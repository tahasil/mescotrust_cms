export default function StatsBlock({ items = [], columns = 4, background = "#f8f9fa" }) {
  const list = Array.isArray(items) ? items : [];
  const cols = Math.min(Math.max(Number(columns) || 4, 1), 6);

  if (list.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "1.5rem",
        padding: "2rem",
        background,
        borderRadius: 8,
        margin: "1.5rem 0",
        textAlign: "center",
      }}
    >
      {list.map((stat, i) => (
        <div key={i}>
          <div
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              color: "var(--primary-color, #1890ff)",
              lineHeight: 1.2,
            }}
          >
            {stat.prefix || ""}{stat.value || "0"}{stat.suffix || ""}
          </div>
          {stat.label && (
            <div style={{ fontSize: "0.95rem", color: "#666", marginTop: "0.5rem" }}>
              {stat.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
