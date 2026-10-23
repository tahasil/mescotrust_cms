import { connectDB } from "@/lib/db";
import { getRequestSiteUrl } from "@/lib/env";
import Page from "@/models/Page";
import ThemeConfig from "@/models/ThemeConfig";
import {
  getGlobalFallbackImageFromTheme,
  toAbsoluteUrl,
} from "@/helpers/socialShare";

const THEME_QUERY = {
  $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }],
};

const SYSTEM_DEFAULT_TITLE = "MESCO Trust";
const SYSTEM_DEFAULT_DESCRIPTION = "Content management system";

function toTrimmedString(value) {
  return value == null ? "" : String(value).trim();
}

export function parseMetaKeywords(value) {
  const raw = toTrimmedString(value);
  if (!raw) return undefined;
  const keywords = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return keywords.length > 0 ? keywords : undefined;
}

export function extractGlobalSeoFromTheme(themeDoc, siteUrl) {
  const title = toTrimmedString(themeDoc?.defaultMetaTitle);
  const description = toTrimmedString(themeDoc?.defaultMetaDescription);
  const keywords = parseMetaKeywords(themeDoc?.defaultMetaKeywords);
  const image = toAbsoluteUrl(
    getGlobalFallbackImageFromTheme(themeDoc || {}),
    siteUrl,
  );
  return { title, description, keywords, image };
}

export async function getGlobalSeoSettings() {
  try {
    await connectDB();
    const siteUrl = await getRequestSiteUrl();
    const themeDoc = await ThemeConfig.findOne(THEME_QUERY)
      .sort({ updatedAt: -1 })
      .lean();
    return extractGlobalSeoFromTheme(themeDoc, siteUrl);
  } catch {
    return { title: "", description: "", keywords: undefined, image: "" };
  }
}

export function buildSeoMetadata({
  title,
  description,
  keywords,
  canonical,
  openGraphUrl,
  image,
  type = "website",
}) {
  const metadata = {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: openGraphUrl,
      type,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
    },
  };

  if (keywords?.length) metadata.keywords = keywords;
  if (image) {
    metadata.openGraph.images = [{ url: image, alt: title }];
    metadata.twitter.images = [image];
  }

  return metadata;
}

/**
 * Build SEO metadata for a page slug from CMS data with global fallback.
 * Priority:
 * 1) page meta
 * 2) global theme SEO
 * 3) route/system fallback
 */
export async function getPageSeoMetadata({
  slug,
  fallbackTitle,
  fallbackDescription,
  fallbackCanonical,
  fallbackOpenGraphUrl,
  fallbackKeywords,
}) {
  let page = null;
  let themeDoc = null;

  try {
    await connectDB();
    [page, themeDoc] = await Promise.all([
      Page.findOne({ slug, status: "published" }).lean(),
      ThemeConfig.findOne(THEME_QUERY).sort({ updatedAt: -1 }).lean(),
    ]);
  } catch {
    // handled via fallback chain
  }

  // Request-aware base URL. Without it a deployment that has no
  // NEXT_PUBLIC_SITE_URL emits canonical / og:url / og:image on localhost.
  const siteUrl = await getRequestSiteUrl();
  const globalSeo = extractGlobalSeoFromTheme(themeDoc, siteUrl);
  const pageMeta = page?.meta || {};

  const title =
    toTrimmedString(pageMeta.metaTitle) ||
    globalSeo.title ||
    toTrimmedString(page?.title) ||
    toTrimmedString(fallbackTitle) ||
    SYSTEM_DEFAULT_TITLE;

  const description =
    toTrimmedString(pageMeta.metaDescription) ||
    globalSeo.description ||
    toTrimmedString(fallbackDescription) ||
    SYSTEM_DEFAULT_DESCRIPTION;

  const keywords =
    parseMetaKeywords(pageMeta.metaKeywords) ||
    globalSeo.keywords ||
    parseMetaKeywords(fallbackKeywords);

  const image =
    toAbsoluteUrl(toTrimmedString(pageMeta.metaImage), siteUrl) ||
    toAbsoluteUrl(toTrimmedString(page?.seoImage), siteUrl) ||
    globalSeo.image;

  return buildSeoMetadata({
    title,
    description,
    keywords,
    canonical: toAbsoluteUrl(toTrimmedString(fallbackCanonical), siteUrl),
    openGraphUrl: toAbsoluteUrl(toTrimmedString(fallbackOpenGraphUrl), siteUrl),
    image,
    type: "website",
  });
}

export {
  buildBreadcrumbSchema,
  normalizeBreadcrumbUrl,
} from "@/lib/breadcrumbSchema";

