import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const CARDS_MIN_IMAGE_WIDTH = 210;
export const CARDS_MIN_IMAGE_HEIGHT = 170;
export const CARDS_MIN_IMAGE_HINT_TEXT =
  `Min Width ${CARDS_MIN_IMAGE_WIDTH} and Min Height ${CARDS_MIN_IMAGE_HEIGHT} px`;

function resolveImageUrl(value) {
  if (!value) return "";
  if (typeof value === "string") return String(value).trim();
  if (typeof value === "object") {
    return String(
      value.url ??
        value.originalUrl ??
        value.publicUrl ??
        value.src ??
        "",
    ).trim();
  }
  return String(value || "").trim();
}

function resolveCardImages(item) {
  if (!item || typeof item !== "object") {
    return { desktop: "" };
  }

  const desktop = resolveImageUrl(item.imageDesktop ?? item.image ?? "");
  return { desktop };
}

function isValidMinDimensions(width, height) {
  return width >= CARDS_MIN_IMAGE_WIDTH && height >= CARDS_MIN_IMAGE_HEIGHT;
}

function buildErrorPrefix(labelPrefix) {
  const prefix = String(labelPrefix || "").trim();
  return prefix ? `${prefix}: ` : "";
}

export async function validateCardsImages(props, options = {}) {
  const items = Array.isArray(props?.cardsItems) ? props.cardsItems : [];
  if (items.length === 0) return [];

  const cache = new Map();
  for (let index = 0; index < items.length; index += 1) {
    const { desktop } = resolveCardImages(items[index]);
    if (!desktop) continue;

    try {
      let dims = cache.get(desktop);
      if (!dims) {
        dims = await getImageDimensionsForValidation(desktop);
        cache.set(desktop, dims);
      }

      const width = Number(dims?.width) || 0;
      const height = Number(dims?.height) || 0;
      if (isValidMinDimensions(width, height)) continue;

      return [
        `${buildErrorPrefix(options?.labelPrefix)}Card #${index + 1} Desktop Image must be minimum ${CARDS_MIN_IMAGE_WIDTH} \u00D7 ${CARDS_MIN_IMAGE_HEIGHT} px. Selected image is ${width} \u00D7 ${height} px.`,
      ];
    } catch {
      return [
        `${buildErrorPrefix(options?.labelPrefix)}Unable to validate card #${index + 1} desktop image size. Please use ${CARDS_MIN_IMAGE_HINT_TEXT}.`,
      ];
    }
  }

  return [];
}
