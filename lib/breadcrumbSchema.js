/**
 * Breadcrumb Schema Generator (Schema.org / Google Search BreadcrumbList)
 *
 * Generates valid JSON-LD structured data conforming to Google Search Central
 * and Schema.org BreadcrumbList guidelines:
 * https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 */

const LOCAL_HOST_PATTERN = /(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)/i;

export function isLocalHostUrl(val) {
  if (!val) return true;
  return LOCAL_HOST_PATTERN.test(String(val).trim());
}

/**
 * Known folder slug to human-friendly display label and default landing page.
 */
export const KNOWN_FOLDERS = {
  "about-us": { label: "About Us", href: "/about-us/mesco-at-glance" },
  "our-works": { label: "Our Works", href: "/our-works/educational-support" },
  "media": { label: "Media", href: "/media/in-media" },
  "impact": { label: "Impact", href: "/impact/success-stories" },
  "get-involved": { label: "Get Involved", href: "/get-involved/contact-us" },
  "csr": { label: "CSR", href: "/get-involved/csr" },
  "faq": { label: "FAQ", href: "/faq" },
  "events": { label: "Events", href: "/events" },
  "blog": { label: "Blog", href: "/blog" },
};

/**
 * Converts a slug segment into a capitalized, readable title.
 * e.g. "old-newspaper-units" -> "Old Newspaper Units"
 */
export function titleizeSegment(segment) {
  if (!segment) return "";
  const lower = String(segment).toLowerCase().trim();
  if (KNOWN_FOLDERS[lower]) {
    return KNOWN_FOLDERS[lower].label;
  }
  return lower
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Automatically builds a complete hierarchical breadcrumb trail for any CMS page.
 * Handles single slugs, nested parent folders (e.g. "our-works/old-newspaper-units"),
 * and newly created pages from /admin/pages.
 *
 * @param {string} slug - Page slug (e.g. "our-works/old-newspaper-units" or "donate-now")
 * @param {string} [pageTitle] - The page's published title
 * @param {Array} [existingItems] - Optional existing items from block props
 * @returns {Array<{ label: string, href: string }>}
 */
export function resolveBreadcrumbsForPage(slug, pageTitle = "", existingItems = []) {
  // If user explicitly configured 3 or more custom breadcrumb steps in page builder, respect them
  if (Array.isArray(existingItems) && existingItems.length > 2) {
    return existingItems;
  }

  const cleanSlug = String(slug || "").replace(/^\/+|\/+$/g, "");
  if (!cleanSlug || cleanSlug === "home") {
    return [];
  }

  const segments = cleanSlug.split("/").filter(Boolean);
  const items = [{ label: "Home", href: "/" }];

  let accumulatedPath = "";
  segments.forEach((seg, idx) => {
    accumulatedPath += (accumulatedPath ? "/" : "/") + seg;
    const isLast = idx === segments.length - 1;

    if (isLast) {
      items.push({
        label: pageTitle && pageTitle.trim() ? pageTitle.trim() : titleizeSegment(seg),
        href: accumulatedPath,
      });
    } else {
      const folder = KNOWN_FOLDERS[seg.toLowerCase()];
      items.push({
        label: folder ? folder.label : titleizeSegment(seg),
        href: folder ? folder.href : accumulatedPath,
      });
    }
  });

  return items;
}

/**
 * Resolves a reliable base URL.
 * Prefers configured public site URL or request domain over localhost.
 */
function ensureProtocol(url) {
  if (!url) return "";
  const trimmed = String(url).trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function getBaseUrl(explicitBase) {
  if (explicitBase && typeof explicitBase === "string" && explicitBase.trim()) {
    const trimmed = explicitBase.trim().replace(/\/+$/, "");
    if (!isLocalHostUrl(trimmed)) return ensureProtocol(trimmed);
  }
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  if (configured && !isLocalHostUrl(configured)) {
    return ensureProtocol(configured);
  }
  const authUrl = (process.env.NEXTAUTH_URL || "").trim().replace(/\/+$/, "");
  if (authUrl && !isLocalHostUrl(authUrl)) {
    return ensureProtocol(authUrl);
  }
  if (typeof window !== "undefined" && window.location?.origin && !isLocalHostUrl(window.location.origin)) {
    return ensureProtocol(window.location.origin);
  }
  // Public fallback domain so Google Rich Results Test and search engines always receive a valid public HTTPS URL
  return "https://mescotrust.org";
}

/**
 * Normalizes any relative or absolute URL into a clean, canonical absolute URL.
 * Handles trailing slashes, leading slashes, and redundant double slashes.
 *
 * @param {string} url - Target URL or path (e.g. "/about", "about", "https://example.com/about/")
 * @param {string} [baseUrl] - Base domain URL
 * @returns {string} Absolute URL or clean relative path if base unavailable
 */
export function normalizeBreadcrumbUrl(url, baseUrl = "") {
  const rawUrl = typeof url === "string" ? url.trim() : "";
  if (!rawUrl) return "";

  // Already absolute http/https URL
  if (/^https?:\/\//i.test(rawUrl)) {
    try {
      const parsed = new URL(rawUrl);
      parsed.pathname = parsed.pathname.replace(/\/+/g, "/");
      if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
        parsed.pathname = parsed.pathname.replace(/\/+$/, "");
      }
      return parsed.toString();
    } catch {
      return rawUrl;
    }
  }

  const base = getBaseUrl(baseUrl);
  const stripped = rawUrl.replace(/^[\/\\]+/, "");
  let cleanPath = stripped ? "/" + stripped.replace(/[\/\\]+/g, "/") : "/";
  if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
    cleanPath = cleanPath.replace(/\/+$/, "");
  }

  if (!base) return cleanPath;

  try {
    const resolved = new URL(cleanPath, `${base}/`);
    if (resolved.pathname.length > 1 && resolved.pathname.endsWith("/")) {
      resolved.pathname = resolved.pathname.replace(/\/+$/, "");
    }
    return resolved.toString();
  } catch {
    return "";
  }
}

/**
 * Strips HTML tags and trims whitespace from label strings.
 */
function cleanLabel(value) {
  if (value == null) return "";
  return String(value)
    .replace(/<[^>]*>?/gm, "")
    .trim();
}

/**
 * Creates a slug from a label.
 */
function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate Schema.org BreadcrumbList JSON-LD object.
 *
 * Every ListItem MUST have an 'item' (canonical URL) to be accepted
 * by Google Rich Results Test and Google Search Console.
 *
 * @param {Array<{ label?: string, name?: string, title?: string, href?: string, url?: string, item?: string }>} items
 * @param {Object} [options]
 * @param {string} [options.baseUrl] - Base URL override
 * @param {string} [options.currentUrl] - Current page canonical URL (fallback for the active last item)
 * @returns {Object|null} Valid Schema.org BreadcrumbList object or null
 */
export function buildBreadcrumbSchema(items = [], options = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const base = getBaseUrl(options.baseUrl);
  const elements = [];
  let previousUrl = "";

  items.forEach((entry, index) => {
    if (!entry) return;

    const isLast = index === items.length - 1;
    const name = cleanLabel(entry.name || entry.label || entry.title || (typeof entry === "string" ? entry : ""));
    if (!name) return;

    const rawHref =
      entry.href != null && entry.href !== ""
        ? entry.href
        : entry.url != null && entry.url !== ""
        ? entry.url
        : entry.item != null && entry.item !== ""
        ? entry.item
        : "";

    let resolvedUrl = "";
    if (rawHref) {
      resolvedUrl = normalizeBreadcrumbUrl(rawHref, base);
    } else if (isLast && options.currentUrl) {
      resolvedUrl = normalizeBreadcrumbUrl(options.currentUrl, base);
    } else if (isLast && typeof window !== "undefined" && window.location?.pathname) {
      resolvedUrl = normalizeBreadcrumbUrl(window.location.pathname, base);
    } else {
      // Ensure Google Rich Results Test never rejects breadcrumb because of missing 'item' field
      const slug = slugify(name);
      if (index === 0 && (name.toLowerCase() === "home" || name.toLowerCase() === "main")) {
        resolvedUrl = normalizeBreadcrumbUrl("/", base);
      } else if (previousUrl && previousUrl !== normalizeBreadcrumbUrl("/", base)) {
        try {
          const parsedPrev = new URL(previousUrl);
          resolvedUrl = normalizeBreadcrumbUrl(`${parsedPrev.pathname}/${slug}`, base);
        } catch {
          resolvedUrl = normalizeBreadcrumbUrl(`/${slug}`, base);
        }
      } else {
        resolvedUrl = normalizeBreadcrumbUrl(`/${slug}`, base);
      }
    }

    if (resolvedUrl) {
      previousUrl = resolvedUrl;
    }

    const listItem = {
      "@type": "ListItem",
      position: elements.length + 1,
      name,
      item: resolvedUrl || normalizeBreadcrumbUrl("/", base),
    };

    elements.push(listItem);
  });

  if (elements.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: elements,
  };
}

/**
 * Serializes a JSON-LD object to a safe JSON string, escaping '<' to prevent XSS / script closing attacks.
 */
export function serializeJsonLd(data) {
  if (!data) return "";
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
