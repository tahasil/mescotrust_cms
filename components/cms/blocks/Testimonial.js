import NextImage from "next/image";

export default function TestimonialBlock({ items = [], columns = 1 }) {
  const list = Array.isArray(items) ? items : [];
  const cols = Math.min(Math.max(Number(columns) || 1, 1), 3);

  if (list.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "1.5rem",
        margin: "1.5rem 0",
      }}
    >
      {list.map((t, i) => (
        <figure
          key={i}
          style={{
            margin: 0,
            padding: "1.5rem",
            background: "#f8f9fa",
            borderRadius: 8,
            borderLeft: "4px solid var(--primary-color, #1890ff)",
          }}
        >
          <blockquote style={{ margin: "0 0 1rem", fontSize: "1.05rem", color: "#444", lineHeight: 1.7, fontStyle: "italic" }}>
            &ldquo;{t.quote || ""}&rdquo;
          </blockquote>
          <figcaption style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {t.avatar && (
              <NextImage loading="lazy"
                src={t.avatar}
                alt={t.name || ""}
                width={48}
                height={48}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            )}
            <div>
              {t.name && <div style={{ fontWeight: 600, color: "#333" }}>{t.name}</div>}
              {t.role && <div style={{ fontSize: "0.85rem", color: "#888" }}>{t.role}</div>}
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
