import Link from "next/link";

function isExternal(url) {
  return /^https?:\/\//.test(url) || url.startsWith("//");
}

const btnStyle = (variant) => ({
  display: "inline-block",
  padding: "0.625rem 1.5rem",
  borderRadius: 4,
  background: variant === "outline" ? "transparent" : "var(--primary-color, #1890ff)",
  color: variant === "outline" ? "var(--primary-color, #1890ff)" : "#fff",
  border: variant === "outline" ? "2px solid var(--primary-color, #1890ff)" : "none",
  textDecoration: "none",
  fontWeight: 500,
  cursor: "pointer",
});

export default function Buttons({ buttons = [] }) {
  const items = Array.isArray(buttons) ? buttons : [];
  if (items.length === 0) {
    return (
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", margin: "1rem 0" }}>
        <span style={{ color: "#999" }}>No buttons configured</span>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", margin: "1rem 0" }}>
      {items.map((btn, i) => {
        const url = btn.url || "#";
        const style = btnStyle(btn.variant);

        if (btn.openInNewTab || isExternal(url)) {
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={style}
            >
              {btn.label || "Button"}
            </a>
          );
        }

        return (
          <Link key={i} href={url} style={style}>
            {btn.label || "Button"}
          </Link>
        );
      })}
    </div>
  );
}
