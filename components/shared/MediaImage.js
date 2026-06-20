import Image from "next/image";
import {
  buildMediaUrl,
  extractMediaFormatParam,
  ensureMediaVariantParams,
  isMediaRouteUrl,
  normalizeMediaFormatParam,
} from "@/lib/media/url";

function normalizeLoading({ priority, loading }) {
  if (priority) return "eager";
  const l = String(loading || "").toLowerCase();
  if (l === "eager" || l === "lazy") return l;
  return "lazy";
}

function normalizeFormat(format) {
  return normalizeMediaFormatParam(format || "");
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
  format = "",
}) {
  const normalizedFormat = normalizeFormat(format);
  const sourceFormat = normalizedFormat || extractMediaFormatParam(src) || "auto";
  const mobileSourceFormat =
    normalizedFormat || extractMediaFormatParam(mobileSrc) || sourceFormat;

  const resolvedSrc = buildMediaUrl(src, {
    size: "original",
    ...(normalizedFormat ? { format: normalizedFormat } : {}),
  });
  const normalizedResolvedSrc = ensureMediaVariantParams(resolvedSrc, {
    defaultSize: "original",
    defaultFormat: sourceFormat,
  });

  if (!normalizedResolvedSrc) return null;

  const resolvedMobileSrc = mobileSrc
    ? ensureMediaVariantParams(
        buildMediaUrl(mobileSrc, {
          size: "original",
          ...(normalizedFormat ? { format: normalizedFormat } : {}),
        }),
        {
          defaultSize: "original",
          defaultFormat: mobileSourceFormat,
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
