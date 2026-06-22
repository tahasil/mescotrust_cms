import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const BLOG_DESKTOP_REQUIRED_WIDTH = 1200;
export const BLOG_DESKTOP_REQUIRED_HEIGHT = 1000;

export const BLOG_DESKTOP_REQUIRED_TEXT =
  `${BLOG_DESKTOP_REQUIRED_WIDTH} \u00D7 ${BLOG_DESKTOP_REQUIRED_HEIGHT} px`;

function toTrimmed(value) {
  return String(value || "").trim();
}

function buildPrefix(labelPrefix) {
  const prefix = toTrimmed(labelPrefix);
  return prefix ? `${prefix}: ` : "";
}

async function validateSingleImage(url, options = {}) {
  const imageUrl = toTrimmed(url);
  if (!imageUrl) return [];

  const requiredWidth = Number(options.requiredWidth) || 0;
  const requiredHeight = Number(options.requiredHeight) || 0;
  const requiredText = toTrimmed(options.requiredText);
  const label = toTrimmed(options.label) || "Image";
  const labelPrefix = buildPrefix(options.labelPrefix);

  try {
    const dims = await getImageDimensionsForValidation(imageUrl);
    const width = Number(dims?.width) || 0;
    const height = Number(dims?.height) || 0;

    if (width === requiredWidth && height === requiredHeight) return [];

    return [
      `${labelPrefix}${label} must be exactly ${requiredText}. Selected image is ${width} \u00D7 ${height} px.`,
    ];
  } catch {
    return [
      `${labelPrefix}Unable to validate ${label.toLowerCase()} size. Please use ${requiredText}.`,
    ];
  }
}

export async function validateBlogImages(payload, options = {}) {
  const desktopErrors = await validateSingleImage(payload?.featuredImage, {
    requiredWidth: BLOG_DESKTOP_REQUIRED_WIDTH,
    requiredHeight: BLOG_DESKTOP_REQUIRED_HEIGHT,
    requiredText: BLOG_DESKTOP_REQUIRED_TEXT,
    label: "Desktop Image",
    labelPrefix: options?.labelPrefix,
  });
  if (desktopErrors.length > 0) return desktopErrors;

  return [];
}
