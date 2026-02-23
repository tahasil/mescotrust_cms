import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Menu from "@/models/Menu";

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const name = params.name;
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
    const name = params.name;
    const body = await req.json();
    const { items } = body;
    await connectDB();
    let menu = await Menu.findOne({ name });
    if (!menu) {
      menu = await Menu.create({ name, items: Array.isArray(items) ? items : [] });
    } else {
      if (Array.isArray(items)) menu.items = items;
      await menu.save();
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
    const name = params.name;
    await connectDB();
    const menu = await Menu.findOneAndDelete({ name });
    if (!menu) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
