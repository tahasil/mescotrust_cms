import SafeHtml from "@/components/cms/SafeHtml";

/** Renders full HTML event body (sanitized). */
export default function EventContent({ html, className = "", style }) {
  if (!html?.trim()) return null;
  return (
    <div
      className={className}
      style={{
        fontSize: 16,
        lineHeight: 1.8,
        color: "#262A2C",
        overflowWrap: "break-word",
        wordBreak: "break-word",
        maxWidth: "100%",
        ...style,
      }}
    >
      <SafeHtml html={html} />
    </div>
  );
}
