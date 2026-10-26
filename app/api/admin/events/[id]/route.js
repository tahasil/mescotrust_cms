import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import { normalizeSlug } from "@/lib/slug";
import { clearUsageForRef, syncMediaUsageForEvent } from "@/lib/media/usageTracker";
import { validateEventImages } from "@/lib/eventImageValidation";
import { sanitizeHtml, sanitizePlainText, sanitizeUrl } from "@/lib/security/sanitize";

function parseOptionalDate(v) {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

import {
  canDeleteContent,
  isContentAdmin,
  isContentAuthor,
  isContentOwner,
  appendWorkflowHistory,
} from "@/lib/workflow/workflowEngine";
import { CONTENT_STATUSES } from "@/lib/workflow/constants";

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const doc = await Event.findById(id).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Authors can only view their own content or published content
    if (isContentAuthor(session) && !isContentOwner(doc, session) && doc.status !== CONTENT_STATUSES.PUBLISHED) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this content" },
        { status: 403 }
      );
    }

    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const body = await req.json();
    const {
      title,
      slug: rawSlug,
      description,
      content,
      featuredImageDesktop,
      featuredImageMobile,
      startDate,
      endDate,
      time,
      location,
      isOnline,
      featured,
      eventLink,
      tags,
      status: requestedStatus,
      publishedAt,
      meta,
      locale,
      submitForReview,
    } = body;

    const imageValidationErrors = await validateEventImages({
      featuredImageDesktop,
      featuredImageMobile,
    });
    if (imageValidationErrors.length > 0) {
      return NextResponse.json(
        { error: imageValidationErrors[0] },
        { status: 400 },
      );
    }

    await connectDB();
    const doc = await Event.findById(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdminUser = isContentAdmin(session);
    const isAuthorUser = isContentAuthor(session);
    const isOwner = isContentOwner(doc, session);

    // Permission check: Author can only edit their own content
    if (isAuthorUser && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: Authors can only edit content they created" },
        { status: 403 }
      );
    }

    // Author cannot edit content that is currently locked under review
    if (isAuthorUser && doc.status === CONTENT_STATUSES.PENDING_REVIEW) {
      return NextResponse.json(
        { error: "Event is currently under review by Admin and cannot be edited" },
        { status: 403 }
      );
    }

    let cleanSlug = doc.slug;
    if (rawSlug !== undefined) {
      const result = normalizeSlug(rawSlug);
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      const existing = await Event.findOne({ slug: result.slug, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ error: "An event with this slug already exists" }, { status: 400 });
      }
      cleanSlug = result.slug;
    }

    const cleanTitle = title !== undefined ? sanitizePlainText(title) || "Untitled" : doc.title;
    const cleanDescription = description !== undefined ? sanitizePlainText(description) : doc.description;
    const cleanContent = content !== undefined ? sanitizeHtml(content) : doc.content;
    const cleanTime = time !== undefined ? sanitizePlainText(time) : doc.time;
    const cleanLocation = isOnline ? "" : (location !== undefined ? sanitizePlainText(location) : doc.location);
    const cleanEventLink = eventLink !== undefined ? sanitizeUrl(eventLink, "") : doc.eventLink;
    const cleanTags = Array.isArray(tags) ? tags.map(sanitizePlainText).filter(Boolean) : doc.tags;
    const cleanMeta = meta && typeof meta === "object" ? {
      metaTitle: sanitizePlainText(meta.metaTitle),
      metaDescription: sanitizePlainText(meta.metaDescription),
      metaKeywords: sanitizePlainText(meta.metaKeywords),
    } : doc.meta;

    // Phase 4: Protect Existing Published Content
    if (isAuthorUser && doc.status === CONTENT_STATUSES.PUBLISHED) {
      doc.pendingRevision = {
        hasPendingRevision: true,
        submittedAt: new Date(),
        submittedBy: session.email || "",
        status: "pending_review",
        reviewComments: "",
        data: {
          title: cleanTitle,
          slug: cleanSlug,
          description: cleanDescription,
          content: cleanContent,
          featuredImageDesktop: featuredImageDesktop !== undefined ? featuredImageDesktop : doc.featuredImageDesktop,
          featuredImageMobile: featuredImageMobile !== undefined ? featuredImageMobile : doc.featuredImageMobile,
          startDate: startDate !== undefined ? parseOptionalDate(startDate) : doc.startDate,
          endDate: endDate !== undefined ? parseOptionalDate(endDate) : doc.endDate,
          time: cleanTime,
          location: cleanLocation,
          isOnline: isOnline !== undefined ? Boolean(isOnline) : doc.isOnline,
          featured: featured !== undefined ? featured === true : doc.featured,
          eventLink: cleanEventLink,
          tags: cleanTags,
          meta: cleanMeta,
          locale: locale !== undefined ? locale : doc.locale,
        },
      };
      appendWorkflowHistory(doc, {
        action: "revision_submitted",
        sessionLike: session,
        notes: "Author submitted revision for published event",
      });
      doc.updatedBy = session.email || "";
      await doc.save();
      return NextResponse.json({
        ...doc.toObject(),
        message: "Revision submitted for admin review. Published version remains live.",
      });
    }

    doc.title = cleanTitle;
    doc.slug = cleanSlug;
    doc.description = cleanDescription;
    doc.content = cleanContent;
    if (featuredImageDesktop !== undefined) doc.featuredImageDesktop = featuredImageDesktop;
    if (featuredImageMobile !== undefined) doc.featuredImageMobile = featuredImageMobile;
    if (startDate !== undefined) doc.startDate = parseOptionalDate(startDate);
    if (endDate !== undefined) doc.endDate = parseOptionalDate(endDate);
    doc.time = cleanTime;
    if (isOnline !== undefined) doc.isOnline = Boolean(isOnline);
    if (featured !== undefined) doc.featured = featured === true;
    doc.location = cleanLocation;
    doc.eventLink = cleanEventLink;
    doc.tags = cleanTags;
    doc.meta = cleanMeta;
    if (locale !== undefined) doc.locale = locale;
    doc.updatedBy = session.email || "";

    // Status transition enforcement
    if (isAuthorUser) {
      if (requestedStatus === CONTENT_STATUSES.PUBLISHED || requestedStatus === CONTENT_STATUSES.APPROVED) {
        return NextResponse.json(
          { error: "Forbidden: Authors cannot directly publish or approve content" },
          { status: 403 }
        );
      }
      if (submitForReview === true || requestedStatus === CONTENT_STATUSES.PENDING_REVIEW) {
        doc.status = CONTENT_STATUSES.PENDING_REVIEW;
        doc.submittedAt = new Date();
        appendWorkflowHistory(doc, {
          action: "submit_for_review",
          sessionLike: session,
          notes: "Submitted for Admin review",
        });
      } else if (doc.status === CONTENT_STATUSES.CHANGES_REQUESTED || doc.status === CONTENT_STATUSES.REJECTED) {
        doc.status = CONTENT_STATUSES.DRAFT;
        appendWorkflowHistory(doc, {
          action: "update_draft",
          sessionLike: session,
          notes: "Author updated draft after feedback",
        });
      }
    } else if (isAdminUser) {
      if (requestedStatus && requestedStatus !== doc.status) {
        doc.status = requestedStatus;
        if (requestedStatus === CONTENT_STATUSES.PUBLISHED) {
          if (!doc.publishedAt) doc.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
          doc.publishedBy = session.email || "";
        }
        appendWorkflowHistory(doc, {
          action: `status_${requestedStatus}`,
          sessionLike: session,
          notes: `Admin changed status to ${requestedStatus}`,
        });
      }
    }

    await doc.save();
    await syncMediaUsageForEvent(doc);
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const doc = await Event.findById(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!canDeleteContent(doc, session)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete this content" },
        { status: 403 }
      );
    }

    await Event.findByIdAndDelete(id);
    await clearUsageForRef("event", id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
