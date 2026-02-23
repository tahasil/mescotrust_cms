const CLEANUP_INTERVAL = 5 * 60 * 1000;

export function createRateLimiter({ windowMs = 60_000, max = 5 } = {}) {
  const map = new Map();
  let lastCleanup = Date.now();

  return function checkRateLimit(clientId) {
    const now = Date.now();
    if (now - lastCleanup > CLEANUP_INTERVAL) {
      for (const [key, val] of map) {
        if (now > val.resetAt) map.delete(key);
      }
      lastCleanup = now;
    }
    const bucket = map.get(clientId) || { count: 0, resetAt: now + windowMs };
    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }
    bucket.count++;
    map.set(clientId, bucket);
    return bucket.count <= max;
  };
}

export function getClientIp(req) {
  if (typeof req?.get === "function") {
    return req.get("x-forwarded-for")?.split(",")[0]?.trim() || req.get("x-real-ip") || "unknown";
  }
  const headers = req?.headers;
  if (headers?.get) {
    return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  }
  return "unknown";
}
