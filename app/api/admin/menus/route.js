import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Menu from "@/models/Menu";
import Page from "@/models/Page";

/** Walk the menu tree and sync page slugs based on their parent position. */
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

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const menus = await Menu.find().sort({ name: 1 }).lean();
    return NextResponse.json(menus);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { name, items } = body;
    await connectDB();
    const itemsToSave = Array.isArray(items) ? items : [];
    const conflicts = await syncPageSlugsFromMenu(itemsToSave);

    let menu = await Menu.findOne({ name: name?.trim() });
    if (menu) {
      menu.items = itemsToSave;
      await menu.save();
    } else {
      menu = await Menu.create({ name: name?.trim() || "main", items: itemsToSave });
    }
    const result = menu.toObject ? menu.toObject() : menu;
    if (conflicts.length > 0) {
      return NextResponse.json({ ...result, _slugConflicts: conflicts });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
