import { connectDB } from "@/lib/db";
import { getSiteUrl } from "@/lib/env";
import Page from "@/models/Page";
import Blog from "@/models/Blog";

export default async function sitemap() {
  const baseUrl = getSiteUrl();
  const entries = [];

  try {
    await connectDB();
    const [pages, blogs] = await Promise.all([
      Page.find({ status: "published" }).select("slug updatedAt").lean(),
      Blog.find({ status: "published" }).select("slug updatedAt publishedAt").lean(),
    ]);

    entries.push({ url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 });
    entries.push({ url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 });
    entries.push({ url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 });

    for (const p of pages) {
      if (p.slug && p.slug !== "home") {
        entries.push({
          url: `${baseUrl}/${p.slug}`,
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
  } catch (e) {
    console.error("Sitemap error:", e);
  }

  return entries;
}
