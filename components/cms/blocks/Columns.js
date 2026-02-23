export default function Columns({ columns = 2, gap = 24, content = [] }) {
  const count = Math.min(Math.max(Number(columns) || 2, 1), 4);
  const items = Array.isArray(content) ? content : [];

  return (
    <div
      className="cms-columns"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${count}, 1fr)`,
        gap: Number(gap) || 24,
        margin: "1rem 0",
      }}
    >
      {items.length > 0
        ? items.map((col, i) => (
            <div key={i} style={{ minWidth: 0 }}>
              {col.text || col.content || ""}
            </div>
          ))
        : Array.from({ length: count }).map((_, i) => (
            <div key={i} style={{ minWidth: 0, padding: "1rem", background: "#fafafa", borderRadius: 4, minHeight: 60 }}>
              Column {i + 1}
            </div>
          ))}
    </div>
  );
}
