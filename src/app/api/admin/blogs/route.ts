import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { BlogPost } from "@/models";
import { toSlug, isValidSlug } from "@/utils/slug";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const posts = await BlogPost.find().sort({ updatedAt: -1 }).populate("categoryId").lean();
  return NextResponse.json(posts.map((p) => ({ ...p, id: String(p._id) })));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  let body: { title: string; slug?: string; content?: string; excerpt?: string; categoryId?: string | null; tags?: string[]; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const slug = body.slug?.trim() ? toSlug(body.slug) : toSlug(body.title || "post");
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid or reserved slug" }, { status: 400 });
  }
  const existing = await BlogPost.findOne({ slug }).lean();
  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }
  const post = await BlogPost.create({
    title: body.title ?? "Untitled",
    slug,
    content: body.content ?? "",
    excerpt: body.excerpt ?? null,
    categoryId: body.categoryId ?? null,
    tags: body.tags ?? [],
    status: body.status ?? "draft",
  });
  return NextResponse.json(post);
}
