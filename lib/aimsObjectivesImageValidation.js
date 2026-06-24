import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const AIMS_OBJECTIVES_REQUIRED_IMAGE_WIDTH = 1440;
export const AIMS_OBJECTIVES_REQUIRED_IMAGE_HEIGHT = 620;
export const AIMS_OBJECTIVES_REQUIRED_IMAGE_TEXT =
  `${AIMS_OBJECTIVES_REQUIRED_IMAGE_WIDTH} \u00D7 ${AIMS_OBJECTIVES_REQUIRED_IMAGE_HEIGHT} px`;

function resolveAimsObjectivesSectionImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  return String(props.aimsObjectivesSectionBgImage ?? "").trim();
}

export async function validateAimsObjectivesImage(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const imageUrl = resolveAimsObjectivesSectionImageUrl(props);
  if (!imageUrl) return [];

  try {
    const dims = await getImageDimensionsForValidation(imageUrl);
    const width = Number(dims?.width) || 0;
    const height = Number(dims?.height) || 0;

    if (
      width === AIMS_OBJECTIVES_REQUIRED_IMAGE_WIDTH &&
      height === AIMS_OBJECTIVES_REQUIRED_IMAGE_HEIGHT
    ) {
      return [];
    }

    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Section background image must be exactly ${AIMS_OBJECTIVES_REQUIRED_IMAGE_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
    ];
  } catch {
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Unable to validate section background image size. Please use ${AIMS_OBJECTIVES_REQUIRED_IMAGE_TEXT}.`,
    ];
  }
}
