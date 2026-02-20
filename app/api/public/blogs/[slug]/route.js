import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";

export async function GET(req, { params }) {
  try {
    const slug = params.slug;
    if (!slug) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await connectDB();
    const blog = await Blog.findOne({ slug, status: "published" }).populate("category").lean();

    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(blog);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
