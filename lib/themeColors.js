import { LEGACY_THEME_COLORS } from "./themeColorFallbacks";

function toSafeString(value) {
  return value == null ? "" : String(value).trim();
}

function paletteFromPairs(pairs) {
  if (!Array.isArray(pairs)) return {};
  const entries = pairs
    .filter((item) => item && toSafeString(item.key))
    .map((item) => [toSafeString(item.key), item.value]);
  return Object.fromEntries(entries);
}

export function normalizeThemePalette(themeLike) {
  const frontendUiColors =
    themeLike?.frontendUiColors &&
    typeof themeLike.frontendUiColors === "object" &&
    !Array.isArray(themeLike.frontendUiColors)
      ? themeLike.frontendUiColors
      : null;
  if (frontendUiColors) {
    const cleaned = Object.fromEntries(
      Object.entries(frontendUiColors).filter(([k]) => toSafeString(k)),
    );
    if (Object.keys(cleaned).length > 0) return cleaned;
  }

  const themePalette =
    themeLike?.themePalette && typeof themeLike.themePalette === "object"
      ? themeLike.themePalette
      : null;
  if (themePalette && !Array.isArray(themePalette)) {
    const cleaned = Object.fromEntries(
      Object.entries(themePalette).filter(([k]) => toSafeString(k)),
    );
    if (Object.keys(cleaned).length > 0) return cleaned;
  }
  return paletteFromPairs(themeLike?.paletteColors);
}

export function normalizeThemeColors(themeLike) {
  if (!Array.isArray(themeLike?.colors)) return [];
  return themeLike.colors.filter((item) => item && toSafeString(item.name));
}

export function buildThemeColorOptions(themeLike) {
  const palette = normalizeThemePalette(themeLike);
  const names = Object.keys(palette).sort((a, b) =>
    String(a).localeCompare(String(b)),
  );
  return names.map((name) => ({ label: name, value: name }));
}

/**
 * Color dropdown options (palette + custom colors), guaranteed non-empty: if a
 * theme has neither (e.g. a failed /api/theme fetch on the client, or a bare DB),
 * fall back to the default theme color names so the picker never shows "No data".
 */
export function buildThemeColorOptionsSafe(themeLike) {
  const palette = normalizeThemePalette(themeLike);
  const colors = normalizeThemeColors(themeLike);
  // Some callers pass the AppearanceColorConfig shape (frontendUiColors) instead
  // of/alongside themePalette — include both so this is a superset of every caller.
  const frontendUi =
    themeLike?.frontendUiColors && typeof themeLike.frontendUiColors === "object"
      ? themeLike.frontendUiColors
      : {};
  const names = [
    ...new Set([
      ...Object.keys(frontendUi),
      ...Object.keys(palette),
      ...colors.map((c) => c && c.name).filter(Boolean),
    ]),
  ];
  const finalNames = names.length
    ? names
    : LEGACY_THEME_COLORS.map((c) => c.name);
  return finalNames
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map((name) => ({ label: name, value: name }));
}

export function buildThemePaletteData(themeLike) {
  return {
    themePalette: normalizeThemePalette(themeLike),
    colors: normalizeThemeColors(themeLike),
  };
}
