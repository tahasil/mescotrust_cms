import { connectDB } from "@/lib/db";
import { getRequestSiteUrl, getSiteUrl } from "@/lib/env";
import Blog from "@/models/Blog";
import Event from "@/models/Event";
import Page from "@/models/Page";
import SiteFileSetting from "@/models/SiteFileSetting";

export const SITE_FILE_TYPES = Object.freeze(["sitemap", "robots"]);

const MAX_CONTENT_LENGTH = Object.freeze({
  sitemap: 1_000_000,
  robots: 250_000,
});

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || getSiteUrl() || "http://localhost:3000").replace(/\/+$/, "");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function routeFromSlug(slug) {
  const segments = String(slug || "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(encodeURIComponent);
  return segments.length > 0 ? `/${segments.join("/")}` : "/";
}

function dateValue(value, fallback) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : fallback;
}

function addSitemapEntry(entries, baseUrl, path, options = {}) {
  const normalizedPath = path === "/" ? "/" : `/${String(path || "").replace(/^\/+/, "")}`;
  const url = normalizedPath === "/" ? `${baseUrl}/` : `${baseUrl}${normalizedPath}`;
  const current = entries.get(url);
  const next = {
    url,
    lastModified: dateValue(options.lastModified, new Date()),
    changeFrequency: options.changeFrequency || "weekly",
    priority: Number(options.priority ?? 0.5),
  };

  if (!current || next.priority > current.priority) entries.set(url, next);
}

export function assertSiteFileType(type) {
  const normalized = String(type || "").trim().toLowerCase();
  if (!SITE_FILE_TYPES.includes(normalized)) {
    throw new Error("Unsupported site file type");
  }
  return normalized;
}

export function validateSiteFileContent(type, content) {
  const normalizedType = assertSiteFileType(type);
  const normalizedContent = String(content || "").trim();
  if (!normalizedContent) throw new Error("Content is required");
  if (normalizedContent.length > MAX_CONTENT_LENGTH[normalizedType]) {
    throw new Error(`${normalizedType === "sitemap" ? "Sitemap" : "Robots"} content is too large`);
  }
  if (
    normalizedType === "sitemap" &&
    !/<(?:urlset|sitemapindex)(?:\s|>)/i.test(normalizedContent)
  ) {
    throw new Error("Sitemap content must contain a valid <urlset> or <sitemapindex> root element");
  }
  return `${normalizedContent}\n`;
}

export async function generateSitemapContent() {
  const entries = new Map();
  const now = new Date();
  // Request-aware base URL so a deployment without NEXT_PUBLIC_SITE_URL still
  // emits absolute public URLs instead of http://localhost:3000.
  const baseUrl = normalizeBaseUrl(await getRequestSiteUrl());

  addSitemapEntry(entries, baseUrl, "/", {
    lastModified: now,
    changeFrequency: "daily",
    priority: 1,
  });
  addSitemapEntry(entries, baseUrl, "/blog", {
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  });
  addSitemapEntry(entries, baseUrl, "/events", {
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  });

  try {
    await connectDB();
    const [pages, blogs, events] = await Promise.all([
      Page.find({ status: "published" }).select("slug updatedAt").lean(),
      Blog.find({ status: "published" }).select("slug updatedAt publishedAt").lean(),
      Event.find({ status: "published" }).select("slug updatedAt startDate").lean(),
    ]);

    for (const page of pages) {
      const path = page.slug === "home" ? "/" : routeFromSlug(page.slug);
      addSitemapEntry(entries, baseUrl, path, {
        lastModified: page.updatedAt,
        changeFrequency: "weekly",
        priority: page.slug === "home" ? 1 : 0.8,
      });
    }
    for (const blog of blogs) {
      if (!blog.slug) continue;
      addSitemapEntry(entries, baseUrl, `/blog/${encodeURIComponent(blog.slug)}`, {
        lastModified: blog.publishedAt || blog.updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
    for (const event of events) {
      if (!event.slug) continue;
      addSitemapEntry(entries, baseUrl, `/events/${encodeURIComponent(event.slug)}`, {
        lastModified: event.startDate || event.updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error("Sitemap generation error:", error);
  }

  const rows = Array.from(entries.values())
    .sort((a, b) => a.url.localeCompare(b.url))
    .map(
      (entry) =>
        `  <url>\n` +
        `    <loc>${escapeXml(entry.url)}</loc>\n` +
        `    <lastmod>${entry.lastModified.toISOString()}</lastmod>\n` +
        `    <changefreq>${entry.changeFrequency}</changefreq>\n` +
        `    <priority>${entry.priority.toFixed(1)}</priority>\n` +
        `  </url>`,
    );

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${rows.join("\n")}\n` +
    `</urlset>\n`
  );
}

export async function generateRobotsContent() {
  const baseUrl = normalizeBaseUrl(await getRequestSiteUrl());
  return (
    `User-agent: *\n` +
    `Allow: /\n` +
    `Disallow: /admin\n` +
    `Disallow: /api/\n` +
    `Disallow: /preview\n\n` +
    `Sitemap: ${baseUrl}/sitemap.xml\n`
  );
}

export async function generateSiteFileContent(type) {
  const normalizedType = assertSiteFileType(type);
  return normalizedType === "sitemap"
    ? generateSitemapContent()
    : generateRobotsContent();
}

export async function getSiteFile(type, { fallbackToGenerated = true } = {}) {
  const normalizedType = assertSiteFileType(type);
  await connectDB();
  const saved = await SiteFileSetting.findOne({ fileType: normalizedType }).lean();
  if (saved?.content) {
    return {
      type: normalizedType,
      content: saved.content,
      isSaved: true,
      generatedAt: saved.generatedAt || null,
      updatedAt: saved.updatedAt || null,
      updatedBy: saved.updatedBy || "",
    };
  }
  if (!fallbackToGenerated) return null;
  return {
    type: normalizedType,
    content: await generateSiteFileContent(normalizedType),
    isSaved: false,
    generatedAt: null,
    updatedAt: null,
    updatedBy: "",
  };
}

export async function saveSiteFile(type, content, updatedBy = "", { generated = false } = {}) {
  const normalizedType = assertSiteFileType(type);
  const validatedContent = validateSiteFileContent(normalizedType, content);
  await connectDB();
  const update = {
    content: validatedContent,
    updatedBy: String(updatedBy || ""),
  };
  if (generated) update.generatedAt = new Date();

  const saved = await SiteFileSetting.findOneAndUpdate(
    { fileType: normalizedType },
    { $set: update, $setOnInsert: { fileType: normalizedType } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();

  return {
    type: normalizedType,
    content: saved.content,
    isSaved: true,
    generatedAt: saved.generatedAt || null,
    updatedAt: saved.updatedAt || null,
    updatedBy: saved.updatedBy || "",
  };
}

export async function generateAndSaveSiteFile(type, updatedBy = "") {
  const normalizedType = assertSiteFileType(type);
  const content = await generateSiteFileContent(normalizedType);
  return saveSiteFile(normalizedType, content, updatedBy, { generated: true });
}
