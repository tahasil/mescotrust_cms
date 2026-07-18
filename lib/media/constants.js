const RASTER_IMAGE_MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

const PASSTHROUGH_IMAGE_MIME_TO_EXT = {
  "image/gif": ".gif",
};

const VECTOR_IMAGE_MIME_TO_EXT = {
  "image/svg+xml": ".svg",
};

const IMAGE_MIME_TO_EXT = {
  ...RASTER_IMAGE_MIME_TO_EXT,
  ...PASSTHROUGH_IMAGE_MIME_TO_EXT,
  ...VECTOR_IMAGE_MIME_TO_EXT,
};

/**
 * Raster image types supported by optimizer pipeline (sharp).
 * Animated GIF is intentionally excluded from this list to preserve animation.
 * SVG is intentionally excluded here and handled as a sanitized passthrough.
 */
const OPTIMIZABLE_IMAGE_UPLOAD_MIME_TYPES = Object.keys(RASTER_IMAGE_MIME_TO_EXT);
const PASSTHROUGH_IMAGE_UPLOAD_MIME_TYPES = Object.keys(PASSTHROUGH_IMAGE_MIME_TO_EXT);
const IMAGE_UPLOAD_MIME_TYPES = [
  ...OPTIMIZABLE_IMAGE_UPLOAD_MIME_TYPES,
  ...PASSTHROUGH_IMAGE_UPLOAD_MIME_TYPES,
];
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
  ".gif": "image/gif",
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
  PASSTHROUGH_IMAGE_MIME_TO_EXT,
  VECTOR_IMAGE_MIME_TO_EXT,
  IMAGE_MIME_TO_EXT,
  OPTIMIZABLE_IMAGE_UPLOAD_MIME_TYPES,
  PASSTHROUGH_IMAGE_UPLOAD_MIME_TYPES,
  IMAGE_UPLOAD_MIME_TYPES,
  VECTOR_IMAGE_UPLOAD_MIME_TYPES,
  NON_IMAGE_UPLOAD_MIME_TYPES,
  ALLOWED_UPLOAD_MIME_TYPES,
  UPLOAD_MIME_BY_EXT,
  QUALITY_PRESETS,
};

