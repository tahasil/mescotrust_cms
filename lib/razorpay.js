/**
 * Razorpay REST + signature utilities.
 * Uses global fetch and Node's built-in crypto — no external packages needed.
 *
 * Razorpay protocol:
 * - Orders API is called server-side with HTTP Basic auth (key_id:key_secret)
 * - Amounts are always in the smallest currency unit (paise for INR)
 * - Checkout returns razorpay_order_id | razorpay_payment_id | razorpay_signature
 * - Signature = HMAC-SHA256("<order_id>|<payment_id>", key_secret), hex encoded
 */

const crypto = require("crypto");

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";
const RAZORPAY_CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

// RAZORPAY_API_KEY / RAZORPAY_API_SECRET are accepted as aliases so an
// existing deployment keeps working without renaming its variables.
function getCredentials() {
  const keyId = String(
    process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_API_KEY || "",
  ).trim();
  const keySecret = String(
    process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_API_SECRET || "",
  ).trim();
  return { keyId, keySecret, configured: Boolean(keyId && keySecret) };
}

function isConfigured() {
  return getCredentials().configured;
}

/**
 * Convert a rupee amount to the paise integer Razorpay expects.
 */
function toSmallestUnit(amount) {
  return Math.round(Number(amount) * 100);
}

async function razorpayRequest(path, { method = "GET", body } = {}) {
  const { keyId, keySecret, configured } = getCredentials();
  if (!configured) {
    throw new Error("Razorpay credentials are not configured");
  }
  const response = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      payload?.error?.description || `Razorpay request failed (${response.status})`,
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

/**
 * Create a Razorpay order.
 * @param {object} params
 * @param {number} params.amount - amount in rupees
 * @param {string} [params.currency]
 * @param {string} params.receipt - our own order id (max 40 chars)
 * @param {object} [params.notes] - string key/value pairs echoed back by Razorpay
 * @returns {Promise<object>} Razorpay order object
 */
async function createOrder({ amount, currency = "INR", receipt, notes = {} }) {
  return razorpayRequest("/orders", {
    method: "POST",
    body: {
      amount: toSmallestUnit(amount),
      currency,
      receipt: String(receipt || "").slice(0, 40),
      notes: normalizeNotes(notes),
    },
  });
}

/**
 * Fetch a payment so the captured amount/currency/status can be reconciled
 * server-side. The checkout signature proves authenticity but not the amount.
 */
async function fetchPayment(paymentId) {
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
}

/**
 * Capture an authorized payment. Accounts without auto-capture leave payments
 * in "authorized", and Razorpay voids those automatically after a few days, so
 * an uncaptured donation would silently never settle.
 * @param {string} paymentId
 * @param {number} amountInSmallestUnit - must equal the authorized amount
 * @param {string} currency
 */
async function capturePayment(paymentId, amountInSmallestUnit, currency = "INR") {
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/capture`, {
    method: "POST",
    body: { amount: amountInSmallestUnit, currency },
  });
}

/**
 * Razorpay notes must be flat strings, at most 15 entries of 256 chars.
 */
function normalizeNotes(notes) {
  const normalized = {};
  Object.entries(notes || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .slice(0, 15)
    .forEach(([key, value]) => {
      normalized[key] = String(value).slice(0, 256);
    });
  return normalized;
}

/**
 * Verify the checkout signature returned to our callback.
 * @returns {boolean}
 */
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const { keySecret, configured } = getCredentials();
  if (!configured || !orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const provided = String(signature);
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

module.exports = {
  RAZORPAY_CHECKOUT_SCRIPT,
  getCredentials,
  isConfigured,
  toSmallestUnit,
  createOrder,
  fetchPayment,
  capturePayment,
  verifyPaymentSignature,
};
