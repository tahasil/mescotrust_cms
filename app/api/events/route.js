import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";

function withCache(body, maxAge = 60) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control":
        maxAge > 0
          ? `public, max-age=${maxAge}, stale-while-revalidate=${maxAge}`
          : "no-store",
    },
  });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getStartOfTodayUtc() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function getEndOfTodayUtc(todayStart) {
  return new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
}

function buildActiveDateCondition(todayStart) {
  return {
    $or: [
      { endDate: { $gte: todayStart } },
      { endDate: null, startDate: { $gte: todayStart } },
      { endDate: null, startDate: null },
    ],
  };
}

function buildPastDateCondition(todayStart) {
  return {
    $or: [
      { endDate: { $lt: todayStart } },
      { endDate: null, startDate: { $lt: todayStart } },
    ],
  };
}

/** Start and end dates are inclusive for the whole current UTC day. */
function buildLiveDateCondition(todayStart) {
  const todayEnd = getEndOfTodayUtc(todayStart);
  return {
    $and: [
      { startDate: { $ne: null, $lte: todayEnd } },
      {
        $or: [
          { endDate: { $gte: todayStart } },
          {
            endDate: null,
            startDate: { $gte: todayStart, $lte: todayEnd },
          },
        ],
      },
    ],
  };
}

function buildStatusGroupedItemsQuery({ filter, todayStart, page, limit }) {
  const todayEnd = getEndOfTodayUtc(todayStart);
  const epoch = new Date(0);
  const farFuture = new Date("9999-12-31T23:59:59.999Z");
  const effectiveEndDate = { $ifNull: ["$endDate", "$startDate"] };
  const isLive = {
    $and: [
      { $ne: ["$startDate", null] },
      { $lte: ["$startDate", todayEnd] },
      { $gte: [effectiveEndDate, todayStart] },
    ],
  };
  const isPast = {
    $and: [
      { $ne: [effectiveEndDate, null] },
      { $lt: [effectiveEndDate, todayStart] },
    ],
  };

  return Event.aggregate([
    { $match: filter },
    {
      $addFields: {
        __eventStatusRank: {
          $cond: [isLive, 0, { $cond: [isPast, 2, 1] }],
        },
      },
    },
    {
      $addFields: {
        __eventGroupSortDate: {
          $cond: [
            { $eq: ["$__eventStatusRank", 2] },
            { $subtract: [epoch, effectiveEndDate] },
            {
              $subtract: [
                { $ifNull: ["$startDate", farFuture] },
                epoch,
              ],
            },
          ],
        },
      },
    },
    { $sort: { __eventStatusRank: 1, __eventGroupSortDate: 1, updatedAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    { $project: { __eventStatusRank: 0, __eventGroupSortDate: 0 } },
  ]);
}

/**
 * Public events API.
 * GET /api/events — paginated list (published + active by default)
 * GET /api/events?slug=my-event — single published event
 *
 * Query: page, limit, search, sort=upcoming|recent, locale, featured=true|false,
 * visibility=active|live|past|all
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
    // Featured feeds are kept dynamic so admin changes appear on the next fetch.
    const featuredParam = (searchParams.get("featured") || "").toLowerCase();
    const featured =
      featuredParam === "true" || featuredParam === "1"
        ? true
        : featuredParam === "false" || featuredParam === "0"
          ? false
          : null;
    const visibility = (searchParams.get("visibility") || "active").toLowerCase();
    const fieldsMode = (searchParams.get("fields") || "").toLowerCase();
    const todayStart = getStartOfTodayUtc();

    const andConditions = [{ status: "published" }];
    if (locale) andConditions.push({ locale });
    if (featured === true) andConditions.push({ featured: true });
    if (featured === false) andConditions.push({ featured: { $ne: true } });
    if (search) {
      const query = escapeRegex(search);
      andConditions.push({
        $or: [
          { title: new RegExp(query, "i") },
          { description: new RegExp(query, "i") },
          { content: new RegExp(query, "i") },
          { slug: new RegExp(query, "i") },
        ],
      });
    }
    if (visibility === "past") {
      andConditions.push(buildPastDateCondition(todayStart));
    } else if (visibility === "live") {
      andConditions.push(buildLiveDateCondition(todayStart));
    } else if (visibility !== "all") {
      andConditions.push(buildActiveDateCondition(todayStart));
    }
    const filter =
      andConditions.length === 1 ? andConditions[0] : { $and: andConditions };

    const sort =
      visibility === "past"
        ? { endDate: -1, startDate: -1, updatedAt: -1 }
        : sortMode === "recent"
        ? { updatedAt: -1, startDate: -1 }
        : { startDate: 1, updatedAt: -1 };
    const select =
      fieldsMode === "sidebar"
        ? "slug title featuredImageDesktop featuredImageMobile startDate endDate updatedAt"
        : null;
    const includeTotal = fieldsMode !== "sidebar";

    const useStatusGroupedSort = sortMode === "grouped" && fieldsMode !== "sidebar";
    const findQuery = useStatusGroupedSort
      ? null
      : Event.find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit);
    if (select && findQuery) findQuery.select(select);

    const itemsPromise = useStatusGroupedSort
      ? buildStatusGroupedItemsQuery({ filter, todayStart, page, limit })
      : findQuery.lean();
    const totalPromise = includeTotal ? Event.countDocuments(filter) : Promise.resolve(null);
    const [items, total] = await Promise.all([itemsPromise, totalPromise]);

    return withCache(
      {
        items,
        total: total ?? items.length,
        page,
        limit,
        totalPages: includeTotal ? Math.ceil(total / limit) : 1,
      },
      featured !== null ? 0 : 60,
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
