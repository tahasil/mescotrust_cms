const PLATFORM_ICONS = {
  facebook: "f",
  twitter: "𝕏",
  instagram: "📷",
  linkedin: "in",
  youtube: "▶",
  github: "⌨",
  tiktok: "♪",
  pinterest: "P",
  whatsapp: "💬",
  telegram: "✈",
};

export default function SocialLinksBlock({
  links = [],
  size = 40,
  variant = "filled",
  align = "center",
}) {
  const list = Array.isArray(links) ? links : [];

  if (list.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
        flexWrap: "wrap",
        margin: "1rem 0",
      }}
    >
      {list.map((link, i) => {
        const icon = PLATFORM_ICONS[link.platform?.toLowerCase()] || link.platform?.charAt(0)?.toUpperCase() || "?";
        const s = Number(size) || 40;

        return (
          <a
            key={i}
            href={link.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title={link.platform || "Social link"}
            style={{
              width: s,
              height: s,
              borderRadius: variant === "rounded" ? "50%" : 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              fontSize: s * 0.4,
              fontWeight: 700,
              background: variant === "outline" ? "transparent" : (link.color || "var(--primary-color, #1890ff)"),
              color: variant === "outline" ? (link.color || "var(--primary-color, #1890ff)") : "#fff",
              border: variant === "outline" ? `2px solid ${link.color || "var(--primary-color, #1890ff)"}` : "none",
              transition: "opacity 0.2s",
            }}
          >
            {icon}
          </a>
        );
      })}
    </div>
  );
}
