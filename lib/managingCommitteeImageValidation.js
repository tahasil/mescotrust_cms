import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";
import {
  MANAGING_COMMITTEE_DESKTOP_ALLOWED_COMPACT_TEXT,
  isAllowedManagingCommitteeDesktopSize,
} from "@/lib/managingCommitteeImageConfig";

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
    if (isAllowedManagingCommitteeDesktopSize(width, height)) {
      return [];
    }

    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Supports Only ${MANAGING_COMMITTEE_DESKTOP_ALLOWED_COMPACT_TEXT} px. Selected image is ${width}X${height} px.`,
    ];
  } catch {
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Unable to validate desktop image size. Supports Only ${MANAGING_COMMITTEE_DESKTOP_ALLOWED_COMPACT_TEXT} px.`,
    ];
  }
}
