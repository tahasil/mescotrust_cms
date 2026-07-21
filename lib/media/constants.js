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
const VIDEO_MIME_TO_EXT = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};
const VIDEO_UPLOAD_MIME_TYPES = Object.keys(VIDEO_MIME_TO_EXT);
const DOCUMENT_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "text/plain",
  "application/rtf",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "application/zip",
];
const NON_IMAGE_UPLOAD_MIME_TYPES = [
  ...DOCUMENT_UPLOAD_MIME_TYPES,
  ...VIDEO_UPLOAD_MIME_TYPES,
];
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
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".csv": "text/csv",
  ".txt": "text/plain",
  ".rtf": "application/rtf",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".zip": "application/zip",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
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
  VIDEO_MIME_TO_EXT,
  VIDEO_UPLOAD_MIME_TYPES,
  DOCUMENT_UPLOAD_MIME_TYPES,
  NON_IMAGE_UPLOAD_MIME_TYPES,
  ALLOWED_UPLOAD_MIME_TYPES,
  UPLOAD_MIME_BY_EXT,
  QUALITY_PRESETS,
};

