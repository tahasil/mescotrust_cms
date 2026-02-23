export default function FileDownloadBlock({ url, label, description }) {
  if (!url) return null;
  const fileName = label || url.split("/").pop() || "Download";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75em",
        padding: "0.75em 1em",
        border: "1px solid #e0e0e0",
        borderRadius: 6,
        marginBottom: "1em",
        background: "#fafafa",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "#666" }}>
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <a
          href={url}
          download
          style={{ color: "var(--primary-color, #1890ff)", fontWeight: 500, textDecoration: "none" }}
        >
          {fileName}
        </a>
        {description && <div style={{ fontSize: "0.85em", color: "#888", marginTop: 2 }}>{description}</div>}
      </div>
    </div>
  );
}
