const TYPE_STYLES = {
  info: { background: "#e6f7ff", border: "#91d5ff", color: "#096dd9", icon: "ℹ" },
  success: { background: "#f6ffed", border: "#b7eb8f", color: "#389e0d", icon: "✓" },
  warning: { background: "#fffbe6", border: "#ffe58f", color: "#d48806", icon: "⚠" },
  error: { background: "#fff2f0", border: "#ffccc7", color: "#cf1322", icon: "✕" },
};

export default function AlertBlock({ type = "info", title, message, closable = false }) {
  const s = TYPE_STYLES[type] || TYPE_STYLES.info;

  return (
    <div
      role="alert"
      style={{
        padding: "1rem 1.25rem",
        background: s.background,
        border: `1px solid ${s.border}`,
        borderRadius: 6,
        margin: "1rem 0",
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: "1.1rem", color: s.color, flexShrink: 0, marginTop: 1 }}>
        {s.icon}
      </span>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, color: s.color, marginBottom: message ? "0.25rem" : 0 }}>{title}</div>}
        {message && <div style={{ color: "#555", fontSize: "0.9rem", lineHeight: 1.6 }}>{message}</div>}
      </div>
    </div>
  );
}
