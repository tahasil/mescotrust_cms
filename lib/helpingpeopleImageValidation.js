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

async function validateHelpingpeopleDesktopImage({
  imageUrl,
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
    if (
      width === HELPINGPEOPLE_DESKTOP_REQUIRED_WIDTH &&
      height === HELPINGPEOPLE_DESKTOP_REQUIRED_HEIGHT
    ) {
      return [];
    }

    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Desktop Image must be exactly ${HELPINGPEOPLE_DESKTOP_REQUIRED_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
    ];
  } catch {
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Unable to validate desktop image size. Please use ${HELPINGPEOPLE_DESKTOP_REQUIRED_TEXT}.`,
    ];
  }
}

export async function validateHelpingpeopleImage(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const cache = new Map();
  const desktopImageUrl = resolveHelpingpeopleDesktopImageUrl(props);

  return validateHelpingpeopleDesktopImage({
    imageUrl: desktopImageUrl,
    labelPrefix,
    cache,
  });
}
