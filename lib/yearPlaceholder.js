const YEAR_PLACEHOLDER_RE = /\{\{\s*year\s*\}\}/gi;

export function resolveYearPlaceholder(text, year = new Date().getFullYear()) {
  const raw = String(text ?? "");
  if (!raw) return "";
  return raw.replace(YEAR_PLACEHOLDER_RE, String(year));
}
