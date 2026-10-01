"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { FullWidthBackground, getColor, MainTitle, PageContainer } from "@/styles/Theme";
import BlogSidebarFull from "@/components/blog/BlogSidebarFull";
import MediaImage from "@/components/shared/MediaImage";
import { getBlogImageSources } from "@/components/blog/blogDisplay";
import { getBlogSectionStyles } from "@/components/blog/blogSectionStyles";

const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

const revealBlogCard = keyframes`
  from {
    opacity: 0;
    transform: translateY(22px);
  }
`;

const revealBlogSidebar = keyframes`
  from {
    opacity: 0;
    transform: translateX(18px);
  }
`;

const ListingRoot = styled.div`
  color: var(--blog-list-text);

  .blog-list-layout { display: flex; gap: var(--blog-list-gap); }
  .blog-list-posts { flex: 1; min-width: 0; }
  .blog-list-sidebar { width: 320px; flex-shrink: 0; }
  .blog-list-state {
    padding: 60px 0;
    color: var(--blog-list-muted);
    text-align: center;
  }
  .blog-list-state--error { color: var(--blog-list-accent); }
  .blog-list-card {
    display: flex;
    align-items: stretch;
    gap: 32px;
    margin-bottom: 24px;
    padding: 24px;
    border: 1px solid var(--blog-list-border);
    border-radius: var(--blog-list-radius);
    background: var(--blog-list-card-bg);
    animation: ${revealBlogCard} 560ms cubic-bezier(.22, 1, .36, 1) backwards;
    transition: transform 240ms ease, border-color 240ms ease, box-shadow 240ms ease;
  }
  .blog-list-card:nth-of-type(2) { animation-delay: 70ms; }
  .blog-list-card:nth-of-type(3) { animation-delay: 140ms; }
  .blog-list-card:nth-of-type(4) { animation-delay: 210ms; }
  .blog-list-card:nth-of-type(5) { animation-delay: 280ms; }
  .blog-list-card:nth-of-type(n + 6) { animation-delay: 350ms; }
  .blog-list-card:hover {
    transform: translateY(-5px);
    border-color: color-mix(in srgb, var(--blog-list-accent) 28%, var(--blog-list-border));
    box-shadow: 0 16px 36px rgba(20, 18, 36, .1);
  }
  .blog-list-image {
    flex-shrink: 0;
    width: 380px;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--blog-list-surface);
  }
  .blog-list-image img {
    width: 100%; height: auto; object-fit: contain; display: block;
    transition: transform 500ms cubic-bezier(.22, 1, .36, 1);
  }
  .blog-list-card:hover .blog-list-image img { transform: scale(1.035); }
  .blog-list-no-image {
    width: 100%; min-height: 200px; display: flex; align-items: center;
    justify-content: center; color: var(--blog-list-muted); font-size: 14px;
  }
  .blog-list-body {
    flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;
  }
  .blog-list-category {
    margin-bottom: 8px; color: var(--blog-list-accent); font-size: 13px;
    font-weight: 700; letter-spacing: .5px; text-transform: uppercase;
  }
  .blog-list-title-link { color: inherit; text-decoration: none; }
  .blog-list-title { color: var(--blog-list-title); transition: color 200ms ease; }
  .blog-list-title-link:hover .blog-list-title { color: var(--blog-list-accent); }
  .blog-list-excerpt {
    margin-bottom: 20px; color: var(--blog-list-muted); font-size: 15px;
    line-height: 1.7; overflow: hidden; display: -webkit-box;
    -webkit-line-clamp: 4; -webkit-box-orient: vertical;
  }
  .blog-list-meta {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: auto; padding-top: 14px; border-top: 1px solid var(--blog-list-border);
    color: var(--blog-list-meta); font-size: 13px;
  }
  .blog-list-comment { color: var(--blog-list-meta); text-decoration: none; transition: color 200ms ease; }
  .blog-list-comment:hover { color: var(--blog-list-accent); }
  .blog-list-date { font-weight: 500; letter-spacing: .5px; text-transform: uppercase; }
  .blog-list-pagination { display: flex; gap: 8px; justify-content: center; margin-top: 40px; }
  .blog-list-page-button {
    padding: 8px 16px; border: 1px solid var(--blog-list-border); border-radius: 8px;
    background: var(--blog-list-card-bg); color: var(--blog-list-text); font: inherit;
    font-size: 14px; cursor: pointer;
    transition: transform 180ms ease, border-color 180ms ease, color 180ms ease;
  }
  .blog-list-page-button:not(:disabled):hover {
    transform: translateY(-2px); border-color: var(--blog-list-accent); color: var(--blog-list-accent);
  }
  .blog-list-page-button:disabled { opacity: .45; cursor: not-allowed; }
  .blog-list-page-status { padding: 8px 16px; color: var(--blog-list-meta); font-size: 14px; }
  .blog-list-sidebar {
    animation: ${revealBlogSidebar} 620ms 160ms cubic-bezier(.22, 1, .36, 1) backwards;
  }

  @media (max-width: 992px) {
    .blog-list-layout { flex-direction: column; gap: 0; }
    .blog-list-sidebar { width: 100%; margin-top: 40px; }
  }
  @media (max-width: 768px) {
    .blog-list-card { flex-direction: column; gap: 16px; padding: 16px; }
    .blog-list-image { width: 100%; }
    .blog-list-image img { min-height: 180px; max-height: 220px; }
    .blog-list-title { font-size: 18px !important; }
    .blog-list-excerpt { font-size: 14px; }
  }
  @media (max-width: 480px) {
    .blog-list-card { padding: 12px; margin-bottom: 16px; }
    .blog-list-image img { min-height: 150px; max-height: 180px; }
    .blog-list-title { margin-bottom: 8px !important; font-size: 16px !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .blog-list-card,
    .blog-list-sidebar { animation: none; }
    .blog-list-card,
    .blog-list-image img,
    .blog-list-title,
    .blog-list-comment,
    .blog-list-page-button { transition: none; }
    .blog-list-card:hover,
    .blog-list-card:hover .blog-list-image img,
    .blog-list-page-button:not(:disabled):hover { transform: none; }
  }
`;

function text(value, fallback = "") {
  return value == null ? fallback : String(value).trim();
}

function clamp(value, min, max, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function color(value, fallback) {
  const key = text(value);
  return key ? getColor(key) : fallback;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function queryFromSearchParams(input) {
  const params = new URLSearchParams(input || "");
  return {
    q: text(params.get("q")),
    category: text(params.get("category")),
    page: Math.max(1, Number.parseInt(params.get("page"), 10) || 1),
  };
}

export default function BlogListing(props) {
  const pathname = usePathname() || "/blog";
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() || "";
  const [query, setQuery] = useState({ q: "", category: "", page: 1 });
  const [categories, setCategories] = useState([]);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageSize = clamp(props?.blogListingPageSize, 1, 50, 6);
  const showSidebar = props?.blogListingShowSidebar !== false;
  const showComments = props?.blogListingShowCommentLink !== false;
  const showCategories = props?.blogListingShowCategories !== false;
  const showExcerpt = props?.blogListingShowExcerpt !== false;

  const labels = useMemo(() => ({
    empty: text(props?.blogListingEmptyLabel, "No posts found."),
    loading: text(props?.blogListingLoadingLabel, "Loading posts..."),
    previous: text(props?.blogListingPreviousLabel, "Previous"),
    next: text(props?.blogListingNextLabel, "Next"),
    comment: text(props?.blogListingCommentLabel, "Leave a Comment"),
  }), [props]);

  useEffect(() => {
    setQuery(queryFromSearchParams(queryString));
  }, [queryString]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/public/blog-categories", { cache: "no-store", signal: controller.signal })
        .then((response) => response.ok ? response.json() : []),
      fetch("/api/theme", { cache: "no-store", signal: controller.signal })
        .then((response) => response.ok ? response.json() : {}),
    ])
      .then(([categoryItems, theme]) => {
        setCategories(Array.isArray(categoryItems) ? categoryItems : []);
        if (typeof theme?.blogCommentsEnabled === "boolean") {
          setCommentsEnabled(theme.blogCommentsEnabled);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const selectedCategory = categories.find((item) => item?.slug === query.category);
    const params = new URLSearchParams({ page: String(query.page), limit: String(pageSize) });
    if (query.q) params.set("search", query.q);
    if (selectedCategory?._id) params.set("category", selectedCategory._id);
    setLoading(true);
    setError("");
    fetch(`/api/public/blogs?${params.toString()}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Blog posts could not be loaded.");
        return response.json();
      })
      .then((response) => setData({
        items: Array.isArray(response?.items) ? response.items : [],
        total: Number(response?.total) || 0,
        totalPages: Math.max(1, Number(response?.totalPages) || 1),
      }))
      .catch((requestError) => {
        if (requestError?.name !== "AbortError") {
          setError(requestError?.message || "Blog posts could not be loaded.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [categories, pageSize, query.category, query.page, query.q]);

  const updatePage = (page) => {
    const next = { ...query, page: Math.max(1, Number(page) || 1) };
    setQuery(next);
    if (pathname === "/blog") {
      const params = new URLSearchParams();
      if (next.q) params.set("q", next.q);
      if (next.category) params.set("category", next.category);
      if (next.page > 1) params.set("page", String(next.page));
      const search = params.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    }
  };

  const { sectionBgClassName, sectionBgStyle, pageContainerBgStyle } =
    getBlogSectionStyles(props, "blogListing", "customInnerHero");
  const style = {
    "--blog-list-text": color(props?.blogListingTextColorKey, "#2a283e"),
    "--blog-list-title": color(props?.blogListingTitleColorKey, "#2a283e"),
    "--blog-list-muted": color(props?.blogListingMutedColorKey, "rgba(0,0,0,0.55)"),
    "--blog-list-meta": color(props?.blogListingMetaColorKey, "rgba(0,0,0,0.35)"),
    "--blog-list-accent": color(props?.blogListingAccentColorKey, "var(--primary-color, #8b1a1a)"),
    "--blog-sidebar-search-button": color(props?.blogListingSearchButtonColorKey, "var(--blog-list-accent)"),
    "--blog-sidebar-link": color(props?.blogListingSidebarLinkColorKey, "var(--blog-list-text)"),
    "--blog-list-card-bg": color(props?.blogListingCardBgColorKey, "#fff"),
    "--blog-list-surface": color(props?.blogListingSurfaceColorKey, "rgba(0,0,0,0.02)"),
    "--blog-list-border": color(props?.blogListingBorderColorKey, "rgba(0,0,0,0.08)"),
    "--blog-list-radius": `${clamp(props?.blogListingCardRadius, 0, 40, 12)}px`,
    "--blog-list-gap": `${clamp(props?.blogListingColumnGap, 16, 80, 40)}px`,
    ...(text(props?.blogListingAccentColorKey)
      ? { "--primary-color": getColor(text(props.blogListingAccentColorKey)) }
      : {}),
  };

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer className="pt-0" $managedStyle={pageContainerBgStyle}>
        <ListingRoot style={style}>
          <div className="blog-list-layout">
            <div className="blog-list-posts" aria-live="polite" aria-busy={loading}>
              {loading ? <div className="blog-list-state">{labels.loading}</div> : null}
              {error ? <div className="blog-list-state blog-list-state--error">{error}</div> : null}
              {!loading && !error && !data.items.length ? <div className="blog-list-state">{labels.empty}</div> : null}
              {!loading && !error ? data.items.map((post) => {
                const { desktop, mobile } = getBlogImageSources(post);
                return (
                  <article className="blog-list-card" key={post._id || post.slug}>
                    <Link className="blog-list-image" href={`/blog/${post.slug}`}>
                      {desktop ? (
                        <MediaImage
                          src={desktop}
                          mobileSrc={mobile && mobile !== desktop ? mobile : ""}
                          alt={post.title}
                          width={1200}
                          height={675}
                          sizes="(max-width: 768px) 100vw, 380px"
                          imgStyle={{ width: "100%", height: "auto", objectFit: "contain", display: "block" }}
                        />
                      ) : <div className="blog-list-no-image">No Image</div>}
                    </Link>
                    <div className="blog-list-body">
                      {showCategories && post.category?.name ? <div className="blog-list-category">{post.category.name}</div> : null}
                      <Link className="blog-list-title-link" href={`/blog/${post.slug}`}>
                        {/*
                          Card titles are not the page heading — the listing page
                          already has one <h1>. MainTitle renders an <h1> by
                          default, which produced four <h1> tags here.
                        */}
                        <MainTitle
                          as="h2"
                          className="blog-list-title mb-3"
                          fontSize={24}
                          fontWeight={600}
                          style={{ lineHeight: "30px" }}
                        >
                          {post.title}
                        </MainTitle>
                      </Link>
                      {showExcerpt && post.excerpt ? <p className="blog-list-excerpt">{post.excerpt}</p> : null}
                      <div className="blog-list-meta" style={{ justifyContent: showComments && commentsEnabled ? "space-between" : "flex-end" }}>
                        {showComments && commentsEnabled ? <Link className="blog-list-comment" href={`/blog/${post.slug}#comments`}>{labels.comment}</Link> : null}
                        <span className="blog-list-date">{formatDate(post.publishedAt)}</span>
                      </div>
                    </div>
                  </article>
                );
              }) : null}
              {data.totalPages > 1 ? (
                <nav className="blog-list-pagination" aria-label="Blog pagination">
                  <button className="blog-list-page-button" type="button" disabled={query.page <= 1} onClick={() => updatePage(query.page - 1)}>{labels.previous}</button>
                  <span className="blog-list-page-status">Page {query.page} of {data.totalPages}</span>
                  <button className="blog-list-page-button" type="button" disabled={query.page >= data.totalPages} onClick={() => updatePage(query.page + 1)}>{labels.next}</button>
                </nav>
              ) : null}
            </div>
            {showSidebar ? (
              <aside className="blog-list-sidebar">
                <BlogSidebarFull
                  searchQuery={query.q}
                  categorySlug={query.category}
                  categories={categories}
                  commentsEnabled={commentsEnabled}
                />
              </aside>
            ) : null}
          </div>
        </ListingRoot>
      </PageContainer>
    </FullWidthBackground>
  );
}
