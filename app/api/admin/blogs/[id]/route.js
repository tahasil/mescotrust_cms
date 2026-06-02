import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import { normalizeSlug } from "@/lib/slug";
import { clearUsageForRef, syncMediaUsageForBlog } from "@/lib/media/usageTracker";
import { revalidateBlogs } from "@/lib/revalidateContent";

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const blog = await Blog.findById(id).populate("category").lean();
    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(blog);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const body = await req.json();
    const { title, slug: rawSlug, content, excerpt, featuredImage, featuredImageMobile, author, status, publishedAt, category, tags, meta, locale } = body;

    await connectDB();
    const blog = await Blog.findById(id);
    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (rawSlug !== undefined) {
      const result = normalizeSlug(rawSlug);
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      const existing = await Blog.findOne({ slug: result.slug, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ error: "A post with this slug already exists" }, { status: 400 });
      }
      blog.slug = result.slug;
    }
    if (title !== undefined) blog.title = title;
    if (content !== undefined) blog.content = content;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (featuredImage !== undefined) blog.featuredImage = featuredImage;
    if (featuredImageMobile !== undefined) blog.featuredImageMobile = featuredImageMobile;
    if (author !== undefined) blog.author = author;
    if (status !== undefined) {
      blog.status = status;
      if (status === "published" && !blog.publishedAt) blog.publishedAt = new Date();
    }
    if (publishedAt !== undefined) blog.publishedAt = publishedAt;
    if (category !== undefined) blog.category = category;
    if (Array.isArray(tags)) blog.tags = tags;
    if (meta !== undefined) blog.meta = meta;
    if (locale !== undefined) blog.locale = locale;
    blog.updatedBy = session.email || "";

    await blog.save();
    await syncMediaUsageForBlog(blog);
    revalidateBlogs(blog.slug);
    return NextResponse.json(blog);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await clearUsageForRef("blog", id);
    revalidateBlogs(blog.slug);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
