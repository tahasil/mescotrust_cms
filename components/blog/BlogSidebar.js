"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";

const SidebarWrap = styled.aside`
  @media (max-width: 992px) {
    margin-top: 40px;
  }
`;

const SidebarSection = styled.div`
  .sidebar-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 20px;
    padding-left: 12px;
    border-left: 3px solid var(--primary-color, #8b1a1a);
  }
`;

const RecentPostItem = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
  .rp-image {
    flex-shrink: 0;
    width: 80px;
    height: 70px;
    border-radius: 6px;
    overflow: hidden;
    display: block;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }
  .rp-body {
    flex: 1;
    min-width: 0;
  }
  .rp-title {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    margin-bottom: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    a {
      color: inherit;
      text-decoration: none;
      &:hover {
        color: var(--primary-color, #8b1a1a);
      }
    }
  }
  .rp-meta {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
`;

const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/**
 * Reusable blog sidebar — fetches and shows "Recent Posts".
 * @param {string} currentSlug - slug to exclude (current post on detail page)
 * @param {object} commentCounts - { blogId: count } map (optional)
 */
export default function BlogSidebar({ currentSlug, commentCounts }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("/api/public/blogs?limit=5")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => setPosts(data.items || []))
      .catch(() => {});
  }, []);

  const filtered = currentSlug ? posts.filter((p) => p.slug !== currentSlug) : posts;
  const display = filtered.slice(0, 5);

  if (display.length === 0) return null;

  return (
    <SidebarWrap>
      <SidebarSection>
        <div className="sidebar-title">Recent Posts</div>
        {display.map((post) => (
          <RecentPostItem key={post._id}>
            {post.featuredImage && (
              <Link href={`/blog/${post.slug}`} className="rp-image">
                <img loading="lazy" src={post.featuredImage} alt={post.title} />
              </Link>
            )}
            <div className="rp-body">
              <div className="rp-title">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </div>
              <div className="rp-meta">
                {post.publishedAt ? formatDate(post.publishedAt) : ""}
                {commentCounts && ` / ${commentCounts[post._id] || 0} COMMENTS`}
              </div>
            </div>
          </RecentPostItem>
        ))}
      </SidebarSection>
    </SidebarWrap>
  );
}
