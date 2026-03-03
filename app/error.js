"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Something went wrong</h2>
      <p style={{ marginBottom: "1.5rem", color: "#666" }}>An unexpected error occurred. Please try again.</p>
      <button
        onClick={() => reset()}
        style={{
          padding: "8px 24px",
          backgroundColor: "var(--primary-color, #1890ff)",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </main>
  );
}
