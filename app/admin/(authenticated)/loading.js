export default function AdminLoading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        background: "transparent",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "3px solid rgba(0,0,0,0.12)",
          borderTopColor: "var(--admin-loader-color, #1677ff)",
          animation: "adminLoadingSpin 0.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes adminLoadingSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
