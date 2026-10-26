import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import { normalizeSlug } from "@/lib/slug";
import {
  syncAfterPageChange,
  removePageItems,
  cloneMenuItems,
  normalizeMenuItems,
} from "@/lib/menuPageSync";
import Menu from "@/models/Menu";
import {
  filterLayoutValidationErrors,
  validateLayoutProps,
} from "@/lib/validateLayout";
import { clearUsageForRef, syncMediaUsageForPage } from "@/lib/media/usageTracker";
import { sanitizeVideoPlayingLayout } from "@/lib/videoPlayingImageValidation";
import { sanitizePhotoGalleryLayout } from "@/lib/photoGalleryImageValidation";
import { normalizeAboutPageDesign } from "@/lib/aboutPageDesign";

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const page = await Page.findById(id).lean();
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(page);
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
    const { title, slug: rawSlug, status, layout, meta, locale } = body;

    await connectDB();
    const page = await Page.findById(id);
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const oldSlug = page.slug;
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
      const existing = await Page.findOne({ slug: nextSlug, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ error: "A page with this slug already exists" }, { status: 400 });
      }
      page.slug = nextSlug;
    }
    if (title !== undefined) page.title = title;
    if (status !== undefined) page.status = status;
    if (Array.isArray(layout)) {
      const normalizedLayout = normalizeAboutPageDesign(nextSlug, layout);
      const safeLayout = sanitizePhotoGalleryLayout(
        sanitizeVideoPlayingLayout(normalizedLayout),
      );
      const validationErrors = await validateLayoutProps(safeLayout);
      const blockingValidationErrors = filterLayoutValidationErrors(
        validationErrors,
        { nonBlockingBaseComponents: ["PhotoGallery"] },
      );
      if (blockingValidationErrors.length > 0) {
        return NextResponse.json({ error: `Layout validation: ${blockingValidationErrors.join("; ")}` }, { status: 400 });
      }
      page.layout = safeLayout;
    }
    if (meta !== undefined) page.meta = meta;
    if (locale !== undefined) page.locale = locale;
    page.updatedBy = session.email || "";

    await page.save();
    await syncMediaUsageForPage(page);

    // Auto-sync menus whenever the address changes (including a "Parent Menu"
    // change). This re-nests the page's menu item under the new parent, drags
    // every descendant page along, repairs every other menu so no nav link is
    // left pointing at a dead slug, and records redirects so previously
    // published URLs answer with a redirect instead of a 404.
    let sync = { warnings: [], changedMenus: [], movedPages: [], conflicts: [] };
    if (oldSlug && page.slug !== oldSlug) {
      try {
        sync = await syncAfterPageChange({
          oldSlug,
          newSlug: page.slug,
          title: page.title || "",
        });
      } catch (e) {
        console.error("Menu sync after slug change failed:", e);
        sync = {
          ...sync,
          warnings: [
            "The page was saved, but menus could not be updated automatically. Please re-check the Menu screen.",
          ],
        };
      }
    }

    if (
      Array.isArray(layout) &&
      layout.some((b) => b?.baseComponent === "Reports")
    ) {
      import("@/lib/pdf/extractor")
        .then(({ indexAllAnnualReports }) => indexAllAnnualReports())
        .catch((e) =>
          console.warn("[page-save] Annual reports auto-index warning:", e.message)
        );
    }

    return NextResponse.json({
      ...page.toObject(),
      menuSync: {
        movedPages: sync.movedPages,
        changedMenus: sync.changedMenus,
        conflicts: sync.conflicts,
        warnings: sync.warnings,
      },
    });
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
    const page = await Page.findByIdAndDelete(id);
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await clearUsageForRef("page", id);

    // Drop the page from every menu so the header/footer never render a link
    // that would 404 after the page is gone.
    try {
      const menus = await Menu.find().lean();
      for (const menu of menus) {
        const items = cloneMenuItems(menu.items);
        if (removePageItems(items, page.slug)) {
          normalizeMenuItems(items);
          await Menu.updateOne({ _id: menu._id }, { $set: { items } });
        }
      }
    } catch (e) {
      console.error("Menu cleanup after page delete failed:", e);
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
