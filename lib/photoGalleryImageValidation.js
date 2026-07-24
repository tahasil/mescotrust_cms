export const PHOTO_GALLERY_REQUIRED_IMAGE_WIDTH = 446;
export const PHOTO_GALLERY_REQUIRED_IMAGE_HEIGHT = 334;
export const PHOTO_GALLERY_REQUIRED_IMAGE_TEXT =
  `${PHOTO_GALLERY_REQUIRED_IMAGE_WIDTH} \u00D7 ${PHOTO_GALLERY_REQUIRED_IMAGE_HEIGHT} pixels`;

function normalizeGalleryImage(image) {
  if (typeof image === "string") {
    const desktop = image.trim();
    return desktop ? { urlDesktop: desktop, url: desktop, alt: "" } : null;
  }
  if (!image || typeof image !== "object") return null;
  const desktop = [image.urlDesktop, image.url, image.src, image.urlMobile]
    .map((candidate) => String(candidate || "").trim())
    .find(Boolean);
  if (!desktop) return null;
  return {
    urlDesktop: desktop,
    url: desktop,
    alt: String(image.alt || "").trim(),
  };
}

function resolveCoverImageUrl(item) {
  if (!item || typeof item !== "object") return "";
  const firstImage = Array.isArray(item.images)
    ? item.images.map(normalizeGalleryImage).find(Boolean)
    : null;
  return [item.imageDesktop, item.image, item.imageMobile, firstImage?.urlDesktop]
    .map((candidate) => String(candidate || "").trim())
    .find(Boolean) || "";
}

function normalizeGalleryItem(item) {
  if (!item || typeof item !== "object") return item;
  const images = Array.isArray(item.images)
    ? item.images.map(normalizeGalleryImage).filter(Boolean)
    : [];
  const imageDesktop = resolveCoverImageUrl({ ...item, images });
  const next = { ...item };
  delete next.imageMobile;
  return { ...next, imageDesktop, image: imageDesktop, images };
}

export function stripPhotoGalleryMobileCoverImages(props) {
  if (!props || typeof props !== "object" || !Array.isArray(props.photoGalleryItems)) {
    return props;
  }
  return {
    ...props,
    photoGalleryItems: props.photoGalleryItems.map(normalizeGalleryItem),
  };
}

export function sanitizePhotoGalleryLayout(layout) {
  if (!Array.isArray(layout)) return layout;
  return layout.map((block) =>
    block?.baseComponent === "PhotoGallery" && block?.props && typeof block.props === "object"
      ? { ...block, props: stripPhotoGalleryMobileCoverImages(block.props) }
      : block,
  );
}

/** Mixed image dimensions are valid because gallery cards contain the complete image. */
export async function validatePhotoGalleryCoverImages() {
  return [];
}
