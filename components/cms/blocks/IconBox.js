const ICON_MAP = {
  star: "★",
  heart: "♥",
  check: "✓",
  gear: "⚙",
  lightning: "⚡",
  shield: "🛡",
  globe: "🌐",
  clock: "⏰",
  user: "👤",
  mail: "✉",
  phone: "📞",
  lock: "🔒",
  rocket: "🚀",
  chart: "📊",
  book: "📖",
  camera: "📷",
  code: "💻",
  palette: "🎨",
  target: "🎯",
  trophy: "🏆",
};

export default function IconBoxBlock({
  icon = "star",
  title,
  description,
  align = "center",
  iconSize = 40,
  variant = "default",
}) {
  const emoji = ICON_MAP[icon] || icon;

  return (
    <div
      style={{
        textAlign: align,
        padding: "1.5rem",
        borderRadius: 8,
        background: variant === "bordered" ? "#fff" : variant === "filled" ? "#f8f9fa" : "transparent",
        border: variant === "bordered" ? "1px solid #e8e8e8" : "none",
        margin: "0.5rem 0",
      }}
    >
      <div
        style={{
          fontSize: Number(iconSize) || 40,
          lineHeight: 1,
          marginBottom: "0.75rem",
        }}
      >
        {emoji}
      </div>
      {title && <h4 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>{title}</h4>}
      {description && (
        <p style={{ margin: 0, color: "#666", fontSize: "0.9rem", lineHeight: 1.6 }}>
          {description}
        </p>
      )}
    </div>
  );
}
