export const DEFAULT_TITLE_AND_COLORS_FALLBACK = {
  titleListHeader: "Main Title",
  titleListItems: [
    {
      key: "mainTitle",
      type: "input",
      name: "mainTitle",
      label: "Main title",
      tooltip: "Section heading",
      placeholder: "Section Title",
    },
    {
      key: "subTitle",
      type: "input",
      name: "subTitle",
      label: "Subtitle",
      tooltip: "Subheading",
      placeholder: "Subtitle",
    },
  ],
  colorListItems: [
    {
      name: "titleColorKey",
      label: "Title color",
      tooltip: "Theme color for section title",
    },
    {
      name: "subTitleColorKey",
      label: "Sub title color",
      tooltip: "Theme color for section subtitle",
    },
  ],
};

const DEFAULT_APPEARANCE_TITLE_AND_COLORS_CONFIG = {
  Header: {
    titleListHeader: "Main Title",
    titleListItems: [],
    colorListItems: [
      {
        name: "headerCtaBgColorKey",
        label: "CTA background",
        tooltip: "Theme color for CTA button background",
      },
      {
        name: "headerCtaTextColorKey",
        label: "CTA text",
        tooltip: "Theme color for CTA button text",
      },
    ],
  },
  Footer: {
    titleListHeader: "Main Title",
    titleListItems: [],
    colorListItems: [
      {
        name: "footerBgColorKey",
        label: "Background",
        tooltip: "Theme color for footer background",
      },
      {
        name: "footerTextColorKey",
        label: "Text & links",
        tooltip: "Theme color for text and links",
      },
      {
        name: "footerSocialColorKey",
        label: "Social media",
        tooltip: "Theme color for social media icons",
      },
      {
        name: "footerCopyrightBarColorKey",
        label: "Copyright bar",
        tooltip: "Theme color for copyright bar",
      },
    ],
  },
  Subscribe: {
    titleListHeader: "Main Title",
    titleListItems: [
      {
        key: "subtitle",
        type: "input",
        name: "subscribeSubtitle",
        label: "Subtitle",
        tooltip: "Small text above title",
        placeholder: "e.g. Latest News",
      },
      {
        key: "title",
        type: "input",
        name: "subscribeTitle",
        label: "Title",
        tooltip: "Main heading",
        placeholder: "e.g. To get weekly updates",
      },
    ],
    colorListItems: [
      {
        name: "subscribeSubtitleColorKey",
        label: "Subtitle",
        tooltip: "Theme color for subtitle",
      },
      {
        name: "subscribeTitleColorKey",
        label: "Title",
        tooltip: "Theme color for title",
      },
      {
        name: "subscribeButtonBgColorKey",
        label: "Button background",
        tooltip: "Theme color for button",
      },
      {
        name: "subscribeButtonTextColorKey",
        label: "Button text",
        tooltip: "Theme color for button text",
      },
    ],
  },
};

const APPEARANCE_COMPONENT_IDS = Object.freeze(
  Object.keys(DEFAULT_APPEARANCE_TITLE_AND_COLORS_CONFIG),
);

export const LIST_HEADER_STYLE = {
  fontSize: 13,
  fontWeight: 600,
  color: "rgba(0,0,0,0.65)",
};

function safeString(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const text = value.trim();
  return text || fallback;
}

function sanitizeTitleListItem(item) {
  if (!item || typeof item !== "object") return null;
  const type = safeString(item.type).toLowerCase();
  if (type !== "input" && type !== "switch" && type !== "select") return null;
  const name = safeString(item.name);
  if (!name) return null;

  const output = {
    type,
    name,
    label: safeString(item.label, name),
    tooltip: safeString(item.tooltip, ""),
  };

  const key = safeString(item.key, name);
  if (key) output.key = key;

  const placeholder = safeString(item.placeholder, "");
  if (placeholder) output.placeholder = placeholder;

  if (Array.isArray(item.rules)) {
    output.rules = item.rules.filter((rule) => rule && typeof rule === "object");
  }

  if (type === "select") {
    const options = Array.isArray(item.options)
      ? item.options
          .map((opt) => {
            if (!opt || typeof opt !== "object") return null;
            const value = safeString(opt.value);
            const label = safeString(opt.label, value);
            if (!value) return null;
            return { value, label };
          })
          .filter(Boolean)
      : [];
    if (options.length > 0) output.options = options;
    const defaultValue = safeString(item.defaultValue, "");
    if (defaultValue) output.defaultValue = defaultValue;
  }

  return output;
}

function sanitizeColorListItem(item) {
  if (!item || typeof item !== "object") return null;
  const name = safeString(item.name);
  if (!name) return null;
  return {
    name,
    label: safeString(item.label, name),
    tooltip: safeString(item.tooltip, ""),
  };
}

function sanitizeComponentConfig(raw, fallbackConfig) {
  const base =
    fallbackConfig && typeof fallbackConfig === "object"
      ? fallbackConfig
      : DEFAULT_TITLE_AND_COLORS_FALLBACK;
  const input = raw && typeof raw === "object" ? raw : {};

  const titleListHeader = safeString(
    input.titleListHeader,
    safeString(base.titleListHeader, "Main Title"),
  );

  const titleListItemsRaw = Array.isArray(input.titleListItems)
    ? input.titleListItems
    : Array.isArray(base.titleListItems)
      ? base.titleListItems
      : [];
  const titleListItems = titleListItemsRaw
    .map(sanitizeTitleListItem)
    .filter(Boolean);

  const colorListItemsRaw = Array.isArray(input.colorListItems)
    ? input.colorListItems
    : Array.isArray(base.colorListItems)
      ? base.colorListItems
      : [];
  const colorListItems = colorListItemsRaw
    .map(sanitizeColorListItem)
    .filter(Boolean);

  return {
    titleListHeader,
    titleListItems,
    colorListItems,
  };
}

export function mergeAppearanceTitleAndColorsConfig(overrideMap) {
  const source = overrideMap && typeof overrideMap === "object" ? overrideMap : {};
  const merged = {};
  APPEARANCE_COMPONENT_IDS.forEach((componentId) => {
    merged[componentId] = sanitizeComponentConfig(
      source[componentId],
      DEFAULT_APPEARANCE_TITLE_AND_COLORS_CONFIG[componentId],
    );
  });
  return merged;
}
