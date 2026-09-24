"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const QUICK_LINKS = [
  { label: "Home", href: "/", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Donate Now", href: "/donate", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { label: "About Us", href: "/about-us", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Education Schemes", href: "/education", icon: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" },
  { label: "Medical Aid", href: "/medical-aid", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { label: "Careers", href: "/careers", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { label: "News & Stories", href: "/blog", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
  { label: "Contact Us", href: "/contact", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
];

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #FAF6EF 0%, #F5EFE6 100%)",
        color: "#211E30",
        fontFamily: '"Instrument Sans", system-ui, -apple-system, sans-serif',
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          position: "relative",
          textAlign: "center",
          maxWidth: 760,
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Giant Watermark Badge */}
        <div
          style={{
            userSelect: "none",
            lineHeight: 0.9,
            marginBottom: 8,
          }}
          aria-hidden="true"
        >
          <span
            style={{
              fontSize: "clamp(100px, 20vw, 180px)",
              fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
              fontWeight: 800,
              color: "#D32F2F",
              opacity: 0.12,
              letterSpacing: "-0.04em",
              display: "inline-block",
            }}
          >
            404
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(28px, 4.5vw, 44px)",
            fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
            fontWeight: 700,
            color: "#211E30",
            margin: "0 0 12px 0",
            letterSpacing: "-0.02em",
          }}
        >
          Page Not Found
        </h1>

        <p
          style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "rgba(33, 30, 48, 0.7)",
            lineHeight: 1.6,
            maxWidth: 500,
            margin: "0 auto 32px auto",
          }}
        >
          The page you are looking for might have been moved, renamed, or is temporarily unavailable.
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          style={{
            maxWidth: 480,
            margin: "0 auto 40px auto",
            display: "flex",
            gap: 8,
          }}
        >
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search programs, blogs, services..."
            aria-label="Search site content"
            style={{
              flex: 1,
              padding: "14px 20px",
              borderRadius: "999px",
              border: "1px solid rgba(33, 30, 48, 0.2)",
              background: "#FFFFFF",
              fontSize: 15,
              color: "#211E30",
              outline: "none",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "14px 28px",
              borderRadius: "999px",
              background: "#D32F2F",
              color: "#FFFFFF",
              border: "none",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s ease, transform 0.2s ease",
            }}
          >
            Search
          </button>
        </form>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap",
            marginBottom: 48,
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 32px",
              background: "#211E30",
              color: "#FAF6EF",
              borderRadius: "999px",
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 6px 20px rgba(33, 30, 48, 0.15)",
              transition: "transform 0.2s ease",
            }}
          >
            Back to Home
          </Link>

          <button
            type="button"
            onClick={() => router.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 32px",
              background: "transparent",
              color: "#211E30",
              border: "1px solid rgba(33, 30, 48, 0.25)",
              borderRadius: "999px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s ease, border-color 0.2s ease",
            }}
          >
            ← Previous Page
          </button>
        </div>

        {/* Quick Links Section */}
        <div
          style={{
            borderTop: "1px solid rgba(33, 30, 48, 0.1)",
            paddingTop: 36,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "rgba(33, 30, 48, 0.5)",
              marginBottom: 20,
            }}
          >
            Popular Destinations
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 16px",
                  background: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(33, 30, 48, 0.08)",
                  borderRadius: 12,
                  color: "#211E30",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: 16, height: 16, color: "#D32F2F" }}
                  aria-hidden="true"
                >
                  <path d={link.icon} />
                </svg>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
