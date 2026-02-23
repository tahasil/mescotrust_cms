"use client";

import { useState } from "react";

export default function AccordionBlock({ items = [], allowMultiple = false }) {
  const list = Array.isArray(items) ? items : [];
  const [openIndexes, setOpenIndexes] = useState([]);

  if (list.length === 0) return null;

  const toggle = (idx) => {
    setOpenIndexes((prev) => {
      if (prev.includes(idx)) return prev.filter((i) => i !== idx);
      return allowMultiple ? [...prev, idx] : [idx];
    });
  };

  return (
    <div style={{ margin: "1.5rem 0", borderRadius: 8, border: "1px solid #e8e8e8", overflow: "hidden" }}>
      {list.map((item, idx) => {
        const isOpen = openIndexes.includes(idx);
        return (
          <div key={idx} style={{ borderBottom: idx < list.length - 1 ? "1px solid #e8e8e8" : "none" }}>
            <button
              onClick={() => toggle(idx)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 1.25rem",
                background: isOpen ? "#fafafa" : "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 500,
                textAlign: "left",
                color: "#333",
              }}
            >
              <span>{item.title || `Item ${idx + 1}`}</span>
              <span style={{
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                fontSize: "0.8rem",
              }}>
                ▼
              </span>
            </button>
            <div
              style={{
                maxHeight: isOpen ? 500 : 0,
                overflow: "hidden",
                transition: "max-height 0.3s ease",
              }}
            >
              <div style={{ padding: "0 1.25rem 1rem", color: "#555", lineHeight: 1.7 }}>
                {item.content || ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
