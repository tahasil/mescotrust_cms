import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";
import {
  VOLUNTEER_MESCO_REQUIRED_IMAGE_HEIGHT,
  VOLUNTEER_MESCO_REQUIRED_IMAGE_TEXT,
  VOLUNTEER_MESCO_REQUIRED_IMAGE_WIDTH,
} from "@/components/site/VolunteerMesco/defaults";

export async function validateVolunteerMescoImage(props, options = {}) {
  const imageUrl = String(props?.volunteerMescoImage || "").trim();
  if (!imageUrl) return [];
  const labelPrefix = options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const prefix = labelPrefix ? `${labelPrefix}: ` : "";
  try {
    const dimensions = await getImageDimensionsForValidation(imageUrl);
    const width = Number(dimensions?.width) || 0;
    const height = Number(dimensions?.height) || 0;
    if (width === VOLUNTEER_MESCO_REQUIRED_IMAGE_WIDTH && height === VOLUNTEER_MESCO_REQUIRED_IMAGE_HEIGHT) return [];
    return [`${prefix}Image must be exactly ${VOLUNTEER_MESCO_REQUIRED_IMAGE_TEXT}. Selected image is ${width} \u00D7 ${height} px.`];
  } catch {
    return [`${prefix}Unable to validate image size. Required size: ${VOLUNTEER_MESCO_REQUIRED_IMAGE_TEXT}.`];
  }
}
