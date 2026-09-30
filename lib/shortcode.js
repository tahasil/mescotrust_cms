function normalizeText(value) {
  return String(value ?? "").trim();
}

const STRICT_SHORTCODE_RE = /^\[\s*shortcode\s*=\s*"([^"]+)"\s*\]$/i;
const BRACKET_TAG_RE = /^\[\s*([a-zA-Z][\w-]*)\s*([^\]]*)\]$/;
const ATTR_RE =
  /([a-zA-Z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=\]]+))/g;

function parseAttributes(raw) {
  const out = {};
  const src = String(raw || "");
  ATTR_RE.lastIndex = 0;
  let match = ATTR_RE.exec(src);
  while (match) {
    const key = normalizeText(match[1]).toLowerCase();
    const value = normalizeText(match[2] ?? match[3] ?? match[4] ?? "");
    if (key && value) out[key] = value;
    match = ATTR_RE.exec(src);
  }
  return out;
}

function pickFirst(attrs, keys = []) {
  for (const key of keys) {
    const value = normalizeText(attrs?.[String(key || "").toLowerCase()]);
    if (value) return value;
  }
  return "";
}

function toStrictShortcode(value) {
  const clean = normalizeText(value);
  if (!clean) return "";
  return `[shortcode="${clean}"]`;
}

function extractLegacyShortcodeValue(rawValue) {
  const raw = normalizeText(rawValue);
  if (!raw) return "";

  const match = raw.match(BRACKET_TAG_RE);
  if (!match) return "";

  const tag = normalizeText(match[1]).toLowerCase();
  const attrs = parseAttributes(match[2] || "");

  if (tag === "form") {
    return pickFirst(attrs, ["shortcode", "code", "id", "formid", "key", "name"]);
  }

  if (tag === "team") {
    return pickFirst(attrs, ["shortcode", "code", "id", "teamid", "key", "name", "slug"]);
  }

  if (
    tag === "component" ||
    tag === "module" ||
    tag === "slider" ||
    tag === "popup" ||
    tag === "shortcode"
  ) {
    return pickFirst(attrs, ["componentid", "component", "id", "name", "type", "base", "shortcode"]);
  }

  return "";
}

export function normalizeShortcodeText(value) {
  return normalizeText(value);
}

export function buildShortcodeFromSelection(_sourceType, rawValue) {
  return toStrictShortcode(rawValue);
}

export function parseShortcodeInput(rawValue) {
  const raw = normalizeText(rawValue);
  const strictMatch = raw.match(STRICT_SHORTCODE_RE);
  const strictValue = normalizeText(strictMatch?.[1] || "");
  const legacyValue = strictValue ? "" : extractLegacyShortcodeValue(raw);
  const targetKey = strictValue || legacyValue;

  return {
    raw,
    normalized: toStrictShortcode(targetKey),
    isEmpty: raw.length === 0,
    isValidFormat: Boolean(strictValue),
    sourceType: targetKey ? "shortcode" : "manual",
    targetKey,
    tag: "shortcode",
    attrs: strictValue ? { shortcode: strictValue } : {},
    renderProps: {},
  };
}

/**
 * Reads the shortcode text a page block carries. Kept shared so the server
 * (page render) and the client (ShortCode component) resolve targets identically.
 */
export function getShortcodeTextFromProps(props) {
  const direct = normalizeShortcodeText(props?.shortcode || props?.shortCode || props?.shortCodeRaw);
  if (direct) return direct;

  // Legacy fallback to avoid breaking already-configured page blocks.
  const sourceType = normalizeShortcodeText(props?.shortCodeSourceType).toLowerCase();
  const selectedValue =
    sourceType === "form"
      ? normalizeShortcodeText(props?.shortCodeSelectedForm).toLowerCase()
      : sourceType === "slider"
        ? normalizeShortcodeText(props?.shortCodeSelectedSlider)
        : sourceType === "popup"
          ? normalizeShortcodeText(props?.shortCodeSelectedPopup)
          : sourceType === "component"
            ? normalizeShortcodeText(props?.shortCodeSelectedComponent)
            : "";

  return buildShortcodeFromSelection("shortcode", selectedValue);
}

/** Maps a shortcode value to a site component id (empty when it is not a component). */
export function findComponentIdByShortcodeValue(rawValue, siteComponentIds = []) {
  const value = normalizeShortcodeText(rawValue);
  if (!value) return "";
  const ids = Array.isArray(siteComponentIds) ? siteComponentIds : [];
  return (
    ids.find((componentId) => String(componentId).toLowerCase() === value.toLowerCase()) || ""
  );
}

/** Shortcode target key for a block's props ("[shortcode=\"X\"]" -> "X"). */
export function getShortcodeTargetKey(props) {
  return normalizeShortcodeText(parseShortcodeInput(getShortcodeTextFromProps(props))?.targetKey);
}

export function inferShortcodeSelection(rawValue) {
  const parsed = parseShortcodeInput(rawValue);
  return {
    sourceType: parsed.isEmpty ? "manual" : parsed.sourceType,
    shortcode: parsed.normalized || parsed.raw,
    shortcodeValue: parsed.targetKey,
    isValidFormat: parsed.isValidFormat,
    formShortcode: "",
    sliderComponentId: "",
    popupComponentId: "",
    moduleComponentId: "",
  };
}
