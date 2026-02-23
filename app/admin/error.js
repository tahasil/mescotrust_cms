"use client";

import { useEffect } from "react";

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "4rem auto",
        padding: "2rem",
        textAlign: "center",
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <h2 style={{ color: "#ff4d4f", marginBottom: 8 }}>Admin Error</h2>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Something went wrong while loading this page.
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: "8px 24px",
          backgroundColor: "#1890ff",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
