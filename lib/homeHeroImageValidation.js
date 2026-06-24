import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const HOME_HERO_REQUIRED_IMAGE_WIDTH = 2560;
export const HOME_HERO_REQUIRED_IMAGE_HEIGHT = 1200;
export const HOME_HERO_REQUIRED_IMAGE_TEXT =
  `${HOME_HERO_REQUIRED_IMAGE_WIDTH} \u00D7 ${HOME_HERO_REQUIRED_IMAGE_HEIGHT} pixels`;

function resolveSlides(props) {
  if (!props || typeof props !== "object") return [];
  return Array.isArray(props.homeHeroSlides) ? props.homeHeroSlides : [];
}

function resolveDesktopImageUrl(slide) {
  if (!slide || typeof slide !== "object") return "";
  return String(
    slide.bgImageUrlDesktop ?? slide.bgImageUrl ?? slide.bgImageUrlMobile ?? "",
  ).trim();
}

export async function validateHomeHeroSlideImages(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const slides = resolveSlides(props);
  const invalidSlides = [];
  const dimensionCache = new Map();

  for (let i = 0; i < slides.length; i += 1) {
    const imageUrl = resolveDesktopImageUrl(slides[i]);
    if (!imageUrl) continue;
    try {
      let dims = dimensionCache.get(imageUrl);
      if (!dims) {
        dims = await getImageDimensionsForValidation(imageUrl);
        dimensionCache.set(imageUrl, dims);
      }
      if (
        !Number.isFinite(dims.width) ||
        !Number.isFinite(dims.height) ||
        dims.width !== HOME_HERO_REQUIRED_IMAGE_WIDTH ||
        dims.height !== HOME_HERO_REQUIRED_IMAGE_HEIGHT
      ) {
        invalidSlides.push({
          index: i + 1,
          width: Number(dims.width) || 0,
          height: Number(dims.height) || 0,
        });
      }
    } catch {
      invalidSlides.push({ index: i + 1, width: 0, height: 0 });
    }
  }

  if (invalidSlides.length === 0) return [];

  const prefix = labelPrefix ? `${labelPrefix}: ` : "";
  const labels = invalidSlides
    .map((slide) => `#${slide.index} (${slide.width} \u00D7 ${slide.height})`)
    .join(", ");
  return [
    `${prefix}Image size must be exactly ${HOME_HERO_REQUIRED_IMAGE_TEXT}. Invalid slide(s): ${labels}.`,
  ];
}
