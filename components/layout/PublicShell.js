"use client";

import { useState } from "react";
import Link from "next/link";
import ComponentRenderer from "@/components/cms/ComponentRenderer";

function PublicHeader({ menuItems, siteTitle, logoType, logoImageUrl, logoLightUrl, logoDarkUrl, sticky, transparent, layout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenuKey, setOpenSubmenuKey] = useState(null);
  const logoUrl = logoLightUrl || logoImageUrl;
  const title = siteTitle || "Mesco Trust";
  const links = menuItems?.length
    ? menuItems
    : [
        { label: "Home", url: "/", openInNewTab: false },
        { label: "Blog", url: "/blog", openInNewTab: false },
        { label: "Contact", url: "/contact", openInNewTab: false },
      ];

  const closeMenu = () => {
    setMobileOpen(false);
    setOpenSubmenuKey(null);
  };

  const headerClass = [
    "public-header",
    sticky !== false ? "public-header-sticky" : "",
    transparent ? "public-header-transparent" : "",
    layout ? `public-header-${layout}` : "",
  ].filter(Boolean).join(" ");

  const renderLink = (item, closeOnClick = true) => {
    const onClick = closeOnClick ? closeMenu : undefined;
    if (item.openInNewTab) {
      return (
        <a href={item.url || "#"} target="_blank" rel="noopener noreferrer" onClick={onClick}>
          {item.label || "Link"}
        </a>
      );
    }
    return (
      <Link href={item.url || "#"} onClick={onClick}>
        {item.label || "Link"}
      </Link>
    );
  };

  const renderDropdownContent = (child, j, parentKey) => {
    const subChildren = Array.isArray(child.children) ? child.children : [];
    const hasNested = subChildren.length > 0;
    const subKey = `${parentKey}-${j}`;
    const subOpen = openSubmenuKey === subKey;
    if (hasNested) {
      return (
        <div key={subKey} role="none" className="public-nav-dropdown-item public-nav-dropdown-nested">
          <div
            className={`public-nav-dropdown ${subOpen ? "open" : ""}`}
            onMouseEnter={() => setOpenSubmenuKey(subKey)}
            onMouseLeave={() => setOpenSubmenuKey(null)}
          >
            <button
              type="button"
              className="public-nav-dropdown-trigger public-nav-dropdown-trigger-inner"
              onClick={(e) => { e.stopPropagation(); setOpenSubmenuKey((p) => (p === subKey ? null : subKey)); }}
              aria-expanded={subOpen}
              aria-haspopup="true"
            >
              {child.label || "Menu"}
              <span className="public-nav-dropdown-arrow" aria-hidden />
            </button>
            <div className="public-nav-dropdown-menu public-nav-dropdown-submenu" role="menu">
              {subChildren.map((subChild, k) => renderDropdownContent(subChild, k, subKey))}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div key={subKey} role="none" className="public-nav-dropdown-item">
        {child.openInNewTab ? (
          <a href={child.url || "#"} target="_blank" rel="noopener noreferrer" onClick={closeMenu} role="menuitem">
            {child.label || "Link"}
          </a>
        ) : (
          <Link href={child.url || "#"} onClick={closeMenu} role="menuitem">
            {child.label || "Link"}
          </Link>
        )}
      </div>
    );
  };

  const renderNavItem = (item, index, keyPrefix) => {
    const children = Array.isArray(item.children) ? item.children : [];
    const hasSubmenu = children.length > 0;
    const key = keyPrefix !== undefined ? `${keyPrefix}-${index}` : String(index);
    const isOpen = openSubmenuKey === key;

    if (hasSubmenu) {
      return (
        <div
          key={key}
          className={`public-nav-dropdown ${isOpen ? "open" : ""}`}
        >
          <button
            type="button"
            className="public-nav-dropdown-trigger"
            onClick={() => setOpenSubmenuKey((prev) => (prev === key ? null : key))}
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            {item.label || "Menu"}
            <span className="public-nav-dropdown-arrow" aria-hidden />
          </button>
          <div className="public-nav-dropdown-menu" role="menu">
            {children.map((child, j) => renderDropdownContent(child, j, key))}
          </div>
        </div>
      );
    }

    return (
      <div key={key} className="public-nav-link">
        {renderLink(item)}
      </div>
    );
  };

  return (
    <header className={headerClass}>
      <div className="public-header-inner">
        <Link href="/" className="public-logo" aria-label={title}>
          {logoType === "image" && logoUrl ? (
            <img src={logoUrl} alt={title} />
          ) : (
            title
          )}
        </Link>
        <button
          className="hamburger-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-icon ${mobileOpen ? "open" : ""}`} />
        </button>
        <nav className={`public-nav ${mobileOpen ? "mobile-open" : ""}`}>
          {links.map((item, i) => renderNavItem(item, i))}
          <div className="public-nav-link">
            <Link href="/search" onClick={closeMenu} aria-label="Search">Search</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

function PublicFooter({ menuItems, siteTitle, copyrightText, columnsCount, socialIcons, layoutStyle }) {
  const title = siteTitle || "Mesco Trust";
  const copy = copyrightText && copyrightText.trim() ? copyrightText.trim() : `© ${new Date().getFullYear()} ${title}. All rights reserved.`;
  const footerClass = [
    "public-footer",
    layoutStyle ? `public-footer-${layoutStyle}` : "",
  ].filter(Boolean).join(" ");
  return (
    <footer className={footerClass} data-columns={columnsCount}>
      <div className="public-footer-inner">
        {menuItems?.length > 0 && (
          <nav className="footer-nav">
            {menuItems.map((item) =>
              item.openInNewTab ? (
                <a key={item.url + item.label} href={item.url} target="_blank" rel="noopener noreferrer">{item.label}</a>
              ) : (
                <Link key={item.url + item.label} href={item.url}>{item.label}</Link>
              )
            )}
          </nav>
        )}
        {socialIcons !== false && (
          <div className="footer-social" aria-hidden />
        )}
        <p className="footer-copy" dangerouslySetInnerHTML={{ __html: copy }} />
      </div>
    </footer>
  );
}

export default function PublicShell({
  headerItems,
  footerItems,
  customHeaderLayout,
  customFooterLayout,
  siteTitle,
  tagline,
  logoType,
  logoImageUrl,
  logoLightUrl,
  logoDarkUrl,
  footerCopyrightText,
  headerSticky,
  headerTransparent,
  headerLayout,
  footerColumnsCount,
  footerSocialIcons,
  footerLayoutStyle,
  children,
}) {
  const hasCustomHeader = Array.isArray(customHeaderLayout) && customHeaderLayout.length > 0;
  const hasCustomFooter = Array.isArray(customFooterLayout) && customFooterLayout.length > 0;

  return (
    <div className="public-site" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {hasCustomHeader ? (
        <ComponentRenderer layout={customHeaderLayout} />
      ) : (
        <PublicHeader
          menuItems={headerItems}
          siteTitle={siteTitle}
          logoType={logoType}
          logoImageUrl={logoImageUrl}
          logoLightUrl={logoLightUrl}
          logoDarkUrl={logoDarkUrl}
          sticky={headerSticky}
          transparent={headerTransparent}
          layout={headerLayout}
        />
      )}
      <div style={{ flex: 1 }}>{children}</div>
      {hasCustomFooter ? (
        <ComponentRenderer layout={customFooterLayout} />
      ) : (
        <PublicFooter
          menuItems={footerItems}
          siteTitle={siteTitle}
          copyrightText={footerCopyrightText}
          columnsCount={footerColumnsCount}
          socialIcons={footerSocialIcons}
          layoutStyle={footerLayoutStyle}
        />
      )}
    </div>
  );
}
