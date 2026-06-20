function normalizeUrlValue(value) {
  return String(value || "").trim();
}

function normalizeMediaFormatParam(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "original" || raw === "jpeg") return "jpg";
  if (raw === "jpg" || raw === "png" || raw === "webp" || raw === "avif" || raw === "auto") {
    return raw;
  }
  return raw;
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

function extractMediaFormatParam(value) {
  const comparable = toComparableMediaUrl(value);
  if (!isMediaRouteUrl(comparable)) return "";

  if (comparable.startsWith("http://") || comparable.startsWith("https://")) {
    try {
      const parsed = new URL(comparable);
      return normalizeMediaFormatParam(parsed.searchParams.get("format") || "");
    } catch {
      return "";
    }
  }

  const [, queryPart = ""] = comparable.split("?");
  const params = new URLSearchParams(queryPart);
  return normalizeMediaFormatParam(params.get("format") || "");
}

function buildMediaUrl(value, options = {}) {
  const normalized = normalizeUrlValue(value);
  if (!normalized) return "";
  if (!isMediaRouteUrl(normalized)) return normalized;

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    try {
      const parsed = new URL(normalized);
      if (options.size) parsed.searchParams.set("size", String(options.size));
      if (options.format) {
        parsed.searchParams.set(
          "format",
          normalizeMediaFormatParam(options.format),
        );
      }
      return parsed.toString();
    } catch {
      return normalized;
    }
  }

  const [pathPart, queryPart = ""] = normalized.split("?");
  const params = new URLSearchParams(queryPart);
  if (options.size) params.set("size", String(options.size));
  if (options.format) {
    params.set("format", normalizeMediaFormatParam(options.format));
  }
  const query = params.toString();
  return query ? `${pathPart}?${query}` : pathPart;
}

function buildMediaVariantUrl(mediaId, { size = "original", format = "auto" } = {}) {
  const id = String(mediaId || "").trim();
  if (!id) return "";
  return buildMediaUrl(`/media/${id}`, {
    size: String(size || "original"),
    format: normalizeMediaFormatParam(format || "auto"),
  });
}

function ensureMediaVariantParams(
  value,
  { defaultSize = "original", defaultFormat = "auto" } = {},
) {
  const normalized = normalizeUrlValue(value);
  if (!normalized || !isMediaRouteUrl(normalized)) return normalized;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    try {
      const parsed = new URL(normalized);
      if (!parsed.searchParams.get("size")) {
        parsed.searchParams.set("size", String(defaultSize || "original"));
      }
      if (!parsed.searchParams.get("format")) {
        parsed.searchParams.set(
          "format",
          normalizeMediaFormatParam(defaultFormat || "auto"),
        );
      }
      return parsed.toString();
    } catch {
      return normalized;
    }
  }

  const [pathPart, queryPart = ""] = normalized.split("?");
  const params = new URLSearchParams(queryPart);
  if (!params.get("size")) params.set("size", String(defaultSize || "original"));
  if (!params.get("format")) {
    params.set("format", normalizeMediaFormatParam(defaultFormat || "auto"));
  }
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
  normalizeMediaFormatParam,
  toComparableMediaUrl,
  isMediaRouteUrl,
  extractMediaIdFromUrl,
  extractMediaFormatParam,
  buildMediaUrl,
  buildMediaVariantUrl,
  ensureMediaVariantParams,
  looksLikeMediaReference,
};
