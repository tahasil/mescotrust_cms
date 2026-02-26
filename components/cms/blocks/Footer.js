"use client";

import Link from "next/link";
import NextImage from "next/image";

function isExternal(url) {
  return /^https?:\/\//.test(url || "") || (url || "").startsWith("//");
}

/** Split phone string into lines (newline or comma). */
function phoneLines(phone) {
  if (!phone || typeof phone !== "string") return [];
  return phone
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const SOCIAL_ICONS = {
  facebook: "f",
  twitter: "𝕏",
  instagram: "📷",
  linkedin: "in",
  youtube: "▶",
  github: "⌨",
  whatsapp: "💬",
  telegram: "✈",
};

export default function FooterBlock({
  logoImage = "",
  logoTitle = "",
  logoTagline = "",
  logoUrl = "",
  columns = [],
  socialLinks = [],
  address = "",
  phone = "",
  email = "",
  copyrightText = "",
  backgroundColor = "#1a1a1a",
  textColor = "#ccc",
  linkColor = "#fff",
  copyrightBarColor = "#c0392b",
  paddingY = 48,
  paddingX = 24,
}) {
  const columnsList = Array.isArray(columns) ? columns : [];
  const socialList = Array.isArray(socialLinks) ? socialLinks : [];
  const phones = phoneLines(phone);

  const footerStyle = {
    background: backgroundColor || "#1a1a1a",
    color: textColor || "#ccc",
    padding: `${Number(paddingY) || 48}px ${Number(paddingX) || 24}px`,
  };

  const linkStyle = {
    color: linkColor || "#fff",
    textDecoration: "none",
    fontSize: "0.9rem",
    opacity: 0.9,
  };

  const logoSection = (logoTitle || logoImage) && (
    <div style={{ marginBottom: 20 }}>
      {logoUrl ? (
        <Link href={logoUrl} style={{ display: "inline-block", textDecoration: "none", color: "inherit" }}>
          {logoImage ? (
            <NextImage src={logoImage} alt={logoTitle} width={120} height={40} style={{ objectFit: "contain" }} />
          ) : (
            <>
              <div style={{ fontWeight: 700, fontSize: "1.25rem", letterSpacing: "0.05em", color: linkColor }}>{logoTitle || "Logo"}</div>
              {logoTagline && <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: 2 }}>{logoTagline}</div>}
            </>
          )}
        </Link>
      ) : (
        <>
          {logoImage ? (
            <NextImage src={logoImage} alt={logoTitle} width={120} height={40} style={{ objectFit: "contain" }} />
          ) : (
            <>
              <div style={{ fontWeight: 700, fontSize: "1.25rem", letterSpacing: "0.05em", color: linkColor }}>{logoTitle || "Logo"}</div>
              {logoTagline && <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: 2 }}>{logoTagline}</div>}
            </>
          )}
        </>
      )}
    </div>
  );

  const linkCols = columnsList.map((col, i) => {
    const links = Array.isArray(col.links) ? col.links : [];
    return (
      <div key={i} style={{ minWidth: 140 }}>
        {col.title ? (
          <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 12, color: linkColor }}>{col.title}</div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {links.map((link, j) => {
            const href = link.url || "#";
            const content = link.label || "Link";
            if (isExternal(href)) {
              return (
                <a key={j} href={href} target="_blank" rel="noopener noreferrer" style={linkStyle}>{content}</a>
              );
            }
            return (
              <Link key={j} href={href} style={linkStyle}>{content}</Link>
            );
          })}
        </div>
      </div>
    );
  });

  const hasCol1 = logoSection || address || email || socialList.length > 0;
  const col1 = hasCol1 && (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: "0.9rem", lineHeight: 1.6 }}>
      {logoSection}
      {address ? <span style={{ whiteSpace: "pre-line" }}>{address}</span> : null}
      {email ? (
        <a href={`mailto:${email}`} style={linkStyle}>{email}</a>
      ) : null}
      {socialList.length > 0 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          {socialList.map((link, i) => {
            const icon = SOCIAL_ICONS[link.platform?.toLowerCase()] || link.platform?.charAt(0)?.toUpperCase() || "?";
            return (
              <a
                key={i}
                href={link.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                title={link.platform}
                style={{
                  ...linkStyle,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.1)",
                  fontSize: 14,
                }}
              >
                {icon}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );

  const col2 = phones.length > 0 && (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.9rem", lineHeight: 1.5 }}>
      {phones.map((line, i) => (
        <span key={i} style={{ display: "block" }}>{line}</span>
      ))}
    </div>
  );

  const copyrightBarBg = copyrightBarColor || "#c0392b";

  return (
    <footer style={footerStyle} className="cms-footer">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "32px 40px",
          marginBottom: 0,
        }}
      >
        {col1}
        {col2}
        {linkCols}
      </div>
      <div
        style={{
          marginTop: 0,
          marginLeft: -Number(paddingX) || -24,
          marginRight: -Number(paddingX) || -24,
          marginBottom: -Number(paddingY) || -48,
          padding: "12px 24px",
          background: copyrightBarBg,
          textAlign: "center",
          fontSize: "0.9rem",
          color: "#fff",
        }}
      >
        {copyrightText || `© ${new Date().getFullYear()} All rights reserved.`}
      </div>
    </footer>
  );
}
