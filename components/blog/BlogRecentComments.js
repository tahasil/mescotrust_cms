"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function BlogRecentComments() {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    fetch("/api/public/blog-comments?recent=5")
      .then((r) => (r.ok ? r.json() : { recent: [] }))
      .then((data) => setComments(Array.isArray(data.recent) ? data.recent : []))
      .catch(() => {});
  }, []);

  if (comments.length === 0) {
    return <div style={{ fontSize: 14, color: "rgba(0,0,0,0.35)" }}>No comments yet.</div>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {comments.map((c) => (
        <li key={c._id} style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600 }}>{c.name}</span>
          <span style={{ color: "rgba(0,0,0,0.4)" }}> on </span>
          <Link href={`/blogs/${c.blogSlug}#comments`} style={{ color: "var(--primary-color, #8b1a1a)", textDecoration: "none" }}>
            {c.blogTitle}
          </Link>
        </li>
      ))}
    </ul>
  );
}
