function normalizeText(value) {
  return String(value ?? "").trim();
}

function parseAttributes(raw) {
  const out = {};
  const src = String(raw || "");
  const attrRe = /([a-zA-Z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=\]]+))/g;
  let match = attrRe.exec(src);
  while (match) {
    const key = String(match[1] || "").trim();
    const value = normalizeText(match[2] ?? match[3] ?? match[4] ?? "");
    if (key) out[key] = value;
    match = attrRe.exec(src);
  }
  return out;
}

function pickFirst(attrs, keys = []) {
  const lookup = {};
  Object.entries(attrs || {}).forEach(([key, value]) => {
    const normalizedKey = normalizeText(key).toLowerCase();
    if (!normalizedKey) return;
    if (!(normalizedKey in lookup)) lookup[normalizedKey] = value;
  });
  for (const key of keys) {
    const value = normalizeText(lookup[String(key || "").toLowerCase()]);
    if (value) return value;
  }
  return "";
}

function normalizeTargetForType(sourceType, targetKey) {
  const value = normalizeText(targetKey);
  if (!value) return "";
  if (sourceType === "form") return value.toLowerCase();
  return value;
}

function toRenderProps(attrs, keysToStrip = []) {
  const removeSet = new Set(
    (keysToStrip || []).map((key) => String(key || "").toLowerCase()),
  );
  const props = {};
  Object.entries(attrs || {}).forEach(([key, value]) => {
    const normalizedKey = String(key || "").toLowerCase();
    if (!removeSet.has(normalizedKey)) props[key] = value;
  });
  return props;
}

export const SHORTCODE_SOURCE_OPTIONS = [
  { label: "Manual", value: "manual" },
  { label: "Form", value: "form" },
  { label: "Slider", value: "slider" },
  { label: "Popup", value: "popup" },
  { label: "Module", value: "component" },
];

export const SHORTCODE_SLIDER_COMPONENTS = [
  "EventsSlider",
  "StoriesSlider",
  "ImageSlider",
];

export const SHORTCODE_MODULE_COMPONENTS = [
  "EventRegistrationForm",
  "SocialMediaWall",
  "LatestEvents1",
  "Notices",
  "Cards",
  "Cards1",
];

export function normalizeShortcodeText(value) {
  return normalizeText(value);
}

export function buildShortcodeFromSelection(sourceType, rawValue) {
  const value = normalizeText(rawValue);
  if (!value) return "";
  if (sourceType === "form") return `[form shortcode="${value.toLowerCase()}"]`;
  if (sourceType === "slider") return `[slider type="${value}"]`;
  if (sourceType === "popup") return `[popup id="${value}"]`;
  if (sourceType === "component") return `[component id="${value}"]`;
  return value;
}

export function parseShortcodeInput(rawValue) {
  const raw = normalizeText(rawValue);
  const base = {
    raw,
    isEmpty: raw.length === 0,
    sourceType: "manual",
    targetKey: "",
    tag: "",
    attrs: {},
    renderProps: {},
  };
  if (!raw) return base;

  const bracketMatch = raw.match(/^\[\s*([a-zA-Z][\w-]*)\s*([^\]]*)\]$/);
  if (bracketMatch) {
    const tag = normalizeText(bracketMatch[1]);
    const tagLower = tag.toLowerCase();
    const attrs = parseAttributes(bracketMatch[2] || "");

    if (tagLower === "form") {
      const targetKey = normalizeTargetForType(
        "form",
        pickFirst(attrs, ["shortcode", "code", "id", "formid"]),
      );
      return {
        ...base,
        sourceType: "form",
        targetKey,
        tag,
        attrs,
        renderProps: toRenderProps(attrs, ["shortcode", "code", "id", "formid"]),
      };
    }

    if (tagLower === "slider") {
      const targetKey = normalizeTargetForType(
        "slider",
        pickFirst(attrs, ["type", "id", "component", "name"]),
      );
      return {
        ...base,
        sourceType: "slider",
        targetKey,
        tag,
        attrs,
        renderProps: toRenderProps(attrs, ["type", "id", "component", "name"]),
      };
    }

    if (tagLower === "popup") {
      const targetKey = normalizeTargetForType(
        "popup",
        pickFirst(attrs, ["id", "component", "name"]),
      );
      return {
        ...base,
        sourceType: "popup",
        targetKey,
        tag,
        attrs,
        renderProps: toRenderProps(attrs, ["id", "component", "name"]),
      };
    }

    if (tagLower === "component" || tagLower === "module") {
      const targetKey = normalizeTargetForType(
        "component",
        pickFirst(attrs, ["id", "component", "name", "type"]),
      );
      return {
        ...base,
        sourceType: "component",
        targetKey,
        tag,
        attrs,
        renderProps: toRenderProps(attrs, ["id", "component", "name", "type"]),
      };
    }

    return {
      ...base,
      sourceType: "component",
      targetKey: normalizeTargetForType("component", tag),
      tag,
      attrs,
      renderProps: attrs,
    };
  }

  const prefixed = raw.match(/^([a-zA-Z][\w-]*)\s*:\s*(.+)$/);
  if (prefixed) {
    const prefix = normalizeText(prefixed[1]).toLowerCase();
    const targetRaw = normalizeText(prefixed[2]);
    if (prefix === "form") {
      return {
        ...base,
        sourceType: "form",
        targetKey: normalizeTargetForType("form", targetRaw),
      };
    }
    if (prefix === "slider") {
      return {
        ...base,
        sourceType: "slider",
        targetKey: normalizeTargetForType("slider", targetRaw),
      };
    }
    if (prefix === "popup") {
      return {
        ...base,
        sourceType: "popup",
        targetKey: normalizeTargetForType("popup", targetRaw),
      };
    }
    if (prefix === "component" || prefix === "module") {
      return {
        ...base,
        sourceType: "component",
        targetKey: normalizeTargetForType("component", targetRaw),
      };
    }
  }

  return {
    ...base,
    sourceType: "form",
    targetKey: normalizeTargetForType("form", raw),
  };
}

export function inferShortcodeSelection(rawValue) {
  const parsed = parseShortcodeInput(rawValue);
  const sourceType = parsed.isEmpty ? "manual" : parsed.sourceType;
  return {
    sourceType,
    shortcode: parsed.raw,
    formShortcode: sourceType === "form" ? parsed.targetKey : "",
    sliderComponentId: sourceType === "slider" ? parsed.targetKey : "",
    popupComponentId: sourceType === "popup" ? parsed.targetKey : "",
    moduleComponentId: sourceType === "component" ? parsed.targetKey : "",
  };
}
