import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";

function withCache(body, maxAge = 60) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": `public, max-age=${maxAge}, stale-while-revalidate=${maxAge}`,
    },
  });
}

/**
 * Public events API.
 * GET /api/events — paginated list (published only)
 * GET /api/events?slug=my-event — single published event
 *
 * Query: page, limit, search, sort=upcoming|recent, locale
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug")?.trim();

    await connectDB();

    if (slug) {
      const doc = await Event.findOne({ slug, status: "published" }).lean();
      if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return withCache(doc);
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const search = searchParams.get("search")?.trim() || null;
    const sortMode = (searchParams.get("sort") || "upcoming").toLowerCase();
    const locale = searchParams.get("locale") || null;
    const fieldsMode = (searchParams.get("fields") || "").toLowerCase();

    const filter = { status: "published" };
    if (locale) filter.locale = locale;
    if (search) {
      filter.$or = [
        { title: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { description: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { slug: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      ];
    }

    const sort =
      sortMode === "recent"
        ? { updatedAt: -1, startDate: -1 }
        : { startDate: 1, updatedAt: -1 };
    const select =
      fieldsMode === "sidebar"
        ? "slug title featuredImageDesktop featuredImageMobile startDate endDate updatedAt"
        : null;
    const includeTotal = fieldsMode !== "sidebar";

    const findQuery = Event.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    if (select) findQuery.select(select);

    const itemsPromise = findQuery.lean();
    const totalPromise = includeTotal ? Event.countDocuments(filter) : Promise.resolve(null);
    const [items, total] = await Promise.all([itemsPromise, totalPromise]);

    return withCache({
      items,
      total: total ?? items.length,
      page,
      limit,
      totalPages: includeTotal ? Math.ceil(total / limit) : 1,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
