const REQUIRED_ENV = ["MONGODB_URI", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];

const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/i;
const LOCAL_URL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:\d+)?/i;

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
      "Check .env and README for the full list."
    );
  }
}

function trimSlashes(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function isLocalUrl(value) {
  return LOCAL_URL.test(String(value || "").trim());
}

/** Configured site URL, always without a trailing slash. */
function getSiteUrl() {
  return trimSlashes(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL) ||
    "http://localhost:3000";
}

/**
 * Site URL that is correct for the *current* request.
 *
 * Deployments frequently leave `NEXT_PUBLIC_SITE_URL` unset (or pointing at
 * localhost). Every absolute URL we emit — sitemap entries, robots.txt sitemap
 * directive, canonical tags, `og:url`, `og:image` — then points at localhost,
 * which search engines cannot crawl.
 *
 * Resolution order:
 *   1) `NEXT_PUBLIC_SITE_URL` — used whenever it is a real (non-local) host.
 *   2) `NEXTAUTH_URL`         — same rule.
 *   3) The incoming request    — derived from `x-forwarded-proto` + `host`,
 *                                so each deployment gets its own domain.
 *   4) `getSiteUrl()`          — last-resort fallback.
 *
 * Step 3 keeps local development on `http://localhost:3000` while production
 * automatically emits the public domain.
 */
async function getRequestSiteUrl() {
  const configured = trimSlashes(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured && !isLocalUrl(configured)) return configured;

  const authUrl = trimSlashes(process.env.NEXTAUTH_URL);
  if (!configured && authUrl && !isLocalUrl(authUrl)) return authUrl;

  try {
    // Lazy require: `next/headers` is only available in a request scope and
    // this module is also imported from plain Node scripts.
    // eslint-disable-next-line global-require
    const { headers } = require("next/headers");
    const requestHeaders = typeof headers === "function" ? headers() : null;
    if (requestHeaders) {
      const host =
        requestHeaders.get("x-forwarded-host") ||
        requestHeaders.get("host") ||
        "";
      if (host) {
        const cleanHost = String(host).split(",")[0].trim();
        const forwardedProto = String(
          requestHeaders.get("x-forwarded-proto") || "",
        )
          .split(",")[0]
          .trim();
        const isLocalHost = LOCAL_HOSTS.test(cleanHost) || cleanHost.includes("localhost");
        const protocol =
          forwardedProto ||
          (cleanHost.startsWith("localhost") || cleanHost.startsWith("127.") || cleanHost.startsWith("[")
            ? "http"
            : "https");
        const derived = `${protocol}://${cleanHost}`;
        // Never let a proxy header downgrade a properly configured site URL.
        if (!isLocalUrl(configured) && configured) return configured;
        return derived;
      }
    }
  } catch {
    // Outside a request scope (scripts, generateStaticParams, tests).
  }

  return getSiteUrl();
}

module.exports = { validateEnv, getSiteUrl, getRequestSiteUrl, isLocalUrl };
