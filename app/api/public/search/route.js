import { NextResponse } from "next/server";
import { performUnifiedSearch } from "@/lib/search/unifiedSearch";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 120 });

export async function GET(req) {
  const clientId = getClientIp(req);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || searchParams.get("query") || searchParams.get("search") || "").trim();
  const type = (searchParams.get("type") || "all").trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(100, Math.max(1, Number(limitParam))) : 20;

  if (!q || q.length < 2) {
    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      totalPages: 0,
      counts: { all: 0, pages: 0, events: 0, blogs: 0, news: 0, reports: 0 },
      query: q,
    });
  }

  try {
    const result = await performUnifiedSearch({
      query: q,
      type,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[public-search] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
