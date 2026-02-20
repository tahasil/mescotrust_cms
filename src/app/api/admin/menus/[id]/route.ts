import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { Menu, MenuItem } from "@/models";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  const menu = await Menu.findById(id).lean();
  if (!menu) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = await MenuItem.find({ menuId: id }).sort({ order: 1 }).lean();
  return NextResponse.json({ ...menu, items });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  let body: { name?: string; location?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const menu = await Menu.findById(id).lean();
  if (!menu) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await Menu.updateOne(
    { _id: id },
    {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.location !== undefined && { location: body.location.trim() }),
      ...(body.type !== undefined && { type: body.type }),
    }
  );
  const updated = await Menu.findById(id).lean();
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  await Menu.findByIdAndDelete(id);
  await MenuItem.deleteMany({ menuId: id });
  return NextResponse.json({ ok: true });
}
