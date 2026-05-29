import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import { normalizeSlug } from "@/lib/slug";
import { validateLayoutProps } from "@/lib/validateLayout";
import { syncMediaUsageForPage } from "@/lib/media/usageTracker";
import { hasPublishedSnapshot } from "@/lib/pagePublication";

const ACTIVE_PAGE_FILTER = { isDeleted: { $ne: 1 } };

function hydrateLegacyPublishedSnapshot(page) {
  if (!page || page.status !== "published") return;
  if (hasPublishedSnapshot(page)) return;
  page.publishedTitle = page.title || "";
  page.publishedSlug = page.slug || "";
  page.publishedLayout = Array.isArray(page.layout) ? page.layout : [];
  page.publishedMeta = page.meta || {};
  page.publishedAt = page.updatedAt || new Date();
  page.publishedBy = page.updatedBy || page.createdBy || "";
  page.publishedRevision = Math.max(1, Number(page.publishedRevision) || 0);
}

export async function GET(req, { params }) {
  const session = await requirePermission(req, "pages.view");
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const page = await Page.findOne({ _id: id, ...ACTIVE_PAGE_FILTER })
      .populate("layout.componentId")
      .populate("publishedLayout.componentId")
      .lean();
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(page);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requirePermission(req, "pages.edit");
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const body = await req.json();
    const { title, slug: rawSlug, status, layout, meta, locale, ifMatchUpdatedAt } = body;

    await connectDB();
    const page = await Page.findOne({ _id: id, ...ACTIVE_PAGE_FILTER });
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (ifMatchUpdatedAt && page.updatedAt) {
      const expected = new Date(ifMatchUpdatedAt);
      const current = new Date(page.updatedAt);
      if (!Number.isNaN(expected.getTime()) && expected.getTime() !== current.getTime()) {
        return NextResponse.json(
          { error: "This page was updated by another user. Please refresh and try again." },
          { status: 409 },
        );
      }
    }

    // Legacy safety: preserve currently-live content before first draft edit on old published docs.
    hydrateLegacyPublishedSnapshot(page);

    const slugSource =
      rawSlug !== undefined && String(rawSlug).trim() !== ""
        ? rawSlug
        : (title !== undefined ? title : page.slug);
    const result = normalizeSlug(slugSource);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const nextSlug = result.slug;
    if (nextSlug !== page.slug) {
      const existing = await Page.findOne({ slug: nextSlug, _id: { $ne: id }, ...ACTIVE_PAGE_FILTER });
      if (existing) {
        return NextResponse.json({ error: "A page with this slug already exists" }, { status: 400 });
      }
      page.slug = nextSlug;
    }

    if (title !== undefined) page.title = title;

    // Draft saves must not implicitly publish. Keep published pages published.
    if (status === "draft" && page.status !== "published") {
      page.status = "draft";
    }

    if (Array.isArray(layout)) {
      const validationErrors = await validateLayoutProps(layout);
      if (validationErrors.length > 0) {
        return NextResponse.json({ error: `Layout validation: ${validationErrors.join("; ")}` }, { status: 400 });
      }
      page.layout = layout;
    }

    if (meta !== undefined) page.meta = meta;
    if (locale !== undefined) page.locale = locale;
    page.updatedBy = session.email || "";

    await page.save();
    await syncMediaUsageForPage(page);

    const fresh = await Page.findOne({ _id: id, ...ACTIVE_PAGE_FILTER })
      .populate("layout.componentId")
      .populate("publishedLayout.componentId")
      .lean();

    return NextResponse.json(fresh || page);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requirePermission(req, "pages.delete");
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const page = await Page.findOne({ _id: id, ...ACTIVE_PAGE_FILTER });
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    page.isDeleted = 1;
    page.deletedSlug = page.slug || "";
    if (page.publishedSlug) {
      page.publishedSlug = `${page.publishedSlug}--deleted-${page._id}`;
    }
    page.slug = `${page.slug || "page"}--deleted-${page._id}`;
    page.updatedBy = session.email || "";
    await page.save();
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
