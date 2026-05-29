import { connectDB } from "@/lib/db";
import { getSiteUrl } from "@/lib/env";
import Page from "@/models/Page";
import Blog from "@/models/Blog";
import Event from "@/models/Event";
import { getPublishedSlug } from "@/lib/pagePublication";

export default async function sitemap() {
  const baseUrl = getSiteUrl();
  const entries = [];

  try {
    await connectDB();
    const [pages, blogs, events] = await Promise.all([
      Page.find({ status: "published", isDeleted: { $ne: 1 } }).select("slug publishedSlug updatedAt").lean(),
      Blog.find({ status: "published" }).select("slug updatedAt publishedAt").lean(),
      Event.find({ status: "published" }).select("slug updatedAt startDate").lean(),
    ]);

    entries.push({ url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 });
    entries.push({ url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 });
    entries.push({ url: `${baseUrl}/events`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 });
    entries.push({ url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 });

    for (const p of pages) {
      const liveSlug = getPublishedSlug(p);
      if (liveSlug && liveSlug !== "home") {
        entries.push({
          url: `${baseUrl}/${liveSlug}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
    for (const b of blogs) {
      entries.push({
        url: `${baseUrl}/blog/${b.slug}`,
        lastModified: (b.publishedAt || b.updatedAt) ? new Date(b.publishedAt || b.updatedAt) : new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
    for (const e of events) {
      entries.push({
        url: `${baseUrl}/events/${e.slug}`,
        lastModified: (e.startDate || e.updatedAt) ? new Date(e.startDate || e.updatedAt) : new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  } catch (e) {
    console.error("Sitemap error:", e);
  }

  return entries;
}
