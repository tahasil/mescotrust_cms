import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const IMPACT_SHOWCASE_LEFT_REQUIRED_WIDTH = 763;
export const IMPACT_SHOWCASE_LEFT_REQUIRED_HEIGHT = 476;
export const IMPACT_SHOWCASE_RIGHT_REQUIRED_WIDTH = 457;
export const IMPACT_SHOWCASE_RIGHT_REQUIRED_HEIGHT = 338;
export const IMPACT_SHOWCASE_LEFT_REQUIRED_TEXT =
  `${IMPACT_SHOWCASE_LEFT_REQUIRED_WIDTH} \u00D7 ${IMPACT_SHOWCASE_LEFT_REQUIRED_HEIGHT} px`;
export const IMPACT_SHOWCASE_RIGHT_REQUIRED_TEXT =
  `${IMPACT_SHOWCASE_RIGHT_REQUIRED_WIDTH} \u00D7 ${IMPACT_SHOWCASE_RIGHT_REQUIRED_HEIGHT} px`;

function resolveLeftDesktopImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  return String(
    props.impactShowcaseLeftImageDesktop ??
      props.impactShowcaseLeftImage ??
      "",
  ).trim();
}

function resolveRightDesktopImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  return String(
    props.impactShowcaseRightImageDesktop ??
      props.impactShowcaseRightImage ??
      "",
  ).trim();
}

async function validateSingleImage({
  imageUrl,
  requiredWidth,
  requiredHeight,
  requiredText,
  label,
  labelPrefix,
  cache,
}) {
  if (!imageUrl) return [];

  try {
    let dims = cache.get(imageUrl);
    if (!dims) {
      dims = await getImageDimensionsForValidation(imageUrl);
      cache.set(imageUrl, dims);
    }

    const width = Number(dims?.width) || 0;
    const height = Number(dims?.height) || 0;
    if (width === requiredWidth && height === requiredHeight) return [];

    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}${label} must be exactly ${requiredText}. Selected image is ${width} \u00D7 ${height} px.`,
    ];
  } catch {
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Unable to validate ${label.toLowerCase()} size. Please use ${requiredText}.`,
    ];
  }
}

export async function validateImpactShowcaseImages(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const cache = new Map();
  const leftDesktopImage = resolveLeftDesktopImageUrl(props);
  const rightDesktopImage = resolveRightDesktopImageUrl(props);

  const leftErrors = await validateSingleImage({
    imageUrl: leftDesktopImage,
    requiredWidth: IMPACT_SHOWCASE_LEFT_REQUIRED_WIDTH,
    requiredHeight: IMPACT_SHOWCASE_LEFT_REQUIRED_HEIGHT,
    requiredText: IMPACT_SHOWCASE_LEFT_REQUIRED_TEXT,
    label: "Left Desktop Image",
    labelPrefix,
    cache,
  });
  if (leftErrors.length > 0) return leftErrors;

  return validateSingleImage({
    imageUrl: rightDesktopImage,
    requiredWidth: IMPACT_SHOWCASE_RIGHT_REQUIRED_WIDTH,
    requiredHeight: IMPACT_SHOWCASE_RIGHT_REQUIRED_HEIGHT,
    requiredText: IMPACT_SHOWCASE_RIGHT_REQUIRED_TEXT,
    label: "Right Desktop Image",
    labelPrefix,
    cache,
  });
}
