export const HELPINGPEOPLE_DESKTOP_ALLOWED_SIZES = [
  { width: 600, height: 400 },
  { width: 600, height: 600 },
];

function formatSize(size, options = {}) {
  const width = Number(size?.width) || 0;
  const height = Number(size?.height) || 0;
  if (options.compact) return `${width}X${height}`;
  return `${width} × ${height} px`;
}

export const HELPINGPEOPLE_DESKTOP_REQUIRED_TEXT =
  HELPINGPEOPLE_DESKTOP_ALLOWED_SIZES.map((size) => formatSize(size)).join(
    ", ",
  );

export const HELPINGPEOPLE_DESKTOP_ALLOWED_COMPACT_TEXT =
  HELPINGPEOPLE_DESKTOP_ALLOWED_SIZES.map((size) =>
    formatSize(size, { compact: true }),
  ).join(", ");

export function isAllowedHelpingpeopleDesktopSize(width, height) {
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  return HELPINGPEOPLE_DESKTOP_ALLOWED_SIZES.some(
    (size) => size.width === w && size.height === h,
  );
}
