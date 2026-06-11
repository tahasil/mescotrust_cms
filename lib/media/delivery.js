const ALLOWED_VARIANT_SIZES = new Set([
  "original",
  "thumbnail",
  "medium",
  "large",
  "mobile",
  "desktop",
]);

function normalizeRequestedFormat(format) {
  const fmt = String(format || "").toLowerCase().trim();
  if (fmt === "webp" || fmt === "avif") return fmt;
  return "";
}

function normalizeRequestedSize(size) {
  const requested = String(size || "").toLowerCase().trim();
  if (!requested) return "";
  if (!ALLOWED_VARIANT_SIZES.has(requested)) return "";
  if (!requested || requested === "original") return "";
  return requested;
}

function pickVariantUrl(media, size, format) {
  const requestedSize = normalizeRequestedSize(size);
  const hasExplicitVariant = Boolean(requestedSize);
  const variant = hasExplicitVariant
    ? media?.generatedSizes?.[requestedSize] || null
    : null;

  const fallback = hasExplicitVariant
    ? variant?.jpgUrl || media?.originalUrl || media?.url || ""
    : media?.originalUrl || media?.url || "";
  const avif = hasExplicitVariant
    ? variant?.avifUrl || ""
    : media?.avifUrl || "";
  const webp = hasExplicitVariant
    ? variant?.webpUrl || ""
    : media?.webpUrl || "";

  const fmt = String(format || "auto").toLowerCase();
  if (fmt === "avif") return avif || webp || fallback;
  if (fmt === "webp") return webp || avif || fallback;
  if (fmt === "jpg" || fmt === "jpeg") return fallback;
  if (fmt === "original") return fallback;
  return avif || webp || fallback;
}

module.exports = {
  normalizeRequestedFormat,
  normalizeRequestedSize,
  pickVariantUrl,
};
