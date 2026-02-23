"use client";

import Link from "next/link";
import NextImage from "next/image";

function isExternal(url) {
  return /^https?:\/\//.test(url || "") || (url || "").startsWith("//");
}

const ChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: 4, verticalAlign: "middle" }}>
    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 6, verticalAlign: "middle" }}>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const HeartPlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 6, verticalAlign: "middle" }}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35zM17 8v3h-3v2h3v3h2v-3h3v-2h-3V8h-2z" />
  </svg>
);

export default function HeaderBlock({
  logoImage = "",
  logoTitle = "MESCO",
  logoTagline = "A TRUST SINCE 1960",
  logoUrl = "",
  navItems = [],
  actionButtons = [],
  headerBackground = "",
  navColor = "#333",
  primaryButtonBg = "#a52a2a",
  primaryButtonText = "#fff",
  secondaryButtonBg = "#f4c4c4",
  secondaryButtonText = "#8b0000",
  paddingY = 16,
  paddingX = 0,
}) {
  const navItemsList = Array.isArray(navItems) ? navItems : [];
  const actionButtonsList = Array.isArray(actionButtons) ? actionButtons : [];

  const headerStyle = {
    background: headerBackground || "transparent",
    padding: `${Number(paddingY) || 16}px ${Number(paddingX) || 0}`,
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
  };

  const logoSection = (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
      {logoUrl ? (
        <Link href={logoUrl} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>
          {logoImage ? (
            <NextImage src={logoImage} alt={logoTitle} width={120} height={48} style={{ objectFit: "contain" }} />
          ) : (
            <div style={{ textAlign: "left" }}>
              <div style={{ borderTop: "1px solid currentColor", width: "100%", marginBottom: 2 }} />
              <div style={{ fontWeight: 700, fontSize: "1.25rem", letterSpacing: "0.05em", color: navColor }}>
                {logoTitle || "Logo"}
              </div>
              <div style={{ borderBottom: "1px solid currentColor", width: "100%", marginTop: 2 }} />
              {logoTagline && (
                <div style={{ fontSize: "0.7rem", fontWeight: 500, color: navColor, opacity: 0.9, marginTop: 2, letterSpacing: "0.02em" }}>
                  {logoTagline}
                </div>
              )}
            </div>
          )}
        </Link>
      ) : (
        <>
          {logoImage ? (
            <NextImage src={logoImage} alt={logoTitle} width={120} height={48} style={{ objectFit: "contain" }} />
          ) : null}
          <div style={{ textAlign: "left" }}>
            <div style={{ borderTop: "1px solid currentColor", width: "100%", marginBottom: 2 }} />
            <div style={{ fontWeight: 700, fontSize: "1.25rem", letterSpacing: "0.05em", color: navColor }}>
              {logoTitle || "Logo"}
            </div>
            <div style={{ borderBottom: "1px solid currentColor", width: "100%", marginTop: 2 }} />
            {logoTagline && (
              <div style={{ fontSize: "0.7rem", fontWeight: 500, color: navColor, opacity: 0.9, marginTop: 2, letterSpacing: "0.02em" }}>
                {logoTagline}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const navSection = (
    <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
      {navItemsList.map((item, i) => {
        const url = item.url || "#";
        const linkStyle = {
          color: navColor,
          textDecoration: "none",
          fontWeight: 500,
          fontSize: "0.95rem",
          display: "inline-flex",
          alignItems: "center",
        };
        const content = (
          <>
            {item.label || "Link"}
            {(item.hasDropdown || item.dropdown) && <ChevronDown />}
          </>
        );
        if (isExternal(url)) {
          return (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              {content}
            </a>
          );
        }
        return (
          <Link key={i} href={url} style={linkStyle}>
            {content}
          </Link>
        );
      })}
    </nav>
  );

  const renderPillButton = (btn, isPrimary, key) => {
    const bg = isPrimary ? (btn.background || primaryButtonBg) : (btn.background || secondaryButtonBg);
    const color = isPrimary ? (btn.color || primaryButtonText) : (btn.color || secondaryButtonText);
    const style = {
      display: "inline-flex",
      alignItems: "center",
      padding: "0.5rem 1.25rem",
      borderRadius: 9999,
      fontWeight: 600,
      fontSize: "0.9rem",
      textDecoration: "none",
      border: "none",
      cursor: "pointer",
      background: bg,
      color,
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    };
    const icon = btn.icon === "person" ? <PersonIcon /> : btn.icon === "heart" ? <HeartPlusIcon /> : null;
    const label = btn.label || "Button";
    const url = btn.url || "#";

    if (isExternal(url)) {
      return (
        <a key={key} href={url} target="_blank" rel="noopener noreferrer" style={style}>
          {label}
          {icon}
        </a>
      );
    }
    return (
      <Link key={key} href={url} style={style}>
        {label}
        {icon}
      </Link>
    );
  };

  const actionsSection = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
      {actionButtonsList.map((btn, i) => {
        const isPrimary = (btn.variant || "primary") === "primary";
        return renderPillButton(btn, isPrimary, `header-btn-${i}`);
      })}
    </div>
  );

  return (
    <header style={headerStyle} className="cms-header">
      <div style={rowStyle}>
        {logoSection}
        {navSection}
        {actionsSection}
      </div>
    </header>
  );
}
