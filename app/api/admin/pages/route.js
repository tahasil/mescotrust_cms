import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import { normalizeSlug } from "@/lib/slug";
import { validateLayoutProps } from "@/lib/validateLayout";
import { syncMediaUsageForPage } from "@/lib/media/usageTracker";
import { buildPublishedSlugConflictFilter } from "@/lib/pagePublication";

const ACTIVE_PAGE_FILTER = { isDeleted: { $ne: 1 } };

export async function GET(req) {
  const session = await requirePermission(req, "pages.view");
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const skip = (page - 1) * limit;

    await connectDB();
    const [pages, total] = await Promise.all([
      Page.find(ACTIVE_PAGE_FILTER).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Page.countDocuments(ACTIVE_PAGE_FILTER),
    ]);
    return NextResponse.json({ items: pages, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requirePermission(req, "pages.create");
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { title, slug: rawSlug, status, layout, meta, locale } = body;

    const result = normalizeSlug(rawSlug || title);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const slug = result.slug;

    await connectDB();
    const existing = await Page.findOne({ slug, ...ACTIVE_PAGE_FILTER });
    if (existing) {
      return NextResponse.json({ error: "A page with this slug already exists" }, { status: 400 });
    }

    if (Array.isArray(layout) && layout.length > 0) {
      const validationErrors = await validateLayoutProps(layout);
      if (validationErrors.length > 0) {
        return NextResponse.json({ error: `Layout validation: ${validationErrors.join("; ")}` }, { status: 400 });
      }
    }

    const normalizedStatus = status === "published" ? "published" : "draft";
    if (normalizedStatus === "published") {
      const publishedConflict = await Page.findOne(buildPublishedSlugConflictFilter(slug)).select("_id").lean();
      if (publishedConflict) {
        return NextResponse.json(
          { error: "Cannot publish. This URL slug is already published by another page." },
          { status: 409 },
        );
      }
    }

    const page = await Page.create({
      title: title || "Untitled",
      slug,
      status: normalizedStatus,
      layout: Array.isArray(layout) ? layout : [],
      meta: meta || {},
      ...(normalizedStatus === "published"
        ? {
            publishedTitle: title || "Untitled",
            publishedSlug: slug,
            publishedLayout: Array.isArray(layout) ? layout : [],
            publishedMeta: meta || {},
            publishedAt: new Date(),
            publishedBy: session.email || "",
            publishedRevision: 1,
          }
        : {}),
      isDeleted: 0,
      deletedSlug: "",
      ...(locale && { locale }),
      createdBy: session.email || "",
      updatedBy: session.email || "",
    });
    await syncMediaUsageForPage(page);
    return NextResponse.json(page);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
