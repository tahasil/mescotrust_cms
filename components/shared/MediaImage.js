import Image from "next/image";
import { buildMediaUrl, isMediaRouteUrl } from "@/lib/media/url";

function normalizeLoading({ priority, loading }) {
  if (priority) return "eager";
  const l = String(loading || "").toLowerCase();
  if (l === "eager" || l === "lazy") return l;
  return "lazy";
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

  if (!resolvedSrc) return null;

  const resolvedMobileSrc = mobileSrc
    ? buildMediaUrl(mobileSrc, {
        size: mobileVariant || undefined,
        format: format || undefined,
      })
    : mobileVariant
      ? buildMediaUrl(src, {
          size: mobileVariant,
          format: format || undefined,
        })
      : "";

  const effectiveLoading = normalizeLoading({ priority, loading });

  if (resolvedMobileSrc && resolvedMobileSrc !== resolvedSrc) {
    return (
      <picture className={className} style={style}>
        <source media="(max-width: 768px)" srcSet={resolvedMobileSrc} />
        <img
          src={resolvedSrc}
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
      src={resolvedSrc}
      alt={alt}
      className={imgClassName || className}
      style={imgStyle || style}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : effectiveLoading}
      unoptimized={isMediaRouteUrl(resolvedSrc)}
    />
  );
}
