import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import Menu from "@/models/Menu";
import { normalizeSlug } from "@/lib/slug";
import { validateLayoutProps } from "@/lib/validateLayout";
import { syncMediaUsageForPage } from "@/lib/media/usageTracker";
import {
  applyPublishedSnapshot,
  buildPublishedSlugConflictFilter,
  extractCurrentPublishedSnapshot,
  hasPublishedSnapshot,
} from "@/lib/pagePublication";

const ACTIVE_PAGE_FILTER = { isDeleted: { $ne: 1 } };

function findAndRemoveBySlug(items, slug) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].type === "page" && items[i].pageSlug === slug) {
      return items.splice(i, 1)[0];
    }
    if (Array.isArray(items[i].children) && items[i].children.length > 0) {
      const found = findAndRemoveBySlug(items[i].children, slug);
      if (found) return found;
    }
  }
  return null;
}

function findParentByFolder(items, folder) {
  for (const item of items) {
    const slugified = (item.label || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (slugified === folder) return item;
    if (Array.isArray(item.children) && item.children.length > 0) {
      const found = findParentByFolder(item.children, folder);
      if (found) return found;
    }
  }
  return null;
}

function syncMenuForSlugChange(menuItems, oldSlug, newSlug) {
  const oldFolder = oldSlug.includes("/") ? oldSlug.substring(0, oldSlug.lastIndexOf("/")) : "";
  const newFolder = newSlug.includes("/") ? newSlug.substring(0, newSlug.lastIndexOf("/")) : "";

  if (oldFolder === newFolder) {
    let changed = false;
    const updateInPlace = (items) => {
      for (const item of items) {
        if (item.type === "page" && item.pageSlug === oldSlug) {
          item.pageSlug = newSlug;
          item.url = "/" + newSlug;
          changed = true;
        }
        if (Array.isArray(item.children)) updateInPlace(item.children);
      }
    };
    updateInPlace(menuItems);
    return changed;
  }

  const removed = findAndRemoveBySlug(menuItems, oldSlug);
  if (!removed) return false;
  removed.pageSlug = newSlug;
  removed.url = "/" + newSlug;

  if (!newFolder) {
    menuItems.push(removed);
  } else {
    const newParent = findParentByFolder(menuItems, newFolder);
    if (newParent) {
      if (!Array.isArray(newParent.children)) newParent.children = [];
      newParent.children.push(removed);
    } else {
      menuItems.push(removed);
    }
  }
  return true;
}

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

export async function POST(req, { params }) {
  const session = await requirePermission(req, "pages.publish");
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { ifMatchUpdatedAt } = body || {};

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

    hydrateLegacyPublishedSnapshot(page);
    const draftSlugResult = normalizeSlug(page.slug || page.title || "");
    if (!draftSlugResult.valid) {
      return NextResponse.json({ error: draftSlugResult.error }, { status: 400 });
    }
    const draftSlug = draftSlugResult.slug;
    const draftTitle = String(page.title || "Untitled").trim() || "Untitled";
    const draftLayout = Array.isArray(page.layout) ? page.layout : [];
    const draftMeta = page.meta || {};

    const validationErrors = await validateLayoutProps(draftLayout);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: `Layout validation: ${validationErrors.join("; ")}` }, { status: 400 });
    }

    const conflict = await Page.findOne(buildPublishedSlugConflictFilter(draftSlug, id)).select("_id").lean();
    if (conflict) {
      return NextResponse.json(
        { error: "Cannot publish. This URL slug is already published by another page." },
        { status: 409 },
      );
    }

    const previousLiveSnapshot = extractCurrentPublishedSnapshot(page);
    if (previousLiveSnapshot) {
      page.previousPublishedSnapshot = previousLiveSnapshot;
    }

    const oldPublishedSlug = previousLiveSnapshot?.slug || "";
    applyPublishedSnapshot(
      page,
      { slug: draftSlug, title: draftTitle, layout: draftLayout, meta: draftMeta },
      session.email || "",
    );
    page.status = "published";
    page.updatedBy = session.email || "";

    await page.save();
    await syncMediaUsageForPage(page);

    if (oldPublishedSlug && page.publishedSlug && oldPublishedSlug !== page.publishedSlug) {
      try {
        const menus = await Menu.find().lean();
        for (const menu of menus) {
          const plainItems = JSON.parse(JSON.stringify(menu.items));
          if (syncMenuForSlugChange(plainItems, oldPublishedSlug, page.publishedSlug)) {
            await Menu.updateOne({ _id: menu._id }, { $set: { items: plainItems } });
          }
        }
      } catch (e) {
        console.error("Menu sync after publish failed:", e);
      }
    }

    const fresh = await Page.findOne({ _id: id, ...ACTIVE_PAGE_FILTER })
      .populate("layout.componentId")
      .populate("publishedLayout.componentId")
      .lean();

    return NextResponse.json(fresh || page);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

