const LEGACY_VARIANT_SIZES = new Set([
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
  if (requested === "original") return "";
  if (LEGACY_VARIANT_SIZES.has(requested)) return "";
  return "";
}

function resolveOriginalJpgUrl(media) {
  return (
    String(media?.generatedSizes?.original?.jpgUrl || "").trim() ||
    String(media?.originalUrl || "").trim() ||
    String(media?.url || "").trim()
  );
}

function resolveOriginalUrl(media) {
  return (
    String(media?.originalUrl || "").trim() ||
    String(media?.url || "").trim() ||
    resolveOriginalJpgUrl(media)
  );
}

function resolveWebpUrl(media) {
  return (
    String(media?.webpUrl || "").trim() ||
    String(media?.generatedSizes?.original?.webpUrl || "").trim()
  );
}

function resolveAvifUrl(media) {
  return (
    String(media?.avifUrl || "").trim() ||
    String(media?.generatedSizes?.original?.avifUrl || "").trim()
  );
}

function pickVariantUrl(media, size, format) {
  normalizeRequestedSize(size);

  const originalUrl = resolveOriginalUrl(media);
  const jpgUrl = resolveOriginalJpgUrl(media);
  const fallback = originalUrl || jpgUrl || "";
  const webp = resolveWebpUrl(media);
  const avif = resolveAvifUrl(media);

  const fmt = String(format || "auto").toLowerCase();
  if (fmt === "avif") return avif || webp || fallback;
  if (fmt === "webp") return webp || avif || fallback;
  if (fmt === "jpg" || fmt === "jpeg") return jpgUrl || fallback;
  if (fmt === "original") return originalUrl || jpgUrl || fallback;
  return webp || avif || fallback;
}

module.exports = {
  normalizeRequestedFormat,
  normalizeRequestedSize,
  pickVariantUrl,
};
