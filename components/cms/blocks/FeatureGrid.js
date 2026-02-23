const ICON_MAP = {
  star: "★", heart: "♥", check: "✓", gear: "⚙", lightning: "⚡",
  shield: "🛡", globe: "🌐", clock: "⏰", user: "👤", mail: "✉",
  rocket: "🚀", chart: "📊", book: "📖", code: "💻", palette: "🎨",
  target: "🎯", trophy: "🏆",
};

export default function FeatureGridBlock({ features = [], columns = 3, variant = "default" }) {
  const list = Array.isArray(features) ? features : [];
  const cols = Math.min(Math.max(Number(columns) || 3, 1), 4);

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
      {list.map((f, i) => {
        const emoji = ICON_MAP[f.icon] || f.icon || "★";
        return (
          <div
            key={i}
            style={{
              padding: "1.5rem",
              borderRadius: 8,
              background: variant === "cards" ? "#fff" : "#f8f9fa",
              border: variant === "cards" ? "1px solid #e8e8e8" : "none",
              boxShadow: variant === "cards" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{emoji}</div>
            {f.title && <h4 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>{f.title}</h4>}
            {f.description && (
              <p style={{ margin: 0, color: "#666", fontSize: "0.9rem", lineHeight: 1.6 }}>
                {f.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
