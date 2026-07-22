import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const ACCORDION_IMAGE_REQUIRED_WIDTH = 600;
export const ACCORDION_IMAGE_REQUIRED_HEIGHT = 400;
export const ACCORDION_IMAGE_REQUIRED_TEXT =
  `${ACCORDION_IMAGE_REQUIRED_WIDTH} \u00D7 ${ACCORDION_IMAGE_REQUIRED_HEIGHT} px`;

function imageUrl(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  return String(
    value.url ?? value.originalUrl ?? value.publicUrl ?? value.src ?? "",
  ).trim();
}

export async function validateAccordionImages(props, options = {}) {
  const labelPrefix = String(options?.labelPrefix || "").trim();
  const items = Array.isArray(props?.accordionItems)
    ? props.accordionItems
    : [];
  const cache = new Map();

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] || {};
    const targets = [
      {
        label: "desktop / tablet image",
        url: imageUrl(item.imageDesktop ?? item.image ?? item.imageUrl),
      },
      { label: "mobile image", url: imageUrl(item.imageMobile) },
    ];

    for (const target of targets) {
      if (!target.url) continue;
      try {
        let dimensions = cache.get(target.url);
        if (!dimensions) {
          dimensions = await getImageDimensionsForValidation(target.url);
          cache.set(target.url, dimensions);
        }
        const width = Number(dimensions?.width) || 0;
        const height = Number(dimensions?.height) || 0;
        if (
          width === ACCORDION_IMAGE_REQUIRED_WIDTH &&
          height === ACCORDION_IMAGE_REQUIRED_HEIGHT
        ) {
          continue;
        }
        const prefix = labelPrefix ? `${labelPrefix}: ` : "";
        return [
          `${prefix}Panel #${index + 1} ${target.label} must be exactly ${ACCORDION_IMAGE_REQUIRED_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
        ];
      } catch {
        const prefix = labelPrefix ? `${labelPrefix}: ` : "";
        return [
          `${prefix}Unable to validate panel #${index + 1} ${target.label}. Please use ${ACCORDION_IMAGE_REQUIRED_TEXT}.`,
        ];
      }
    }
  }

  return [];
}
