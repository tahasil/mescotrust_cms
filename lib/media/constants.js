const RASTER_IMAGE_MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

const VECTOR_IMAGE_MIME_TO_EXT = {
  "image/svg+xml": ".svg",
};

const IMAGE_MIME_TO_EXT = {
  ...RASTER_IMAGE_MIME_TO_EXT,
  ...VECTOR_IMAGE_MIME_TO_EXT,
};

/**
 * Raster image types supported by optimizer pipeline (sharp).
 * SVG is intentionally excluded here and handled as a sanitized passthrough.
 */
const IMAGE_UPLOAD_MIME_TYPES = Object.keys(RASTER_IMAGE_MIME_TO_EXT);
const VECTOR_IMAGE_UPLOAD_MIME_TYPES = Object.keys(VECTOR_IMAGE_MIME_TO_EXT);
const NON_IMAGE_UPLOAD_MIME_TYPES = ["application/pdf"];
const ALLOWED_UPLOAD_MIME_TYPES = [
  ...IMAGE_UPLOAD_MIME_TYPES,
  ...VECTOR_IMAGE_UPLOAD_MIME_TYPES,
  ...NON_IMAGE_UPLOAD_MIME_TYPES,
];

const UPLOAD_MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

const QUALITY_PRESETS = {
  lossless: 95,
  glossy: 85,
  lossy: 75,
};

module.exports = {
  RASTER_IMAGE_MIME_TO_EXT,
  VECTOR_IMAGE_MIME_TO_EXT,
  IMAGE_MIME_TO_EXT,
  IMAGE_UPLOAD_MIME_TYPES,
  VECTOR_IMAGE_UPLOAD_MIME_TYPES,
  NON_IMAGE_UPLOAD_MIME_TYPES,
  ALLOWED_UPLOAD_MIME_TYPES,
  UPLOAD_MIME_BY_EXT,
  QUALITY_PRESETS,
};

