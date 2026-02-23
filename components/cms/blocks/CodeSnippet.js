export default function CodeSnippetBlock({ code = "", language = "" }) {
  if (!code) return null;
  return (
    <pre
      style={{
        background: "#1e1e1e",
        color: "#d4d4d4",
        padding: "1em",
        borderRadius: 6,
        overflowX: "auto",
        fontSize: "0.9em",
        lineHeight: 1.5,
        marginBottom: "1em",
      }}
    >
      {language && (
        <div style={{ color: "#888", fontSize: "0.8em", marginBottom: "0.5em" }}>
          {language}
        </div>
      )}
      <code>{code}</code>
    </pre>
  );
}
