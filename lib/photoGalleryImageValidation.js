import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const PHOTO_GALLERY_REQUIRED_IMAGE_WIDTH = 446;
export const PHOTO_GALLERY_REQUIRED_IMAGE_HEIGHT = 334;
export const PHOTO_GALLERY_REQUIRED_IMAGE_TEXT =
  `${PHOTO_GALLERY_REQUIRED_IMAGE_WIDTH} \u00D7 ${PHOTO_GALLERY_REQUIRED_IMAGE_HEIGHT} pixels`;

function normalizeGalleryImage(image) {
  if (typeof image === "string") {
    const desktop = image.trim();
    if (!desktop) return null;
    return { urlDesktop: desktop, url: desktop };
  }
  if (!image || typeof image !== "object") return null;

  const candidates = [image.urlDesktop, image.url, image.src, image.urlMobile];
  let desktop = "";
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) {
      desktop = value;
      break;
    }
  }
  if (!desktop) return null;
  return { urlDesktop: desktop, url: desktop };
}

function resolveCoverImageUrl(item) {
  if (!item || typeof item !== "object") return "";
  const normalizedImages = Array.isArray(item.images)
    ? item.images.map(normalizeGalleryImage).filter(Boolean)
    : [];

  const candidates = [
    item.imageDesktop,
    item.image,
    item.imageMobile,
    normalizedImages[0]?.urlDesktop,
    normalizedImages[0]?.url,
  ];
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) return value;
  }
  return "";
}

function normalizeGalleryItem(item) {
  if (!item || typeof item !== "object") return item;

  const normalizedImages = Array.isArray(item.images)
    ? item.images.map(normalizeGalleryImage).filter(Boolean)
    : [];
  const coverDesktop = resolveCoverImageUrl({
    ...item,
    images: normalizedImages,
  });

  const next = { ...item };
  delete next.imageMobile;

  return {
    ...next,
    imageDesktop: coverDesktop,
    image: coverDesktop,
    images: normalizedImages,
  };
}

export function stripPhotoGalleryMobileCoverImages(props) {
  if (!props || typeof props !== "object") return props;
  if (!Array.isArray(props.photoGalleryItems)) return props;

  return {
    ...props,
    photoGalleryItems: props.photoGalleryItems.map(normalizeGalleryItem),
  };
}

export function sanitizePhotoGalleryLayout(layout) {
  if (!Array.isArray(layout)) return layout;
  return layout.map((block) => {
    if (
      block?.baseComponent !== "PhotoGallery" ||
      !block?.props ||
      typeof block.props !== "object"
    ) {
      return block;
    }
    return {
      ...block,
      props: stripPhotoGalleryMobileCoverImages(block.props),
    };
  });
}

export async function validatePhotoGalleryCoverImages(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const items = Array.isArray(props?.photoGalleryItems)
    ? props.photoGalleryItems
    : [];
  const invalidImages = [];
  const dimensionCache = new Map();

  for (let i = 0; i < items.length; i += 1) {
    const coverImageUrl = resolveCoverImageUrl(items[i]);
    if (!coverImageUrl) continue;

    try {
      let dimensions = dimensionCache.get(coverImageUrl);
      if (!dimensions) {
        dimensions = await getImageDimensionsForValidation(coverImageUrl);
        dimensionCache.set(coverImageUrl, dimensions);
      }
      const width = Number(dimensions.width) || 0;
      const height = Number(dimensions.height) || 0;
      if (
        width !== PHOTO_GALLERY_REQUIRED_IMAGE_WIDTH ||
        height !== PHOTO_GALLERY_REQUIRED_IMAGE_HEIGHT
      ) {
        invalidImages.push({ index: i + 1, width, height });
      }
    } catch {
      invalidImages.push({ index: i + 1, width: 0, height: 0 });
    }
  }

  if (invalidImages.length === 0) return [];

  const prefix = labelPrefix ? `${labelPrefix}: ` : "";
  const itemLabels = invalidImages
    .map((item) => `#${item.index} Desktop Cover Image (${item.width} \u00D7 ${item.height})`)
    .join(", ");

  return [
    `${prefix}Image size must be exactly ${PHOTO_GALLERY_REQUIRED_IMAGE_TEXT}. Invalid item(s): ${itemLabels}.`,
  ];
}
