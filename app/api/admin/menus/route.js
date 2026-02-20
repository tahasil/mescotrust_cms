import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Menu from "@/models/Menu";

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
    let menu = await Menu.findOne({ name: name?.trim() });
    if (menu) {
      if (Array.isArray(items)) menu.items = items;
      await menu.save();
    } else {
      menu = await Menu.create({ name: name?.trim() || "main", items: Array.isArray(items) ? items : [] });
    }
    return NextResponse.json(menu);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
