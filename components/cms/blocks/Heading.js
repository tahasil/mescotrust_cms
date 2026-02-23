export default function HeadingBlock({ level = 2, text, style: headingStyle = "default", color, align }) {
  if (!text) return null;
  const Tag = level >= 1 && level <= 6 ? `h${level}` : "h2";

  const styleMap = {
    default: {},
    underline: { borderBottom: "2px solid currentColor", paddingBottom: "0.25em" },
    accent: { color: "var(--primary-color, #1890ff)" },
    uppercase: { textTransform: "uppercase", letterSpacing: "0.05em" },
    light: { fontWeight: 300 },
  };

  const inlineStyle = {
    marginBottom: "0.5em",
    ...(styleMap[headingStyle] || {}),
  };

  if (color) inlineStyle.color = color;
  if (align) inlineStyle.textAlign = align;

  return <Tag style={inlineStyle}>{text}</Tag>;
}
