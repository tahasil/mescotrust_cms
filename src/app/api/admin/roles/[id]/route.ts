import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { Role, User } from "@/models";
import { toSlug } from "@/utils/slug";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  const role = await Role.findById(id).lean();
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const userCount = await User.countDocuments({ roleId: id });
  return NextResponse.json({ ...role, _count: { users: userCount } });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  let body: { name?: string; slug?: string; description?: string; permissions?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const role = await Role.findById(id).lean() as { slug?: string } | null;
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.slug !== undefined) {
    const slug = body.slug.trim() ? toSlug(body.slug) : (role.slug ?? "");
    const existing = await Role.findOne({ slug, _id: { $ne: new mongoose.Types.ObjectId(id) } }).lean();
    if (existing) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
    }
  }

  await Role.updateOne(
    { _id: id },
    {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.slug !== undefined && { slug: body.slug.trim() ? toSlug(body.slug) : undefined }),
      ...(body.description !== undefined && { description: body.description.trim() || null }),
      ...(body.permissions !== undefined && { permissions: body.permissions }),
    }
  );
  const updated = await Role.findById(id).lean();
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
  const role = await Role.findById(id).lean();
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const userCount = await User.countDocuments({ roleId: id });
  if (userCount > 0) {
    return NextResponse.json(
      { error: "Reassign or remove users before deleting this role" },
      { status: 400 }
    );
  }
  await Role.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
