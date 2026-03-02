"use client";

import Link from "next/link";

/**
 * Site component: Footer (static UI + content).
 * Edit this file to change footer layout and content.
 * Receives theme/menu props when used as global component.
 */
export default function Footer({
  menuItems = [],
  siteTitle = "Mesco Trust",
  copyrightText = "",
  columnsCount = 4,
  socialIcons = true,
  layoutStyle = "default",
}) {
  const title = siteTitle || "Mesco Trust";
  const copy =
    copyrightText && copyrightText.trim()
      ? copyrightText.trim()
      : `© ${new Date().getFullYear()} ${title}. All rights reserved.`;
  const footerClass = ["public-footer", layoutStyle ? `public-footer-${layoutStyle}` : ""].filter(Boolean).join(" ");

  return (
    <footer className={footerClass} data-columns={columnsCount}>
      <div className="public-footer-inner">
        {menuItems?.length > 0 && (
          <nav className="footer-nav">
            {menuItems.map((item) =>
              item.openInNewTab ? (
                <a key={item.url + item.label} href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.label}
                </a>
              ) : (
                <Link key={item.url + item.label} href={item.url}>
                  {item.label}
                </Link>
              )
            )}
          </nav>
        )}
        {socialIcons !== false && <div className="footer-social" aria-hidden />}
        <p className="footer-copy" dangerouslySetInnerHTML={{ __html: copy }} />
      </div>
    </footer>
  );
}
