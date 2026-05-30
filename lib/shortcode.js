import { SITE_COMPONENT_IDS } from "@/lib/siteComponentRegistry";

const SHORTCODE_REGEX = /\[([^\[\]]+)\]/g;
const ATTR_REGEX =
  /([a-zA-Z_][a-zA-Z0-9_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=]+))/g;

function normalizeComponentId(raw) {
  const value = String(raw || "")
    .trim()
    .replace(/\/$/, "");
  if (!value) return "";

  const exact = SITE_COMPONENT_IDS.find((id) => id === value);
  if (exact) return exact;

  const caseInsensitive = SITE_COMPONENT_IDS.find(
    (id) => id.toLowerCase() === value.toLowerCase(),
  );
  if (caseInsensitive) return caseInsensitive;

  return value;
}

function parseAttributes(input) {
  const attrs = {};
  ATTR_REGEX.lastIndex = 0;
  let match = null;
  while ((match = ATTR_REGEX.exec(input)) !== null) {
    const key = String(match[1] || "").trim().toLowerCase();
    const value = String(match[2] ?? match[3] ?? match[4] ?? "").trim();
    if (key) attrs[key] = value;
  }
  return attrs;
}

function extractShortcodeTarget(tag, attrs) {
  const tagLower = String(tag || "").trim().toLowerCase();
  if (!tagLower || tagLower.startsWith("/")) {
    return { type: "unknown", componentId: "", formKey: "" };
  }

  if (tagLower === "component" || tagLower === "shortcode" || tagLower === "slider") {
    const componentId =
      attrs.componentid ||
      attrs.component ||
      attrs.id ||
      attrs.name ||
      attrs.base ||
      "";
    return { type: "component", componentId, formKey: "" };
  }

  if (tagLower === "form" || tagLower === "dynamic_form") {
    const formKey =
      attrs.formkey ||
      attrs.id ||
      attrs.name ||
      attrs.key ||
      "";
    return { type: "form", componentId: "", formKey };
  }

  return { type: "component", componentId: tag, formKey: "" };
}

export function parseComponentShortcodes(input) {
  const text = String(input || "");
  const out = [];
  SHORTCODE_REGEX.lastIndex = 0;
  let match = null;
  let order = 0;

  while ((match = SHORTCODE_REGEX.exec(text)) !== null) {
    const expression = String(match[1] || "").trim();
    if (!expression) continue;

    const token = expression.replace(/\/$/, "").trim();
    const firstSpace = token.indexOf(" ");
    const tag = firstSpace === -1 ? token : token.slice(0, firstSpace).trim();
    const rest = firstSpace === -1 ? "" : token.slice(firstSpace + 1);
    const attrs = parseAttributes(rest);
    const target = extractShortcodeTarget(tag, attrs);
    const componentId =
      target.type === "component" ? normalizeComponentId(target.componentId) : "";
    const formKey = target.type === "form" ? String(target.formKey || "").trim() : "";
    const isKnown =
      target.type === "component"
        ? SITE_COMPONENT_IDS.includes(componentId)
        : target.type === "form"
          ? !!formKey
          : false;

    out.push({
      index: order++,
      raw: match[0],
      expression,
      type: target.type,
      componentId,
      formKey,
      known: isKnown,
      attrs,
    });
  }

  return out;
}

export function buildComponentShortcode(componentId) {
  const normalized = normalizeComponentId(componentId);
  if (!normalized) return "";
  return `[component id="${normalized}"]`;
}

export function buildFormShortcode(formKey) {
  const normalized = String(formKey || "").trim();
  if (!normalized) return "";
  return `[form id="${normalized}"]`;
}
