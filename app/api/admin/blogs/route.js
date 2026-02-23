import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import { normalizeSlug } from "@/lib/slug";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const skip = (page - 1) * limit;

    await connectDB();
    const [blogs, total] = await Promise.all([
      Blog.find().populate("category").sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Blog.countDocuments(),
    ]);
    return NextResponse.json({ items: blogs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { title, slug: rawSlug, content, excerpt, featuredImage, author, status, publishedAt, category, tags, meta, locale } = body;

    const result = normalizeSlug(rawSlug || title);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const slug = result.slug;

    await connectDB();
    const existing = await Blog.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 400 });
    }

    const blog = await Blog.create({
      title: title || "Untitled",
      slug,
      content: content || "",
      excerpt: excerpt || "",
      featuredImage: featuredImage || "",
      author: author || "",
      status: status || "draft",
      publishedAt: status === "published" ? new Date() : null,
      category: category || null,
      tags: Array.isArray(tags) ? tags : [],
      meta: meta || {},
      ...(locale && { locale }),
      createdBy: session.email || "",
      updatedBy: session.email || "",
    });
    return NextResponse.json(blog);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
