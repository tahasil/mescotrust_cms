"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ResponsiveHeader from "./ResponsiveHeader";
import {
  isPdfDocumentUrl,
  usePdfViewerModal,
} from "@/components/site/shared/PdfViewerModal";
import { PageContainer } from "@/styles/Theme";

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

/**
 * A menu item is only navigable when it has a real destination.
 * CMS dropdown parents are often saved as `javascript:void(0)` (or `#`) purely
 * to open the dropdown. Emitting that as an <a href> produces links that
 * crawlers cannot follow and that React warns about (and will block in a
 * future major version).
 */
function isNavigableUrl(url) {
  const value = String(url || "").trim();
  if (!value) return false;
  if (value === "#") return false;
  if (/^javascript:/i.test(value)) return false;
  return true;
}

function normalizeMenuItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const rawUrl = String(item?.url || item?.href || "");
    const children = normalizeMenuItems(item?.children || item?.submenu);

    let url = rawUrl;
    let openInNewTab = item?.openInNewTab === true || item?.target === "_blank";

    // Dropdown parent without a real destination: point it at the first
    // navigable descendant so the top-level nav stays a crawlable link.
    if (!isNavigableUrl(url)) {
      const firstChild = children.find((child) => isNavigableUrl(child.url));
      if (firstChild) {
        url = firstChild.url;
        openInNewTab = firstChild.openInNewTab;
      } else {
        url = "#";
      }
    }

    const isModal = item?.target === "modal" || item?.type === "modal";

    return {
      label: String(item?.label || ""),
      url,
      openInNewTab,
      target: isModal ? "modal" : openInNewTab ? "_blank" : undefined,
      opensPdfModal: isModal && isPdfDocumentUrl(rawUrl),
      children,
    };
  });
}

function openMenuPdf(event, item, openPdf) {
  if (!item.opensPdfModal) return;
  event.preventDefault();
  openPdf({
    url: item.url,
    title: item.label || "PDF document",
    trigger: event.currentTarget,
  });
}

function resolveNavBackground(value, fallback = "#ffffff") {
  const candidate = String(value || "").trim();
  return candidate || fallback;
}

function resolveScrolledNavBackground(value, fallback = "#ffffff") {
  const candidate = String(value || "").trim() || fallback;
  const rgbaMatch = candidate.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/i,
  );
  if (rgbaMatch) {
    const [, r, g, b, a] = rgbaMatch;
    const alpha = a != null ? Math.min(1, parseFloat(a) + 0.18) : 0.92;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return candidate;
}

function DesktopMenuItem({ item, openPdf }) {
  const hasChildren = item.children.length > 0;
  const target = item.opensPdfModal ? "modal" : item.openInNewTab ? "_blank" : undefined;
  const rel = target === "_blank" ? "noopener noreferrer" : undefined;

  return (
    <div className={`appearance-nav-item${hasChildren ? " has-dropdown" : ""}`}>
      <a
        href={item.url}
        target={target}
        rel={rel}
        data-opens-pdf-modal={item.opensPdfModal ? "true" : undefined}
        aria-haspopup={item.opensPdfModal ? "dialog" : undefined}
        onClick={(event) => openMenuPdf(event, item, openPdf)}
      >
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
              openPdf={openPdf}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DesktopDropdownItem({ item, openPdf }) {
  const hasChildren = item.children.length > 0;
  const target = item.opensPdfModal ? "modal" : item.openInNewTab ? "_blank" : undefined;
  return (
    <div className={`appearance-dropdown-item${hasChildren ? " has-children" : ""}`}>
      <a
        href={item.url}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        data-opens-pdf-modal={item.opensPdfModal ? "true" : undefined}
        aria-haspopup={item.opensPdfModal ? "dialog" : undefined}
        onClick={(event) => openMenuPdf(event, item, openPdf)}
      >
        {item.label}
        {hasChildren ? <span aria-hidden="true">›</span> : null}
      </a>
      {hasChildren ? (
        <div className="appearance-submenu">
          {item.children.map((child, index) => (
            <DesktopDropdownItem
              key={`${child.label}-${index}`}
              item={child}
              openPdf={openPdf}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AppearanceHeader(props) {
  const [scrolled, setScrolled] = useState(false);
  const [responsiveLayerOpen, setResponsiveLayerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchItems, setSearchItems] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchInputRef = useRef(null);
  const headerRootRef = useRef(null);
  const { modal: pdfViewerModal, openPdf } = usePdfViewerModal();
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
    headerNavTextValue = "",
    headerSearchBgValue = "",
    headerSearchTextValue = "",
    headerSearchHoverBgValue = "",
    headerSearchHoverTextValue = "",
    headerCtaBgValue = "",
    headerCtaTextValue = "",
    headerCtaHoverBgValue = "",
    headerCtaHoverTextValue = "",
    headerDonateBgValue = "",
    headerDonateTextValue = "",
    headerDonateHoverBgValue = "",
    headerDonateHoverTextValue = "",
    headerResponsiveButtonBorderValue = "",
    headerDesktopSearchBorderValue = "",
    headerResponsiveVolunteerIconValue = "",
    headerResponsiveVolunteerCircleBgValue = "",
    headerResponsiveDonateIconValue = "",
    headerResponsiveDonateCircleBgValue = "",
    volunteerIconUrl = "",
    donateIconUrl = "",
    preview = false,
  } = props;
  const items = normalizeMenuItems(menuItems);
  const logo = logoLightUrl || logoImageUrl;
  const volunteerTarget = volunteerHrefTarget === "_blank" ? "_blank" : undefined;
  const donateTarget = donateHrefTarget === "_blank" ? "_blank" : undefined;
  const resolvedLogoTarget = logoTarget === "_blank" ? "_blank" : undefined;
  const hasSearchAction =
    headerSearchEnabled === true && String(headerSearchLabel || "").trim();
  const navTextColor = headerNavTextValue || "#1a1a1a";
  const navBackground = resolveNavBackground(headerBgValue);
  const navBackgroundScrolled = resolveScrolledNavBackground(headerBgValue);
  const searchBg = headerSearchBgValue || "transparent";
  const searchText = headerSearchTextValue || navTextColor;
  const searchHoverBg =
    headerSearchHoverBgValue ||
    (headerSearchBgValue && headerSearchBgValue !== "transparent"
      ? headerSearchBgValue
      : "#ffffff");
  const searchHoverText = headerSearchHoverTextValue || searchText;
  const volunteerBg = headerCtaBgValue || "#FDF1F1";
  const volunteerText = headerCtaTextValue || "#A82D2D";
  const volunteerHoverBg = headerCtaHoverBgValue || volunteerBg;
  const volunteerHoverText = headerCtaHoverTextValue || volunteerText;
  const donateBg = headerDonateBgValue || "#A82D2D";
  const donateText = headerDonateTextValue || "#ffffff";
  const donateHoverBg = headerDonateHoverBgValue || "#8C1C13";
  const donateHoverText = headerDonateHoverTextValue || donateText;
  const responsiveButtonBorder =
    headerResponsiveButtonBorderValue || "#A82D2D";
  const desktopSearchBorder =
    headerDesktopSearchBorderValue || "rgba(0,0,0,.12)";
  const responsiveVolunteerIcon =
    headerResponsiveVolunteerIconValue || "#A82D2D";
  const responsiveVolunteerCircleBg =
    headerResponsiveVolunteerCircleBgValue || "#ffffff";
  const responsiveDonateIcon =
    headerResponsiveDonateIconValue || "#ffffff";
  const responsiveDonateCircleBg =
    headerResponsiveDonateCircleBgValue || "#A82D2D";
  const volunteerIconSrc =
    String(volunteerIconUrl || "").trim() || "/images/volunteer-icon.svg";
  const donateIconSrc =
    String(donateIconUrl || "").trim() || "/images/donate-now-icon.svg";

  useEffect(() => {
    if (preview) return undefined;
    const root = document.querySelector(".public-site");
    const headerEl = headerRootRef.current;
    if (!root || !headerEl) return undefined;

    const updateHeaderLayout = () => {
      const ribbon = document.querySelector(".appearance-header-ribbon");
      const ribbonBottom = ribbon
        ? Math.max(0, Math.ceil(ribbon.getBoundingClientRect().bottom))
        : 0;
      const ribbonHeight = ribbon
        ? Math.max(0, Math.ceil(ribbon.offsetHeight))
        : 0;

      root.style.setProperty("--appearance-header-top", `${ribbonBottom}px`);
      if (ribbonHeight > 0) {
        root.style.setProperty("--appearance-ribbon-height", `${ribbonHeight}px`);
      } else if (!ribbon) {
        root.style.setProperty("--appearance-ribbon-height", "0px");
      }
      setScrolled(window.scrollY >= 10);

      const isMobile = window.matchMedia("(max-width: 1199px)").matches;
      const activeHeader = isMobile
        ? headerEl.querySelector(".current-mobile .site-header-shell")
        : headerEl.querySelector(".appearance-nav");
      if (!activeHeader) return;

      const headerHeight = Math.max(0, Math.ceil(activeHeader.offsetHeight));
      if (headerHeight > 0) {
        root.style.setProperty("--appearance-header-height", `${headerHeight}px`);
      }

      const offset = Math.max(0, Math.ceil(activeHeader.getBoundingClientRect().bottom));
      root.style.setProperty("--appearance-header-offset", `${offset}px`);
    };

    updateHeaderLayout();
    const observer = new ResizeObserver(updateHeaderLayout);
    observer.observe(headerEl);
    const ribbonEl = document.querySelector(".appearance-header-ribbon");
    if (ribbonEl) observer.observe(ribbonEl);
    window.addEventListener("resize", updateHeaderLayout, { passive: true });
    window.addEventListener("scroll", updateHeaderLayout, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeaderLayout);
      window.removeEventListener("scroll", updateHeaderLayout);
    };
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

  const router = useRouter();
  const closeSearch = () => {
    setSearchOpen(false);
    setSearchError("");
  };
  const trimmedQuery = searchQuery.trim();
  const resultLabel = (type) => {
    if (type === "blog") return headerSearchResultTypeBlogLabel || "Blog";
    if (type === "event") return headerSearchResultTypeEventLabel || "Event";
    if (type === "news") return "News";
    if (type === "report") return "Annual Report";
    return headerSearchResultTypePageLabel || "Page";
  };
  const excerpt = (value) => {
    const plain = String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return plain.length > 130 ? `${plain.slice(0, 127)}...` : plain;
  };
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (trimmedQuery.length >= 2) {
      closeSearch();
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };
  const handleResultClick = (e, item) => {
    if (item.type === "report" || item.isPdf || (item.url && item.url.endsWith(".pdf"))) {
      if (item.url) {
        closeSearch();
        openPdf(item.url, item.title);
        e.preventDefault();
        return;
      }
    }
    closeSearch();
  };

  return (
    <div
      ref={headerRootRef}
      className={`appearance-header${preview ? " is-preview" : ""}${scrolled ? " is-scrolled" : ""}${responsiveLayerOpen ? " is-responsive-layer-open" : ""}`}
      style={{
        "--appearance-nav-background": navBackground,
        "--appearance-nav-background-scrolled": navBackgroundScrolled,
        "--appearance-search-bg": searchBg,
        "--appearance-search-text": searchText,
        "--appearance-search-hover-bg": searchHoverBg,
        "--appearance-search-hover-text": searchHoverText,
        "--appearance-volunteer-bg": volunteerBg,
        "--appearance-volunteer-text": volunteerText,
        "--appearance-volunteer-hover-bg": volunteerHoverBg,
        "--appearance-volunteer-hover-text": volunteerHoverText,
        "--appearance-donate-bg": donateBg,
        "--appearance-donate-text": donateText,
        "--appearance-donate-hover-bg": donateHoverBg,
        "--appearance-donate-hover-text": donateHoverText,
        "--appearance-responsive-button-border": responsiveButtonBorder,
        "--appearance-desktop-search-border": desktopSearchBorder,
        "--appearance-responsive-volunteer-icon": responsiveVolunteerIcon,
        "--appearance-responsive-volunteer-circle-bg": responsiveVolunteerCircleBg,
        "--appearance-responsive-donate-icon": responsiveDonateIcon,
        "--appearance-responsive-donate-circle-bg": responsiveDonateCircleBg,
      }}
    >
      <div className="appearance-desktop">
        <header className="appearance-nav">
          <div className="appearance-nav-shell">
            <PageContainer
              className="appearance-nav-container page-container-header"
              $managedPaddingTop={0}
              $managedPaddingBottom={0}
            >
              <div className="appearance-nav-inner">
            <a className="appearance-logo" href={logoUrl || "/"} target={resolvedLogoTarget} rel={resolvedLogoTarget ? "noopener noreferrer" : undefined} aria-label={`${siteTitle} home`}>
              {logoType === "image" && logo ? (
                <img src={logo} alt={siteTitle} />
              ) : (
                <span>{siteTitle}</span>
              )}
            </a>
            <nav className="appearance-links" aria-label="Primary navigation">
              {items.map((item, index) => (
                <DesktopMenuItem
                  key={`${item.label}-${index}`}
                  item={item}
                  openPdf={openPdf}
                />
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
                  <span className="appearance-btn-label">{volunteerLabel}</span>
                  <span className="appearance-btn-icon appearance-btn-icon-volunteer" aria-hidden="true">
                    <img src={volunteerIconSrc} alt="" />
                  </span>
                </a>
              ) : null}
              {donateHref ? (
                <a
                  className="appearance-donate"
                  href={donateHref}
                  target={donateTarget}
                  rel={donateTarget ? "noopener noreferrer" : undefined}
                >
                  <span className="appearance-btn-label">{donateLabel}</span>
                  <span className="appearance-btn-icon appearance-btn-icon-donate" aria-hidden="true">
                    <img src={donateIconSrc} alt="" />
                  </span>
                </a>
              ) : null}
            </div>
            </div>
            </PageContainer>
          </div>
        </header>
      </div>
      <div className="current-mobile">
        <ResponsiveHeader
          {...props}
          logoTarget={logoTarget}
          donateHrefTarget={donateHrefTarget}
          headerNavTextValue={navTextColor}
          appearanceResponsive
          onResponsiveLayerChange={setResponsiveLayerOpen}
          onOpenPdf={openPdf}
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
          <form className="appearance-search-top-row" onSubmit={handleSearchSubmit}>
            <span className="appearance-search-top-icon"><SearchIcon /></span>
            <input
              className="appearance-search-input"
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearchSubmit(event);
                }
              }}
              placeholder={headerSearchPlaceholder}
              aria-label={headerSearchInputAriaLabel || headerSearchLabel}
            />
            <button className="appearance-search-close" type="button" aria-label={headerSearchCloseAriaLabel || headerSearchLabel} onClick={closeSearch}>
              <CloseIcon />
            </button>
            <button type="submit" style={{ display: "none" }} aria-hidden="true" tabIndex={-1}>
              Search
            </button>
          </form>
          <div className="appearance-search-results">
            {trimmedQuery.length < 2 ? (
              <div className="appearance-search-state">{headerSearchMinCharsMessage}</div>
            ) : searchLoading ? (
              <div className="appearance-search-state">{headerSearchLoadingMessage}</div>
            ) : searchError ? (
              <div className="appearance-search-state">{searchError}</div>
            ) : searchItems.length === 0 ? (
              <div className="appearance-search-state">{headerSearchNoResultsMessage.replace("{query}", trimmedQuery)}</div>
            ) : (
              <>
                {searchItems.map((item, index) => (
                  <a
                    className="appearance-search-result"
                    key={`${item.type || "result"}-${item.slug || item.url || index}`}
                    href={item.url || ""}
                    onClick={(e) => handleResultClick(e, item)}
                  >
                    <span className="appearance-search-result-type">{resultLabel(item.type)}</span>
                    <span className="appearance-search-result-title">{item.title || headerSearchFallbackTitle}</span>
                    <span className="appearance-search-result-meta">{excerpt(item.excerpt) || item.url || headerSearchFallbackMeta}</span>
                  </a>
                ))}
                <a
                  className="appearance-search-view-all"
                  href={`/search?q=${encodeURIComponent(trimmedQuery)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    closeSearch();
                    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
                  }}
                >
                  <span>See all results for “{trimmedQuery}”</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
      {pdfViewerModal}
      <style dangerouslySetInnerHTML={{ __html: `
        .appearance-header, .appearance-header * { box-sizing: border-box; }
        .appearance-header { --appearance-font-body: "Instrument Sans", system-ui, sans-serif; --appearance-font-display: "Bricolage Grotesque", "Instrument Sans", system-ui, sans-serif; --appearance-nav-text: ${navTextColor}; position: relative; z-index: 100; font-family: var(--appearance-font-body); font-synthesis: none; -webkit-font-smoothing: antialiased; }
        .appearance-header.is-responsive-layer-open { z-index: 120; }
        .appearance-header *, .appearance-header *::before, .appearance-header *::after { font-family: var(--appearance-font-body); }
        .appearance-header .current-mobile { display: none; }
        .appearance-header .appearance-nav { position: fixed; top: var(--appearance-header-top, 0); left: 0; right: 0; z-index: 100; background: transparent; pointer-events: none; }
        .appearance-header .appearance-nav-shell { pointer-events: auto; width: 100%; padding: 0; background: var(--appearance-nav-background); border-bottom: 1px solid rgba(0,0,0,.06); transition: background .35s, box-shadow .35s, border-color .35s; }
        .appearance-header.is-scrolled .appearance-nav-shell { background: var(--appearance-nav-background-scrolled); border-bottom-color: transparent; box-shadow: 0 2px 16px rgba(0,0,0,.08); }
        .appearance-header.is-preview .appearance-nav { position: relative; top: auto; pointer-events: auto; }
        .appearance-header .appearance-nav-container,
        .appearance-header .page-container-header { padding-top: 0 !important; padding-bottom: 0 !important; }
        .appearance-header .appearance-nav-inner { min-height: 0; height: auto; padding: 16px 0; display: flex; align-items: center; justify-content: space-between; gap: clamp(16px,3vw,40px); background: transparent; border: 0; border-radius: 0; box-shadow: none; }
        .appearance-header .appearance-logo { flex: 0 0 auto; display: inline-flex; align-items: center; color: #1a1a1a; font-weight: 700; text-decoration: none; }
        .appearance-header .appearance-logo img { display: block; width: auto; height: 58px; max-width: 216px; object-fit: contain; background: transparent; border-radius: 0; padding: 0; }
        .appearance-header .appearance-links { flex: 1 1 auto; display: flex; align-items: center; justify-content: center; gap: clamp(22px,3vw,48px); min-width: 0; margin: 0; }
        .appearance-header .appearance-nav-item { position: relative; }
        .appearance-header .appearance-nav-item > a { display: inline-flex; align-items: center; gap: 6px; color: var(--appearance-nav-text) !important; -webkit-text-fill-color: var(--appearance-nav-text) !important; font-size: 16px; font-weight: 500; line-height: 1.5; white-space: nowrap; text-decoration: none !important; position: relative; transition: color .2s; }
        .appearance-header .appearance-nav-item > a svg { opacity: .72; }
        .appearance-header .appearance-nav-item > a::after { content: ""; position: absolute; left: 0; bottom: -4px; width: 100%; height: 2px; background: var(--appearance-donate-bg, #A82D2D); transform: scaleX(0); transform-origin: right; transition: transform .3s cubic-bezier(.16,1,.3,1); }
        .appearance-header .appearance-nav-item:hover > a::after, .appearance-header .appearance-nav-item:focus-within > a::after { transform: scaleX(1); transform-origin: left; }
        .appearance-header .appearance-dropdown { position: absolute; top: calc(100% + 12px); left: 50%; transform: translateX(-50%) translateY(8px); min-width: 240px; padding: 8px; display: flex; flex-direction: column; background: var(--appearance-nav-background); border: 1px solid rgba(0,0,0,.08); border-radius: 12px; box-shadow: 0 16px 40px rgba(0,0,0,.12); opacity: 0; visibility: hidden; transition: opacity .25s, transform .25s, visibility .25s; }
        .appearance-header .appearance-nav-item:hover .appearance-dropdown, .appearance-header .appearance-nav-item:focus-within .appearance-dropdown { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
        .appearance-header .appearance-dropdown-item { position: relative; }
        .appearance-header .appearance-dropdown-item > a { width: 100%; padding: 10px 14px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 20px; color: var(--appearance-nav-text) !important; -webkit-text-fill-color: var(--appearance-nav-text) !important; font-size: 15px; font-weight: 500; text-decoration: none !important; transition: background .2s, color .2s; }
        .appearance-header .appearance-dropdown-item > a:hover, .appearance-header .appearance-dropdown-item > a:focus-visible { color: var(--appearance-donate-bg, #A82D2D) !important; -webkit-text-fill-color: var(--appearance-donate-bg, #A82D2D) !important; background: var(--appearance-volunteer-bg, #FDF1F1); }
        .appearance-header .appearance-submenu { position: absolute; top: -8px; left: calc(100% + 8px); min-width: 240px; padding: 8px; display: flex; flex-direction: column; background: var(--appearance-nav-background); border: 1px solid rgba(0,0,0,.08); border-radius: 12px; box-shadow: 0 16px 40px rgba(0,0,0,.12); opacity: 0; visibility: hidden; transform: translateX(8px); transition: opacity .2s, transform .2s, visibility .2s; }
        .appearance-header .appearance-dropdown-item:hover > .appearance-submenu, .appearance-header .appearance-dropdown-item:focus-within > .appearance-submenu { opacity: 1; visibility: visible; transform: translateX(0); }
        .appearance-header .appearance-actions { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
        .appearance-header .appearance-actions a:not(.appearance-search), .appearance-header .appearance-actions button:not(.appearance-search) { position: relative; display: inline-flex; align-items: center; min-height: 46px; padding: 0 52px 0 22px; border-radius: 999px; font-size: 15px; font-weight: 600; line-height: 1.2; text-decoration: none !important; white-space: nowrap; transition: transform .25s, background .25s, color .25s, box-shadow .25s; border: none; cursor: pointer; font-family: inherit; }
        .appearance-header .appearance-actions button.appearance-search,
        .appearance-header .appearance-search { position: relative; display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 18px; border-radius: 999px; font-size: 15px; font-weight: 600; line-height: 1.2; white-space: nowrap; transition: transform .25s, border-color .25s, box-shadow .25s, background .25s, color .25s; cursor: pointer; font-family: inherit; gap: 8px; min-width: 44px; color: var(--appearance-search-text) !important; -webkit-text-fill-color: var(--appearance-search-text) !important; background: var(--appearance-search-bg) !important; border: 1px solid var(--appearance-desktop-search-border, rgba(0,0,0,.12)); text-decoration: none !important; }
        .appearance-header .appearance-actions button.appearance-search svg,
        .appearance-header .appearance-search svg { color: var(--appearance-search-text); stroke: currentColor; transition: stroke .25s, color .25s; }
        .appearance-header .appearance-desktop .appearance-actions a.appearance-volunteer,
        .appearance-header .appearance-desktop .appearance-actions a.appearance-donate { padding: 0 26px; }
        .appearance-header .appearance-desktop .appearance-btn-icon { display: none; }
        .appearance-header .appearance-btn-label { display: inline-flex; align-items: center; line-height: 1; }
        .appearance-header .appearance-btn-icon { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,.08); }
        .appearance-header .appearance-btn-icon img { width: 14px; height: 14px; object-fit: contain; display: block; }
        .appearance-header .appearance-btn-icon-volunteer { background: #fff; }
        .appearance-header .appearance-btn-icon-donate { background: rgba(255,255,255,.22); }
        .appearance-header .appearance-actions button.appearance-search:hover,
        .appearance-header .appearance-search:hover { border-color: var(--appearance-desktop-search-border, rgba(0,0,0,.12)); background: var(--appearance-search-hover-bg) !important; color: var(--appearance-search-hover-text) !important; -webkit-text-fill-color: var(--appearance-search-hover-text) !important; transform: translateY(-1px); }
        .appearance-header .appearance-actions button.appearance-search:hover svg,
        .appearance-header .appearance-search:hover svg { color: var(--appearance-search-hover-text); stroke: currentColor; }
        .appearance-header .appearance-volunteer { color: var(--appearance-volunteer-text) !important; -webkit-text-fill-color: var(--appearance-volunteer-text) !important; background: var(--appearance-volunteer-bg) !important; box-shadow: 0 2px 8px rgba(0,0,0,.06); transition: transform .25s, background .25s, color .25s, box-shadow .25s; }
        .appearance-header .appearance-volunteer:hover { color: var(--appearance-volunteer-hover-text) !important; -webkit-text-fill-color: var(--appearance-volunteer-hover-text) !important; background: var(--appearance-volunteer-hover-bg) !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.1); }
        .appearance-header .appearance-donate { color: var(--appearance-donate-text) !important; -webkit-text-fill-color: var(--appearance-donate-text) !important; background: var(--appearance-donate-bg) !important; box-shadow: 0 6px 16px rgba(168,45,45,.22); transition: transform .25s, background .25s, color .25s, box-shadow .25s; }
        .appearance-header .appearance-donate:hover { color: var(--appearance-donate-hover-text) !important; -webkit-text-fill-color: var(--appearance-donate-hover-text) !important; background: var(--appearance-donate-hover-bg) !important; transform: translateY(-1px); box-shadow: 0 8px 18px rgba(168,45,45,.28); }
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
        .appearance-header .appearance-search-view-all { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 4px; padding: 12px 14px; background: rgba(168,45,45,.06); border: 1px solid rgba(168,45,45,.16); border-radius: 12px; color: #a82d2d !important; -webkit-text-fill-color: #a82d2d !important; font-size: 14px; font-weight: 600; text-decoration: none !important; transition: background .2s, transform .2s; cursor: pointer; }
        .appearance-header .appearance-search-view-all:hover { background: rgba(168,45,45,.12); transform: translateY(-1px); }
        @media (max-width: 1199px) {
          .appearance-header .appearance-desktop { display: none; }
          .appearance-header .current-mobile { display: block; }
          .appearance-header .current-mobile .site-header-shell { position: fixed !important; top: var(--appearance-header-top, 0) !important; left: 0 !important; right: 0 !important; background: var(--appearance-nav-background) !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; border-bottom: 1px solid rgba(0,0,0,.06) !important; padding: 0 !important; transition: background .35s, box-shadow .35s, border-color .35s !important; }
          .appearance-header.is-scrolled .current-mobile .site-header-shell { background: var(--appearance-nav-background-scrolled) !important; border-bottom-color: transparent !important; box-shadow: 0 2px 16px rgba(0,0,0,.08) !important; }
          .appearance-header.is-preview .current-mobile .site-header-shell { position: relative !important; top: auto !important; padding-top: 0 !important; padding-bottom: 0 !important; }
          .appearance-header .current-mobile .site-header-content { padding-top: 0 !important; padding-bottom: 0 !important; }
          .appearance-header .current-mobile .site-header-main { min-height: 0 !important; height: auto !important; padding: 16px 0 !important; display: flex !important; align-items: center !important; justify-content: flex-start !important; gap: 12px !important; background: transparent !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
          .appearance-header .current-mobile .site-header-shell.is-scrolled .site-header-main { background: transparent !important; }
          .appearance-header .current-mobile .site-header-logo { flex: 0 0 auto !important; display: inline-flex !important; align-items: center !important; }
          .appearance-header .current-mobile .site-header-logo img { display: block !important; width: auto !important; height: 53px !important; max-width: 168px !important; object-fit: contain !important; background: transparent !important; border-radius: 0 !important; padding: 0 !important; }
          .appearance-header .current-mobile .site-header-nav { display: none !important; }
          .appearance-header .current-mobile .site-header-actions { display: none !important; }
          .appearance-header .current-mobile .site-header-mobile-quick-actions { display: flex !important; align-items: center !important; gap: 8px !important; margin-left: auto !important; }
          .appearance-header .current-mobile .site-header-mobile-quick-action { display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 44px !important; height: 44px !important; flex: 0 0 44px !important; padding: 0 !important; border-radius: 50% !important; border: 1.5px solid var(--appearance-responsive-button-border, #A82D2D) !important; background: #fff !important; color: var(--appearance-nav-text) !important; text-decoration: none !important; transition: transform .25s, box-shadow .25s, border-color .25s, background .25s !important; }
          .appearance-header .current-mobile .site-header-mobile-volunteer { background: var(--appearance-responsive-volunteer-circle-bg, #fff) !important; }
          .appearance-header .current-mobile .site-header-mobile-donate { background: var(--appearance-responsive-donate-circle-bg, #A82D2D) !important; }
          .appearance-header .current-mobile .site-header-mobile-quick-action-icon { display: block !important; width: 20px !important; height: 20px !important; flex: 0 0 20px !important; -webkit-mask: var(--mobile-quick-action-icon-url) center / contain no-repeat !important; mask: var(--mobile-quick-action-icon-url) center / contain no-repeat !important; background-color: currentColor !important; }
          .appearance-header .current-mobile .site-header-mobile-volunteer .site-header-mobile-quick-action-icon { color: var(--appearance-responsive-volunteer-icon, #A82D2D) !important; background-color: var(--appearance-responsive-volunteer-icon, #A82D2D) !important; }
          .appearance-header .current-mobile .site-header-mobile-donate .site-header-mobile-quick-action-icon { color: var(--appearance-responsive-donate-icon, #fff) !important; background-color: var(--appearance-responsive-donate-icon, #fff) !important; }
          .appearance-header .current-mobile .site-header-mobile-quick-action img { display: none !important; }
          .appearance-header .current-mobile .site-header-mobile-quick-action:hover { border-color: var(--appearance-responsive-button-border, #A82D2D) !important; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,.08) !important; }
          .appearance-header .current-mobile .site-header-search,
          .appearance-header .current-mobile .site-header-volunteer { display: none !important; }
          .appearance-header .current-mobile .site-header-donate { display: none !important; }
          .appearance-header .current-mobile .site-header-hamburger { display: flex !important; flex: 0 0 44px !important; width: 44px !important; height: 44px !important; padding: 0 !important; color: var(--appearance-nav-text) !important; background: transparent !important; border: 0 !important; border-radius: 0 !important; margin-left: auto !important; }
          .appearance-header .current-mobile .site-header-main:has(.site-header-mobile-quick-actions) .site-header-hamburger { margin-left: 0 !important; }
          .appearance-header .current-mobile .site-header-hamburger:hover { background: rgba(0,0,0,.04) !important; border-radius: 8px !important; }
          .appearance-header .current-mobile .site-mobile-overlay,
          .appearance-header .current-mobile .site-mobile-menu { display: block !important; }
          .appearance-header .current-mobile .site-mobile-menu nav,
          .appearance-header .current-mobile .site-mobile-menu nav * { font-family: var(--appearance-font-display); }
          .appearance-header .current-mobile .site-mobile-menu > div:last-child,
          .appearance-header .current-mobile .site-mobile-menu > div:last-child * { font-family: var(--appearance-font-body); }
          .appearance-header .appearance-search-overlay { padding-top: 72px; }
          .appearance-header .appearance-search-panel { max-height: calc(100vh - 96px); border-radius: 14px; }
        }
        @media (max-width: 480px) {
          .appearance-header .current-mobile .site-header-main { padding: 10px 0 !important; gap: 8px !important; }
          .appearance-header .current-mobile .site-header-logo img { height: 42px !important; max-width: 140px !important; }
          .appearance-header .current-mobile .site-header-mobile-quick-actions { gap: 6px !important; }
          .appearance-header .current-mobile .site-header-mobile-quick-action { width: 38px !important; height: 38px !important; flex: 0 0 38px !important; }
          .appearance-header .current-mobile .site-header-mobile-quick-action-icon { width: 17px !important; height: 17px !important; flex: 0 0 17px !important; }
          .appearance-header .current-mobile .site-header-hamburger { width: 38px !important; height: 38px !important; flex: 0 0 38px !important; }
        }
        @media (min-width: 1200px) {
          .appearance-header .appearance-desktop { display: block; }
          .appearance-header .current-mobile { display: none; }
          .appearance-header .current-mobile .site-header-mobile-quick-actions { display: none !important; }
        }
      ` }} />
    </div>
  );
}
