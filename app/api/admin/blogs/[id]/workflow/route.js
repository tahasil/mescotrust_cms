import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import {
  isContentAdmin,
  isContentAuthor,
  isContentOwner,
  appendWorkflowHistory,
} from "@/lib/workflow/workflowEngine";
import { CONTENT_STATUSES } from "@/lib/workflow/constants";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { syncMediaUsageForBlog } from "@/lib/media/usageTracker";

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
    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isAdmin = isContentAdmin(session);
    const isAuthor = isContentAuthor(session);
    const isOwner = isContentOwner(blog, session);

    switch (action) {
      case "submit_review": {
        // Author must own the post; Admin can also submit
        if (isAuthor && !isOwner) {
          return NextResponse.json(
            { error: "Forbidden: You can only submit your own content for review" },
            { status: 403 }
          );
        }
        if (blog.status === CONTENT_STATUSES.PUBLISHED && !blog.pendingRevision?.hasPendingRevision) {
          return NextResponse.json(
            { error: "Post is already published" },
            { status: 400 }
          );
        }

        blog.status = CONTENT_STATUSES.PENDING_REVIEW;
        blog.submittedAt = new Date();
        appendWorkflowHistory(blog, {
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

        // If there is a pending revision on a published post, approve and merge it
        if (blog.status === CONTENT_STATUSES.PUBLISHED && blog.pendingRevision?.hasPendingRevision) {
          const revData = blog.pendingRevision.data || {};
          if (revData.title) blog.title = revData.title;
          if (revData.slug) blog.slug = revData.slug;
          if (revData.content !== undefined) blog.content = revData.content;
          if (revData.excerpt !== undefined) blog.excerpt = revData.excerpt;
          if (revData.featuredImage !== undefined) blog.featuredImage = revData.featuredImage;
          if (revData.featuredImageMobile !== undefined) blog.featuredImageMobile = revData.featuredImageMobile;
          if (revData.author !== undefined) blog.author = revData.author;
          if (revData.category !== undefined) blog.category = revData.category;
          if (Array.isArray(revData.tags)) blog.tags = revData.tags;
          if (revData.meta) blog.meta = revData.meta;
          if (revData.locale) blog.locale = revData.locale;

          blog.pendingRevision = {
            hasPendingRevision: false,
            submittedAt: null,
            submittedBy: "",
            data: null,
            reviewComments: "",
            status: "none",
          };
          blog.reviewedBy = session.email || "";
          blog.reviewedAt = new Date();
          appendWorkflowHistory(blog, {
            action: "revision_approved_and_merged",
            sessionLike: session,
            notes: comments ? sanitizePlainText(comments) : "Revision approved and published live",
          });
        } else {
          blog.status = CONTENT_STATUSES.APPROVED;
          blog.reviewedBy = session.email || "";
          blog.reviewedAt = new Date();
          blog.reviewComments = comments ? sanitizePlainText(comments) : "";
          appendWorkflowHistory(blog, {
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

        if (blog.status === CONTENT_STATUSES.PUBLISHED && blog.pendingRevision?.hasPendingRevision) {
          blog.pendingRevision.status = "changes_requested";
          blog.pendingRevision.reviewComments = cleanComments;
        } else {
          blog.status = CONTENT_STATUSES.CHANGES_REQUESTED;
          blog.reviewComments = cleanComments;
        }

        blog.reviewedBy = session.email || "";
        blog.reviewedAt = new Date();
        appendWorkflowHistory(blog, {
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

        if (blog.status === CONTENT_STATUSES.PUBLISHED && blog.pendingRevision?.hasPendingRevision) {
          blog.pendingRevision.status = "rejected";
          blog.pendingRevision.reviewComments = cleanReason;
        } else {
          blog.status = CONTENT_STATUSES.REJECTED;
          blog.rejectionReason = cleanReason;
        }

        blog.reviewedBy = session.email || "";
        blog.reviewedAt = new Date();
        appendWorkflowHistory(blog, {
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

        // If there was a pending revision, merge it too
        if (blog.pendingRevision?.hasPendingRevision && blog.pendingRevision.data) {
          const revData = blog.pendingRevision.data;
          if (revData.title) blog.title = revData.title;
          if (revData.slug) blog.slug = revData.slug;
          if (revData.content !== undefined) blog.content = revData.content;
          if (revData.excerpt !== undefined) blog.excerpt = revData.excerpt;
          if (revData.featuredImage !== undefined) blog.featuredImage = revData.featuredImage;
          if (revData.featuredImageMobile !== undefined) blog.featuredImageMobile = revData.featuredImageMobile;
          if (revData.author !== undefined) blog.author = revData.author;
          if (revData.category !== undefined) blog.category = revData.category;
          if (Array.isArray(revData.tags)) blog.tags = revData.tags;
          if (revData.meta) blog.meta = revData.meta;
          if (revData.locale) blog.locale = revData.locale;
          blog.pendingRevision = {
            hasPendingRevision: false,
            submittedAt: null,
            submittedBy: "",
            data: null,
            reviewComments: "",
            status: "none",
          };
        }

        blog.status = CONTENT_STATUSES.PUBLISHED;
        if (!blog.publishedAt) blog.publishedAt = new Date();
        blog.publishedBy = session.email || "";
        appendWorkflowHistory(blog, {
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
        blog.status = CONTENT_STATUSES.DRAFT;
        appendWorkflowHistory(blog, {
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
        blog.pendingRevision = {
          hasPendingRevision: false,
          submittedAt: null,
          submittedBy: "",
          data: null,
          reviewComments: "",
          status: "none",
        };
        appendWorkflowHistory(blog, {
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

    blog.updatedBy = session.email || "";
    await blog.save();
    await syncMediaUsageForBlog(blog);

    return NextResponse.json({
      success: true,
      blog,
      message: `Action '${action}' executed successfully.`,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
