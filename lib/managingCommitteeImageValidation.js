import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const MANAGING_COMMITTEE_DESKTOP_REQUIRED_WIDTH = 600;
export const MANAGING_COMMITTEE_DESKTOP_REQUIRED_HEIGHT = 400;
export const MANAGING_COMMITTEE_DESKTOP_REQUIRED_TEXT =
  `${MANAGING_COMMITTEE_DESKTOP_REQUIRED_WIDTH} \u00D7 ${MANAGING_COMMITTEE_DESKTOP_REQUIRED_HEIGHT} px`;

function resolveManagingCommitteeDesktopImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  return String(
    props.managingCommitteeImageDesktop ?? props.managingCommitteeImageUrl ?? "",
  ).trim();
}

export async function validateManagingCommitteeImage(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const imageUrl = resolveManagingCommitteeDesktopImageUrl(props);
  if (!imageUrl) return [];

  try {
    const dims = await getImageDimensionsForValidation(imageUrl);
    const width = Number(dims?.width) || 0;
    const height = Number(dims?.height) || 0;
    if (
      width === MANAGING_COMMITTEE_DESKTOP_REQUIRED_WIDTH &&
      height === MANAGING_COMMITTEE_DESKTOP_REQUIRED_HEIGHT
    ) {
      return [];
    }

    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Desktop Image must be exactly ${MANAGING_COMMITTEE_DESKTOP_REQUIRED_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
    ];
  } catch {
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Unable to validate desktop image size. Please use ${MANAGING_COMMITTEE_DESKTOP_REQUIRED_TEXT}.`,
    ];
  }
}
