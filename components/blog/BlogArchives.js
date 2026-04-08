"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function BlogArchives() {
  const [archives, setArchives] = useState([]);

  useEffect(() => {
    fetch("/api/public/blogs?limit=100")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        const items = data.items || [];
        const monthMap = {};
        items.forEach((post) => {
          if (!post.publishedAt) return;
          const d = new Date(post.publishedAt);
          const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
          const label = `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
          if (!monthMap[key]) monthMap[key] = { key, label, count: 0 };
          monthMap[key].count++;
        });
        setArchives(Object.values(monthMap).sort((a, b) => b.key.localeCompare(a.key)));
      })
      .catch(() => {});
  }, []);

  if (archives.length === 0) {
    return <div style={{ fontSize: 14, color: "rgba(0,0,0,0.35)" }}>No archives.</div>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {archives.map((a) => (
        <li key={a.key} style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: "rgba(0,0,0,0.65)" }}>
            ▪ {a.label} ({a.count})
          </span>
        </li>
      ))}
    </ul>
  );
}
