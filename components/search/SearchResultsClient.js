"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  SearchOutlined,
  CloseOutlined,
  FilePdfOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  BookOutlined,
  NotificationOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { usePdfViewerModal } from "@/components/site/shared/PdfViewerModal";

const TYPE_CONFIG = {
  all: { label: "All", singular: "Result" },
  pages: { label: "Pages", singular: "Page", icon: GlobalOutlined, color: "#1d4ed8", bg: "#eff6ff" },
  events: { label: "Events", singular: "Event", icon: CalendarOutlined, color: "#047857", bg: "#ecfdf5" },
  blogs: { label: "Blogs", singular: "Blog", icon: BookOutlined, color: "#7c3aed", bg: "#f5f3ff" },
  news: { label: "News", singular: "News", icon: NotificationOutlined, color: "#c2410c", bg: "#fff7ed" },
  reports: { label: "Annual Reports", singular: "Annual Report", icon: FilePdfOutlined, color: "#a82d2d", bg: "#fef2f2" },
};

function highlightMatch(text, query) {
  if (!text) return "";
  const str = String(text);
  if (!query) return str;

  const words = query
    .trim()
    .split(/\s+/)
    .map((w) => w.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .filter((w) => w.length >= 2);

  if (words.length === 0) return str;

  const regex = new RegExp(`(${words.join("|")})`, "gi");
  const parts = str.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="search-mark">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function SearchResultsClient({ initialData, initialQuery, initialType }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery || "");
  const [activeType, setActiveType] = useState(initialType || "all");
  const [results, setResults] = useState(initialData?.items || []);
  const [counts, setCounts] = useState(
    initialData?.counts || { all: 0, pages: 0, events: 0, blogs: 0, news: 0, reports: 0 }
  );
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialData?.page || 1);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 1);
  const [isPending, startTransition] = useTransition();

  const { modal: pdfViewerModal, openPdf } = usePdfViewerModal({
    accentColor: "#A82D2D",
  });

  const performSearch = async (searchTerm, typeFilter, pageNum = 1) => {
    const q = (searchTerm || "").trim();
    if (!q || q.length < 2) {
      setResults([]);
      setCounts({ all: 0, pages: 0, events: 0, blogs: 0, news: 0, reports: 0 });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q,
        type: typeFilter || "all",
        page: String(pageNum),
        limit: "20",
      });

      const res = await fetch(`/api/public/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search request failed");
      const data = await res.json();

      setResults(Array.isArray(data.items) ? data.items : []);
      setCounts(
        data.counts || { all: 0, pages: 0, events: 0, blogs: 0, news: 0, reports: 0 }
      );
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Search fetch error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      startTransition(() => {
        router.push(`/search?q=${encodeURIComponent(trimmed)}&type=${activeType}`, {
          scroll: false,
        });
      });
      performSearch(trimmed, activeType, 1);
    }
  };

  const handleTypeChange = (newType) => {
    setActiveType(newType);
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      startTransition(() => {
        router.push(`/search?q=${encodeURIComponent(trimmed)}&type=${newType}`, {
          scroll: false,
        });
      });
      performSearch(trimmed, newType, 1);
    }
  };

  const handleChipClick = (suggestion) => {
    setQuery(suggestion);
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(suggestion)}&type=all`, {
        scroll: false,
      });
    });
    performSearch(suggestion, "all", 1);
  };

  const handleResultClick = (e, item) => {
    if (item.isPdf && item.pdfUrl) {
      e.preventDefault();
      openPdf(item.pdfUrl, item.title);
    }
  };

  const filterTabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "pages", label: "Pages", count: counts.pages },
    { key: "events", label: "Events", count: counts.events },
    { key: "blogs", label: "Blogs", count: counts.blogs },
    { key: "news", label: "News", count: counts.news },
    { key: "reports", label: "Annual Reports", count: counts.reports },
  ];

  return (
    <div className="search-page-container">
      {/* ── Search Hero Banner ── */}
      <section className="search-hero">
        <div className="search-hero-inner">
          <div className="search-eyebrow">MESCO Trust Site Search</div>
          <h1 className="search-title">
            {query ? (
              <>
                Search Results for <span className="search-query-hl">“{query}”</span>
              </>
            ) : (
              <>
                Search Across <span className="search-query-hl">MESCO Trust</span>
              </>
            )}
          </h1>
          <p className="search-subtitle">
            {query ? (
              counts.all > 0 ? (
                `Found ${counts.all} matching result${counts.all === 1 ? "" : "s"} across website pages, events, blogs, news, and annual reports.`
              ) : (
                `No matching results found for “${query}”. Try adjusting your search term below.`
              )
            ) : (
              "Discover information across our educational programmes, healthcare initiatives, relief of poverty, annual reports, events, and news."
            )}
          </p>

          {/* Search Input Bar */}
          <form className="search-bar-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrap">
              <span className="search-input-icon">
                <SearchOutlined />
              </span>
              <input
                type="search"
                className="search-input-field"
                placeholder="Search pages, events, blogs, news, reports..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setQuery("");
                  }}
                  aria-label="Clear query"
                >
                  <CloseOutlined />
                </button>
              )}
              <button type="submit" className="search-submit-btn">
                Search
              </button>
            </div>
          </form>

          {/* Popular Keywords Chips */}
          <div className="search-popular-chips">
            <span className="search-chips-label">Popular Searches:</span>
            {["Scholarship", "Zakat", "Annual Reports", "Events", "Education", "Old Newspaper"].map(
              (term) => (
                <button
                  key={term}
                  type="button"
                  className={`search-chip ${query.toLowerCase() === term.toLowerCase() ? "is-active" : ""}`}
                  onClick={() => handleChipClick(term)}
                >
                  {term}
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Search Main Content Area ── */}
      <section className="search-main-section">
        <div className="search-main-inner">
          {/* Filter Tabs Bar */}
          <div className="search-tabs-bar">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`search-tab-btn ${activeType === tab.key ? "is-active" : ""}`}
                onClick={() => handleTypeChange(tab.key)}
              >
                <span className="search-tab-label">{tab.label}</span>
                <span className="search-tab-count">{tab.count || 0}</span>
              </button>
            ))}
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="search-skeleton-list">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="search-skeleton-card">
                  <div className="skeleton-line skeleton-badge" />
                  <div className="skeleton-line skeleton-title" />
                  <div className="skeleton-line skeleton-excerpt" />
                  <div className="skeleton-line skeleton-meta" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            /* Results Grid / List */
            <div className="search-results-list">
              {results.map((item, index) => {
                const conf = TYPE_CONFIG[item.type] || TYPE_CONFIG.pages;
                const IconComponent = conf.icon || GlobalOutlined;

                return (
                  <article className="search-result-card" key={item.id || `${item.type}-${index}`}>
                    <div className="search-card-main">
                      {/* Badge Row */}
                      <div className="search-card-badge-row">
                        <span
                          className="search-type-badge"
                          style={{
                            color: conf.color,
                            backgroundColor: conf.bg,
                            borderColor: `${conf.color}33`,
                          }}
                        >
                          <IconComponent className="search-type-icon" />
                          {item.typeLabel || conf.singular}
                        </span>
                        {item.year && (
                          <span className="search-meta-pill">FY {item.year}</span>
                        )}
                        {item.date && (
                          <span className="search-meta-pill">
                            {typeof item.date === "string"
                              ? item.date
                              : new Date(item.date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                          </span>
                        )}
                        {item.category && (
                          <span className="search-meta-pill">{item.category}</span>
                        )}
                        {item.source && (
                          <span className="search-meta-pill">Source: {item.source}</span>
                        )}
                      </div>

                      {/* Result Title */}
                      <h2 className="search-card-title">
                        {item.isPdf ? (
                          <a
                            href={item.url}
                            onClick={(e) => handleResultClick(e, item)}
                            className="search-card-title-link"
                          >
                            {highlightMatch(item.title, query)}
                          </a>
                        ) : (
                          <Link href={item.url || "#"} className="search-card-title-link">
                            {highlightMatch(item.title, query)}
                          </Link>
                        )}
                      </h2>

                      {/* Excerpt Snippet */}
                      {item.excerpt && (
                        <p className="search-card-excerpt">
                          {highlightMatch(item.excerpt, query)}
                        </p>
                      )}

                      {/* Card Footer / Action Link */}
                      <div className="search-card-footer">
                        {item.isPdf ? (
                          <a
                            href={item.url}
                            onClick={(e) => handleResultClick(e, item)}
                            className="search-action-btn search-action-pdf"
                          >
                            <FilePdfOutlined />
                            <span>View Annual Report PDF</span>
                            <ArrowRightOutlined />
                          </a>
                        ) : (
                          <Link href={item.url || "#"} className="search-action-btn">
                            <span>
                              {item.type === "event"
                                ? "View Event Details"
                                : item.type === "blog"
                                  ? "Read Blog Post"
                                  : item.type === "news"
                                    ? "View Announcement"
                                    : "View Page"}
                            </span>
                            <ArrowRightOutlined />
                          </Link>
                        )}
                        <span className="search-url-hint">
                          {item.url.startsWith("/") ? item.url : `/${item.url}`}
                        </span>
                      </div>
                    </div>

                    {/* Optional Thumbnail Image */}
                    {item.image && (
                      <div className="search-card-thumb">
                        <img
                          src={item.image}
                          alt={item.title || "Thumbnail"}
                          loading="lazy"
                        />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="search-empty-state">
              <div className="search-empty-icon">
                <SearchOutlined />
              </div>
              <h3 className="search-empty-title">
                {query ? `No results found for “${query}”` : "Enter a search term above"}
              </h3>
              <p className="search-empty-text">
                {query
                  ? "We couldn't find anything matching your keywords. Please check your spelling or try searching for a broader term."
                  : "Type at least two characters into the search box to find pages, events, blogs, news, and annual reports."}
              </p>

              <div className="search-empty-suggestions">
                <h4>Suggested Keywords:</h4>
                <div className="search-suggestion-chips">
                  {["Scholarship", "Zakat", "Annual Reports", "Education", "Healthcare", "Careers"].map(
                    (suggest) => (
                      <button
                        key={suggest}
                        type="button"
                        className="search-chip"
                        onClick={() => handleChipClick(suggest)}
                      >
                        {suggest}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="search-pagination">
              <button
                type="button"
                className="search-page-btn"
                disabled={page <= 1}
                onClick={() => performSearch(query, activeType, page - 1)}
              >
                Previous
              </button>
              <span className="search-page-info">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="search-page-btn"
                disabled={page >= totalPages}
                onClick={() => performSearch(query, activeType, page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      {pdfViewerModal}

      <style jsx global>{`
        .search-page-container {
          min-height: 80vh;
          background: #ffffff;
          font-family: "Instrument Sans", system-ui, -apple-system, sans-serif;
          color: #1a1a1a;
        }

        /* ── Hero Banner ── */
        .search-hero {
          background: linear-gradient(180deg, #fbf8f5 0%, #ffffff 100%);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          padding: 56px 20px 48px;
        }
        .search-hero-inner {
          max-width: 860px;
          margin: 0 auto;
          text-align: center;
        }
        .search-eyebrow {
          display: inline-block;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #a82d2d;
          margin-bottom: 12px;
        }
        .search-title {
          font-family: "Bricolage Grotesque", system-ui, sans-serif;
          font-size: clamp(28px, 4.2vw, 44px);
          font-weight: 650;
          color: #050505;
          line-height: 1.18;
          margin: 0 0 14px;
        }
        .search-query-hl {
          color: #a82d2d;
        }
        .search-subtitle {
          font-size: 16px;
          line-height: 1.5;
          color: rgba(5, 5, 5, 0.65);
          margin: 0 auto 32px;
          max-width: 660px;
        }

        /* Search Input Field */
        .search-bar-form {
          width: 100%;
          margin: 0 auto 24px;
        }
        .search-input-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #ffffff;
          border: 1.5px solid rgba(0, 0, 0, 0.14);
          border-radius: 999px;
          padding: 6px 8px 6px 20px;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06);
          transition: border-color 0.25s, box-shadow 0.25s;
        }
        .search-input-wrap:focus-within {
          border-color: #a82d2d;
          box-shadow: 0 12px 36px rgba(168, 45, 45, 0.12);
        }
        .search-input-icon {
          display: inline-flex;
          font-size: 18px;
          color: rgba(0, 0, 0, 0.45);
        }
        .search-input-field {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 16px;
          font-family: inherit;
          color: #050505;
        }
        .search-input-field::placeholder {
          color: rgba(0, 0, 0, 0.42);
        }
        .search-clear-btn {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 50%;
          color: rgba(0, 0, 0, 0.6);
          cursor: pointer;
          transition: background 0.2s;
        }
        .search-clear-btn:hover {
          background: rgba(0, 0, 0, 0.1);
        }
        .search-submit-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          padding: 0 28px;
          border-radius: 999px;
          background: #a82d2d;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          border: 0;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .search-submit-btn:hover {
          background: #8c1c13;
          transform: translateY(-1px);
        }

        /* Popular Chips */
        .search-popular-chips {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 13.5px;
        }
        .search-chips-label {
          color: rgba(5, 5, 5, 0.55);
          font-weight: 500;
        }
        .search-chip {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #1a1a1a;
          cursor: pointer;
          transition: all 0.2s;
        }
        .search-chip:hover {
          border-color: #a82d2d;
          color: #a82d2d;
          background: #fff8f8;
        }
        .search-chip.is-active {
          background: #a82d2d;
          color: #ffffff;
          border-color: #a82d2d;
        }

        /* ── Main Section ── */
        .search-main-section {
          padding: 36px 20px 80px;
        }
        .search-main-inner {
          max-width: 980px;
          margin: 0 auto;
        }

        /* Filter Tabs */
        .search-tabs-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          margin-bottom: 32px;
          scrollbar-width: none;
        }
        .search-tabs-bar::-webkit-scrollbar {
          display: none;
        }
        .search-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 999px;
          background: transparent;
          border: 1px solid transparent;
          color: rgba(5, 5, 5, 0.65);
          font-size: 14.5px;
          font-weight: 550;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .search-tab-btn:hover {
          color: #050505;
          background: rgba(0, 0, 0, 0.04);
        }
        .search-tab-btn.is-active {
          background: #050505;
          color: #ffffff;
        }
        .search-tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          background: rgba(0, 0, 0, 0.07);
          color: inherit;
        }
        .search-tab-btn.is-active .search-tab-count {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        /* Result Cards */
        .search-results-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .search-result-card {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          padding: 24px;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
        }
        .search-result-card:hover {
          transform: translateY(-2px);
          border-color: rgba(168, 45, 45, 0.25);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.07);
        }
        .search-card-main {
          flex: 1;
          min-width: 0;
        }
        .search-card-badge-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        .search-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid transparent;
        }
        .search-type-icon {
          font-size: 12px;
        }
        .search-meta-pill {
          display: inline-flex;
          align-items: center;
          font-size: 12px;
          font-weight: 500;
          color: rgba(5, 5, 5, 0.55);
          background: #f5f5f5;
          padding: 3px 10px;
          border-radius: 999px;
        }
        .search-card-title {
          font-family: "Bricolage Grotesque", system-ui, sans-serif;
          font-size: 19px;
          font-weight: 620;
          line-height: 1.35;
          margin: 0 0 10px;
        }
        .search-card-title-link {
          color: #050505;
          text-decoration: none;
          transition: color 0.2s;
        }
        .search-card-title-link:hover {
          color: #a82d2d;
        }
        .search-card-excerpt {
          font-size: 14.5px;
          line-height: 1.58;
          color: rgba(5, 5, 5, 0.72);
          margin: 0 0 16px;
        }
        .search-card-footer {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .search-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 600;
          color: #a82d2d;
          text-decoration: none;
          transition: gap 0.2s, color 0.2s;
        }
        .search-action-btn:hover {
          color: #8c1c13;
          gap: 12px;
        }
        .search-action-pdf {
          color: #a82d2d;
        }
        .search-url-hint {
          font-size: 12.5px;
          color: rgba(5, 5, 5, 0.4);
        }
        .search-card-thumb {
          width: 140px;
          height: 100px;
          flex-shrink: 0;
          border-radius: 10px;
          overflow: hidden;
          background: #f0ede8;
        }
        .search-card-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Keyword Highlight Mark */
        .search-mark {
          background-color: #fef08a;
          color: #854d0e;
          font-weight: 600;
          padding: 0 3px;
          border-radius: 3px;
        }

        /* Empty State */
        .search-empty-state {
          padding: 64px 20px;
          text-align: center;
          background: #fbf8f5;
          border-radius: 20px;
          border: 1px dashed rgba(0, 0, 0, 0.12);
        }
        .search-empty-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
          font-size: 26px;
          color: #a82d2d;
          margin-bottom: 20px;
        }
        .search-empty-title {
          font-family: "Bricolage Grotesque", system-ui, sans-serif;
          font-size: 22px;
          font-weight: 620;
          color: #050505;
          margin: 0 0 10px;
        }
        .search-empty-text {
          font-size: 15px;
          color: rgba(5, 5, 5, 0.65);
          max-width: 480px;
          margin: 0 auto 28px;
          line-height: 1.5;
        }
        .search-empty-suggestions h4 {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(5, 5, 5, 0.5);
          margin-bottom: 12px;
        }
        .search-suggestion-chips {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        /* Skeleton */
        .search-skeleton-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .search-skeleton-card {
          padding: 24px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: #ffffff;
        }
        .skeleton-line {
          height: 14px;
          border-radius: 6px;
          background: linear-gradient(90deg, #f0ede8 25%, #f8f6f2 50%, #f0ede8 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.5s infinite;
          margin-bottom: 12px;
        }
        .skeleton-badge {
          width: 90px;
          height: 20px;
          border-radius: 6px;
        }
        .skeleton-title {
          width: 60%;
          height: 22px;
        }
        .skeleton-excerpt {
          width: 90%;
        }
        .skeleton-meta {
          width: 30%;
          margin-bottom: 0;
        }
        @keyframes skeletonShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        /* Pagination */
        .search-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 40px;
        }
        .search-page-btn {
          height: 38px;
          padding: 0 20px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #ffffff;
          color: #050505;
          font-size: 14px;
          font-weight: 550;
          cursor: pointer;
          transition: all 0.2s;
        }
        .search-page-btn:hover:not(:disabled) {
          border-color: #a82d2d;
          color: #a82d2d;
        }
        .search-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .search-page-info {
          font-size: 14px;
          color: rgba(5, 5, 5, 0.6);
        }

        @media (max-width: 640px) {
          .search-result-card {
            flex-direction: column-reverse;
          }
          .search-card-thumb {
            width: 100%;
            height: 160px;
          }
          .search-hero {
            padding: 36px 16px 32px;
          }
          .search-main-section {
            padding: 24px 16px 60px;
          }
        }
      `}</style>
    </div>
  );
}
