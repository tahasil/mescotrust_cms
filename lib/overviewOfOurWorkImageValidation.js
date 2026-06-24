import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const OVERVIEW_WORK_BG_REQUIRED_WIDTH = 580;
export const OVERVIEW_WORK_BG_REQUIRED_HEIGHT = 704;
export const OVERVIEW_WORK_BG_REQUIRED_TEXT =
  `${OVERVIEW_WORK_BG_REQUIRED_WIDTH} \u00D7 ${OVERVIEW_WORK_BG_REQUIRED_HEIGHT} pixels`;
export const OVERVIEW_WORK_ICON_REQUIRED_WIDTH = 48;
export const OVERVIEW_WORK_ICON_REQUIRED_HEIGHT = 48;
export const OVERVIEW_WORK_ICON_REQUIRED_TEXT =
  `${OVERVIEW_WORK_ICON_REQUIRED_WIDTH} \u00D7 ${OVERVIEW_WORK_ICON_REQUIRED_HEIGHT} pixels`;

function resolveOverviewItems(props) {
  if (!props || typeof props !== "object") return [];
  if (Array.isArray(props.overviewOfOurWorkItems)) return props.overviewOfOurWorkItems;
  if (Array.isArray(props.awardsRecognitionItems)) return props.awardsRecognitionItems;
  if (Array.isArray(props.items)) return props.items;
  return [];
}

function resolveDesktopBackgroundUrl(item) {
  if (!item || typeof item !== "object") return "";
  return String(
    item.bgImageUrlDesktop ??
      item.bgImageUrl ??
      item.bgImage ??
      item.bgImageUrlMobile ??
      "",
  ).trim();
}

function resolveIconUrl(item) {
  if (!item || typeof item !== "object") return "";
  return String(item.icon ?? "").trim();
}

export async function validateOverviewOfOurWorkBackgroundImages(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const errors = [];
  const items = resolveOverviewItems(props);
  const dimensionCache = new Map();
  const invalidBackgroundItems = [];
  const invalidIconItems = [];

  const getDimensionsWithCache = async (imageUrl) => {
    const cacheKey = String(imageUrl || "").trim();
    if (!cacheKey) return null;
    let dims = dimensionCache.get(cacheKey);
    if (!dims) {
      dims = await getImageDimensionsForValidation(cacheKey);
      dimensionCache.set(cacheKey, dims);
    }
    return dims;
  };

  for (let i = 0; i < items.length; i += 1) {
    const imageUrl = resolveDesktopBackgroundUrl(items[i]);
    if (imageUrl) {
      try {
        const dims = await getDimensionsWithCache(imageUrl);
        if (
          !dims ||
          !Number.isFinite(dims.width) ||
          !Number.isFinite(dims.height) ||
          dims.width !== OVERVIEW_WORK_BG_REQUIRED_WIDTH ||
          dims.height !== OVERVIEW_WORK_BG_REQUIRED_HEIGHT
        ) {
          invalidBackgroundItems.push({
            index: i + 1,
            width: Number(dims?.width) || 0,
            height: Number(dims?.height) || 0,
          });
        }
      } catch {
        invalidBackgroundItems.push({ index: i + 1, width: 0, height: 0 });
      }
    }

    const iconUrl = resolveIconUrl(items[i]);
    if (iconUrl) {
      try {
        const dims = await getDimensionsWithCache(iconUrl);
        if (
          !dims ||
          !Number.isFinite(dims.width) ||
          !Number.isFinite(dims.height) ||
          dims.width !== OVERVIEW_WORK_ICON_REQUIRED_WIDTH ||
          dims.height !== OVERVIEW_WORK_ICON_REQUIRED_HEIGHT
        ) {
          invalidIconItems.push({
            index: i + 1,
            width: Number(dims?.width) || 0,
            height: Number(dims?.height) || 0,
          });
        }
      } catch {
        invalidIconItems.push({ index: i + 1, width: 0, height: 0 });
      }
    }
  }

  if (invalidBackgroundItems.length > 0) {
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    const itemLabels = invalidBackgroundItems
      .map((item) => `#${item.index} (${item.width} \u00D7 ${item.height})`)
      .join(", ");
    errors.push(
      `${prefix}Image size must be exactly ${OVERVIEW_WORK_BG_REQUIRED_TEXT}. Invalid item(s): ${itemLabels}.`,
    );
  }

  if (invalidIconItems.length > 0) {
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    const itemLabels = invalidIconItems
      .map((item) => `#${item.index} (${item.width} \u00D7 ${item.height})`)
      .join(", ");
    errors.push(
      `${prefix}Icon image size must be exactly ${OVERVIEW_WORK_ICON_REQUIRED_TEXT}. Invalid item(s): ${itemLabels}.`,
    );
  }

  return errors;
}
