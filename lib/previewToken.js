import crypto from "crypto";

const DEFAULT_TTL_SECONDS = 15 * 60;

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  return Buffer.from(padded, "base64").toString("utf8");
}

function getSecret() {
  const configured = process.env.PREVIEW_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing PREVIEW_TOKEN_SECRET/NEXTAUTH_SECRET for preview tokens in production");
  }
  return "local-preview-token-secret-change-me";
}

function signData(data) {
  return toBase64Url(
    crypto.createHmac("sha256", getSecret()).update(data).digest(),
  );
}

export function createPreviewToken(payload, options = {}) {
  const ttl = Math.max(60, Number(options.ttlSeconds) || DEFAULT_TTL_SECONDS);
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + ttl,
  };
  const encoded = toBase64Url(JSON.stringify(body));
  const signature = signData(encoded);
  return `${encoded}.${signature}`;
}

export function verifyPreviewToken(token) {
  const value = String(token || "");
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;
  const expected = signData(encoded);
  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expected);
  if (sigA.length !== sigB.length) return null;
  if (!crypto.timingSafeEqual(sigA, sigB)) return null;
  try {
    const payload = JSON.parse(fromBase64Url(encoded));
    const now = Math.floor(Date.now() / 1000);
    if (!payload || typeof payload !== "object") return null;
    if (Number(payload.exp) <= now) return null;
    return payload;
  } catch {
    return null;
  }
}
