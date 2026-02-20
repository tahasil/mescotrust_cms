const required = ["MONGODB_URI", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];

/**
 * Validate required environment variables at startup.
 * Throws with a clear message if any are missing.
 */
function validateEnv() {
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Set them in .env or .env.local. See .env.example."
    );
  }
}

module.exports = { validateEnv };
