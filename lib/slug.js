const slugify = require("slugify");

const RESERVED_PATHS = ["admin", "blog", "contact", "search", "api", "preview", "sitemap.xml", "robots.txt"];
const MAX_SLUG_LENGTH = 200;

/**
 * Normalize and validate slug. Returns { valid: boolean, slug?: string, error?: string }.
 */
function normalizeSlug(input) {
  if (typeof input !== "string" || !input.trim()) {
    return { valid: false, error: "Slug is required" };
  }
  // Slugify each path segment individually to preserve slashes (e.g. "about-us/mesco-at-glance")
  const slug = input
    .trim()
    .split("/")
    .map((seg) => slugify(seg.trim(), { lower: true, strict: true }))
    .filter(Boolean)
    .join("/");
  if (!slug) {
    return { valid: false, error: "Invalid slug characters" };
  }
  if (slug.length > MAX_SLUG_LENGTH) {
    return { valid: false, error: `Slug must be at most ${MAX_SLUG_LENGTH} characters` };
  }
  const firstSegment = slug.split("/")[0];
  if (RESERVED_PATHS.includes(firstSegment)) {
    return { valid: false, error: `Slug "${firstSegment}" is a reserved path` };
  }
  return { valid: true, slug };
}

function isReservedPath(slug) {
  return RESERVED_PATHS.includes(String(slug).toLowerCase());
}

module.exports = { normalizeSlug, RESERVED_PATHS, isReservedPath };
