import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import { normalizeSlug } from "@/lib/slug";
import { syncMediaUsageForEvent } from "@/lib/media/usageTracker";
import { validateEventImages } from "@/lib/eventImageValidation";
import { sanitizeHtml, sanitizePlainText, sanitizeUrl } from "@/lib/security/sanitize";

function parseOptionalDate(v) {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

import { isContentAdmin, isContentAuthor, appendWorkflowHistory } from "@/lib/workflow/workflowEngine";
import { CONTENT_STATUSES } from "@/lib/workflow/constants";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");
    const scope = searchParams.get("scope");
    const q = searchParams.get("q") || searchParams.get("search");

    await connectDB();

    const query = {};

    if (isContentAuthor(session) || scope === "my") {
      const email = String(session.email || "").trim();
      const userId = session.id || session.userId;
      query.$or = [{ createdBy: email }];
      if (userId) {
        query.$or.push({ creatorId: userId });
      }
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (q && q.trim()) {
      const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ title: regex }, { slug: regex }],
      });
    }

    const [items, total] = await Promise.all([
      Event.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Event.countDocuments(query),
    ]);
    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
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

    const cleanTitle = sanitizePlainText(title) || "Untitled";
    const result = normalizeSlug(rawSlug || cleanTitle);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const slug = result.slug;

    await connectDB();
    const existing = await Event.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "An event with this slug already exists" }, { status: 400 });
    }

    const cleanMeta = meta && typeof meta === "object" ? {
      ...meta,
      metaTitle: sanitizePlainText(meta.metaTitle),
      metaDescription: sanitizePlainText(meta.metaDescription),
      metaKeywords: sanitizePlainText(meta.metaKeywords),
    } : {};

    let finalStatus = CONTENT_STATUSES.DRAFT;
    if (isContentAdmin(session)) {
      finalStatus = requestedStatus || CONTENT_STATUSES.DRAFT;
    } else {
      // Authors can only create Drafts initially
      finalStatus = CONTENT_STATUSES.DRAFT;
    }

    const doc = new Event({
      title: cleanTitle,
      slug,
      description: sanitizePlainText(description || ""),
      content: sanitizeHtml(content || ""),
      featuredImageDesktop: featuredImageDesktop || "",
      featuredImageMobile: featuredImageMobile || "",
      startDate: parseOptionalDate(startDate),
      endDate: parseOptionalDate(endDate),
      time: sanitizePlainText(time || ""),
      location: isOnline ? "" : sanitizePlainText(location || ""),
      isOnline: Boolean(isOnline),
      featured: featured === true,
      eventLink: sanitizeUrl(eventLink || "", ""),
      tags: Array.isArray(tags) ? tags.map(sanitizePlainText).filter(Boolean) : [],
      status: finalStatus,
      publishedAt: finalStatus === CONTENT_STATUSES.PUBLISHED ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
      publishedBy: finalStatus === CONTENT_STATUSES.PUBLISHED ? (session.email || "") : "",
      meta: cleanMeta,
      ...(locale && { locale }),
      createdBy: session.email || "",
      creatorId: session.id || session.userId || null,
      updatedBy: session.email || "",
    });

    appendWorkflowHistory(doc, {
      action: "create",
      sessionLike: session,
      notes: `Created event with status ${finalStatus}`,
    });

    await doc.save();
    await syncMediaUsageForEvent(doc);
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
