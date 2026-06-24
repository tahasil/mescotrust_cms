import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const EVENT_DESKTOP_REQUIRED_WIDTH = 800;
export const EVENT_DESKTOP_REQUIRED_HEIGHT = 400;

export const EVENT_DESKTOP_REQUIRED_TEXT =
  `${EVENT_DESKTOP_REQUIRED_WIDTH} \u00D7 ${EVENT_DESKTOP_REQUIRED_HEIGHT} px`;

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

export async function validateEventImages(payload, options = {}) {
  const desktopErrors = await validateSingleImage(
    payload?.featuredImageDesktop,
    {
      requiredWidth: EVENT_DESKTOP_REQUIRED_WIDTH,
      requiredHeight: EVENT_DESKTOP_REQUIRED_HEIGHT,
      requiredText: EVENT_DESKTOP_REQUIRED_TEXT,
      label: "Desktop Image",
      labelPrefix: options?.labelPrefix,
    },
  );
  if (desktopErrors.length > 0) return desktopErrors;

  return [];
}
