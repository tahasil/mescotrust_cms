import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";
import {
  IMAGES_DESKTOP_ALLOWED_COMPACT_TEXT,
  isAllowedImagesDesktopSize,
} from "@/lib/imagesImageConfig";

function resolveImagesDesktopImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  return String(props.imageUrlDesktop ?? props.imageUrl ?? "").trim();
}

async function validateImagesDesktopImageByLabel({ imageUrl, labelPrefix, cache }) {
  if (!imageUrl) return [];

  try {
    let dims = cache.get(imageUrl);
    if (!dims) {
      dims = await getImageDimensionsForValidation(imageUrl);
      cache.set(imageUrl, dims);
    }

    const width = Number(dims?.width) || 0;
    const height = Number(dims?.height) || 0;
    if (isAllowedImagesDesktopSize(width, height)) {
      return [];
    }

    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Supports Only ${IMAGES_DESKTOP_ALLOWED_COMPACT_TEXT} px. Selected image is ${width}X${height} px.`,
    ];
  } catch {
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Unable to validate desktop image size. Supports Only ${IMAGES_DESKTOP_ALLOWED_COMPACT_TEXT} px.`,
    ];
  }
}

export async function validateImagesImage(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const cache = new Map();
  const desktopImageUrl = resolveImagesDesktopImageUrl(props);

  return validateImagesDesktopImageByLabel({
    imageUrl: desktopImageUrl,
    labelPrefix,
    cache,
  });
}
