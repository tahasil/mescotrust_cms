export const HELPINGPEOPLE_DESKTOP_ALLOWED_SIZES = [
  { width: 600, height: 400 },
  { width: 600, height: 600 },
];

export const IMPACT_SHOWCASE_DESKTOP_ALLOWED_SIZES = [
  { width: 1200, height: 1400 },
];

function formatSize(size, options = {}) {
  const width = Number(size?.width) || 0;
  const height = Number(size?.height) || 0;
  if (options.compact) return `${width}X${height}`;
  return `${width} × ${height} px`;
}

export function formatAllowedImageSizes(sizes, options = {}) {
  return (Array.isArray(sizes) ? sizes : [])
    .map((size) => formatSize(size, options))
    .join(", ");
}

export const HELPINGPEOPLE_DESKTOP_REQUIRED_TEXT =
  formatAllowedImageSizes(HELPINGPEOPLE_DESKTOP_ALLOWED_SIZES);

export const HELPINGPEOPLE_DESKTOP_ALLOWED_COMPACT_TEXT =
  formatAllowedImageSizes(HELPINGPEOPLE_DESKTOP_ALLOWED_SIZES, {
    compact: true,
  });

export const IMPACT_SHOWCASE_DESKTOP_REQUIRED_TEXT =
  formatAllowedImageSizes(IMPACT_SHOWCASE_DESKTOP_ALLOWED_SIZES);

export const IMPACT_SHOWCASE_DESKTOP_ALLOWED_COMPACT_TEXT =
  formatAllowedImageSizes(IMPACT_SHOWCASE_DESKTOP_ALLOWED_SIZES, {
    compact: true,
  });

export function isAllowedDesktopImageSize(width, height, allowedSizes) {
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  return (Array.isArray(allowedSizes) ? allowedSizes : []).some(
    (size) => Number(size?.width) === w && Number(size?.height) === h,
  );
}

export function buildDesktopImageValidationError(
  width,
  height,
  allowedCompactText,
) {
  const selectedWidth = Number(width) || 0;
  const selectedHeight = Number(height) || 0;
  return `Supports Only ${allowedCompactText} px. Selected image is ${selectedWidth}X${selectedHeight} px.`;
}

export function buildDesktopImageValidationUnavailableError(
  allowedCompactText,
) {
  return `Unable to validate desktop image size. Supports Only ${allowedCompactText} px.`;
}

export function getBrowserImageDimensions(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () =>
      resolve({
        width: Number(image.naturalWidth) || 0,
        height: Number(image.naturalHeight) || 0,
      });
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageUrl;
  });
}

export function createDesktopImageDimensionValidator({
  allowedSizes,
  allowedCompactText,
}) {
  return async (_, value) => {
    const imageUrl = String(value || "").trim();
    if (!imageUrl) return Promise.resolve();

    try {
      const { width, height } = await getBrowserImageDimensions(imageUrl);
      if (isAllowedDesktopImageSize(width, height, allowedSizes)) {
        return Promise.resolve();
      }
      return Promise.reject(
        new Error(
          buildDesktopImageValidationError(
            width,
            height,
            allowedCompactText,
          ),
        ),
      );
    } catch {
      return Promise.reject(
        new Error(
          buildDesktopImageValidationUnavailableError(allowedCompactText),
        ),
      );
    }
  };
}

export function isAllowedHelpingpeopleDesktopSize(width, height) {
  return isAllowedDesktopImageSize(
    width,
    height,
    HELPINGPEOPLE_DESKTOP_ALLOWED_SIZES,
  );
}
