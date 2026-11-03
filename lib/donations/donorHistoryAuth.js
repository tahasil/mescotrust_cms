import crypto from "crypto";
import { signToken, verifySignedToken } from "./signedToken.js";

/**
 * Donor history (UAT DON-05) verification and session rules.
 *
 * A donor proves they own the email address on their donations with a
 * one-time code, then gets a short signed session cookie that only the
 * `/api/public/donor-history` routes accept. Everything here is pure (builtin
 * and relative imports only) so `scripts/test-donor-history-contracts.js` can
 * `require` it without the Next.js `@/` alias.
 */

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_SEND_WINDOW_MS = 60 * 60 * 1000;
export const OTP_MAX_SENDS_PER_WINDOW = 5;

export const SESSION_TTL_MS = 30 * 60 * 1000;
export const SESSION_COOKIE_NAME = "mesco_donor_history";
export const SESSION_COOKIE_PATH = "/api/public/donor-history";
export const SESSION_PURPOSE = "donor-history";

export const HISTORY_PAGE_SIZE = 20;

export const VERIFY_OTP_FAILED_MESSAGE =
  "That code is incorrect or has expired. Check the latest email from us or request a new code.";

// Separates this key from the raw NEXTAUTH_SECRET that the donor lookup uses,
// so a lookup `verificationProof` can never be replayed as a history session.
const KEY_CONTEXT = "mesco:donor-history:v1";

/** Derived signing key, or "" when NEXTAUTH_SECRET is missing (callers fail closed). */
export function getHistoryKey(env = process.env) {
  const secret = String(env?.NEXTAUTH_SECRET || "").trim();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(KEY_CONTEXT).digest("hex");
}

export function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? ""));
}

export function toDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function escapeRegex(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Stored mobiles may or may not carry a 0 / 91 prefix, so match all forms. */
export function getMobileVariants(rawValue) {
  const digits = toDigits(rawValue);
  if (!digits) return [];
  const normalized = digits.replace(/^0+/, "");
  const variants = new Set([digits, normalized]);

  if (normalized.length > 10) {
    variants.add(normalized.slice(-10));
  }
  if (normalized.length === 10) {
    variants.add(`91${normalized}`);
    variants.add(`0${normalized}`);
  }

  return [...variants].filter(Boolean);
}

/**
 * Accepts an email, or a mobile number of 10 to 15 digits (spaces, dashes,
 * brackets and a leading + allowed). Returns null for anything else.
 */
export function parseIdentifier(rawValue) {
  const value = String(rawValue ?? "").trim();
  if (!value || value.length > 254) return null;

  if (value.includes("@")) {
    const email = normalizeEmail(value);
    return isValidEmail(email) ? { type: "email", email } : null;
  }

  if (!/^[+\d\s()-]+$/.test(value)) return null;
  const digits = toDigits(value);
  if (digits.length < 10 || digits.length > 15) return null;
  return { type: "mobile", mobile: digits, variants: getMobileVariants(digits) };
}

/**
 * "chandni@gmail.com" -> "ch*****@gmail.com". Tells the donor which inbox to
 * check (they may have typed a mobile) without printing the full address.
 */
export function maskEmailForDisplay(value) {
  const email = normalizeEmail(value);
  const at = email.lastIndexOf("@");
  if (at < 1) return "";
  const local = email.slice(0, at);
  const keep = local.length <= 2 ? 1 : 2;
  return `${local.slice(0, keep)}${"*".repeat(Math.max(3, local.length - keep))}${email.slice(at)}`;
}

/** Mongo filter fragment matching `donor.mobile` in any stored form. */
export function buildMobileMatch(variants = []) {
  const conditions = [{ "donor.mobile": { $in: variants } }];
  const national = variants.find((value) => value.length === 10);
  if (national) {
    conditions.push({ "donor.mobile": { $regex: new RegExp(`${escapeRegex(national)}$`) } });
  }
  return { $or: conditions };
}

/** Only completed, non-deleted donations are ever shown or used to send a code. */
export function getHistoryFilter(email) {
  return {
    "donor.email": normalizeEmail(email),
    status: "success",
    isDeleted: { $ne: true },
  };
}

export function generateOtp() {
  return String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

export function generateChallengeId() {
  return crypto.randomBytes(16).toString("hex");
}

export function isValidChallengeId(value) {
  return /^[a-f0-9]{32}$/.test(String(value ?? ""));
}

/** The plain code is never stored; only this hash, bound to its challenge. */
export function hashOtp(challengeId, code, key) {
  if (!key) throw new Error("hashOtp: missing key");
  return crypto
    .createHmac("sha256", key)
    .update(`otp:${challengeId}:${code}`)
    .digest("hex");
}

export function otpMatches(challengeId, code, storedHash, key) {
  const normalized = toDigits(code);
  if (!key || !storedHash || normalized.length !== OTP_LENGTH) return false;
  const expected = Buffer.from(hashOtp(challengeId, normalized, key), "hex");
  const actual = Buffer.from(String(storedHash), "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function issueHistorySession(email, key, now = Date.now()) {
  return signToken(
    {
      purpose: SESSION_PURPOSE,
      email: normalizeEmail(email),
      iat: now,
      exp: now + SESSION_TTL_MS,
    },
    key,
  );
}

/** Returns `{ email, exp }` for a valid, unexpired history session, else null. */
export function readHistorySession(token, key, now = Date.now()) {
  const payload = verifySignedToken(token, key);
  if (!payload || payload.purpose !== SESSION_PURPOSE) return null;
  const email = normalizeEmail(payload.email);
  const exp = Number(payload.exp);
  if (!isValidEmail(email) || !Number.isFinite(exp) || now > exp) return null;
  return { email, exp };
}

export function isSecureRequest(req) {
  const forwarded = String(req?.headers?.get?.("x-forwarded-proto") || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (forwarded) return forwarded === "https";
  return req?.nextUrl?.protocol === "https:";
}

export function getSessionCookieOptions({ secure = false, maxAgeSeconds } = {}) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: Boolean(secure),
    path: SESSION_COOKIE_PATH,
    maxAge: maxAgeSeconds ?? Math.floor(SESSION_TTL_MS / 1000),
  };
}

export const HISTORY_PROJECTION = Object.freeze({
  _id: 0,
  orderId: 1,
  amount: 1,
  currency: 1,
  purpose: 1,
  schemes: 1,
  donationCategory: 1,
  completedAt: 1,
  createdAt: 1,
  "payment.transactionId": 1,
  "payment.paymentMode": 1,
});

/**
 * Whitelist mapping for one history row. Built field by field so donor PII
 * (PAN, address, mobile) can't leak even if the query projection changes.
 */
export function toHistoryItem(doc = {}) {
  const schemes = Array.isArray(doc.schemes)
    ? doc.schemes
        .filter((item) => item && (item.schemeName || item.schemeId))
        .map((item) => ({
          name: String(item.schemeName || item.schemeId || "").trim(),
          quantity: Math.max(1, Number(item.quantity) || 1),
          subtotal: Number(item.subtotal) || 0,
        }))
    : [];

  return {
    orderId: String(doc.orderId || ""),
    date: doc.completedAt || doc.createdAt || null,
    amount: Number(doc.amount) || 0,
    currency: String(doc.currency || "INR"),
    purpose: String(doc.purpose || "").trim(),
    schemes,
    category: String(doc.donationCategory || "").trim(),
    paymentMode: String(doc?.payment?.paymentMode || "").trim(),
    transactionId: String(doc?.payment?.transactionId || "").trim(),
  };
}
