/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compiler: {
    styledComponents: true,
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  experimental: {
    // Tree-shake the giant antd / icons / dnd-kit barrel exports so the
    // browser only pays for the components actually imported.
    optimizePackageImports: [
      "antd",
      "@ant-design/icons",
      "react-bootstrap",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
    // Admin CMS can replace images in-place. Keep the optimizer cache short so
    // updates propagate without a rebuild; browsers/CDN still get long cache
    // via the `Cache-Control` headers below for content-addressed paths.
    minimumCacheTTL: 300, // 5 minutes
  },
  async rewrites() {
    return [
      {
        source: "/media/:id([0-9a-fA-F]{24})",
        destination: "/api/media/:id",
      },
    ];
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const longCache = "public, max-age=31536000, immutable";
    // In `next dev`, /_next/static chunks are served under STABLE (non-hashed)
    // names, so an immutable year-long cache makes the browser serve stale JS
    // forever across edits and dev restarts (working pages look broken/empty).
    // Only cache-forever in a production build, where chunk URLs are content-hashed.
    const staticCache = isDev ? "no-cache" : longCache;
    // Admin CMS may replace uploaded files at the same /uploads path. Keep a
    // short fresh window (60s) so changes propagate without a rebuild, with a
    // long stale-while-revalidate window so most loads still hit cache.
    const uploadCache = "public, max-age=60, stale-while-revalidate=86400";
    return [
      // Next.js static assets — content-hashed in production (cache forever),
      // but revalidated in dev so edits are never masked by a stale cache.
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: staticCache }],
      },
      // User-uploaded media. Short fresh window so CMS edits show up quickly.
      {
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: uploadCache }],
      },
      // Static images shipped with the app build — content-addressed.
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: staticCache }],
      },
      // App-shipped static JS (e.g. /js/* polyfills bundled in /public).
      {
        source: "/js/:path*",
        headers: [{ key: "Cache-Control", value: staticCache }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // MESCO loads Bootstrap from jsdelivr (app/(site)/layout.js) — keep
              // cdn.jsdelivr.net + blob: here (decision 6.7c: keep jsdelivr, do not self-host).
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdn.jsdelivr.net https://www.instagram.com https://platform.twitter.com https://connect.facebook.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "media-src 'self' data: blob: https:",
              "connect-src 'self' https://api.resend.com https://cdn.jsdelivr.net",
              "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://www.google.com https://maps.google.com https://www.instagram.com https://instagram.com https://www.facebook.com https://web.facebook.com https://platform.twitter.com https://syndication.twitter.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
