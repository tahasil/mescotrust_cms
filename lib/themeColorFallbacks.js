const LEGACY_THEME_COLORS = [
  { name: "Primary", value: "rgba(207, 55, 47, 1)" },
  { name: "Black", value: "#050505" },
  { name: "Black Light", value: "rgba(5, 5, 5, 0.5)" },
  { name: "White", value: "#FFFFFF" },
  { name: "Primary Light", value: "rgba(207, 55, 47, 0.1)" },
  { name: "Gradient", value: "linear-gradient(90deg, #CF372F 0%, #691C18 100%)" },
  { name: "Border", value: "rgba(0, 0, 0, 0.1)" },
  {
    name: "imgWhite",
    value:
      "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(3%) hue-rotate(51deg) brightness(115%) contrast(100%)",
  },
  {
    name: "imgColor",
    value:
      "brightness(0) saturate(100%) invert(25%) sepia(76%) saturate(6383%) hue-rotate(354deg) brightness(93%) contrast(73%)",
  },
  { name: "Transparent", value: "transparent" },
];

const WRONG_GENERATED_THEME_PALETTE_KEYS = new Set([
  "primary",
  "secondary",
  "white",
  "black",
  "gradient",
  "primaryLight",
  "border",
  "ctaBorder",
  "headerBg",
  "headerCta",
  "themeBorder",
  "transparent",
  "imgFillWhite",
  "imgFillTheme",
]);

function toNonEmptyString(value) {
  if (value == null) return "";
  const out = String(value).trim();
  return out;
}

function legacyColors() {
  return LEGACY_THEME_COLORS.map((entry) => ({ ...entry }));
}

function normalizeColorArray(colors) {
  if (!Array.isArray(colors)) return [];
  const seen = new Set();
  return colors
    .map((entry) => ({
      name: toNonEmptyString(entry?.name),
      value: toNonEmptyString(entry?.value),
    }))
    .filter((entry) => {
      if (!entry.name || !entry.value) return false;
      const key = entry.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function isKnownWrongGeneratedSet(colors) {
  if (!Array.isArray(colors) || colors.length !== 11) return false;
  const names = new Set(colors.map((c) => toNonEmptyString(c.name).toLowerCase()));
  const legacyNames = LEGACY_THEME_COLORS.map((c) => c.name.toLowerCase());
  return (
    names.has("secondary") &&
    legacyNames.every((name) => names.has(name))
  );
}

function normalizeThemePalette(palette) {
  if (!palette || typeof palette !== "object") return {};
  const cleaned = Object.fromEntries(
    Object.entries(palette).filter(
      ([key, value]) => toNonEmptyString(key) && toNonEmptyString(value),
    ),
  );
  const keys = Object.keys(cleaned);
  if (keys.length === 0) return {};
  if (keys.every((key) => WRONG_GENERATED_THEME_PALETTE_KEYS.has(key))) {
    return {};
  }
  const pruned = Object.fromEntries(
    keys
      .filter((key) => !WRONG_GENERATED_THEME_PALETTE_KEYS.has(key))
      .map((key) => [key, cleaned[key]]),
  );
  return Object.keys(pruned).length > 0 ? pruned : cleaned;
}

export function normalizeThemeColorCollections(theme = {}) {
  const out = { ...(theme || {}) };
  const normalizedColors = normalizeColorArray(out.colors);
  out.themePalette = normalizeThemePalette(out.themePalette);
  if (isKnownWrongGeneratedSet(normalizedColors)) {
    out.colors = legacyColors();
    return out;
  }
  if (normalizedColors.length === 0) {
    out.colors = legacyColors();
    return out;
  }
  out.colors = normalizedColors;
  return out;
}
