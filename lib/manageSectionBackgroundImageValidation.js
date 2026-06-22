import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const MANAGE_SECTION_BACKGROUND_REQUIRED_WIDTH = 1440;
export const MANAGE_SECTION_BACKGROUND_REQUIRED_HEIGHT = 620;
export const MANAGE_SECTION_BACKGROUND_REQUIRED_TEXT =
  `${MANAGE_SECTION_BACKGROUND_REQUIRED_WIDTH} \u00D7 ${MANAGE_SECTION_BACKGROUND_REQUIRED_HEIGHT} px`;

function getRequiredSizeConfig(options = {}) {
  const requestedWidth = Number(options?.requiredWidth);
  const requestedHeight = Number(options?.requiredHeight);
  const requestedMinWidth = Number(options?.minWidth);
  const requestedMinHeight = Number(options?.minHeight);
  const validationMode =
    String(options?.validationMode || "").trim().toLowerCase() === "minimum" ||
    (Number.isFinite(requestedMinWidth) &&
      requestedMinWidth > 0 &&
      Number.isFinite(requestedMinHeight) &&
      requestedMinHeight > 0)
      ? "minimum"
      : "exact";
  const requiredWidth =
    validationMode === "minimum"
      ? Number.isFinite(requestedMinWidth) && requestedMinWidth > 0
        ? requestedMinWidth
        : Number.isFinite(requestedWidth) && requestedWidth > 0
          ? requestedWidth
          : MANAGE_SECTION_BACKGROUND_REQUIRED_WIDTH
      : Number.isFinite(requestedWidth) && requestedWidth > 0
        ? requestedWidth
        : MANAGE_SECTION_BACKGROUND_REQUIRED_WIDTH;
  const requiredHeight =
    validationMode === "minimum"
      ? Number.isFinite(requestedMinHeight) && requestedMinHeight > 0
        ? requestedMinHeight
        : Number.isFinite(requestedHeight) && requestedHeight > 0
          ? requestedHeight
          : MANAGE_SECTION_BACKGROUND_REQUIRED_HEIGHT
      : Number.isFinite(requestedHeight) && requestedHeight > 0
        ? requestedHeight
        : MANAGE_SECTION_BACKGROUND_REQUIRED_HEIGHT;
  const dimensionText = `${requiredWidth} \u00D7 ${requiredHeight} px`;
  const requiredText =
    options?.requiredText != null && String(options.requiredText).trim()
      ? String(options.requiredText).trim()
      : validationMode === "minimum"
        ? `minimum ${dimensionText}`
        : dimensionText;

  return {
    requiredWidth,
    requiredHeight,
    requiredText,
    validationMode,
    dimensionText,
  };
}

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
  const {
    requiredWidth,
    requiredHeight,
    requiredText,
    validationMode,
    dimensionText,
  } =
    getRequiredSizeConfig(options);
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
        (validationMode === "minimum" &&
          width >= requiredWidth &&
          height >= requiredHeight) ||
        (validationMode !== "minimum" &&
          width === requiredWidth &&
          height === requiredHeight)
      ) {
        continue;
      }

      const prefix = labelPrefix ? `${labelPrefix}: ` : "";
      return [
        validationMode === "minimum"
          ? `${prefix}Background must be at least ${dimensionText}. Selected image is ${width} \u00D7 ${height} px.`
          : `${prefix}Background must be exactly ${requiredText}. Selected image is ${width} \u00D7 ${height} px.`,
      ];
    } catch {
      const prefix = labelPrefix ? `${labelPrefix}: ` : "";
      return [
        `${prefix}Unable to validate background size. Please use ${requiredText}.`,
      ];
    }
  }

  return [];
}
