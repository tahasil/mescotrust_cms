import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const category = searchParams.get("category") || null;
    const search = searchParams.get("search")?.trim() || null;

    await connectDB();

    const locale = searchParams.get("locale") || null;

    const filter = { status: "published" };
    if (category) filter["category"] = category;
    if (locale) filter.locale = locale;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, "i") },
        { excerpt: new RegExp(search, "i") },
        { slug: new RegExp(search, "i") },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate("category")
        .sort({ publishedAt: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return NextResponse.json({
      items: blogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
