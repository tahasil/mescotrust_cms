export default function AdminLoading() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 80px)",
        width: "100%",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 44,
            height: 44,
            margin: "0 auto 16px",
            border: "3px solid #f0f0f0",
            borderTop: "3px solid var(--admin-loader-color, #1677ff)",
            borderRadius: "50%",
            animation: "adminLoadSpin 0.8s linear infinite",
          }}
        />
        <div
          style={{
            fontSize: 14,
            color: "rgba(0, 0, 0, 0.45)",
            fontWeight: 400,
          }}
        >
          Loading...
        </div>
        <style>{`
          @keyframes adminLoadSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
