import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";
import {
  OVERLAY_CARDS_DESKTOP_ALLOWED_COMPACT_TEXT,
  isAllowedOverlayCardsDesktopSize,
} from "@/lib/overlayCardsImageConfig";

function resolveOverlayCardsItems(props) {
  if (!props || typeof props !== "object") return [];
  if (!Array.isArray(props.overlayCardsItems)) return [];
  return props.overlayCardsItems;
}

function resolveDesktopImageUrl(item) {
  if (!item || typeof item !== "object") return "";
  return String(item.bgImageDesktop ?? item.bgImage ?? "").trim();
}

export async function validateOverlayCardsImages(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const items = resolveOverlayCardsItems(props);
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
      if (isAllowedOverlayCardsDesktopSize(width, height)) {
        continue;
      }

      const prefix = labelPrefix ? `${labelPrefix}: ` : "";
      return [
        `${prefix}Card #${index + 1}: Supports Only ${OVERLAY_CARDS_DESKTOP_ALLOWED_COMPACT_TEXT} px. Selected image is ${width}X${height} px.`,
      ];
    } catch {
      const prefix = labelPrefix ? `${labelPrefix}: ` : "";
      return [
        `${prefix}Card #${index + 1}: Unable to validate desktop image size. Supports Only ${OVERLAY_CARDS_DESKTOP_ALLOWED_COMPACT_TEXT} px.`,
      ];
    }
  }

  return [];
}
