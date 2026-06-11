import Image from "next/image";
import {
  buildMediaUrl,
  ensureMediaVariantParams,
  isMediaRouteUrl,
  normalizeMediaFormatParam,
} from "@/lib/media/url";

const RESPONSIVE_SIZE_VARIANTS = [
  ["thumbnail", 240],
  ["medium", 640],
  ["mobile", 768],
  ["large", 1280],
  ["desktop", 1440],
];

function normalizeLoading({ priority, loading }) {
  if (priority) return "eager";
  const l = String(loading || "").toLowerCase();
  if (l === "eager" || l === "lazy") return l;
  return "lazy";
}

function normalizeFormat(format) {
  return normalizeMediaFormatParam(format || "auto") || "auto";
}

function buildResponsiveSrcSet(src, format) {
  if (!isMediaRouteUrl(src)) return "";
  const fmt = normalizeFormat(format);
  return RESPONSIVE_SIZE_VARIANTS.map(
    ([size, width]) => `${buildMediaUrl(src, { size, format: fmt })} ${width}w`,
  ).join(", ");
}

export default function MediaImage({
  src,
  mobileSrc = "",
  alt = "",
  className,
  imgClassName,
  style,
  imgStyle,
  width = 1200,
  height = 800,
  sizes = "100vw",
  priority = false,
  loading = "lazy",
  variant = "",
  mobileVariant = "",
  format = "auto",
}) {
  const resolvedSrc = buildMediaUrl(src, {
    size: variant || undefined,
    format: format || undefined,
  });
  const normalizedResolvedSrc = ensureMediaVariantParams(resolvedSrc, {
    defaultSize: "original",
    defaultFormat: normalizeFormat(format),
  });

  if (!normalizedResolvedSrc) return null;

  const resolvedMobileSrc = mobileSrc
    ? ensureMediaVariantParams(
        buildMediaUrl(mobileSrc, {
          size: mobileVariant || undefined,
          format: format || undefined,
        }),
        {
          defaultSize: mobileVariant || "original",
          defaultFormat: normalizeFormat(format),
        },
      )
    : mobileVariant
      ? ensureMediaVariantParams(
          buildMediaUrl(src, {
            size: mobileVariant,
            format: format || undefined,
          }),
          {
            defaultSize: mobileVariant,
            defaultFormat: normalizeFormat(format),
          },
        )
      : "";

  const effectiveLoading = normalizeLoading({ priority, loading });

  if (resolvedMobileSrc && resolvedMobileSrc !== normalizedResolvedSrc) {
    return (
      <picture className={className} style={style}>
        <source media="(max-width: 768px)" srcSet={resolvedMobileSrc} />
        <img
          src={normalizedResolvedSrc}
          alt={alt}
          className={imgClassName}
          loading={effectiveLoading}
          decoding="async"
          style={imgStyle}
        />
      </picture>
    );
  }

  const normalizedFormat = normalizeFormat(format);
  const canRenderResponsivePicture =
    isMediaRouteUrl(normalizedResolvedSrc) && !resolvedMobileSrc;

  if (canRenderResponsivePicture) {
    const jpgFallbackSrc = buildMediaUrl(normalizedResolvedSrc, {
      size: variant || undefined,
      format: "jpg",
    });
    const normalizedJpgFallbackSrc = ensureMediaVariantParams(jpgFallbackSrc, {
      defaultSize: variant || "original",
      defaultFormat: "jpg",
    });
    const jpgSrcSet = buildResponsiveSrcSet(normalizedResolvedSrc, "jpg");

    if (normalizedFormat === "auto") {
      const avifSrcSet = buildResponsiveSrcSet(normalizedResolvedSrc, "avif");
      const webpSrcSet = buildResponsiveSrcSet(normalizedResolvedSrc, "webp");
      return (
        <picture className={className} style={style}>
          <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
          <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
          <img
            src={normalizedJpgFallbackSrc || normalizedResolvedSrc}
            srcSet={jpgSrcSet}
            sizes={sizes}
            alt={alt}
            className={imgClassName}
            loading={effectiveLoading}
            decoding="async"
            style={imgStyle}
          />
        </picture>
      );
    }

    const explicitSrc = ensureMediaVariantParams(
      buildMediaUrl(normalizedResolvedSrc, {
        size: variant || undefined,
        format: normalizedFormat,
      }),
      {
        defaultSize: variant || "original",
        defaultFormat: normalizedFormat,
      },
    );
    const explicitSrcSet = buildResponsiveSrcSet(normalizedResolvedSrc, normalizedFormat);
    return (
      <img
        src={explicitSrc || normalizedResolvedSrc}
        srcSet={explicitSrcSet || undefined}
        sizes={sizes}
        alt={alt}
        className={imgClassName || className}
        loading={effectiveLoading}
        decoding="async"
        style={imgStyle || style}
      />
    );
  }

  return (
    <Image
      src={normalizedResolvedSrc}
      alt={alt}
      className={imgClassName || className}
      style={imgStyle || style}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : effectiveLoading}
      unoptimized={isMediaRouteUrl(normalizedResolvedSrc)}
    />
  );
}
