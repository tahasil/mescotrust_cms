import { getImageDimensionsForValidation } from "@/lib/imageDimensionValidation";

export const VIDEO_PLAYING_REQUIRED_IMAGE_WIDTH = 2164;
export const VIDEO_PLAYING_REQUIRED_IMAGE_HEIGHT = 1200;
export const VIDEO_PLAYING_REQUIRED_IMAGE_TEXT =
  `${VIDEO_PLAYING_REQUIRED_IMAGE_WIDTH} \u00D7 ${VIDEO_PLAYING_REQUIRED_IMAGE_HEIGHT} pixels`;

function resolveCoverImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  return String(props.coverImageDesktop ?? props.coverImage ?? "").trim();
}

export function stripVideoPlayingMobileCoverImage(props) {
  if (!props || typeof props !== "object") return props;
  if (!("coverImageMobile" in props)) return props;
  const next = { ...props };
  delete next.coverImageMobile;
  return next;
}

export function sanitizeVideoPlayingLayout(layout) {
  if (!Array.isArray(layout)) return layout;
  return layout.map((block) => {
    if (
      block?.baseComponent !== "VideoPlaying" ||
      !block?.props ||
      typeof block.props !== "object"
    ) {
      return block;
    }
    return {
      ...block,
      props: stripVideoPlayingMobileCoverImage(block.props),
    };
  });
}

export async function validateVideoPlayingCoverImage(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const imageUrl = resolveCoverImageUrl(props);
  if (!imageUrl) return [];

  try {
    const { width, height } = await getImageDimensionsForValidation(imageUrl);
    if (
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      width === VIDEO_PLAYING_REQUIRED_IMAGE_WIDTH &&
      height === VIDEO_PLAYING_REQUIRED_IMAGE_HEIGHT
    ) {
      return [];
    }
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    return [
      `${prefix}Image size must be exactly ${VIDEO_PLAYING_REQUIRED_IMAGE_TEXT}. Selected: ${width} \u00D7 ${height} pixels.`,
    ];
  } catch {}

  const prefix = labelPrefix ? `${labelPrefix}: ` : "";
  return [`${prefix}Image size must be exactly ${VIDEO_PLAYING_REQUIRED_IMAGE_TEXT}.`];
}
