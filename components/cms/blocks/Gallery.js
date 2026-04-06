import NextImage from "next/image";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBlMGUwIi8+PC9zdmc+";

export default function GalleryBlock({ images = [], columns = 3, gap = 8 }) {
  if (!images || images.length === 0) return null;
  const cols = Math.min(Math.max(Number(columns) || 3, 1), 6);
  const g = Number(gap) || 8;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: g,
        marginBottom: "1em",
      }}
    >
      {images.map((img, i) => {
        const src = typeof img === "string" ? img : img?.src;
        const alt = typeof img === "string" ? "" : img?.alt || "";
        if (!src) return null;
        return (
          <figure key={i} style={{ margin: 0 }}>
            <NextImage loading="lazy"
              src={src}
              alt={alt}
              width={400}
              height={300}
              sizes={`(max-width: 768px) 100vw, ${Math.round(100 / cols)}vw`}
              style={{ width: "100%", height: "auto", borderRadius: 4, objectFit: "cover" }}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          </figure>
        );
      })}
    </div>
  );
}
