"use client";

import { useState } from "react";

export default function TabsBlock({ tabs = [], defaultTab = 0 }) {
  const list = Array.isArray(tabs) ? tabs : [];
  const [active, setActive] = useState(Number(defaultTab) || 0);

  if (list.length === 0) return null;

  return (
    <div style={{ margin: "1.5rem 0" }}>
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e8e8e8",
          gap: 0,
          overflowX: "auto",
        }}
      >
        {list.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            style={{
              padding: "0.75rem 1.25rem",
              border: "none",
              borderBottom: active === idx ? "2px solid var(--primary-color, #1890ff)" : "2px solid transparent",
              marginBottom: -2,
              background: "transparent",
              cursor: "pointer",
              fontWeight: active === idx ? 600 : 400,
              color: active === idx ? "var(--primary-color, #1890ff)" : "#666",
              fontSize: "0.95rem",
              whiteSpace: "nowrap",
              transition: "color 0.2s, border-color 0.2s",
            }}
          >
            {tab.label || `Tab ${idx + 1}`}
          </button>
        ))}
      </div>
      <div style={{ padding: "1.25rem 0.5rem", color: "#444", lineHeight: 1.7 }}>
        {list[active]?.content || ""}
      </div>
    </div>
  );
}
