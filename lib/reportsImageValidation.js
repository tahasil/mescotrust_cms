import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";
import {
  REPORTS_DESKTOP_ALLOWED_COMPACT_TEXT,
  isAllowedReportsDesktopSize,
} from "@/lib/reportsImageConfig";

function resolveReportsItems(props) {
  if (!props || typeof props !== "object") return [];
  if (!Array.isArray(props.reportsItems)) return [];
  return props.reportsItems;
}

function resolveDesktopImageUrl(item) {
  if (!item || typeof item !== "object") return "";
  return String(item.imageDesktop ?? item.image ?? "").trim();
}

export async function validateReportsImages(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const items = resolveReportsItems(props);
  const dimensionCache = new Map();

  for (let index = 0; index < items.length; index += 1) {
    const imageUrl = resolveDesktopImageUrl(items[index]);
    if (!imageUrl) continue;

    try {
      let dims = dimensionCache.get(imageUrl);
      if (!dims) {
        dims = await getImageDimensionsForValidation(imageUrl);
        dimensionCache.set(imageUrl, dims);
      }

      const width = Number(dims?.width) || 0;
      const height = Number(dims?.height) || 0;
      if (isAllowedReportsDesktopSize(width, height)) {
        continue;
      }

      const prefix = labelPrefix ? `${labelPrefix}: ` : "";
      return [
        `${prefix}Report #${index + 1}: Supports Only ${REPORTS_DESKTOP_ALLOWED_COMPACT_TEXT} px. Selected image is ${width}X${height} px.`,
      ];
    } catch {
      const prefix = labelPrefix ? `${labelPrefix}: ` : "";
      return [
        `${prefix}Report #${index + 1}: Unable to validate desktop image size. Supports Only ${REPORTS_DESKTOP_ALLOWED_COMPACT_TEXT} px.`,
      ];
    }
  }

  return [];
}
