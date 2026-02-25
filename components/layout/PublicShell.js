"use client";

import { useState } from "react";
import Link from "next/link";
import ComponentRenderer from "@/components/cms/ComponentRenderer";

function PublicHeader({ menuItems, siteTitle, logoType, logoImageUrl, logoLightUrl, logoDarkUrl, sticky, transparent, layout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoUrl = logoLightUrl || logoImageUrl;
  const title = siteTitle || "Mesco Trust";
  const links = menuItems?.length
    ? menuItems
    : [
        { label: "Home", url: "/", openInNewTab: false },
        { label: "Blog", url: "/blog", openInNewTab: false },
        { label: "Contact", url: "/contact", openInNewTab: false },
      ];

  const headerClass = [
    "public-header",
    sticky !== false ? "public-header-sticky" : "",
    transparent ? "public-header-transparent" : "",
    layout ? `public-header-${layout}` : "",
  ].filter(Boolean).join(" ");

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
          {links.map((item) =>
            item.openInNewTab ? (
              <a key={item.url + item.label} href={item.url} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}>
                {item.label}
              </a>
            ) : (
              <Link key={item.url + item.label} href={item.url} onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
            )
          )}
          <Link href="/search" onClick={() => setMobileOpen(false)} aria-label="Search">Search</Link>
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
      <PublicFooter
        menuItems={footerItems}
        siteTitle={siteTitle}
        copyrightText={footerCopyrightText}
        columnsCount={footerColumnsCount}
        socialIcons={footerSocialIcons}
        layoutStyle={footerLayoutStyle}
      />
    </div>
  );
}
