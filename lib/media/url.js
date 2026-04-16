function normalizeUrlValue(value) {
  return String(value || "").trim();
}

function toComparableMediaUrl(value) {
  const raw = normalizeUrlValue(value);
  if (!raw) return "";

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const parsed = new URL(raw);
      return `${parsed.pathname}${parsed.search || ""}`;
    } catch {
      return raw;
    }
  }

  return raw;
}

function isMediaRouteUrl(value) {
  const comparable = toComparableMediaUrl(value);
  return /^\/media\/[^/?#]+(?:\?.*)?$/i.test(comparable);
}

function extractMediaIdFromUrl(value) {
  const comparable = toComparableMediaUrl(value);
  if (!isMediaRouteUrl(comparable)) return "";
  const pathPart = comparable.split("?")[0] || "";
  const id = pathPart.replace(/^\/media\//i, "").trim();
  return id || "";
}

function buildMediaUrl(value, options = {}) {
  const normalized = normalizeUrlValue(value);
  if (!normalized) return "";
  if (!isMediaRouteUrl(normalized)) return normalized;

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    try {
      const parsed = new URL(normalized);
      if (options.size) parsed.searchParams.set("size", String(options.size));
      if (options.format) parsed.searchParams.set("format", String(options.format));
      return parsed.toString();
    } catch {
      return normalized;
    }
  }

  const [pathPart, queryPart = ""] = normalized.split("?");
  const params = new URLSearchParams(queryPart);
  if (options.size) params.set("size", String(options.size));
  if (options.format) params.set("format", String(options.format));
  const query = params.toString();
  return query ? `${pathPart}?${query}` : pathPart;
}

function looksLikeMediaReference(value) {
  const normalized = toComparableMediaUrl(value).toLowerCase();
  if (!normalized) return false;
  if (normalized.startsWith("/media/")) return true;
  if (normalized.startsWith("/uploads/")) return true;
  if (normalized.startsWith("uploads/")) return true;
  return /\.(jpg|jpeg|png|webp|avif|gif|svg|pdf)(\?|$)/i.test(normalized);
}

module.exports = {
  normalizeUrlValue,
  toComparableMediaUrl,
  isMediaRouteUrl,
  extractMediaIdFromUrl,
  buildMediaUrl,
  looksLikeMediaReference,
};
