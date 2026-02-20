import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import Blog from "@/models/Blog";

const RATE_LIMIT_MAP = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 30;

function getClientId(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(clientId) {
  const now = Date.now();
  const bucket = RATE_LIMIT_MAP.get(clientId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  bucket.count++;
  RATE_LIMIT_MAP.set(clientId, bucket);
  return bucket.count <= RATE_LIMIT_MAX;
}

export async function GET(req) {
  const clientId = getClientId(req);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  try {
    await connectDB();
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const [pages, blogs] = await Promise.all([
      Page.find({ status: "published", $or: [{ title: regex }, { slug: regex }] }).select("title slug").lean(),
      Blog.find({ status: "published", $or: [{ title: regex }, { slug: regex }, { excerpt: regex }] }).select("title slug excerpt").lean(),
    ]);
    const items = [
      ...pages.map((p) => ({ type: "page", title: p.title, url: `/${p.slug}`, slug: p.slug })),
      ...blogs.map((b) => ({ type: "blog", title: b.title, url: `/blog/${b.slug}`, slug: b.slug, excerpt: b.excerpt })),
    ];
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
