import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const LATEST_NEWS_REQUIRED_IMAGE_WIDTH = 600;
export const LATEST_NEWS_REQUIRED_IMAGE_HEIGHT = 455;
export const LATEST_NEWS_REQUIRED_IMAGE_TEXT =
  `${LATEST_NEWS_REQUIRED_IMAGE_WIDTH} \u00D7 ${LATEST_NEWS_REQUIRED_IMAGE_HEIGHT} pixels`;

function resolveItems(props) {
  if (!props || typeof props !== "object") return [];
  if (Array.isArray(props.latestEvents1Items)) return props.latestEvents1Items;
  if (Array.isArray(props.items)) return props.items;
  return [];
}

function resolveItemImageUrl(item) {
  if (!item || typeof item !== "object") return "";
  return String(
    item.imageUrlDesktop ?? item.imageUrl ?? item.imageUrlMobile ?? "",
  ).trim();
}

export async function validateLatestNewsImages(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const items = resolveItems(props);
  const invalidItems = [];
  const dimensionCache = new Map();

  for (let i = 0; i < items.length; i += 1) {
    const imageUrl = resolveItemImageUrl(items[i]);
    if (!imageUrl) continue;
    try {
      let dims = dimensionCache.get(imageUrl);
      if (!dims) {
        dims = await getImageDimensionsForValidation(imageUrl);
        dimensionCache.set(imageUrl, dims);
      }
      if (
        !Number.isFinite(dims.width) ||
        !Number.isFinite(dims.height) ||
        dims.width !== LATEST_NEWS_REQUIRED_IMAGE_WIDTH ||
        dims.height !== LATEST_NEWS_REQUIRED_IMAGE_HEIGHT
      ) {
        invalidItems.push({
          index: i + 1,
          width: Number(dims.width) || 0,
          height: Number(dims.height) || 0,
        });
      }
    } catch {
      invalidItems.push({ index: i + 1, width: 0, height: 0 });
    }
  }

  if (invalidItems.length === 0) return [];

  const prefix = labelPrefix ? `${labelPrefix}: ` : "";
  const labels = invalidItems
    .map((item) => `#${item.index} (${item.width} \u00D7 ${item.height})`)
    .join(", ");
  return [
    `${prefix}Image size must be exactly ${LATEST_NEWS_REQUIRED_IMAGE_TEXT}. Invalid item(s): ${labels}.`,
  ];
}
