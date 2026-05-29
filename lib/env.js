const REQUIRED_ENV = ["MONGODB_URI", "NEXTAUTH_SECRET"];

function normalizeAbsoluteUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    return parsed.origin;
  } catch {
    return "";
  }
}

function toHttpsUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return normalizeAbsoluteUrl(raw);
  return normalizeAbsoluteUrl(`https://${raw}`);
}

function getConfiguredPublicUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.APP_URL,
    process.env.NEXTAUTH_URL,
    toHttpsUrl(process.env.VERCEL_URL),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeAbsoluteUrl(candidate);
    if (normalized) return normalized;
  }

  return "";
}

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
      "Check .env.local and README for the full list."
    );
  }
}

function getSiteUrl() {
  const configured = getConfiguredPublicUrl();
  if (configured) return configured;
  if (String(process.env.NODE_ENV) !== "production") return "http://localhost:3000";
  return "http://localhost:3000";
}

function getAuthRedirectBaseUrl(fallbackBaseUrl = "") {
  const configured = getConfiguredPublicUrl();
  const fallback = normalizeAbsoluteUrl(fallbackBaseUrl);
  const vercel = toHttpsUrl(process.env.VERCEL_URL);

  if (String(process.env.NODE_ENV) === "production") {
    return configured || fallback || vercel || "";
  }

  return configured || fallback || "http://localhost:3000";
}

function getAdminLoginRedirectUrl(fallbackBaseUrl = "") {
  const base = getAuthRedirectBaseUrl(fallbackBaseUrl);
  return `${base}/admin/login`;
}

module.exports = {
  validateEnv,
  getSiteUrl,
  getConfiguredPublicUrl,
  getAuthRedirectBaseUrl,
  getAdminLoginRedirectUrl,
};
