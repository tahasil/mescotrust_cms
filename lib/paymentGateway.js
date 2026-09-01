/**
 * Payment gateway selection and shared donation-payment helpers.
 *
 * The active gateway is chosen with the PAYMENT_GATEWAY env variable:
 *   PAYMENT_GATEWAY=ccavenue   (default when unset or unrecognised)
 *   PAYMENT_GATEWAY=razorpay
 *
 * Only the selected gateway is used to collect donations; the other one stays
 * dormant but keeps working for reconciling callbacks of orders it created.
 */

const CCAVENUE = "ccavenue";
const RAZORPAY = "razorpay";

const GATEWAY_LABELS = {
  [CCAVENUE]: "CCAvenue",
  [RAZORPAY]: "Razorpay",
};

/**
 * @returns {"ccavenue"|"razorpay"} normalized active gateway
 */
function getActiveGateway() {
  const configured = String(process.env.PAYMENT_GATEWAY || "")
    .trim()
    .toLowerCase();
  return configured === RAZORPAY ? RAZORPAY : CCAVENUE;
}

/**
 * Human readable gateway name, as stored on the donation record.
 */
function getGatewayLabel(gateway) {
  return GATEWAY_LABELS[String(gateway || "").toLowerCase()] || GATEWAY_LABELS[CCAVENUE];
}

function getSiteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";
  return new URL(configured).origin;
}

/**
 * Generate unique order ID for donation.
 */
function generateOrderId() {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DON_${ts}_${rand}`;
}

/**
 * Send the browser back to /donate-now with the payment outcome in the query
 * string. Shared by every gateway callback so the result UI stays identical.
 */
function paymentRedirect({ status, orderId = "", reason = "" }) {
  const target = new URL("/donate-now", getSiteUrl());
  target.searchParams.set("donation", status === "success" ? "success" : "failed");
  if (orderId) target.searchParams.set("order", orderId);
  if (status && status !== "success") target.searchParams.set("status", status);
  if (reason) target.searchParams.set("reason", reason);
  return Response.redirect(target, 303);
}

module.exports = {
  CCAVENUE,
  RAZORPAY,
  GATEWAY_LABELS,
  getActiveGateway,
  getGatewayLabel,
  getSiteUrl,
  generateOrderId,
  paymentRedirect,
};
