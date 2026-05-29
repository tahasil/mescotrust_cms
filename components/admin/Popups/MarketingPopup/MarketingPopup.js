"use client";

import { useEffect, useMemo, useState } from "react";

export default function MarketingPopup({
  imageUrl = "",
  title = "",
  description = "",
}) {
  const src = String(imageUrl || "").trim();
  const [hasError, setHasError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setHasError(false);
    setRefreshKey(Date.now());
  }, [src]);

  const previewSrc = useMemo(() => {
    if (!src) return "";
    const joiner = src.includes("?") ? "&" : "?";
    return `${src}${joiner}preview=${refreshKey}`;
  }, [src, refreshKey]);
  const titleText = String(title || "").trim();
  const descriptionText = String(description || "").trim();
  const showImage = Boolean(previewSrc) && !hasError;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: "20px 0",
      }}
    >
      <div
        style={{
          width: "min(760px, 100%)",
          borderRadius: 16,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 14px 40px rgba(17, 24, 39, 0.16)",
          border: "1px solid rgba(15, 23, 42, 0.08)",
        }}
      >
        {showImage ? (
          <div
            style={{
              width: "100%",
              padding: 12,
              background: "#f8fafc",
            }}
          >
            <div
              style={{
                width: "100%",
                maxHeight: 460,
                minHeight: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: 12,
                background: "#fff",
                border: "1px solid rgba(15, 23, 42, 0.06)",
              }}
            >
              <img
                src={previewSrc}
                alt={titleText || "Popup image"}
                onError={() => setHasError(true)}
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: "100%",
                  maxHeight: "min(72vh, 460px)",
                  display: "block",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              height: 220,
              display: "grid",
              placeItems: "center",
              color: "#64748b",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.04), rgba(15,23,42,0.08))",
            }}
          >
            {src ? "Unable to preview image" : "No popup image selected"}
          </div>
        )}
        {titleText || descriptionText ? (
          <div style={{ padding: 16 }}>
            {titleText ? (
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  lineHeight: 1.25,
                  color: "#0f172a",
                }}
              >
                {titleText}
              </h3>
            ) : null}
            {descriptionText ? (
              <p style={{ margin: "8px 0 0", color: "#475569", fontSize: 14 }}>
                {descriptionText}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
