import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "linear-gradient(135deg, #f8f9fc 0%, #eef1f8 50%, #e8edf5 100%)",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          position: "relative",
          textAlign: "center",
          maxWidth: 520,
          width: "100%",
        }}
      >
        {/* 404 watermark — absolutely positioned behind content */}
        <div
          style={{
            position: "relative",
            lineHeight: 1,
            marginBottom: "0px",
          }}
        >
          <span
            style={{
              fontSize: "min(200px, 40vw)",
              fontWeight: 800,
              color: "var(--primary-color, #8b1a1a)",
              opacity: 0.12,
              letterSpacing: "-4px",
              display: "block",
              userSelect: "none",
            }}
          >
            404
          </span>
        </div>

        <h2
          style={{
            position: "relative",
            fontSize: "min(32px, 6vw)",
            fontWeight: 700,
            color: "var(--heading-color, #1a1a2e)",
            margin: "0 0 12px 0",
          }}
        >
          Page Not Found.
        </h2>

        <p
          style={{
            position: "relative",
            fontSize: "min(16px, 3.5vw)",
            color: "rgba(0, 0, 0, 0.45)",
            lineHeight: 1.6,
            margin: "0 0 32px 0",
            fontStyle: "italic",
          }}
        >
          Sorry, we can&apos;t find the page you&apos;re looking for.
        </p>

        <Link
          href="/"
          style={{
            position: "relative",
            display: "inline-block",
            padding: "14px 48px",
            background: "var(--primary-color, #8b1a1a)",
            color: "#fff",
            borderRadius: "8px",
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
