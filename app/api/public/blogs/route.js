import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";

function withCache(body, maxAge = 60) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": `public, max-age=${maxAge}, stale-while-revalidate=${maxAge}`,
    },
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const category = searchParams.get("category") || null;
    const search = searchParams.get("search")?.trim() || null;
    const fieldsMode = (searchParams.get("fields") || "").toLowerCase();

    await connectDB();

    const locale = searchParams.get("locale") || null;

    const filter = { status: "published" };
    if (category) filter["category"] = category;
    if (locale) filter.locale = locale;
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: new RegExp(safe, "i") },
        { excerpt: new RegExp(safe, "i") },
        { slug: new RegExp(safe, "i") },
      ];
    }

    const select =
      fieldsMode === "sidebar"
        ? "_id slug title featuredImage publishedAt"
        : fieldsMode === "archive"
          ? "_id publishedAt"
          : null;
    const includeTotal = fieldsMode !== "sidebar" && fieldsMode !== "archive";

    const findQuery = Blog.find(filter)
      .sort({ publishedAt: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    if (select) findQuery.select(select);
    if (!select || fieldsMode === "full") findQuery.populate("category");

    const blogsPromise = findQuery.lean();
    const totalPromise = includeTotal ? Blog.countDocuments(filter) : Promise.resolve(null);
    const [blogs, total] = await Promise.all([blogsPromise, totalPromise]);

    return withCache({
      items: blogs,
      total: total ?? blogs.length,
      page,
      limit,
      totalPages: includeTotal ? Math.ceil(total / limit) : 1,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
