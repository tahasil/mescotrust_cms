import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { BlogCategory } from "@/models";
import { toSlug } from "@/utils/slug";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  let body: { name?: string; slug?: string; description?: string; order?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const cat = await BlogCategory.findById(id).lean() as { name?: string } | null;
  if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (body.slug !== undefined) {
    const slug = body.slug.trim() ? toSlug(body.slug) : toSlug((body.name ?? cat.name) ?? "");
    const existing = await BlogCategory.findOne({ slug, _id: { $ne: new mongoose.Types.ObjectId(id) } }).lean();
    if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }
  await BlogCategory.updateOne(
    { _id: id },
    {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.slug !== undefined && { slug: body.slug.trim() ? toSlug(body.slug) : undefined }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.order !== undefined && { order: body.order }),
    }
  );
  const updated = await BlogCategory.findById(id).lean();
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
  await BlogCategory.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
