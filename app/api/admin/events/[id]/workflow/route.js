import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import {
  isContentAdmin,
  isContentAuthor,
  isContentOwner,
  appendWorkflowHistory,
} from "@/lib/workflow/workflowEngine";
import { CONTENT_STATUSES } from "@/lib/workflow/constants";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { syncMediaUsageForEvent } from "@/lib/media/usageTracker";

export async function POST(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const { action, comments, reason } = body;

    if (!action) {
      return NextResponse.json({ error: "Workflow action is required" }, { status: 400 });
    }

    await connectDB();
    const doc = await Event.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isAdmin = isContentAdmin(session);
    const isAuthor = isContentAuthor(session);
    const isOwner = isContentOwner(doc, session);

    switch (action) {
      case "submit_review": {
        if (isAuthor && !isOwner) {
          return NextResponse.json(
            { error: "Forbidden: You can only submit your own content for review" },
            { status: 403 }
          );
        }
        if (doc.status === CONTENT_STATUSES.PUBLISHED && !doc.pendingRevision?.hasPendingRevision) {
          return NextResponse.json(
            { error: "Event is already published" },
            { status: 400 }
          );
        }

        doc.status = CONTENT_STATUSES.PENDING_REVIEW;
        doc.submittedAt = new Date();
        appendWorkflowHistory(doc, {
          action: "submit_for_review",
          sessionLike: session,
          notes: comments ? sanitizePlainText(comments) : "Submitted for Admin review",
        });
        break;
      }

      case "approve": {
        if (!isAdmin) {
          return NextResponse.json(
            { error: "Forbidden: Only Admin can approve content" },
            { status: 403 }
          );
        }

        if (doc.status === CONTENT_STATUSES.PUBLISHED && doc.pendingRevision?.hasPendingRevision) {
          const revData = doc.pendingRevision.data || {};
          if (revData.title) doc.title = revData.title;
          if (revData.slug) doc.slug = revData.slug;
          if (revData.description !== undefined) doc.description = revData.description;
          if (revData.content !== undefined) doc.content = revData.content;
          if (revData.featuredImageDesktop !== undefined) doc.featuredImageDesktop = revData.featuredImageDesktop;
          if (revData.featuredImageMobile !== undefined) doc.featuredImageMobile = revData.featuredImageMobile;
          if (revData.startDate !== undefined) doc.startDate = revData.startDate;
          if (revData.endDate !== undefined) doc.endDate = revData.endDate;
          if (revData.time !== undefined) doc.time = revData.time;
          if (revData.location !== undefined) doc.location = revData.location;
          if (revData.isOnline !== undefined) doc.isOnline = revData.isOnline;
          if (revData.featured !== undefined) doc.featured = revData.featured;
          if (revData.eventLink !== undefined) doc.eventLink = revData.eventLink;
          if (Array.isArray(revData.tags)) doc.tags = revData.tags;
          if (revData.meta) doc.meta = revData.meta;
          if (revData.locale) doc.locale = revData.locale;

          doc.pendingRevision = {
            hasPendingRevision: false,
            submittedAt: null,
            submittedBy: "",
            data: null,
            reviewComments: "",
            status: "none",
          };
          doc.reviewedBy = session.email || "";
          doc.reviewedAt = new Date();
          appendWorkflowHistory(doc, {
            action: "revision_approved_and_merged",
            sessionLike: session,
            notes: comments ? sanitizePlainText(comments) : "Revision approved and published live",
          });
        } else {
          doc.status = CONTENT_STATUSES.APPROVED;
          doc.reviewedBy = session.email || "";
          doc.reviewedAt = new Date();
          doc.reviewComments = comments ? sanitizePlainText(comments) : "";
          appendWorkflowHistory(doc, {
            action: "approve",
            sessionLike: session,
            notes: comments ? sanitizePlainText(comments) : "Approved by Admin",
          });
        }
        break;
      }

      case "request_changes": {
        if (!isAdmin) {
          return NextResponse.json(
            { error: "Forbidden: Only Admin can request changes" },
            { status: 403 }
          );
        }
        const cleanComments = sanitizePlainText(comments || "");
        if (!cleanComments) {
          return NextResponse.json(
            { error: "Review comments are required when requesting changes" },
            { status: 400 }
          );
        }

        if (doc.status === CONTENT_STATUSES.PUBLISHED && doc.pendingRevision?.hasPendingRevision) {
          doc.pendingRevision.status = "changes_requested";
          doc.pendingRevision.reviewComments = cleanComments;
        } else {
          doc.status = CONTENT_STATUSES.CHANGES_REQUESTED;
          doc.reviewComments = cleanComments;
        }

        doc.reviewedBy = session.email || "";
        doc.reviewedAt = new Date();
        appendWorkflowHistory(doc, {
          action: "request_changes",
          sessionLike: session,
          notes: cleanComments,
        });
        break;
      }

      case "reject": {
        if (!isAdmin) {
          return NextResponse.json(
            { error: "Forbidden: Only Admin can reject content" },
            { status: 403 }
          );
        }
        const cleanReason = sanitizePlainText(reason || comments || "");
        if (!cleanReason) {
          return NextResponse.json(
            { error: "A rejection reason is required" },
            { status: 400 }
          );
        }

        if (doc.status === CONTENT_STATUSES.PUBLISHED && doc.pendingRevision?.hasPendingRevision) {
          doc.pendingRevision.status = "rejected";
          doc.pendingRevision.reviewComments = cleanReason;
        } else {
          doc.status = CONTENT_STATUSES.REJECTED;
          doc.rejectionReason = cleanReason;
        }

        doc.reviewedBy = session.email || "";
        doc.reviewedAt = new Date();
        appendWorkflowHistory(doc, {
          action: "reject",
          sessionLike: session,
          notes: cleanReason,
        });
        break;
      }

      case "publish": {
        if (!isAdmin) {
          return NextResponse.json(
            { error: "Forbidden: Only Admin can publish content" },
            { status: 403 }
          );
        }

        if (doc.pendingRevision?.hasPendingRevision && doc.pendingRevision.data) {
          const revData = doc.pendingRevision.data;
          if (revData.title) doc.title = revData.title;
          if (revData.slug) doc.slug = revData.slug;
          if (revData.description !== undefined) doc.description = revData.description;
          if (revData.content !== undefined) doc.content = revData.content;
          if (revData.featuredImageDesktop !== undefined) doc.featuredImageDesktop = revData.featuredImageDesktop;
          if (revData.featuredImageMobile !== undefined) doc.featuredImageMobile = revData.featuredImageMobile;
          if (revData.startDate !== undefined) doc.startDate = revData.startDate;
          if (revData.endDate !== undefined) doc.endDate = revData.endDate;
          if (revData.time !== undefined) doc.time = revData.time;
          if (revData.location !== undefined) doc.location = revData.location;
          if (revData.isOnline !== undefined) doc.isOnline = revData.isOnline;
          if (revData.featured !== undefined) doc.featured = revData.featured;
          if (revData.eventLink !== undefined) doc.eventLink = revData.eventLink;
          if (Array.isArray(revData.tags)) doc.tags = revData.tags;
          if (revData.meta) doc.meta = revData.meta;
          if (revData.locale) doc.locale = revData.locale;
          doc.pendingRevision = {
            hasPendingRevision: false,
            submittedAt: null,
            submittedBy: "",
            data: null,
            reviewComments: "",
            status: "none",
          };
        }

        doc.status = CONTENT_STATUSES.PUBLISHED;
        if (!doc.publishedAt) doc.publishedAt = new Date();
        doc.publishedBy = session.email || "";
        appendWorkflowHistory(doc, {
          action: "publish",
          sessionLike: session,
          notes: "Published publicly by Admin",
        });
        break;
      }

      case "unpublish": {
        if (!isAdmin) {
          return NextResponse.json(
            { error: "Forbidden: Only Admin can unpublish content" },
            { status: 403 }
          );
        }
        doc.status = CONTENT_STATUSES.DRAFT;
        appendWorkflowHistory(doc, {
          action: "unpublish",
          sessionLike: session,
          notes: "Unpublished by Admin",
        });
        break;
      }

      case "discard_revision": {
        if (!isAdmin && (!isAuthor || !isOwner)) {
          return NextResponse.json(
            { error: "Forbidden: You cannot discard this revision" },
            { status: 403 }
          );
        }
        doc.pendingRevision = {
          hasPendingRevision: false,
          submittedAt: null,
          submittedBy: "",
          data: null,
          reviewComments: "",
          status: "none",
        };
        appendWorkflowHistory(doc, {
          action: "discard_revision",
          sessionLike: session,
          notes: "Pending revision discarded",
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown workflow action: ${action}` },
          { status: 400 }
        );
    }

    doc.updatedBy = session.email || "";
    await doc.save();
    await syncMediaUsageForEvent(doc);

    return NextResponse.json({
      success: true,
      event: doc,
      message: `Action '${action}' executed successfully.`,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
