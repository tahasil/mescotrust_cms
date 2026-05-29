import { normalizeLinkTarget } from "@/lib/linkUtils";

const DEFAULT_ORBIT_ITEM_COUNT = 10;

export const MAP_SLIDER_STATIC_MAP_URL =
  "";

function toText(value, fallback = "") {
  if (value == null) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

function toNumber(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  if (next < min) return min;
  if (next > max) return max;
  return next;
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const next = value.trim().toLowerCase();
    if (next === "true") return true;
    if (next === "false") return false;
  }
  return fallback;
}

function normalizeDirection(value, fallback = "clockwise") {
  const next = toText(value, fallback).toLowerCase();
  if (next === "clockwise" || next === "counterclockwise") return next;
  if (next === "anticlockwise") return "counterclockwise";
  return fallback;
}

export function createDefaultMapSliderOrbitItems(count = DEFAULT_ORBIT_ITEM_COUNT) {
  const safeCount = Math.max(1, Math.min(16, Number(count) || DEFAULT_ORBIT_ITEM_COUNT));
  return Array.from({ length: safeCount }).map((_, index) => ({
    imageUrl: "",
    altText: `Orbit avatar ${index + 1}`,
    href: "",
    target: "_self",
  }));
}

export function normalizeMapSliderOrbitItem(rawItem, index = 0) {
  const raw = rawItem && typeof rawItem === "object" ? rawItem : {};
  return {
    imageUrl: toText(raw.imageUrl, ""),
    altText: toText(raw.altText, `Orbit avatar ${index + 1}`),
    href: toText(raw.href, ""),
    target: normalizeLinkTarget(
      raw.target ?? raw.linkTarget ?? raw.newTab ?? raw.openInNewTab,
      "_self",
    ),
  };
}

export function normalizeMapSliderConfig(rawConfig, options = {}) {
  const {
    defaultItemCount = DEFAULT_ORBIT_ITEM_COUNT,
    fallback = {},
  } = options;

  const raw = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
  const fallbackConfig =
    fallback && typeof fallback === "object" ? fallback : {};

  const rawItems = Array.isArray(raw.orbitItems)
    ? raw.orbitItems
    : Array.isArray(fallbackConfig.orbitItems)
      ? fallbackConfig.orbitItems
      : [];
  const normalizedItems = rawItems
    .slice(0, 16)
    .map((item, index) => normalizeMapSliderOrbitItem(item, index));

  const baseNodeSize = toNumber(
    raw.nodeSize,
    toNumber(fallbackConfig.nodeSize, 64, { min: 28, max: 180 }),
    { min: 28, max: 180 },
  );
  const defaultTabletNodeSize = Math.round(baseNodeSize * 0.88);
  const defaultMobileNodeSize = Math.round(baseNodeSize * 0.76);
  const nodeSizeDesktop = toNumber(
    raw.nodeSizeDesktop,
    toNumber(fallbackConfig.nodeSizeDesktop, baseNodeSize, {
      min: 24,
      max: 220,
    }),
    { min: 24, max: 220 },
  );
  const nodeSizeTablet = toNumber(
    raw.nodeSizeTablet,
    toNumber(fallbackConfig.nodeSizeTablet, defaultTabletNodeSize, {
      min: 20,
      max: 200,
    }),
    { min: 20, max: 200 },
  );
  const nodeSizeMobile = toNumber(
    raw.nodeSizeMobile,
    toNumber(fallbackConfig.nodeSizeMobile, defaultMobileNodeSize, {
      min: 18,
      max: 180,
    }),
    { min: 18, max: 180 },
  );

  return {
    mapImageUrl: toText(raw.mapImageUrl, toText(fallbackConfig.mapImageUrl, "")),
    mapImageAlt: toText(raw.mapImageAlt, toText(fallbackConfig.mapImageAlt, "Map graphic")),
    orbitItems:
      normalizedItems.length > 0
        ? normalizedItems
        : createDefaultMapSliderOrbitItems(defaultItemCount),
    rotationDuration: toNumber(
      raw.rotationDuration,
      toNumber(fallbackConfig.rotationDuration, 60, { min: 12, max: 240 }),
      { min: 12, max: 240 },
    ),
    pauseOnHover: toBoolean(
      raw.pauseOnHover,
      toBoolean(fallbackConfig.pauseOnHover, true),
    ),
    orbitRadius: toNumber(
      raw.orbitRadius,
      toNumber(fallbackConfig.orbitRadius, 290, { min: 100, max: 520 }),
      { min: 100, max: 520 },
    ),
    nodeSize: baseNodeSize,
    nodeSizeDesktop,
    nodeSizeTablet,
    nodeSizeMobile,
    stageSize: toNumber(
      raw.stageSize,
      toNumber(fallbackConfig.stageSize, 760, { min: 280, max: 1400 }),
      { min: 280, max: 1400 },
    ),
    direction: normalizeDirection(
      raw.direction,
      normalizeDirection(fallbackConfig.direction, "clockwise"),
    ),
    showTicks: toBoolean(raw.showTicks, toBoolean(fallbackConfig.showTicks, true)),
    showInnerRing: toBoolean(
      raw.showInnerRing,
      toBoolean(fallbackConfig.showInnerRing, true),
    ),
  };
}
