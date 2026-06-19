import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const POPUP_REQUIRED_IMAGE_WIDTH = 600;
export const POPUP_REQUIRED_IMAGE_HEIGHT = 600;
export const POPUP_REQUIRED_IMAGE_TEXT =
  `${POPUP_REQUIRED_IMAGE_WIDTH} \u00D7 ${POPUP_REQUIRED_IMAGE_HEIGHT} pixels`;

export async function validatePopupImageDimensions(imageUrl, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const value = String(imageUrl || "").trim();
  if (!value) return [];

  try {
    const { width, height } = await getImageDimensionsForValidation(value);
    if (
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      width === POPUP_REQUIRED_IMAGE_WIDTH &&
      height === POPUP_REQUIRED_IMAGE_HEIGHT
    ) {
      return [];
    }
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Image size must be exactly ${POPUP_REQUIRED_IMAGE_TEXT}. Selected: ${width} \u00D7 ${height} pixels.`,
    ];
  } catch {
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [`${prefix}Image size must be exactly ${POPUP_REQUIRED_IMAGE_TEXT}.`];
  }
}
