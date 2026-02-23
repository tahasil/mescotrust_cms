import Link from "next/link";

export default function PricingBlock({ plans = [], columns = 3 }) {
  const list = Array.isArray(plans) ? plans : [];
  const cols = Math.min(Math.max(Number(columns) || 3, 1), 4);

  if (list.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "1.5rem",
        margin: "1.5rem 0",
        alignItems: "start",
      }}
    >
      {list.map((plan, i) => {
        const isHighlighted = plan.highlighted;
        return (
          <div
            key={i}
            style={{
              borderRadius: 12,
              border: isHighlighted ? "2px solid var(--primary-color, #1890ff)" : "1px solid #e8e8e8",
              background: "#fff",
              padding: "2rem 1.5rem",
              textAlign: "center",
              position: "relative",
              boxShadow: isHighlighted ? "0 4px 20px rgba(0,0,0,0.1)" : "none",
              transform: isHighlighted ? "scale(1.03)" : "none",
            }}
          >
            {plan.badge && (
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--primary-color, #1890ff)",
                  color: "#fff",
                  padding: "0.2em 1em",
                  borderRadius: 20,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                {plan.badge}
              </div>
            )}
            {plan.name && <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem" }}>{plan.name}</h3>}
            {plan.price && (
              <div style={{ fontSize: "2.25rem", fontWeight: 700, color: "var(--primary-color, #1890ff)", margin: "0.5rem 0" }}>
                {plan.price}
                {plan.period && <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "#888" }}>/{plan.period}</span>}
              </div>
            )}
            {plan.description && <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>{plan.description}</p>}
            {Array.isArray(plan.features) && plan.features.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0", textAlign: "left" }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ padding: "0.4em 0", color: "#555", fontSize: "0.9rem", borderBottom: "1px solid #f0f0f0" }}>
                    <span style={{ color: "var(--primary-color, #1890ff)", marginRight: "0.5rem" }}>&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
            )}
            {plan.buttonLabel && (
              <Link
                href={plan.buttonUrl || "#"}
                style={{
                  display: "inline-block",
                  padding: "0.6em 1.5em",
                  borderRadius: 6,
                  fontWeight: 500,
                  textDecoration: "none",
                  marginTop: "0.5rem",
                  background: isHighlighted ? "var(--primary-color, #1890ff)" : "transparent",
                  color: isHighlighted ? "#fff" : "var(--primary-color, #1890ff)",
                  border: isHighlighted ? "none" : "2px solid var(--primary-color, #1890ff)",
                }}
              >
                {plan.buttonLabel}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
