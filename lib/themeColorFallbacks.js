/**
 * Website palette from the current reference design.
 *
 * Keep the labels stable: component settings store these names as color keys.
 * The extra tones mirror the named/repeated colors in the reference CSS.
 */
export const WEBSITE_THEME_COLORS = Object.freeze([
  { name: "Primary", value: "#E03C33" },
  { name: "Black", value: "#2A283E" },
  { name: "Black Light", value: "rgba(42, 40, 62, 0.76)" },
  { name: "White", value: "#FFFFFF" },
  { name: "Primary Light", value: "rgba(224, 60, 51, 0.1)" },
  {
    name: "Gradient",
    value: "linear-gradient(90deg, #E03C33 0%, #B92E27 100%)",
  },
  { name: "Border", value: "rgba(42, 40, 62, 0.14)" },
  {
    name: "imgWhite",
    value:
      "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(3%) hue-rotate(51deg) brightness(115%) contrast(100%)",
  },
  {
    name: "imgColor",
    value:
      "brightness(0) saturate(100%) invert(29%) sepia(88%) saturate(1615%) hue-rotate(339deg) brightness(90%) contrast(95%)",
  },
  { name: "Transparent", value: "transparent" },
  { name: "Primary Dark", value: "#B92E27" },
  { name: "Primary Soft", value: "#F2867F" },
  { name: "Primary Pale", value: "#F2A19B" },
  { name: "Black Muted", value: "rgba(42, 40, 62, 0.52)" },
  { name: "Cream", value: "#FBFAF7" },
  { name: "Warm White", value: "#FAF6EF" },
  { name: "Surface", value: "#F2F0EA" },
  { name: "Dark", value: "#211E30" },
]);

// Exact legacy defaults. Detecting these lets existing installations migrate
// automatically without overwriting a genuinely custom color collection.
const PREVIOUS_THEME_COLORS = [
  { name: "Primary", value: "rgba(207, 55, 47, 1)" },
  { name: "Black", value: "#050505" },
  { name: "Black Light", value: "rgba(5, 5, 5, 0.5)" },
  { name: "White", value: "#FFFFFF" },
  { name: "Primary Light", value: "rgba(207, 55, 47, 0.1)" },
  {
    name: "Gradient",
    value: "linear-gradient(90deg, #CF372F 0%, #691C18 100%)",
  },
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
  return String(value).trim();
}

function websiteColors() {
  return WEBSITE_THEME_COLORS.map((entry) => ({ ...entry }));
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

function normalizeComparableValue(value) {
  return toNonEmptyString(value).toLowerCase().replace(/\s+/g, "");
}

function isPreviousThemeSet(colors) {
  if (!Array.isArray(colors)) return false;
  const byName = new Map(
    colors.map((entry) => [entry.name.toLowerCase(), entry.value]),
  );
  return PREVIOUS_THEME_COLORS.every(
    (entry) =>
      normalizeComparableValue(byName.get(entry.name.toLowerCase())) ===
      normalizeComparableValue(entry.value),
  );
}

function migratePreviousThemeSet(colors) {
  const managedNames = new Set(
    [...PREVIOUS_THEME_COLORS, ...WEBSITE_THEME_COLORS].map((entry) =>
      entry.name.toLowerCase(),
    ),
  );
  const customColors = colors.filter(
    (entry) => !managedNames.has(entry.name.toLowerCase()),
  );
  return [...websiteColors(), ...customColors];
}

function isKnownWrongGeneratedSet(colors) {
  if (!Array.isArray(colors) || colors.length !== 11) return false;
  const names = new Set(colors.map((c) => toNonEmptyString(c.name).toLowerCase()));
  const previousNames = PREVIOUS_THEME_COLORS.map((c) => c.name.toLowerCase());
  return names.has("secondary") && previousNames.every((name) => names.has(name));
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
  const hasWrongGeneratedSet = isKnownWrongGeneratedSet(normalizedColors);
  const hasPreviousThemeSet = isPreviousThemeSet(normalizedColors);
  if (hasWrongGeneratedSet || normalizedColors.length === 0) {
    out.colors = websiteColors();
  } else if (hasPreviousThemeSet) {
    out.colors = migratePreviousThemeSet(normalizedColors);
  } else {
    out.colors = normalizedColors;
  }

  // Loader colors are independent theme settings. Never replace an explicitly
  // saved value while repairing or migrating the shared website palette.
  if (!toNonEmptyString(out.pageLoaderBgColor)) {
    out.pageLoaderBgColor = "#211E30";
  }
  if (!toNonEmptyString(out.pageLoaderBarColor)) {
    out.pageLoaderBarColor = "#E03C33";
  }

  return out;
}
