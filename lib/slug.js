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
  const slug = slugify(input.trim(), { lower: true, strict: true });
  if (!slug) {
    return { valid: false, error: "Invalid slug characters" };
  }
  if (slug.length > MAX_SLUG_LENGTH) {
    return { valid: false, error: `Slug must be at most ${MAX_SLUG_LENGTH} characters` };
  }
  if (RESERVED_PATHS.includes(slug)) {
    return { valid: false, error: `Slug "${slug}" is a reserved path` };
  }
  return { valid: true, slug };
}

function isReservedPath(slug) {
  return RESERVED_PATHS.includes(String(slug).toLowerCase());
}

module.exports = { normalizeSlug, RESERVED_PATHS, isReservedPath };
