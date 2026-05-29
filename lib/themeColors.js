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

export function buildThemePaletteData(themeLike) {
  return {
    themePalette: normalizeThemePalette(themeLike),
    colors: normalizeThemeColors(themeLike),
  };
}
