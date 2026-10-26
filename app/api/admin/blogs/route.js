import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import { normalizeSlug } from "@/lib/slug";
import { syncMediaUsageForBlog } from "@/lib/media/usageTracker";
import { validateBlogImages } from "@/lib/blogImageValidation";
import { sanitizeHtml, sanitizePlainText } from "@/lib/security/sanitize";

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

    const [blogs, total] = await Promise.all([
      Blog.find(query).populate("category").sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Blog.countDocuments(query),
    ]);
    return NextResponse.json({ items: blogs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { title, slug: rawSlug, content, excerpt, featuredImage, featuredImageMobile, author, status: requestedStatus, publishedAt, category, tags, meta, locale } = body;

    const imageValidationErrors = await validateBlogImages({
      featuredImage,
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
    const existing = await Blog.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 400 });
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

    const blogData = {
      title: cleanTitle,
      slug,
      content: sanitizeHtml(content || ""),
      excerpt: sanitizePlainText(excerpt || ""),
      featuredImage: featuredImage || "",
      featuredImageMobile: featuredImageMobile || "",
      author: sanitizePlainText(author || ""),
      status: finalStatus,
      publishedAt: finalStatus === CONTENT_STATUSES.PUBLISHED ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
      publishedBy: finalStatus === CONTENT_STATUSES.PUBLISHED ? (session.email || "") : "",
      category: category || null,
      tags: Array.isArray(tags) ? tags.map(sanitizePlainText).filter(Boolean) : [],
      meta: cleanMeta,
      ...(locale && { locale }),
      createdBy: session.email || "",
      creatorId: session.id || session.userId || null,
      updatedBy: session.email || "",
    };

    const blog = new Blog(blogData);
    appendWorkflowHistory(blog, {
      action: "create",
      sessionLike: session,
      notes: `Created with status ${finalStatus}`,
    });
    await blog.save();
    await syncMediaUsageForBlog(blog);
    return NextResponse.json(blog);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
