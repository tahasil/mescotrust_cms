"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BlogSidebar from "./BlogSidebar";
import BlogRecentComments from "./BlogRecentComments";
import BlogArchives from "./BlogArchives";

const cardStyle = {
  border: "1px solid rgba(0, 0, 0, 0.08)",
  borderRadius: 12,
  padding: 20,
  marginBottom: 24,
  background: "#fff",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
};

const titleStyle = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 16,
  paddingLeft: 12,
  borderLeft: "3px solid var(--primary-color, #8b1a1a)",
};

const contentStyle = {
  paddingLeft: 15,
};

/**
 * Full blog sidebar — Search + Categories + Recent Posts + Recent Comments + Archives.
 * Fully client-rendered to avoid hydration mismatches.
 * @param {string} searchQuery - current search query
 * @param {string} categorySlug - active category slug
 * @param {Array} categories - category objects (passed from server or fetched)
 * @param {string} currentSlug - current blog post slug (for detail page, excludes from recent)
 */
export default function BlogSidebarFull({
  searchQuery,
  categorySlug,
  categories: categoriesProp,
  currentSlug,
  commentsEnabled: commentsEnabledProp,
}) {
  const [categories, setCategories] = useState(
    Array.isArray(categoriesProp) ? categoriesProp : [],
  );
  const [commentsEnabled, setCommentsEnabled] = useState(
    typeof commentsEnabledProp === "boolean" ? commentsEnabledProp : true,
  );

  // If categories not passed (detail page), fetch them
  useEffect(() => {
    if (Array.isArray(categoriesProp) && categoriesProp.length > 0) {
      setCategories(categoriesProp);
      return;
    }
    fetch("/api/public/blog-categories")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [categoriesProp]);

  // Read global comments-enabled flag from theme
  useEffect(() => {
    if (typeof commentsEnabledProp === "boolean") {
      setCommentsEnabled(commentsEnabledProp);
      return;
    }
    fetch("/api/theme")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (typeof data.blogCommentsEnabled === "boolean") {
          setCommentsEnabled(data.blogCommentsEnabled);
        }
      })
      .catch(() => {});
  }, [commentsEnabledProp]);

  return (
    <div>
      {/* Search */}
      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
          Search
        </div>
        <form action="/blog" method="GET" style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            name="q"
            defaultValue={searchQuery || ""}
            placeholder="Search..."
            style={{
              flex: 1,
              padding: "9px 14px",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 6,
              fontSize: 14,
              outline: "none",
            }}
          />
          {categorySlug && (
            <input type="hidden" name="category" value={categorySlug} />
          )}
          <button
            type="submit"
            style={{
              padding: "9px 18px",
              border: "none",
              borderRadius: 6,
              background: "var(--primary-color, #8b1a1a)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>
        {searchQuery && (
          <Link
            href="/blog"
            style={{
              fontSize: 12,
              color: "rgba(0,0,0,0.4)",
              marginTop: 8,
              display: "inline-block",
            }}
          >
            Clear search
          </Link>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div style={cardStyle}>
          <div style={titleStyle}>Categories</div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              ...contentStyle,
            }}
          >
            <li style={{ marginBottom: 10 }}>
              <Link
                href="/blog"
                style={{
                  fontSize: 14,
                  color: !categorySlug
                    ? "var(--primary-color, #8b1a1a)"
                    : "rgba(0,0,0,0.65)",
                  textDecoration: "none",
                  fontWeight: !categorySlug ? 600 : 400,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: !categorySlug
                      ? "var(--primary-color, #8b1a1a)"
                      : "rgba(0,0,0,0.2)",
                    flexShrink: 0,
                  }}
                />
                All
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat._id || cat.slug} style={{ marginBottom: 10 }}>
                <Link
                  href={`/blog?category=${cat.slug}`}
                  style={{
                    fontSize: 14,
                    color:
                      categorySlug === cat.slug
                        ? "var(--primary-color, #8b1a1a)"
                        : "rgba(0,0,0,0.65)",
                    textDecoration: "none",
                    fontWeight: categorySlug === cat.slug ? 600 : 400,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background:
                        categorySlug === cat.slug
                          ? "var(--primary-color, #8b1a1a)"
                          : "rgba(0,0,0,0.2)",
                      flexShrink: 0,
                    }}
                  />
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Posts */}
      <div style={cardStyle}>
        <BlogSidebar currentSlug={currentSlug} />
      </div>

      {/* Recent Comments — hidden when global comments are disabled */}
      {commentsEnabled && (
        <div style={cardStyle}>
          <div style={titleStyle}>Recent Comments</div>
          <div style={contentStyle}>
            <BlogRecentComments />
          </div>
        </div>
      )}

      {/* Archives */}
      <div style={{ ...cardStyle, marginBottom: 0 }}>
        <div style={titleStyle}>Archives</div>
        <div style={contentStyle}>
          <BlogArchives />
        </div>
      </div>
    </div>
  );
}
