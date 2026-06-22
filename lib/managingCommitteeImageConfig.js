export const MANAGING_COMMITTEE_DESKTOP_ALLOWED_SIZES = [
  { width: 600, height: 400 },
  { width: 600, height: 650 },
];

function formatSize(size, options = {}) {
  const width = Number(size?.width) || 0;
  const height = Number(size?.height) || 0;
  if (options.compact) return `${width}X${height}`;
  return `${width} \u00D7 ${height} px`;
}

export const MANAGING_COMMITTEE_DESKTOP_REQUIRED_TEXT =
  MANAGING_COMMITTEE_DESKTOP_ALLOWED_SIZES.map((size) =>
    formatSize(size),
  ).join(", ");

export const MANAGING_COMMITTEE_DESKTOP_ALLOWED_TEXT =
  MANAGING_COMMITTEE_DESKTOP_REQUIRED_TEXT;

export const MANAGING_COMMITTEE_DESKTOP_ALLOWED_COMPACT_TEXT =
  MANAGING_COMMITTEE_DESKTOP_ALLOWED_SIZES.map((size) =>
    formatSize(size, { compact: true }),
  ).join(", ");

export function isAllowedManagingCommitteeDesktopSize(width, height) {
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  return MANAGING_COMMITTEE_DESKTOP_ALLOWED_SIZES.some(
    (size) => size.width === w && size.height === h,
  );
}
