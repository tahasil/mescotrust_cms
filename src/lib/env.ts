const required = ["MONGODB_URI", "NEXTAUTH_SECRET", "NEXTAUTH_URL"] as const;

export function validateEnv(): void {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Check README and .env.example.`
    );
  }
}

export function getEnv(key: (typeof required)[number]): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
