import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Menu from "@/models/Menu";
import {
  cloneMenuItems,
  syncAfterMenuSave,
  castMenuItemsForSave,
} from "@/lib/menuPageSync";

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
    const itemsToSave = cloneMenuItems(items);

    // Reordering, indenting or promoting a sub-item between parents changes
    // the URL its page should live at. The shared sync moves the page (and
    // every page nested under it), keeps the stored link pointing at the slug
    // that actually resolved — so a blocked move can never produce a 404 —
    // repairs every other menu, and records redirects for the old URLs.
    const sync = await syncAfterMenuSave({ menuName: name, items: itemsToSave });
    const finalItems = castMenuItemsForSave(sync.items || itemsToSave);

    const existing = await Menu.findOne({ name });
    if (!existing) {
      await Menu.create({ name, items: finalItems });
    } else {
      existing.items = finalItems;
      await existing.save();
    }
    const menu = await Menu.findOne({ name }).lean();

    return NextResponse.json({
      ...(menu || {}),
      _slugConflicts: sync.conflicts,
      _slugWarnings: sync.warnings,
      _movedPages: sync.movedPages,
      _syncedMenus: sync.changedMenus,
    });
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
