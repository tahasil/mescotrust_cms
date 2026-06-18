const RASTER_UPLOAD_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export function isRasterUploadFile(file) {
  const mimeType = String(file?.type || "").toLowerCase().trim();
  return RASTER_UPLOAD_MIME_TYPES.has(mimeType);
}

export function parsePositiveIntOrNull(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  if (!/^\d+$/.test(normalized)) return Number.NaN;
  const num = Number(normalized);
  return num > 0 ? num : Number.NaN;
}
