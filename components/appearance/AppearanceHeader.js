"use client";

import { useEffect, useRef, useState } from "react";
import CurrentHeader from "@/components/site/Header/Header";

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.4-3.4" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

function normalizeMenuItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    label: String(item?.label || ""),
    url: String(item?.url || item?.href || "#"),
    openInNewTab: item?.openInNewTab === true || item?.target === "_blank",
    children: normalizeMenuItems(item?.children || item?.submenu),
  }));
}

function DesktopMenuItem({ item }) {
  const hasChildren = item.children.length > 0;
  const target = item.openInNewTab ? "_blank" : undefined;
  const rel = target ? "noopener noreferrer" : undefined;

  return (
    <div className={`appearance-nav-item${hasChildren ? " has-dropdown" : ""}`}>
      <a href={item.url} target={target} rel={rel}>
        {item.label}
        {hasChildren ? (
          <svg viewBox="0 0 12 8" width="11" height="7" aria-hidden="true">
            <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ) : null}
      </a>
      {hasChildren ? (
        <div className="appearance-dropdown">
          {item.children.map((child, index) => (
            <DesktopDropdownItem
              key={`${child.label}-${index}`}
              item={child}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DesktopDropdownItem({ item }) {
  const hasChildren = item.children.length > 0;
  const target = item.openInNewTab ? "_blank" : undefined;
  return (
    <div className={`appearance-dropdown-item${hasChildren ? " has-children" : ""}`}>
      <a
        href={item.url}
        target={target}
        rel={target ? "noopener noreferrer" : undefined}
      >
        {item.label}
        {hasChildren ? <span aria-hidden="true">›</span> : null}
      </a>
      {hasChildren ? (
        <div className="appearance-submenu">
          {item.children.map((child, index) => (
            <DesktopDropdownItem key={`${child.label}-${index}`} item={child} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AppearanceHeader(props) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchItems, setSearchItems] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchInputRef = useRef(null);
  const {
    menuItems = [],
    siteTitle = "MESCO Trust",
    logoType = "image",
    logoUrl = "/",
    logoTarget = "_self",
    logoImageUrl = "",
    logoLightUrl = "",
    volunteerLabel = "Volunteer",
    volunteerHref = "/about-us/volunteer",
    volunteerHrefTarget = "_self",
    donateLabel = "Donate Now",
    donateHref = "/donate-now",
    donateHrefTarget = "_self",
    headerSearchEnabled = true,
    headerSearchLabel = "Search",
    headerSearchOpenAriaLabel = "Open search",
    headerSearchPlaceholder = "Search the website",
    headerSearchDialogLabel = "Site search",
    headerSearchInputAriaLabel = "Search",
    headerSearchCloseAriaLabel = "Close search",
    headerSearchMinCharsMessage = "Enter at least 2 characters",
    headerSearchLoadingMessage = "Searching...",
    headerSearchNoResultsMessage = "No results found for {query}",
    headerSearchErrorMessage = "Search is temporarily unavailable",
    headerSearchResultTypePageLabel = "Page",
    headerSearchResultTypeBlogLabel = "Blog",
    headerSearchResultTypeEventLabel = "Event",
    headerSearchFallbackTitle = "Untitled",
    headerSearchFallbackMeta = "",
    headerBgValue = "",
    headerDonateBgValue = "",
    headerDonateTextValue = "",
    preview = false,
  } = props;
  const items = normalizeMenuItems(menuItems);
  const logo = logoLightUrl || logoImageUrl;
  const volunteerTarget = volunteerHrefTarget === "_blank" ? "_blank" : undefined;
  const donateTarget = donateHrefTarget === "_blank" ? "_blank" : undefined;
  const resolvedLogoTarget = logoTarget === "_blank" ? "_blank" : undefined;
  const hasSearchAction =
    headerSearchEnabled === true && String(headerSearchLabel || "").trim();

  useEffect(() => {
    if (preview) return;
    const handleScroll = () => setScrolled(window.scrollY >= 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [preview]);

  useEffect(() => {
    if (!searchOpen) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => searchInputRef.current?.focus(), 120);
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchItems([]);
      setSearchLoading(false);
      setSearchError("");
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");
        const response = await fetch(
          `/api/public/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(headerSearchErrorMessage);
        const body = await response.json();
        setSearchItems(Array.isArray(body?.items) ? body.items : []);
      } catch (error) {
        if (error?.name !== "AbortError") {
          setSearchItems([]);
          setSearchError(error?.message || headerSearchErrorMessage);
        }
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [headerSearchErrorMessage, searchOpen, searchQuery]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchError("");
  };
  const trimmedQuery = searchQuery.trim();
  const resultLabel = (type) => {
    if (type === "blog") return headerSearchResultTypeBlogLabel;
    if (type === "event") return headerSearchResultTypeEventLabel;
    return headerSearchResultTypePageLabel;
  };
  const excerpt = (value) => {
    const plain = String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return plain.length > 130 ? `${plain.slice(0, 127)}...` : plain;
  };

  return (
    <div className={`appearance-header${preview ? " is-preview" : ""}${scrolled ? " is-scrolled" : ""}`}>
      <div className="appearance-desktop">
        <header className="appearance-nav">
          <div
            className="appearance-nav-inner"
            style={{
              background:
                scrolled && !preview
                  ? "rgba(27,24,38,.92)"
                  : headerBgValue || "rgba(27,24,38,.72)",
            }}
          >
            <a className="appearance-logo" href={logoUrl || "/"} target={resolvedLogoTarget} rel={resolvedLogoTarget ? "noopener noreferrer" : undefined} aria-label={`${siteTitle} home`}>
              {logoType === "image" && logo ? (
                <img src={logo} alt={siteTitle} />
              ) : (
                <span>{siteTitle}</span>
              )}
            </a>
            <nav className="appearance-links" aria-label="Primary navigation">
              {items.map((item, index) => (
                <DesktopMenuItem key={`${item.label}-${index}`} item={item} />
              ))}
            </nav>
            <div className="appearance-actions">
              {hasSearchAction ? (
                <button
                  type="button"
                  className="appearance-search"
                  onClick={() => setSearchOpen(true)}
                  aria-label={headerSearchOpenAriaLabel || headerSearchLabel}
                >
                  <SearchIcon />
                  <span>{headerSearchLabel}</span>
                </button>
              ) : null}
              {volunteerHref ? (
                <a className="appearance-volunteer" href={volunteerHref} target={volunteerTarget} rel={volunteerTarget ? "noopener noreferrer" : undefined}>
                  {volunteerLabel}
                </a>
              ) : null}
              {donateHref ? (
                <a
                  className="appearance-donate"
                  href={donateHref}
                  target={donateTarget}
                  rel={donateTarget ? "noopener noreferrer" : undefined}
                  style={{
                    background: headerDonateBgValue || undefined,
                    color: headerDonateTextValue || undefined,
                  }}
                >
                  {donateLabel}
                </a>
              ) : null}
            </div>
          </div>
        </header>
      </div>
      <div className="current-mobile">
        <CurrentHeader
          {...props}
          logoTarget={logoTarget}
          donateHrefTarget={donateHrefTarget}
        />
      </div>
      <div
        className={`appearance-search-overlay${searchOpen ? " is-open" : ""}${preview ? " is-preview" : ""}`}
        onClick={closeSearch}
        aria-hidden={!searchOpen}
      >
        <div
          className="appearance-search-panel"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={headerSearchDialogLabel || headerSearchLabel}
        >
          <div className="appearance-search-top-row">
            <span className="appearance-search-top-icon"><SearchIcon /></span>
            <input
              className="appearance-search-input"
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={headerSearchPlaceholder}
              aria-label={headerSearchInputAriaLabel || headerSearchLabel}
            />
            <button className="appearance-search-close" type="button" aria-label={headerSearchCloseAriaLabel || headerSearchLabel} onClick={closeSearch}>
              <CloseIcon />
            </button>
          </div>
          <div className="appearance-search-results">
            {trimmedQuery.length < 2 ? (
              <div className="appearance-search-state">{headerSearchMinCharsMessage}</div>
            ) : searchLoading ? (
              <div className="appearance-search-state">{headerSearchLoadingMessage}</div>
            ) : searchError ? (
              <div className="appearance-search-state">{searchError}</div>
            ) : searchItems.length === 0 ? (
              <div className="appearance-search-state">{headerSearchNoResultsMessage.replace("{query}", trimmedQuery)}</div>
            ) : searchItems.map((item, index) => (
              <a className="appearance-search-result" key={`${item.type || "result"}-${item.slug || item.url || index}`} href={item.url || ""} onClick={closeSearch}>
                <span className="appearance-search-result-type">{resultLabel(item.type)}</span>
                <span className="appearance-search-result-title">{item.title || headerSearchFallbackTitle}</span>
                <span className="appearance-search-result-meta">{excerpt(item.excerpt) || item.url || headerSearchFallbackMeta}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .appearance-header, .appearance-header * { box-sizing: border-box; }
        .appearance-header { position: relative; z-index: 100; font-family: "Instrument Sans", system-ui, sans-serif; }
        .appearance-header .current-mobile { display: none; }
        .appearance-header .appearance-nav { position: fixed; top: 14px; left: 0; right: 0; padding: 0 24px; z-index: 100; background: transparent; transition: top .3s; }
        .appearance-header.is-preview .appearance-nav { position: relative; top: auto; padding: 14px 18px; }
        .appearance-header .appearance-nav-inner { width: 100%; max-width: 1240px; height: 74px; margin: 0 auto; padding: 0 10px 0 14px; display: flex; align-items: center; justify-content: space-between; gap: 24px; border: 1px solid rgba(255,255,255,.14); border-radius: 999px; backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); box-shadow: 0 18px 50px rgba(15,12,26,.35); transition: background .35s; }
        .appearance-header .appearance-logo { flex: 0 0 auto; display: inline-flex; align-items: center; color: #faf6ef; font-weight: 700; text-decoration: none; }
        .appearance-header .appearance-logo img { display: block; width: auto; height: 42px; max-width: 150px; object-fit: contain; background: #faf6ef; border-radius: 999px; padding: 5px 12px; }
        .appearance-header .appearance-links { display: flex; align-items: center; justify-content: center; gap: clamp(18px,2.6vw,38px); min-width: 0; margin: 0; }
        .appearance-header .appearance-nav-item { position: relative; }
        .appearance-header .appearance-nav-item > a { display: inline-flex; align-items: center; gap: 6px; color: #faf6ef !important; font-size: 15px; font-weight: 570; line-height: 1.6; white-space: nowrap; text-decoration: none !important; position: relative; }
        .appearance-header .appearance-nav-item > a::after { content: ""; position: absolute; left: 0; bottom: -5px; width: 100%; height: 2px; background: #e03c33; transform: scaleX(0); transform-origin: right; transition: transform .3s cubic-bezier(.16,1,.3,1); }
        .appearance-header .appearance-nav-item:hover > a::after, .appearance-header .appearance-nav-item:focus-within > a::after { transform: scaleX(1); transform-origin: left; }
        .appearance-header .appearance-dropdown { position: absolute; top: calc(100% + 14px); left: -18px; min-width: 250px; padding: 10px; display: flex; flex-direction: column; background: #2a283e; border: 1px solid rgba(250,246,239,.12); border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,.4); opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .25s, transform .25s, visibility .25s; }
        .appearance-header .appearance-nav-item:hover .appearance-dropdown, .appearance-header .appearance-nav-item:focus-within .appearance-dropdown { opacity: 1; visibility: visible; transform: translateY(0); }
        .appearance-header .appearance-dropdown-item { position: relative; }
        .appearance-header .appearance-dropdown-item > a { width: 100%; padding: 10px 14px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; gap: 20px; color: #faf6ef !important; -webkit-text-fill-color: #faf6ef !important; font-size: 14.5px; font-weight: 550; text-decoration: none !important; }
        .appearance-header .appearance-dropdown-item > a:hover, .appearance-header .appearance-dropdown-item > a:focus-visible { color: #f2867f !important; -webkit-text-fill-color: #f2867f !important; background: rgba(250,246,239,.08); }
        .appearance-header .appearance-submenu { position: absolute; top: -10px; left: calc(100% + 10px); min-width: 250px; padding: 10px; display: flex; flex-direction: column; background: #2a283e; border: 1px solid rgba(250,246,239,.12); border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,.4); opacity: 0; visibility: hidden; transform: translateX(8px); transition: opacity .2s, transform .2s, visibility .2s; }
        .appearance-header .appearance-dropdown-item:hover > .appearance-submenu, .appearance-header .appearance-dropdown-item:focus-within > .appearance-submenu { opacity: 1; visibility: visible; transform: translateX(0); }
        .appearance-header .appearance-actions { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
        .appearance-header .appearance-actions a { display: inline-flex; align-items: center; padding: 13px 26px; border-radius: 999px; font-size: 15px; font-weight: 600; line-height: 1.2; text-decoration: none !important; white-space: nowrap; transition: transform .25s, background .25s, border-color .25s; }
        .appearance-header .appearance-search { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 44px; height: 46px; padding: 0 16px; color: #faf6ef; background: transparent; border: 1px solid rgba(250,246,239,.32); border-radius: 999px; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; transition: transform .25s,border-color .25s; }
        .appearance-header .appearance-search:hover { border-color: #faf6ef; transform: translateY(-2px); }
        .appearance-header .appearance-volunteer { color: #faf6ef !important; background: transparent; border: 1px solid rgba(250,246,239,.32); }
        .appearance-header .appearance-volunteer:hover { border-color: #faf6ef; transform: translateY(-2px); }
        .appearance-header .appearance-donate { color: #fff !important; background: #e03c33; border: 1px solid transparent; box-shadow: 0 14px 30px rgba(224,60,51,.28); }
        .appearance-header .appearance-donate:hover { background: #b92e27 !important; transform: translateY(-2px); }
        .appearance-header .appearance-search-overlay { position: fixed; inset: 0; z-index: 1400; padding: clamp(84px,14vh,130px) 16px 18px; display: flex; justify-content: center; align-items: flex-start; background: rgba(10,15,25,.6); opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .25s,visibility .25s; }
        .appearance-header .appearance-search-overlay.is-preview { position: absolute; }
        .appearance-header .appearance-search-overlay.is-open { opacity: 1; visibility: visible; pointer-events: auto; }
        .appearance-header .appearance-search-panel { width: min(840px,100%); max-height: min(70vh,640px); display: flex; flex-direction: column; overflow: hidden; background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 18px; box-shadow: 0 26px 60px rgba(0,0,0,.22); transform: translateY(12px) scale(.98); opacity: 0; transition: transform .28s cubic-bezier(.2,.85,.32,1),opacity .2s; }
        .appearance-header .appearance-search-overlay.is-open .appearance-search-panel { transform: translateY(0) scale(1); opacity: 1; }
        .appearance-header .appearance-search-top-row { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid rgba(0,0,0,.08); }
        .appearance-header .appearance-search-top-icon { display: inline-flex; color: rgba(0,0,0,.55); }
        .appearance-header .appearance-search-input { flex: 1; min-width: 0; padding: 0; color: #2a283e; background: transparent; border: 0; outline: 0; font: inherit; font-size: 16px; font-weight: 500; }
        .appearance-header .appearance-search-input::placeholder { color: rgba(0,0,0,.45); font-weight: 400; }
        .appearance-header .appearance-search-close { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; color: rgba(0,0,0,.65); background: transparent; border: 0; border-radius: 10px; cursor: pointer; }
        .appearance-header .appearance-search-close:hover { background: rgba(0,0,0,.07); }
        .appearance-header .appearance-search-results { overflow: auto; padding: 8px 8px 12px; }
        .appearance-header .appearance-search-state { padding: 22px 14px; color: rgba(42,40,62,.65); text-align: center; }
        .appearance-header .appearance-search-result { display: block; margin: 4px 0; padding: 12px 14px; color: #2a283e !important; -webkit-text-fill-color: #2a283e !important; border-radius: 12px; text-decoration: none !important; }
        .appearance-header .appearance-search-result:hover { background: rgba(0,0,0,.05); }
        .appearance-header .appearance-search-result-type { display: block; margin-bottom: 4px; color: #8c1c13; -webkit-text-fill-color: #8c1c13; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        .appearance-header .appearance-search-result-title { display: block; font-size: 15.5px; font-weight: 600; line-height: 1.35; }
        .appearance-header .appearance-search-result-meta { display: block; margin-top: 4px; color: rgba(42,40,62,.65); -webkit-text-fill-color: rgba(42,40,62,.65); font-size: 13px; }
        @media (max-width: 992px) {
          .appearance-header .appearance-desktop { display: none; }
          .appearance-header .current-mobile { display: block; }
          .appearance-header .appearance-search-overlay { padding-top: 72px; }
          .appearance-header .appearance-search-panel { max-height: calc(100vh - 96px); border-radius: 14px; }
        }
        @media (min-width: 993px) {
          .appearance-header .appearance-desktop { display: block; }
          .appearance-header .current-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}
