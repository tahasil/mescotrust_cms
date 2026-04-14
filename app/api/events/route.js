import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";

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
      return NextResponse.json(doc);
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const search = searchParams.get("search")?.trim() || null;
    const sortMode = (searchParams.get("sort") || "upcoming").toLowerCase();
    const locale = searchParams.get("locale") || null;

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

    const [items, total] = await Promise.all([
      Event.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
