import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import { normalizeSlug } from "@/lib/slug";
import { clearUsageForRef, syncMediaUsageForBlog } from "@/lib/media/usageTracker";
import { validateBlogImages } from "@/lib/blogImageValidation";
import { sanitizeHtml, sanitizePlainText } from "@/lib/security/sanitize";

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
    const blog = await Blog.findById(id).populate("category").lean();
    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Authors can only view their own content or published content
    if (isContentAuthor(session) && !isContentOwner(blog, session) && blog.status !== CONTENT_STATUSES.PUBLISHED) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this content" },
        { status: 403 }
      );
    }

    return NextResponse.json(blog);
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
      content,
      excerpt,
      featuredImage,
      featuredImageMobile,
      author,
      status: requestedStatus,
      publishedAt,
      category,
      tags,
      meta,
      locale,
      submitForReview,
    } = body;

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

    await connectDB();
    const blog = await Blog.findById(id);
    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdminUser = isContentAdmin(session);
    const isAuthorUser = isContentAuthor(session);
    const isOwner = isContentOwner(blog, session);

    // Permission check: Author can only edit their own content
    if (isAuthorUser && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: Authors can only edit content they created" },
        { status: 403 }
      );
    }

    // Author cannot edit content that is currently locked under review
    if (isAuthorUser && blog.status === CONTENT_STATUSES.PENDING_REVIEW) {
      return NextResponse.json(
        { error: "Content is currently under review by Admin and cannot be edited" },
        { status: 403 }
      );
    }

    // Cleaned fields
    let cleanSlug = blog.slug;
    if (rawSlug !== undefined) {
      const result = normalizeSlug(rawSlug);
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      const existing = await Blog.findOne({ slug: result.slug, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ error: "A post with this slug already exists" }, { status: 400 });
      }
      cleanSlug = result.slug;
    }

    const cleanTitle = title !== undefined ? sanitizePlainText(title) || "Untitled" : blog.title;
    const cleanContent = content !== undefined ? sanitizeHtml(content) : blog.content;
    const cleanExcerpt = excerpt !== undefined ? sanitizePlainText(excerpt) : blog.excerpt;
    const cleanAuthor = author !== undefined ? sanitizePlainText(author) : blog.author;
    const cleanMeta = meta && typeof meta === "object" ? {
      metaTitle: sanitizePlainText(meta.metaTitle),
      metaDescription: sanitizePlainText(meta.metaDescription),
      metaKeywords: sanitizePlainText(meta.metaKeywords),
    } : blog.meta;
    const cleanTags = Array.isArray(tags) ? tags.map(sanitizePlainText).filter(Boolean) : blog.tags;

    // Phase 4: Protect Existing Published Content
    // If post is published and an Author updates it, create a pendingRevision
    // so live published version remains untouched until Admin approves.
    if (isAuthorUser && blog.status === CONTENT_STATUSES.PUBLISHED) {
      blog.pendingRevision = {
        hasPendingRevision: true,
        submittedAt: new Date(),
        submittedBy: session.email || "",
        status: "pending_review",
        reviewComments: "",
        data: {
          title: cleanTitle,
          slug: cleanSlug,
          content: cleanContent,
          excerpt: cleanExcerpt,
          featuredImage: featuredImage !== undefined ? featuredImage : blog.featuredImage,
          featuredImageMobile: featuredImageMobile !== undefined ? featuredImageMobile : blog.featuredImageMobile,
          author: cleanAuthor,
          category: category !== undefined ? category : blog.category,
          tags: cleanTags,
          meta: cleanMeta,
          locale: locale !== undefined ? locale : blog.locale,
        },
      };
      appendWorkflowHistory(blog, {
        action: "revision_submitted",
        sessionLike: session,
        notes: "Author submitted revision for published blog",
      });
      blog.updatedBy = session.email || "";
      await blog.save();
      return NextResponse.json({
        ...blog.toObject(),
        message: "Revision submitted for admin review. Published version remains live.",
      });
    }

    // Normal draft / editing workflow for Author and Admin
    blog.title = cleanTitle;
    blog.slug = cleanSlug;
    blog.content = cleanContent;
    blog.excerpt = cleanExcerpt;
    if (featuredImage !== undefined) blog.featuredImage = featuredImage;
    if (featuredImageMobile !== undefined) blog.featuredImageMobile = featuredImageMobile;
    blog.author = cleanAuthor;
    if (category !== undefined) blog.category = category;
    blog.tags = cleanTags;
    blog.meta = cleanMeta;
    if (locale !== undefined) blog.locale = locale;
    blog.updatedBy = session.email || "";

    // Status transition enforcement
    if (isAuthorUser) {
      if (requestedStatus === CONTENT_STATUSES.PUBLISHED || requestedStatus === CONTENT_STATUSES.APPROVED) {
        return NextResponse.json(
          { error: "Forbidden: Authors cannot directly publish or approve content" },
          { status: 403 }
        );
      }
      if (submitForReview === true || requestedStatus === CONTENT_STATUSES.PENDING_REVIEW) {
        blog.status = CONTENT_STATUSES.PENDING_REVIEW;
        blog.submittedAt = new Date();
        appendWorkflowHistory(blog, {
          action: "submit_for_review",
          sessionLike: session,
          notes: "Submitted for Admin review",
        });
      } else if (blog.status === CONTENT_STATUSES.CHANGES_REQUESTED || blog.status === CONTENT_STATUSES.REJECTED) {
        // Author editing after changes requested stays in working state until resubmitted
        blog.status = CONTENT_STATUSES.DRAFT;
        appendWorkflowHistory(blog, {
          action: "update_draft",
          sessionLike: session,
          notes: "Author updated draft after feedback",
        });
      }
    } else if (isAdminUser) {
      if (requestedStatus && requestedStatus !== blog.status) {
        blog.status = requestedStatus;
        if (requestedStatus === CONTENT_STATUSES.PUBLISHED) {
          if (!blog.publishedAt) blog.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
          blog.publishedBy = session.email || "";
        }
        appendWorkflowHistory(blog, {
          action: `status_${requestedStatus}`,
          sessionLike: session,
          notes: `Admin changed status to ${requestedStatus}`,
        });
      }
    }

    await blog.save();
    await syncMediaUsageForBlog(blog);
    return NextResponse.json(blog);
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
    const blog = await Blog.findById(id);
    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!canDeleteContent(blog, session)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete this content" },
        { status: 403 }
      );
    }

    await Blog.findByIdAndDelete(id);
    await clearUsageForRef("blog", id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
