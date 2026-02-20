import { connectDB } from "@/lib/db";
import { Page, BlogPost } from "@/models";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap() {
  await connectDB();
  const [pages, posts] = await Promise.all([
    Page.find({ status: "published" }).select("slug isHomePage updatedAt").lean(),
    BlogPost.find({ status: "published" }).select("slug updatedAt").lean(),
  ]);
  const home = pages.find((p) => p.isHomePage);
  const entries: { url: string; lastModified: Date }[] = [];
  entries.push({ url: BASE + "/", lastModified: home?.updatedAt ?? new Date() });
  for (const p of pages) {
    if (!p.isHomePage) entries.push({ url: `${BASE}/${p.slug}`, lastModified: p.updatedAt });
  }
  entries.push({ url: `${BASE}/blog`, lastModified: new Date() });
  for (const p of posts) {
    entries.push({ url: `${BASE}/blog/${p.slug}`, lastModified: p.updatedAt });
  }
  return entries;
}
