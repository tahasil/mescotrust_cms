export const IMAGES_DESKTOP_ALLOWED_SIZES = [{ width: 1240, height: 480 }];

function formatSize(size, options = {}) {
  const width = Number(size?.width) || 0;
  const height = Number(size?.height) || 0;
  if (options.compact) return `${width}X${height}`;
  return `${width} \u00D7 ${height} px`;
}

export const IMAGES_DESKTOP_REQUIRED_TEXT = IMAGES_DESKTOP_ALLOWED_SIZES.map(
  (size) => formatSize(size),
).join(", ");

export const IMAGES_DESKTOP_ALLOWED_COMPACT_TEXT =
  IMAGES_DESKTOP_ALLOWED_SIZES.map((size) =>
    formatSize(size, { compact: true }),
  ).join(", ");

export function isAllowedImagesDesktopSize(width, height) {
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  return IMAGES_DESKTOP_ALLOWED_SIZES.some(
    (size) => size.width === w && size.height === h,
  );
}
