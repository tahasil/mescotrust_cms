import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const HELPINGPEOPLE_DESKTOP_REQUIRED_WIDTH = 600;
export const HELPINGPEOPLE_DESKTOP_REQUIRED_HEIGHT = 400;
export const HELPINGPEOPLE_DESKTOP_REQUIRED_TEXT =
  `${HELPINGPEOPLE_DESKTOP_REQUIRED_WIDTH} \u00D7 ${HELPINGPEOPLE_DESKTOP_REQUIRED_HEIGHT} px`;

function resolveHelpingpeopleDesktopImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  return String(
    props.helpingpeopleImageDesktop ?? props.helpingpeopleImageUrl ?? "",
  ).trim();
}

async function validateHelpingpeopleImageByLabel({
  imageUrl,
  label,
  requiredWidth,
  requiredHeight,
  requiredText,
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
    if (width === requiredWidth && height === requiredHeight) {
      return [];
    }

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

export async function validateHelpingpeopleImage(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const cache = new Map();
  const desktopImageUrl = resolveHelpingpeopleDesktopImageUrl(props);

  return validateHelpingpeopleImageByLabel({
    imageUrl: desktopImageUrl,
    label: "Desktop Image",
    requiredWidth: HELPINGPEOPLE_DESKTOP_REQUIRED_WIDTH,
    requiredHeight: HELPINGPEOPLE_DESKTOP_REQUIRED_HEIGHT,
    requiredText: HELPINGPEOPLE_DESKTOP_REQUIRED_TEXT,
    labelPrefix,
    cache,
  });
}
