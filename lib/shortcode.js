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
