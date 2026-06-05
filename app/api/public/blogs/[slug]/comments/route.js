import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import BlogComment from "@/models/BlogComment";
import ThemeConfig from "@/models/ThemeConfig";
import { unstable_cache } from "next/cache";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 10 });

const THEME_QUERY = {
  $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }],
};

const getCommentsEnabled = unstable_cache(async () => {
  try {
    const themeDoc = await ThemeConfig.findOne(THEME_QUERY)
      .sort({ updatedAt: -1 })
      .select("blogCommentsEnabled")
      .lean();
    if (themeDoc && typeof themeDoc.blogCommentsEnabled === "boolean") {
      return themeDoc.blogCommentsEnabled;
    }
    return true;
  } catch {
    return true;
  }
}, ["blog-comments-enabled-flag"], { revalidate: 60 });

/** GET — approved comments for a blog post */
export async function GET(req, { params }) {
  try {
    const slug = params.slug;
    await connectDB();
    if (!(await getCommentsEnabled())) return NextResponse.json([]);
    const blog = await Blog.findOne({ slug, status: "published" }).select("_id").lean();
    if (!blog) return NextResponse.json([]);
    const comments = await BlogComment.find({ blogId: blog._id, status: "approved" })
      .sort({ createdAt: -1 })
      .select("name comment createdAt")
      .lean();
    return NextResponse.json(comments, {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=30",
      },
    });
  } catch {
    return NextResponse.json([]);
  }
}

/** POST — submit a new comment (pending approval) */
export async function POST(req, { params }) {
  try {
    if (!checkRateLimit(getClientIp(req))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const slug = params.slug;
    const body = await req.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const comment = (body.comment || "").trim();

    if (!name || !email || !comment) {
      return NextResponse.json({ error: "Name, email, and comment are required" }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    await connectDB();
    if (!(await getCommentsEnabled())) {
      return NextResponse.json({ error: "Comments are disabled" }, { status: 403 });
    }
    const blog = await Blog.findOne({ slug, status: "published" }).select("_id").lean();
    if (!blog) return NextResponse.json({ error: "Blog not found" }, { status: 404 });

    await BlogComment.create({ blogId: blog._id, name, email, comment });
    return NextResponse.json({ success: true, message: "Comment submitted for approval" });
  } catch {
    return NextResponse.json({ error: "Failed to submit comment" }, { status: 500 });
  }
}
