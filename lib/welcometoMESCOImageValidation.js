import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const WELCOME_TO_MESCO_REQUIRED_IMAGE_WIDTH = 1042;
export const WELCOME_TO_MESCO_REQUIRED_IMAGE_HEIGHT = 1164;
export const WELCOME_TO_MESCO_REQUIRED_IMAGE_TEXT =
  `${WELCOME_TO_MESCO_REQUIRED_IMAGE_WIDTH} \u00D7 ${WELCOME_TO_MESCO_REQUIRED_IMAGE_HEIGHT} pixels`;

function resolveDesktopImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  const candidates = [props.imageDesktop, props.imageUrl];
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) return value;
  }
  return "";
}

export async function validateWelcometoMESCOImage(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const imageUrl = resolveDesktopImageUrl(props);
  if (!imageUrl) return [];

  try {
    const { width, height } = await getImageDimensionsForValidation(imageUrl);
    if (
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      width === WELCOME_TO_MESCO_REQUIRED_IMAGE_WIDTH &&
      height === WELCOME_TO_MESCO_REQUIRED_IMAGE_HEIGHT
    ) {
      return [];
    }
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Image size must be exactly ${WELCOME_TO_MESCO_REQUIRED_IMAGE_TEXT}. Selected: ${width} \u00D7 ${height} pixels.`,
    ];
  } catch {}

  const prefix = labelPrefix ? `${labelPrefix}: ` : "";
  return [`${prefix}Image size must be exactly ${WELCOME_TO_MESCO_REQUIRED_IMAGE_TEXT}.`];
}
