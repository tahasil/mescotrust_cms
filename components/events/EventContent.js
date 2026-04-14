import SafeHtml from "@/components/cms/SafeHtml";

/** Renders full HTML event body (sanitized). */
export default function EventContent({ html }) {
  if (!html?.trim()) return null;
  return (
    <div
      style={{
        fontSize: 16,
        lineHeight: 1.8,
        color: "rgba(0,0,0,0.75)",
        overflowWrap: "break-word",
        wordBreak: "break-word",
        maxWidth: "100%",
      }}
    >
      <SafeHtml html={html} />
    </div>
  );
}
