import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const IMAGE_SLIDER_REQUIRED_IMAGE_WIDTH = 350;
export const IMAGE_SLIDER_REQUIRED_IMAGE_HEIGHT = 450;
export const IMAGE_SLIDER_REQUIRED_IMAGE_TEXT =
  `${IMAGE_SLIDER_REQUIRED_IMAGE_WIDTH} \u00D7 ${IMAGE_SLIDER_REQUIRED_IMAGE_HEIGHT} px`;

function resolveSlides(props) {
  if (!props || typeof props !== "object") return [];
  if (Array.isArray(props.imageSliderImages)) return props.imageSliderImages;
  if (Array.isArray(props.images)) return props.images;
  return [];
}

function resolveDesktopImageUrl(slide) {
  if (!slide || typeof slide !== "object") return "";
  return String(
    slide.desktopSrc ?? slide.src ?? slide.url ?? "",
  ).trim();
}

export async function validateImageSliderImages(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const slides = resolveSlides(props);
  const invalidSlides = [];
  const dimensionCache = new Map();

  for (let index = 0; index < slides.length; index += 1) {
    const imageUrl = resolveDesktopImageUrl(slides[index]);
    if (!imageUrl) continue;

    try {
      let dims = dimensionCache.get(imageUrl);
      if (!dims) {
        dims = await getImageDimensionsForValidation(imageUrl);
        dimensionCache.set(imageUrl, dims);
      }
      const width = Number(dims?.width) || 0;
      const height = Number(dims?.height) || 0;
      if (
        width !== IMAGE_SLIDER_REQUIRED_IMAGE_WIDTH ||
        height !== IMAGE_SLIDER_REQUIRED_IMAGE_HEIGHT
      ) {
        invalidSlides.push({ index: index + 1, width, height });
      }
    } catch {
      invalidSlides.push({ index: index + 1, width: 0, height: 0 });
    }
  }

  if (invalidSlides.length === 0) return [];

  const prefix = labelPrefix ? `${labelPrefix}: ` : "";
  const labels = invalidSlides
    .map((slide) => `Slide #${slide.index} (${slide.width} \u00D7 ${slide.height} px)`)
    .join(", ");

  return [
    `${prefix}Supports Only ${IMAGE_SLIDER_REQUIRED_IMAGE_TEXT}. Invalid slide(s): ${labels}.`,
  ];
}
