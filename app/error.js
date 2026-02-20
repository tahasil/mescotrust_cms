"use client";

import { useEffect } from "react";
import { Button } from "antd";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{ maxWidth: 600, margin: "4rem auto", padding: "2rem", textAlign: "center" }}>
      <h2>Something went wrong</h2>
      <p style={{ marginBottom: "1.5rem", color: "#666" }}>An error occurred. Please try again.</p>
      <Button type="primary" onClick={() => reset()}>
        Try again
      </Button>
    </main>
  );
}
