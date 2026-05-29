import { ensureMailto, normalizeLinkTarget } from "@/lib/linkUtils";

export const PORTFOLIO_FEATURE_KEYS = [
  "showInSlider",
  "featuredPortfolio",
  "showOnHomepage",
  "highlightPortfolio",
  "enableSocialIcons",
];

export const PORTFOLIO_FEATURE_OPTIONS = [
  { label: "Show in Slider", value: "showInSlider" },
  { label: "Featured Portfolio", value: "featuredPortfolio" },
  { label: "Show on Homepage", value: "showOnHomepage" },
  { label: "Highlight Portfolio", value: "highlightPortfolio" },
  { label: "Enable Social Icons", value: "enableSocialIcons" },
];

export function toText(value) {
  return value != null ? String(value).trim() : "";
}

export function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function toBoolean(value) {
  if (value === true || value === false) return value;
  const text = toText(value).toLowerCase();
  return text === "1" || text === "true" || text === "yes" || text === "on";
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
        item?.target ??
          item?.sourceTarget ??
          item?.openInNewTab ??
          item?.newTab,
        "_self",
      );
      return {
        label: toText(item?.label || item?.platform),
        url: ensureMailto(item?.url),
        linkEnabled:
          item?.linkEnabled == null ? false : toBoolean(item?.linkEnabled),
        target,
        openInNewTab: target === "_blank",
      };
    })
    .filter((item) => item.label || item.url);
}

export function normalizeFeatureMap(input) {
  const featureKeysFromArray = new Set(
    Array.isArray(input?.featureKeys) ? input.featureKeys.map(toText) : [],
  );
  const featureObj =
    input?.features && typeof input.features === "object" ? input.features : {};
  const hasFeatureToggle = input?.feature != null;
  const featureToggle = hasFeatureToggle ? toBoolean(input?.feature) : false;
  const out = {};
  PORTFOLIO_FEATURE_KEYS.forEach((key) => {
    const computed =
      featureKeysFromArray.has(key) ||
      input?.[key] === true ||
      featureObj?.[key] === true;
    if (hasFeatureToggle && (key === "featuredPortfolio" || key === "showInSlider")) {
      out[key] = featureToggle;
      return;
    }
    out[key] = computed;
  });
  out.mappedSliderComponentId = toText(
    input?.mappedSliderComponentId || featureObj?.mappedSliderComponentId,
  );
  return out;
}

export function normalizePortfolioPayload(data = {}, options = {}) {
  const fallbackName = toText(options?.fallbackName);
  const name = toText(data?.name) || fallbackName;
  const normalizedFeature =
    data?.feature != null
      ? toBoolean(data?.feature)
      : toBoolean(data?.showInSlider) ||
        data?.features?.featuredPortfolio === true ||
        data?.features?.showInSlider === true;
  return {
    name,
    slug: slugify(toText(data?.slug) || name || fallbackName || "portfolio-item"),
    categoryId: toText(data?.categoryId),
    designation: toText(data?.designation),
    image:
      toText(data?.image) ||
      toText(data?.imageDesktop) ||
      toText(data?.imageUrl),
    logo: toText(data?.logo || data?.logoImage),
    bio: toText(data?.bio || data?.description),
    socialLinks: normalizeSocialLinks(data?.socialLinks),
    feature: normalizedFeature,
    features: normalizeFeatureMap({ ...(data || {}), feature: normalizedFeature }),
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

