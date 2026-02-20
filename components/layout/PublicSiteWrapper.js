"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

function PublicHeader({ menuItems }) {
  if (!menuItems?.length) {
    return (
      <header style={{ borderBottom: "1px solid #eee", padding: "1rem 2rem" }}>
        <nav style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/" style={{ fontWeight: 600 }}>Home</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </header>
    );
  }
  return (
    <header style={{ borderBottom: "1px solid #eee", padding: "1rem 2rem" }}>
      <nav style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        {menuItems.map((item) => (
          item.openInNewTab ? (
            <a key={item.url + item.label} href={item.url} target="_blank" rel="noopener noreferrer">{item.label}</a>
          ) : (
            <Link key={item.url + item.label} href={item.url}>{item.label}</Link>
          )
        ))}
      </nav>
    </header>
  );
}

export default function PublicSiteWrapper({ children }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState(null);
  const [menu, setMenu] = useState(null);
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;
    fetch("/api/theme")
      .then((r) => r.ok ? r.json() : null)
      .then(setTheme)
      .catch(() => {});
    fetch("/api/public/menus?name=header")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setMenu(data?.items || []))
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin || !theme) return;
    const root = document.documentElement;
    root.setAttribute("dir", theme.direction || "ltr");
    root.style.setProperty("--primary-color", theme.primaryColor || "#1890ff");
    root.style.setProperty("--font-family", theme.fontFamily || "system-ui, sans-serif");
  }, [isAdmin, theme]);

  if (isAdmin) return children;

  return (
    <>
      <PublicHeader menuItems={menu} />
      {children}
    </>
  );
}
