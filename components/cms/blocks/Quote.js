export default function QuoteBlock({ text, citation }) {
  if (!text) return null;
  return (
    <blockquote
      style={{
        margin: "1.5em 0",
        paddingInlineStart: "1.25em",
        borderInlineStart: "4px solid var(--primary-color, #1890ff)",
        fontStyle: "italic",
        color: "#555",
      }}
    >
      <p style={{ margin: 0 }}>{text}</p>
      {citation && (
        <footer style={{ marginTop: "0.5em", fontSize: "0.9em", color: "#888" }}>
          — {citation}
        </footer>
      )}
    </blockquote>
  );
}
