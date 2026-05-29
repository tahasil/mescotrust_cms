import { ensureMailto, normalizeLinkTarget } from "@/lib/linkUtils";

export const TEAM_FEATURE_KEYS = [
  "showInSlider",
  "featuredTeam",
  "showOnHomepage",
  "highlightTeam",
  "enableSocialIcons",
];

export const TEAM_FEATURE_OPTIONS = [
  { label: "Show in Slider", value: "showInSlider" },
  { label: "Featured Team", value: "featuredTeam" },
  { label: "Show on Homepage", value: "showOnHomepage" },
  { label: "Highlight Team", value: "highlightTeam" },
  { label: "Enable Social Icons", value: "enableSocialIcons" },
];

export function toText(value) {
  return value != null ? String(value).trim() : "";
}

export function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function slugify(value) {
  const base = toText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "item";
}

export function normalizeSocialLinks(list) {
  const links = Array.isArray(list) ? list : [];
  return links
    .map((item) => {
      const target = normalizeLinkTarget(
        item?.target ?? item?.sourceTarget ?? item?.openInNewTab,
        "_self",
      );
      return {
        platform: toText(item?.platform),
        url: ensureMailto(item?.url),
        target,
        openInNewTab: target === "_blank",
      };
    })
    .filter((item) => item.platform || item.url);
}

export function normalizeFeatureMap(input) {
  const featureKeysFromArray = new Set(
    Array.isArray(input?.featureKeys) ? input.featureKeys.map(toText) : [],
  );
  const featureObj =
    input?.features && typeof input.features === "object" ? input.features : {};
  const out = {};
  TEAM_FEATURE_KEYS.forEach((key) => {
    out[key] =
      featureKeysFromArray.has(key) ||
      input?.[key] === true ||
      featureObj?.[key] === true;
  });
  out.mappedSliderComponentId = toText(
    input?.mappedSliderComponentId || featureObj?.mappedSliderComponentId,
  );
  return out;
}

export function normalizeMemberPayload(data = {}, options = {}) {
  const fallbackName = toText(options?.fallbackName);
  const name = toText(data?.name) || fallbackName;
  return {
    name,
    slug: slugify(toText(data?.slug) || name || fallbackName || "member"),
    categoryId: toText(data?.categoryId),
    designation: toText(data?.designation),
    image:
      toText(data?.image) ||
      toText(data?.imageDesktop) ||
      toText(data?.imageUrl),
    bio: toText(data?.bio || data?.description),
    socialLinks: normalizeSocialLinks(data?.socialLinks),
    features: normalizeFeatureMap(data),
    order: toNumber(data?.order, 0),
    status: data?.status !== false,
  };
}

export function normalizeCategoryPayload(data = {}, options = {}) {
  const fallbackName = toText(options?.fallbackName) || "Category";
  const name = toText(data?.name) || fallbackName;
  return {
    name,
    slug: slugify(toText(data?.slug) || name),
    description: toText(data?.description),
    order: toNumber(data?.order, 0),
    isActive: data?.isActive !== false,
  };
}
