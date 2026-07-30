import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const STORIES_SLIDER_REQUIRED_IMAGE_WIDTH = 800;
export const STORIES_SLIDER_REQUIRED_IMAGE_HEIGHT = 415;
export const STORIES_SLIDER_REQUIRED_IMAGE_TEXT =
  `${STORIES_SLIDER_REQUIRED_IMAGE_WIDTH} \u00D7 ${STORIES_SLIDER_REQUIRED_IMAGE_HEIGHT} px`;

export async function validateStoriesSliderImages(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const items = Array.isArray(props?.storiesSliderItems)
    ? props.storiesSliderItems
    : [];
  const invalidItems = [];
  const dimensionCache = new Map();

  for (let index = 0; index < items.length; index += 1) {
    const imageUrl = String(items[index]?.image || "").trim();
    if (!imageUrl) continue;

    try {
      let dimensions = dimensionCache.get(imageUrl);
      if (!dimensions) {
        dimensions = await getImageDimensionsForValidation(imageUrl);
        dimensionCache.set(imageUrl, dimensions);
      }

      const width = Number(dimensions?.width) || 0;
      const height = Number(dimensions?.height) || 0;
      if (
        width !== STORIES_SLIDER_REQUIRED_IMAGE_WIDTH ||
        height !== STORIES_SLIDER_REQUIRED_IMAGE_HEIGHT
      ) {
        invalidItems.push({ index: index + 1, width, height });
      }
    } catch {
      invalidItems.push({ index: index + 1, width: 0, height: 0 });
    }
  }

  if (invalidItems.length === 0) return [];

  const prefix = labelPrefix ? `${labelPrefix}: ` : "";
  const itemLabels = invalidItems
    .map(
      ({ index, width, height }) =>
        `Story #${index} (${width} \u00D7 ${height} px)`,
    )
    .join(", ");

  return [
    `${prefix}Desktop image must be exactly ${STORIES_SLIDER_REQUIRED_IMAGE_TEXT}. Invalid item(s): ${itemLabels}.`,
  ];
}
