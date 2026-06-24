import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const INNER_PAGE_HERO_REQUIRED_IMAGE_WIDTH = 1440;
export const INNER_PAGE_HERO_REQUIRED_IMAGE_HEIGHT = 260;
export const INNER_PAGE_HERO_REQUIRED_IMAGE_TEXT =
  `${INNER_PAGE_HERO_REQUIRED_IMAGE_WIDTH} \u00D7 ${INNER_PAGE_HERO_REQUIRED_IMAGE_HEIGHT} pixels`;

function resolveInnerPageHeroBackgroundImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  return String(props.innerPageHeroSectionBgImage || "").trim();
}

function resolveInnerPageHeroDesktopImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  return String(props.bgImageDesktop ?? props.bgImage ?? "").trim();
}

export async function validateInnerPageHeroBackgroundImage(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const targets = [
    { label: "Background Image", url: resolveInnerPageHeroBackgroundImageUrl(props) },
    { label: "Desktop Image", url: resolveInnerPageHeroDesktopImageUrl(props) },
  ].filter((target) => target.url);
  if (targets.length === 0) return [];

  const invalidTargets = [];
  const dimensionCache = new Map();

  for (const target of targets) {
    try {
      let dims = dimensionCache.get(target.url);
      if (!dims) {
        dims = await getImageDimensionsForValidation(target.url);
        dimensionCache.set(target.url, dims);
      }
      const width = Number(dims.width) || 0;
      const height = Number(dims.height) || 0;
      if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width !== INNER_PAGE_HERO_REQUIRED_IMAGE_WIDTH ||
        height !== INNER_PAGE_HERO_REQUIRED_IMAGE_HEIGHT
      ) {
        invalidTargets.push({ label: target.label, width, height });
      }
    } catch {
      invalidTargets.push({ label: target.label, width: 0, height: 0 });
    }
  }

  if (invalidTargets.length === 0) return [];

  const prefix = labelPrefix ? `${labelPrefix}: ` : "";
  const invalidLabels = invalidTargets
    .map((item) => `${item.label} (${item.width} \u00D7 ${item.height})`)
    .join(", ");
  return [
    `${prefix}Image size must be exactly ${INNER_PAGE_HERO_REQUIRED_IMAGE_TEXT}. Invalid field(s): ${invalidLabels}.`,
  ];
}
