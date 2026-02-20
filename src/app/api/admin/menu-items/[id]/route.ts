import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { MenuItem } from "@/models";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  let body: { label?: string; url?: string; openInNewTab?: boolean; parentId?: string | null; order?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const item = await MenuItem.findById(id).lean();
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await MenuItem.updateOne(
    { _id: id },
    {
      ...(body.label !== undefined && { label: body.label.trim() }),
      ...(body.url !== undefined && { url: body.url.trim() }),
      ...(body.openInNewTab !== undefined && { openInNewTab: body.openInNewTab }),
      ...(body.parentId !== undefined && { parentId: body.parentId }),
      ...(body.order !== undefined && { order: body.order }),
    }
  );
  const updated = await MenuItem.findById(id).lean();
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
  await MenuItem.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
