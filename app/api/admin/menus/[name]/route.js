import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Menu from "@/models/Menu";

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
    const existing = await Menu.findOne({ name });
    if (!existing) {
      await Menu.create({ name, items: itemsToSave });
    } else {
      await Menu.updateOne({ name }, { $set: { items: itemsToSave } });
    }
    const menu = await Menu.findOne({ name }).lean();
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
