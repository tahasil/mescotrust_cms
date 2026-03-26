import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import Menu from "@/models/Menu";
import { normalizeSlug } from "@/lib/slug";
import { validateLayoutProps } from "@/lib/validateLayout";

/**
 * Recursively find and remove a menu item by pageSlug.
 * Returns the removed item or null.
 */
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

/**
 * Recursively find a parent menu item whose slugified label matches the given folder.
 * Returns the item (so we can push into its children) or null.
 */
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

/**
 * Sync menu items when a page slug changes:
 * 1. Update pageSlug and url on the matching menu item
 * 2. If parent folder changed, move the item to the correct parent in the menu tree
 */
function syncMenuForSlugChange(menuItems, oldSlug, newSlug) {
  const oldFolder = oldSlug.includes("/") ? oldSlug.substring(0, oldSlug.lastIndexOf("/")) : "";
  const newFolder = newSlug.includes("/") ? newSlug.substring(0, newSlug.lastIndexOf("/")) : "";

  // If parent folder didn't change, just update slug and url in place
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

  // Parent folder changed — remove item from old position and insert under new parent
  const removed = findAndRemoveBySlug(menuItems, oldSlug);
  if (!removed) return false;

  // Update the slug on the removed item
  removed.pageSlug = newSlug;
  removed.url = "/" + newSlug;

  if (!newFolder) {
    // Moved to root level
    menuItems.push(removed);
  } else {
    const newParent = findParentByFolder(menuItems, newFolder);
    if (newParent) {
      if (!Array.isArray(newParent.children)) newParent.children = [];
      newParent.children.push(removed);
    } else {
      // New parent not found in menu — place at root
      menuItems.push(removed);
    }
  }
  return true;
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const page = await Page.findById(id).populate("layout.componentId").lean();
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
    if (rawSlug !== undefined) {
      const result = normalizeSlug(rawSlug);
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      const existing = await Page.findOne({ slug: result.slug, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ error: "A page with this slug already exists" }, { status: 400 });
      }
      page.slug = result.slug;
    }
    if (title !== undefined) page.title = title;
    if (status !== undefined) page.status = status;
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

    // Auto-sync menus: update slug and move item if parent folder changed
    if (oldSlug && page.slug !== oldSlug) {
      try {
        const menus = await Menu.find();
        for (const menu of menus) {
          // Convert to plain objects so splice/push work correctly
          const plainItems = JSON.parse(JSON.stringify(menu.items));
          if (syncMenuForSlugChange(plainItems, oldSlug, page.slug)) {
            menu.items = plainItems;
            menu.markModified("items");
            await menu.save();
          }
        }
      } catch (_) { /* menu sync is best-effort */ }
    }

    return NextResponse.json(page);
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
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
