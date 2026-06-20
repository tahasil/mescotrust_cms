import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const MANAGE_SECTION_BACKGROUND_REQUIRED_WIDTH = 1440;
export const MANAGE_SECTION_BACKGROUND_REQUIRED_HEIGHT = 620;
export const MANAGE_SECTION_BACKGROUND_REQUIRED_TEXT =
  `${MANAGE_SECTION_BACKGROUND_REQUIRED_WIDTH} \u00D7 ${MANAGE_SECTION_BACKGROUND_REQUIRED_HEIGHT} px`;

function getManagedSectionBackgroundImageUrls(props) {
  if (!props || typeof props !== "object") return [];
  const entries = Object.entries(props);
  const output = [];

  for (const [key, value] of entries) {
    if (!key.endsWith("SectionBgType")) continue;
    const type = String(value || "").trim().toLowerCase();
    if (type !== "image") continue;

    const prefix = key.slice(0, -"SectionBgType".length);
    const imageKey = `${prefix}SectionBgImage`;
    const imageUrl = String(props[imageKey] ?? "").trim();
    if (!imageUrl) continue;

    output.push({ imageUrl });
  }

  return output;
}

export async function validateManageSectionBackgroundImages(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const targets = getManagedSectionBackgroundImageUrls(props);
  if (targets.length === 0) return [];

  const cache = new Map();
  for (const target of targets) {
    try {
      let dims = cache.get(target.imageUrl);
      if (!dims) {
        dims = await getImageDimensionsForValidation(target.imageUrl);
        cache.set(target.imageUrl, dims);
      }

      const width = Number(dims?.width) || 0;
      const height = Number(dims?.height) || 0;
      if (
        width === MANAGE_SECTION_BACKGROUND_REQUIRED_WIDTH &&
        height === MANAGE_SECTION_BACKGROUND_REQUIRED_HEIGHT
      ) {
        continue;
      }

      const prefix = labelPrefix ? `${labelPrefix}: ` : "";
      return [
        `${prefix}Background must be exactly ${MANAGE_SECTION_BACKGROUND_REQUIRED_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
      ];
    } catch {
      const prefix = labelPrefix ? `${labelPrefix}: ` : "";
      return [
        `${prefix}Unable to validate background size. Please use ${MANAGE_SECTION_BACKGROUND_REQUIRED_TEXT}.`,
      ];
    }
  }

  return [];
}
