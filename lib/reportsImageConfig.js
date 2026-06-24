export const REPORTS_DESKTOP_ALLOWED_SIZES = [{ width: 348, height: 200 }];

function formatSize(size, options = {}) {
  const width = Number(size?.width) || 0;
  const height = Number(size?.height) || 0;
  if (options.compact) return `${width}X${height}`;
  return `${width} \u00D7 ${height} px`;
}

export const REPORTS_DESKTOP_REQUIRED_TEXT = REPORTS_DESKTOP_ALLOWED_SIZES.map(
  (size) => formatSize(size),
).join(", ");

export const REPORTS_DESKTOP_ALLOWED_COMPACT_TEXT =
  REPORTS_DESKTOP_ALLOWED_SIZES.map((size) =>
    formatSize(size, { compact: true }),
  ).join(", ");

export function isAllowedReportsDesktopSize(width, height) {
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  return REPORTS_DESKTOP_ALLOWED_SIZES.some(
    (size) => size.width === w && size.height === h,
  );
}
