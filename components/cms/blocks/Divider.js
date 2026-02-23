export default function DividerBlock({
  style: dividerStyle = "solid",
  color = "#e8e8e8",
  thickness = 1,
  width = "100%",
  spacing = 24,
  text,
}) {
  const sp = Number(spacing) || 24;
  const t = Number(thickness) || 1;

  if (text) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          margin: `${sp}px 0`,
        }}
      >
        <div style={{ flex: 1, height: t, background: color, borderStyle: dividerStyle === "dashed" ? "dashed" : dividerStyle === "dotted" ? "dotted" : "solid" }} />
        <span style={{ color: "#888", fontSize: "0.9rem", whiteSpace: "nowrap" }}>{text}</span>
        <div style={{ flex: 1, height: t, background: color, borderStyle: dividerStyle === "dashed" ? "dashed" : dividerStyle === "dotted" ? "dotted" : "solid" }} />
      </div>
    );
  }

  return (
    <hr
      style={{
        border: "none",
        borderTop: `${t}px ${dividerStyle === "dashed" ? "dashed" : dividerStyle === "dotted" ? "dotted" : "solid"} ${color}`,
        margin: `${sp}px auto`,
        width,
      }}
    />
  );
}
