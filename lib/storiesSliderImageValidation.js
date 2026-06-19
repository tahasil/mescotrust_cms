import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const STORIES_SLIDER_REQUIRED_IMAGE_WIDTH = 375;
export const STORIES_SLIDER_REQUIRED_IMAGE_HEIGHT = 500;
export const STORIES_SLIDER_REQUIRED_IMAGE_TEXT =
  `${STORIES_SLIDER_REQUIRED_IMAGE_WIDTH} \u00D7 ${STORIES_SLIDER_REQUIRED_IMAGE_HEIGHT} pixels`;

function resolveStoriesItems(props) {
  if (!props || typeof props !== "object") return [];
  return Array.isArray(props.storiesSliderItems) ? props.storiesSliderItems : [];
}

function resolveImageUrl(item) {
  if (!item || typeof item !== "object") return "";
  return String(item.image ?? "").trim();
}

function resolveMobileImageUrl(item) {
  if (!item || typeof item !== "object") return "";
  return String(item.mobileImage ?? "").trim();
}

export async function validateStoriesSliderImages(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const items = resolveStoriesItems(props);
  const invalidImages = [];
  const dimensionCache = new Map();

  const validateUrl = async (url, itemIndex, fieldLabel) => {
    const imageUrl = String(url || "").trim();
    if (!imageUrl) return;
    try {
      let dims = dimensionCache.get(imageUrl);
      if (!dims) {
        dims = await getImageDimensionsForValidation(imageUrl);
        dimensionCache.set(imageUrl, dims);
      }
      if (
        !Number.isFinite(dims.width) ||
        !Number.isFinite(dims.height) ||
        dims.width !== STORIES_SLIDER_REQUIRED_IMAGE_WIDTH ||
        dims.height !== STORIES_SLIDER_REQUIRED_IMAGE_HEIGHT
      ) {
        invalidImages.push({
          index: itemIndex + 1,
          fieldLabel,
          width: Number(dims.width) || 0,
          height: Number(dims.height) || 0,
        });
      }
    } catch {
      invalidImages.push({
        index: itemIndex + 1,
        fieldLabel,
        width: 0,
        height: 0,
      });
    }
  };

  for (let i = 0; i < items.length; i += 1) {
    await validateUrl(resolveImageUrl(items[i]), i, "Desktop image");
    await validateUrl(resolveMobileImageUrl(items[i]), i, "Mobile image");
  }

  if (invalidImages.length === 0) return [];

  const prefix = labelPrefix ? `${labelPrefix}: ` : "";
  const itemLabels = invalidImages
    .map(
      (item) =>
        `#${item.index} ${item.fieldLabel} (${item.width} \u00D7 ${item.height})`,
    )
    .join(", ");

  return [
    `${prefix}Image size must be exactly ${STORIES_SLIDER_REQUIRED_IMAGE_TEXT}. Invalid item(s): ${itemLabels}.`,
  ];
}
