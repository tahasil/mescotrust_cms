import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import Blog from "@/models/Blog";
import Event from "@/models/Event";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";
import { getPublishedSlug, getPublishedTitle } from "@/lib/pagePublication";

const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 30 });

export async function GET(req) {
  const clientId = getClientIp(req);
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
    const [pages, blogs, events] = await Promise.all([
      Page.find({
        status: "published",
        isDeleted: { $ne: 1 },
        $or: [{ title: regex }, { slug: regex }, { publishedTitle: regex }, { publishedSlug: regex }],
      })
        .select("title slug publishedTitle publishedSlug")
        .lean(),
      Blog.find({ status: "published", $or: [{ title: regex }, { slug: regex }, { excerpt: regex }] }).select("title slug excerpt").lean(),
      Event.find({ status: "published", $or: [{ title: regex }, { slug: regex }, { description: regex }] }).select("title slug description").lean(),
    ]);
    const items = [
      ...pages.map((p) => {
        const slug = getPublishedSlug(p);
        const title = getPublishedTitle(p);
        return { type: "page", title, url: `/${slug}`, slug };
      }),
      ...blogs.map((b) => ({ type: "blog", title: b.title, url: `/blog/${b.slug}`, slug: b.slug, excerpt: b.excerpt })),
      ...events.map((ev) => ({ type: "event", title: ev.title, url: `/events/${ev.slug}`, slug: ev.slug, excerpt: ev.description })),
    ];
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
