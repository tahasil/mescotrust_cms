import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const VISION_MISSION_REQUIRED_WIDTH = 550;
export const VISION_MISSION_REQUIRED_HEIGHT = 450;
export const VISION_MISSION_REQUIRED_TEXT =
  `${VISION_MISSION_REQUIRED_WIDTH} \u00D7 ${VISION_MISSION_REQUIRED_HEIGHT} px`;

function resolveVisionDesktopImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  return String(props.visionImageDesktop ?? props.visionImage ?? "").trim();
}

function resolveMissionDesktopImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  return String(props.missionImageDesktop ?? props.missionImage ?? "").trim();
}

async function validateSingleDesktopImage({
  imageUrl,
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
    if (width === VISION_MISSION_REQUIRED_WIDTH && height === VISION_MISSION_REQUIRED_HEIGHT) {
      return [];
    }

    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}${label} must be exactly ${VISION_MISSION_REQUIRED_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
    ];
  } catch {
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Unable to validate ${label.toLowerCase()} size. Please use ${VISION_MISSION_REQUIRED_TEXT}.`,
    ];
  }
}

export async function validateVisionImage(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const cache = new Map();
  const imageUrl = resolveVisionDesktopImageUrl(props);

  return validateSingleDesktopImage({
    imageUrl,
    label: "Desktop Image",
    labelPrefix,
    cache,
  });
}

export async function validateMissionImage(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const cache = new Map();
  const imageUrl = resolveMissionDesktopImageUrl(props);

  return validateSingleDesktopImage({
    imageUrl,
    label: "Desktop Image",
    labelPrefix,
    cache,
  });
}
