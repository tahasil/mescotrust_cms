import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";
import {
  IMPACT_SHOWCASE_DESKTOP_ALLOWED_COMPACT_TEXT,
  IMPACT_SHOWCASE_DESKTOP_ALLOWED_SIZES,
  buildDesktopImageValidationError,
  buildDesktopImageValidationUnavailableError,
  isAllowedDesktopImageSize,
} from "@/lib/helpingpeopleImageConfig";

function resolveImpactShowcaseDesktopImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  return String(
    props.impactShowcaseImageDesktop ??
      props.impactShowcaseLeftImageDesktop ??
      props.impactShowcaseLeftImage ??
      "",
  ).trim();
}

/**
 * Server-side counterpart to the shared Helpingpeople drawer validator.
 * This keeps Page Builder and component-default saves from bypassing the
 * 600 × 600 px rule when a URL is submitted directly.
 */
export async function validateImpactShowcaseImages(props, options = {}) {
  const imageUrl = resolveImpactShowcaseDesktopImageUrl(props);
  if (!imageUrl) return [];

  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const prefix = labelPrefix ? `${labelPrefix}: ` : "";

  try {
    const dimensions = await getImageDimensionsForValidation(imageUrl);
    const width = Number(dimensions?.width) || 0;
    const height = Number(dimensions?.height) || 0;
    if (
      isAllowedDesktopImageSize(
        width,
        height,
        IMPACT_SHOWCASE_DESKTOP_ALLOWED_SIZES,
      )
    ) {
      return [];
    }
    return [
      `${prefix}${buildDesktopImageValidationError(
        width,
        height,
        IMPACT_SHOWCASE_DESKTOP_ALLOWED_COMPACT_TEXT,
      )}`,
    ];
  } catch {
    return [
      `${prefix}${buildDesktopImageValidationUnavailableError(
        IMPACT_SHOWCASE_DESKTOP_ALLOWED_COMPACT_TEXT,
      )}`,
    ];
  }
}
