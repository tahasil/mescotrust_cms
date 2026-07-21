import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";
import {
  HELPINGPEOPLE_DESKTOP_ALLOWED_COMPACT_TEXT,
  HELPINGPEOPLE_DESKTOP_ALLOWED_SIZES,
  buildDesktopImageValidationError,
  buildDesktopImageValidationUnavailableError,
  isAllowedDesktopImageSize,
} from "@/lib/helpingpeopleImageConfig";

function resolveHelpingpeopleDesktopImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  return String(
    props.helpingpeopleImageDesktop ?? props.helpingpeopleImageUrl ?? "",
  ).trim();
}

async function validateHelpingpeopleImageByLabel({
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
      isAllowedDesktopImageSize(
        width,
        height,
        HELPINGPEOPLE_DESKTOP_ALLOWED_SIZES,
      )
    ) {
      return [];
    }

    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}${buildDesktopImageValidationError(
        width,
        height,
        HELPINGPEOPLE_DESKTOP_ALLOWED_COMPACT_TEXT,
      )}`,
    ];
  } catch {
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}${buildDesktopImageValidationUnavailableError(
        HELPINGPEOPLE_DESKTOP_ALLOWED_COMPACT_TEXT,
      )}`,
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
    labelPrefix,
    cache,
  });
}
