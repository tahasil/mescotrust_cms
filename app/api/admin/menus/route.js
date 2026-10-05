import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Menu from "@/models/Menu";
import {
  cloneMenuItems,
  syncAfterMenuSave,
  castMenuItemsForSave,
} from "@/lib/menuPageSync";

/**
 * Shape the sync result into the response contract the Menu admin UI reads.
 */
function withSyncMeta(menuDoc, sync) {
  const result = menuDoc && menuDoc.toObject ? menuDoc.toObject() : menuDoc;
  return NextResponse.json({
    ...result,
    _slugConflicts: sync.conflicts,
    _slugWarnings: sync.warnings,
    _movedPages: sync.movedPages,
    _syncedMenus: sync.changedMenus,
  });
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
    const itemsToSave = cloneMenuItems(items);

    // A menu's saved structure is authoritative for where page links sit, so
    // run the shared sync first: it moves the pages (subtrees included),
    // repairs every other menu, and records redirects.
    const sync = await syncAfterMenuSave({ menuName: name, items: itemsToSave });
    const finalItems = castMenuItemsForSave(sync.items || itemsToSave);

    const existing = await Menu.findOne({ name: name?.trim() });
    if (existing) {
      existing.items = finalItems;
      await existing.save();
    } else {
      await Menu.create({ name: name?.trim() || "main", items: finalItems });
    }
    const menu = await Menu.findOne({ name: name?.trim() || "main" }).lean();
    return withSyncMeta(menu, sync);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
