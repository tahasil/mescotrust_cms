export default function AdminLoading() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ height: 28, width: "30%", background: "#f0f0f0", marginBottom: 24, borderRadius: 4 }} />
      <div style={{ height: 40, width: "100%", background: "#f5f5f5", marginBottom: 16, borderRadius: 6 }} />
      <div
        style={{
          background: "#fafafa",
          borderRadius: 8,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ height: 20, width: `${90 - i * 8}%`, background: "#f0f0f0", borderRadius: 4 }} />
        ))}
      </div>
    </div>
  );
}
