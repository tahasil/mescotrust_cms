"use client";

import { useState, useEffect } from "react";

export default function ModalBlock({
  triggerLabel = "Open",
  triggerVariant = "solid",
  title,
  content,
  size = "medium",
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const widthMap = { small: 400, medium: 560, large: 720 };
  const maxWidth = widthMap[size] || widthMap.medium;

  const btnStyle = {
    display: "inline-block",
    padding: "0.6em 1.5em",
    borderRadius: 6,
    fontWeight: 500,
    cursor: "pointer",
    fontSize: "1rem",
    border: triggerVariant === "outline" ? "2px solid var(--primary-color, #1890ff)" : "none",
    background: triggerVariant === "outline" ? "transparent" : "var(--primary-color, #1890ff)",
    color: triggerVariant === "outline" ? "var(--primary-color, #1890ff)" : "#fff",
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={btnStyle}>
        {triggerLabel}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 12,
              maxWidth,
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{title || "Dialog"}</h3>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  padding: "0.25rem",
                  color: "#999",
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "1.25rem", color: "#444", lineHeight: 1.7 }}>
              {content || ""}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
