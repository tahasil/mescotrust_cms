import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { BlogPost } from "@/models";
import { toSlug, isValidSlug } from "@/utils/slug";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  const post = await BlogPost.findById(id).populate("categoryId").lean();
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { id } = await params;
  let body: { title?: string; slug?: string; content?: string; excerpt?: string; categoryId?: string | null; tags?: string[]; status?: string; publishedAt?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const post = await BlogPost.findById(id).lean() as { title?: string; publishedAt?: Date } | null;
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (body.slug !== undefined) {
    const slug = body.slug.trim() ? toSlug(body.slug) : toSlug((body.title ?? post.title) ?? "");
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: "Invalid or reserved slug" }, { status: 400 });
    }
    const existing = await BlogPost.findOne({ slug, _id: { $ne: new mongoose.Types.ObjectId(id) } }).lean();
    if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }
  const update: Record<string, unknown> = {
    ...(body.title !== undefined && { title: body.title }),
    ...(body.slug !== undefined && { slug: body.slug.trim() ? toSlug(body.slug) : undefined }),
    ...(body.content !== undefined && { content: body.content }),
    ...(body.excerpt !== undefined && { excerpt: body.excerpt }),
    ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
    ...(body.tags !== undefined && { tags: body.tags }),
    ...(body.status !== undefined && { status: body.status }),
    ...(body.publishedAt !== undefined && { publishedAt: body.publishedAt ? new Date(body.publishedAt) : null }),
  };
  if (body.status === "published" && !post.publishedAt) {
    update.publishedAt = new Date();
  }
  await BlogPost.updateOne({ _id: id }, update);
  const updated = await BlogPost.findById(id).populate("categoryId").lean();
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
  await BlogPost.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
