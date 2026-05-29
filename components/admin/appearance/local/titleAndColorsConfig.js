import {
  DEFAULT_TITLE_AND_COLORS_FALLBACK,
  LIST_HEADER_STYLE,
  mergeAppearanceTitleAndColorsConfig,
} from "@/lib/appearanceTitleAndColorsConfig";

const CONFIG_API_PATH = "/api/admin/appearance/title-and-colors-config";
const TITLE_ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

function getMainTitleAlignFieldName(mainTitleFieldName) {
  const name = String(mainTitleFieldName || "").trim();
  if (!name) return "titleAlign";
  if (name.toLowerCase() === "maintitle") return "titleAlign";
  return `${name}Align`;
}

function getDefaultTitleAndColorsConfig() {
  return {
    titleListHeader: DEFAULT_TITLE_AND_COLORS_FALLBACK.titleListHeader,
    titleListItems: Array.isArray(DEFAULT_TITLE_AND_COLORS_FALLBACK.titleListItems)
      ? [...DEFAULT_TITLE_AND_COLORS_FALLBACK.titleListItems]
      : [],
    colorListItems: Array.isArray(DEFAULT_TITLE_AND_COLORS_FALLBACK.colorListItems)
      ? [...DEFAULT_TITLE_AND_COLORS_FALLBACK.colorListItems]
      : [],
  };
}

let cachedAppearanceConfigMap = mergeAppearanceTitleAndColorsConfig();
let inFlightConfigPromise = null;
let hasFetchedConfigMap = false;

function withMainTitleAlign(config) {
  const titleListItems = Array.isArray(config?.titleListItems)
    ? config.titleListItems
    : [];
  if (!titleListItems.length) return config;

  const existingNames = new Set(
    titleListItems
      .map((item) => String(item?.name || "").trim())
      .filter(Boolean),
  );

  const nextTitleItems = [];
  titleListItems.forEach((item) => {
    nextTitleItems.push(item);
    if (item?.key !== "mainTitle" || item?.type !== "input") return;

    const alignFieldName = getMainTitleAlignFieldName(item?.name);
    if (existingNames.has(alignFieldName)) return;

    nextTitleItems.push({
      key: `${item.key}Align`,
      type: "select",
      name: alignFieldName,
      label: "Align",
      tooltip: "Alignment for the main title",
      placeholder: "Select align",
      options: TITLE_ALIGN_OPTIONS,
      defaultValue: "center",
    });
    existingNames.add(alignFieldName);
  });

  return {
    ...config,
    titleListItems: nextTitleItems,
  };
}

export function getTitleAndColorsConfig(componentId) {
  const base =
    cachedAppearanceConfigMap[componentId] || getDefaultTitleAndColorsConfig();
  return withMainTitleAlign(base);
}

export function getCachedAppearanceTitleAndColorsConfigMap() {
  return cachedAppearanceConfigMap;
}

export async function fetchAppearanceTitleAndColorsConfigMap({ force = false } = {}) {
  if (!force && hasFetchedConfigMap) return cachedAppearanceConfigMap;
  if (inFlightConfigPromise) return inFlightConfigPromise;

  inFlightConfigPromise = fetch(CONFIG_API_PATH, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
  })
    .then(async (res) => {
      if (!res.ok) return cachedAppearanceConfigMap;
      const data = await res.json().catch(() => ({}));
      const rawConfig =
        data && typeof data === "object" && data.config && typeof data.config === "object"
          ? data.config
          : data;
      cachedAppearanceConfigMap = mergeAppearanceTitleAndColorsConfig(rawConfig);
      hasFetchedConfigMap = true;
      return cachedAppearanceConfigMap;
    })
    .catch(() => {
      hasFetchedConfigMap = true;
      return cachedAppearanceConfigMap;
    })
    .finally(() => {
      inFlightConfigPromise = null;
    });

  return inFlightConfigPromise;
}

export function getTitleAndColorsConfigFromMap(componentId, configMap) {
  const base =
    mergeAppearanceTitleAndColorsConfig(configMap)[componentId] ||
    getDefaultTitleAndColorsConfig();
  return withMainTitleAlign(base);
}

export { LIST_HEADER_STYLE };
