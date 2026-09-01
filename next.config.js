/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // React-PDF's PDF.js worker is an ES module. Next.js 14 requires the
  // non-SWC minifier path to preserve the worker's import.meta syntax.
  swcMinify: false,
  compiler: {
    styledComponents: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
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
    return [
      {
        // The shared PDF viewer endpoint supplies its own same-origin-only
        // framing policy so PDFs can render inside the reusable modal.
        source: "/((?!api/public/pdf-viewer).*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-XSS-Protection", value: "0" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "form-action 'self' https://test.ccavenue.com https://secure.ccavenue.com https://api.razorpay.com",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://checkout.razorpay.com https://cdn.jsdelivr.net https://www.instagram.com https://platform.twitter.com https://connect.facebook.net https://www.google.com https://www.gstatic.com https://www.recaptcha.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://lumberjack-cx.razorpay.com https://api.resend.com https://cdn.jsdelivr.net https://www.google.com https://www.gstatic.com https://www.recaptcha.net",
              "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://www.google.com https://maps.google.com https://www.recaptcha.net https://www.instagram.com https://instagram.com https://www.facebook.com https://web.facebook.com https://platform.twitter.com https://syndication.twitter.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
