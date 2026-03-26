import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Menu from "@/models/Menu";
import Page from "@/models/Page";

/**
 * Walk the menu tree and sync page slugs based on their parent position.
 * If a page-type item is nested under a parent whose slugified label is "media",
 * the page slug becomes "media/<pageSlug-basename>".
 */
async function syncPageSlugsFromMenu(items, parentFolder = "", conflicts = []) {
  for (const item of items) {
    if (item.type === "page" && item.pageSlug) {
      const basename = item.pageSlug.includes("/")
        ? item.pageSlug.substring(item.pageSlug.lastIndexOf("/") + 1)
        : item.pageSlug;
      const expectedSlug = parentFolder ? `${parentFolder}/${basename}` : basename;

      if (expectedSlug !== item.pageSlug) {
        try {
          const page = await Page.findOne({ slug: item.pageSlug });
          if (page) {
            const conflict = await Page.findOne({ slug: expectedSlug, _id: { $ne: page._id } });
            if (!conflict) {
              page.slug = expectedSlug;
              await page.save();
              item.pageSlug = expectedSlug;
              item.url = "/" + expectedSlug;
            } else {
              conflicts.push(`"${item.label}" could not be moved — slug "/${expectedSlug}" is already used by another page`);
            }
          }
        } catch (_) { /* best-effort */ }
      }
    }
    if (Array.isArray(item.children) && item.children.length > 0) {
      const folder = (item.label || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const childFolder = parentFolder ? `${parentFolder}/${folder}` : folder;
      await syncPageSlugsFromMenu(item.children, childFolder, conflicts);
    }
  }
  return conflicts;
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const resolved = await Promise.resolve(params);
    const name = resolved?.name;
    if (!name) return NextResponse.json({ error: "Menu name required" }, { status: 400 });
    await connectDB();
    const menu = await Menu.findOne({ name }).lean();
    if (!menu) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(menu);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const resolved = await Promise.resolve(params);
    const name = resolved?.name;
    if (!name) return NextResponse.json({ error: "Menu name required" }, { status: 400 });
    const body = await req.json();
    const { items } = body;
    await connectDB();
    const itemsToSave = Array.isArray(items) ? items : [];

    // Sync page slugs based on new menu positions before saving
    const conflicts = await syncPageSlugsFromMenu(itemsToSave);

    const existing = await Menu.findOne({ name });
    if (!existing) {
      await Menu.create({ name, items: itemsToSave });
    } else {
      await Menu.updateOne({ name }, { $set: { items: itemsToSave } });
    }
    const menu = await Menu.findOne({ name }).lean();
    if (conflicts.length > 0) {
      return NextResponse.json({ ...menu, _slugConflicts: conflicts });
    }
    return NextResponse.json(menu);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const resolved = await Promise.resolve(params);
    const name = resolved?.name;
    if (!name) return NextResponse.json({ error: "Menu name required" }, { status: 400 });
    await connectDB();
    const menu = await Menu.findOneAndDelete({ name });
    if (!menu) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
