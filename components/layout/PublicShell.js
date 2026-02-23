"use client";

import { useState } from "react";
import Link from "next/link";

function PublicHeader({ menuItems, siteTitle, logoType, logoImageUrl }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const title = siteTitle || "Mesco Trust";
  const links = menuItems?.length
    ? menuItems
    : [
        { label: "Home", url: "/", openInNewTab: false },
        { label: "Blog", url: "/blog", openInNewTab: false },
        { label: "Contact", url: "/contact", openInNewTab: false },
      ];

  return (
    <header className="public-header">
      <div className="public-header-inner">
        <Link href="/" className="public-logo" aria-label={title}>
          {logoType === "image" && logoImageUrl ? (
            <img src={logoImageUrl} alt={title} />
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

function PublicFooter({ menuItems, siteTitle }) {
  const title = siteTitle || "Mesco Trust";
  return (
    <footer className="public-footer">
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
        <p className="footer-copy">&copy; {new Date().getFullYear()} {title}. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function PublicShell({ headerItems, footerItems, siteTitle, logoType, logoImageUrl, children }) {
  return (
    <div className="public-site" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader menuItems={headerItems} siteTitle={siteTitle} logoType={logoType} logoImageUrl={logoImageUrl} />
      <div style={{ flex: 1 }}>{children}</div>
      <PublicFooter menuItems={footerItems} siteTitle={siteTitle} />
    </div>
  );
}
