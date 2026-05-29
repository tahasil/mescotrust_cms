export default function ContentLoaderFallback({ minHeight = 220 }) {
  return (
    <div
      style={{
        minHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label="Loading"
    >
      <span className="app-global-loader-spinner" />
    </div>
  );
}

