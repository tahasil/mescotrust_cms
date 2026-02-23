import NextImage from "next/image";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBlMGUwIi8+PC9zdmc+";

export default function ImageBlock({ src, alt, width, height }) {
  if (!src) return null;

  const w = Number(width) || 800;
  const h = Number(height) || Math.round(w * 0.5625);

  return (
    <figure style={{ margin: "1em 0" }}>
      <NextImage
        src={src}
        alt={alt || ""}
        width={w}
        height={h}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
        style={{ maxWidth: "100%", height: "auto" }}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
      />
      {alt && (
        <figcaption style={{ marginTop: "0.5em", color: "#666", fontSize: "0.9em" }}>
          {alt}
        </figcaption>
      )}
    </figure>
  );
}
