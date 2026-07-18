const REQUIRED_ENV = ["MONGODB_URI", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
      "Check .env and README for the full list."
    );
  }
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

module.exports = { validateEnv, getSiteUrl };
