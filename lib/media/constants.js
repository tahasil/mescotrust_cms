const IMAGE_MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

const IMAGE_UPLOAD_MIME_TYPES = Object.keys(IMAGE_MIME_TO_EXT);
const NON_IMAGE_UPLOAD_MIME_TYPES = ["application/pdf"];
const ALLOWED_UPLOAD_MIME_TYPES = [
  ...IMAGE_UPLOAD_MIME_TYPES,
  ...NON_IMAGE_UPLOAD_MIME_TYPES,
];

const QUALITY_PRESETS = {
  lossless: 95,
  glossy: 85,
  lossy: 75,
};

const DEFAULT_MEDIA_WIDTHS = {
  thumbnail: 240,
  medium: 640,
  large: 1280,
  mobile: 768,
  desktop: 1440,
};

module.exports = {
  IMAGE_MIME_TO_EXT,
  IMAGE_UPLOAD_MIME_TYPES,
  NON_IMAGE_UPLOAD_MIME_TYPES,
  ALLOWED_UPLOAD_MIME_TYPES,
  QUALITY_PRESETS,
  DEFAULT_MEDIA_WIDTHS,
};
