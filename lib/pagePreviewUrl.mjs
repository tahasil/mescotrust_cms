/**
 * Return the public route used by a CMS page.
 * The page document uses `home` as its slug, while the public router serves it at `/`.
 */
export function getPublicPagePath(slug) {
  const normalizedSlug = String(slug || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");

  if (!normalizedSlug) return "";
  if (normalizedSlug.toLowerCase() === "home") return "/";

  return `/${normalizedSlug}`;
}

export function getPagePreviewUrl(slug, siteUrl = "") {
  const pagePath = getPublicPagePath(slug);
  if (!pagePath) return "#";

  const normalizedSiteUrl = String(siteUrl || "").trim().replace(/\/+$/g, "");
  return `${normalizedSiteUrl}${pagePath}`;
}
