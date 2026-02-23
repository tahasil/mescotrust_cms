export default function TimelineBlock({ items = [], variant = "left" }) {
  const list = Array.isArray(items) ? items : [];

  if (list.length === 0) return null;

  const isAlternating = variant === "alternating";

  return (
    <div style={{ margin: "1.5rem 0", position: "relative", paddingLeft: isAlternating ? 0 : "2rem" }}>
      {!isAlternating && (
        <div
          style={{
            position: "absolute",
            left: 7,
            top: 8,
            bottom: 8,
            width: 2,
            background: "#e8e8e8",
          }}
        />
      )}
      {list.map((item, idx) => (
        <div
          key={idx}
          style={{
            position: "relative",
            marginBottom: idx < list.length - 1 ? "1.5rem" : 0,
            textAlign: isAlternating && idx % 2 !== 0 ? "right" : "left",
          }}
        >
          {!isAlternating && (
            <div
              style={{
                position: "absolute",
                left: "-2rem",
                top: 4,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "var(--primary-color, #1890ff)",
                border: "3px solid #fff",
                boxShadow: "0 0 0 2px var(--primary-color, #1890ff)",
              }}
            />
          )}
          {item.date && (
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--primary-color, #1890ff)",
                fontWeight: 600,
                marginBottom: "0.25rem",
              }}
            >
              {item.date}
            </div>
          )}
          {item.title && (
            <h4 style={{ margin: "0 0 0.25rem", fontSize: "1rem" }}>{item.title}</h4>
          )}
          {item.description && (
            <p style={{ margin: 0, color: "#666", fontSize: "0.9rem", lineHeight: 1.6 }}>
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
