import crypto from "crypto";
import { connectDB } from "@/lib/db";
import DonateNowSubmission from "@/models/DonateNowSubmission";
import {
  fetchPayment,
  capturePayment,
  verifyPaymentSignature,
  isConfigured,
} from "@/lib/razorpay";
import { paymentRedirect } from "@/lib/paymentGateway";
import { sendDonationReceiptSafely } from "@/lib/donationReceipt";

export const dynamic = "force-dynamic";

function toText(value) {
  return String(value ?? "").trim();
}

function existingPayment(donation) {
  return typeof donation?.payment?.toObject === "function"
    ? donation.payment.toObject()
    : { ...(donation?.payment || {}) };
}

/**
 * Razorpay Checkout posts errors as bracketed form fields
 * (error[code], error[description], error[metadata], ...).
 */
function readCheckoutError(formData) {
  const code = toText(formData.get("error[code]"));
  const description = toText(formData.get("error[description]"));
  const reason = toText(formData.get("error[reason]"));
  const source = toText(formData.get("error[source]"));
  const step = toText(formData.get("error[step]"));
  if (!code && !description) return null;

  let metadata = {};
  try {
    metadata = JSON.parse(toText(formData.get("error[metadata]")) || "{}");
  } catch {
    metadata = {};
  }
  return { code, description, reason, source, step, metadata };
}

/**
 * Razorpay considers "captured" settled money. "authorized" only appears when
 * auto-capture is off, and is still an accepted outcome for the donor.
 */
function mapPaymentStatus(paymentStatus) {
  const normalized = toText(paymentStatus).toLowerCase();
  if (normalized === "captured" || normalized === "authorized") return "success";
  if (["created", "pending"].includes(normalized)) return "pending";
  return "failed";
}

function describeCardOrBank(payment) {
  return toText(
    payment?.card?.network ||
      payment?.card?.issuer ||
      payment?.bank ||
      payment?.wallet ||
      payment?.vpa,
  );
}

/**
 * Reconcile the Razorpay payment against our pending record. The signature only
 * proves the callback is genuine, so amount, currency and order linkage are
 * re-checked against the payment fetched from Razorpay's API.
 */
function verifyGatewayResponse(donation, payment, razorpayOrderId, desiredStatus) {
  const errors = [];
  const expectedPaise = Math.round(Number(donation.amount) * 100);
  const paidPaise = Number(payment?.amount);
  const paidCurrency = toText(payment?.currency).toUpperCase();

  if (toText(payment?.order_id) !== toText(razorpayOrderId)) {
    errors.push("Order ID does not match");
  }
  if (toText(razorpayOrderId) !== toText(donation.payment?.gatewayOrderId)) {
    errors.push("Order ID is not linked to this donation");
  }
  if (Number.isFinite(paidPaise)) {
    if (paidPaise !== expectedPaise) errors.push("Amount does not match");
  } else if (desiredStatus === "success") {
    errors.push("Payment amount is missing");
  }
  if (paidCurrency) {
    if (paidCurrency !== toText(donation.currency || "INR").toUpperCase()) {
      errors.push("Currency does not match");
    }
  } else if (desiredStatus === "success") {
    errors.push("Payment currency is missing");
  }

  return errors;
}

export async function POST(req) {
  let orderId = "";
  try {
    if (!isConfigured()) {
      return paymentRedirect({ status: "failed", reason: "config" });
    }

    const formData = await req.formData();
    const checkoutError = readCheckoutError(formData);
    const paymentId =
      toText(formData.get("razorpay_payment_id")) ||
      toText(checkoutError?.metadata?.payment_id);
    const razorpayOrderId =
      toText(formData.get("razorpay_order_id")) ||
      toText(checkoutError?.metadata?.order_id);
    const signature = toText(formData.get("razorpay_signature"));

    if (!razorpayOrderId) {
      return paymentRedirect({ status: "failed", reason: "missing-order" });
    }

    await connectDB();
    const donation = await DonateNowSubmission.findOne({
      "payment.gatewayOrderId": razorpayOrderId,
    });
    if (!donation) {
      return paymentRedirect({ status: "failed", reason: "order-not-found" });
    }
    orderId = toText(donation.orderId);

    const wasSuccessful = donation.status === "success";
    const callbackReceivedAt = new Date();

    // Checkout reported a failure — record it and send the donor back.
    if (checkoutError && !signature) {
      if (!wasSuccessful) {
        donation.status = "failed";
        donation.completedAt = callbackReceivedAt;
        donation.payment = {
          ...existingPayment(donation),
          gateway: "Razorpay",
          gatewayOrderId: razorpayOrderId,
          transactionId: paymentId,
          statusCode: checkoutError.code,
          statusMsg: checkoutError.description,
          failureMessage: [checkoutError.reason, checkoutError.source, checkoutError.step]
            .filter(Boolean)
            .join(" / "),
          responseCode: checkoutError.code,
          verificationMessage:
            checkoutError.description || "Razorpay checkout reported a failure",
          callbackReceivedAt,
        };
        await donation.save();
      }
      return paymentRedirect({ status: "failed", orderId, reason: "payment-failed" });
    }

    const signatureValid = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId,
      signature,
    });

    if (!signatureValid) {
      if (!wasSuccessful) {
        donation.status = "failed";
        donation.completedAt = callbackReceivedAt;
        donation.payment = {
          ...existingPayment(donation),
          gateway: "Razorpay",
          gatewayOrderId: razorpayOrderId,
          transactionId: paymentId,
          verificationMessage: "Razorpay callback signature verification failed",
          callbackReceivedAt,
        };
        await donation.save();
      }
      return paymentRedirect({ status: "failed", orderId, reason: "verification-failed" });
    }

    // Signature is authentic; confirm the money with Razorpay directly.
    let payment;
    try {
      payment = await fetchPayment(paymentId);
    } catch (fetchErr) {
      console.error("Razorpay payment fetch failed:", fetchErr?.message || fetchErr);
      return paymentRedirect({ status: "failed", orderId, reason: "verification-failed" });
    }

    const verificationErrors = verifyGatewayResponse(
      donation,
      payment,
      razorpayOrderId,
      mapPaymentStatus(payment?.status),
    );
    const verified = verificationErrors.length === 0;

    // Capture only money already reconciled against our own record. Accounts
    // with auto-capture return "captured" here and this is skipped.
    if (verified && toText(payment?.status).toLowerCase() === "authorized") {
      try {
        payment = await capturePayment(payment.id, payment.amount, payment.currency);
      } catch (captureErr) {
        // A concurrent callback may have captured it already; re-read the truth.
        console.error("Razorpay capture failed:", captureErr?.message || captureErr);
        payment = await fetchPayment(paymentId).catch(() => payment);
      }
    }

    const captured = toText(payment?.status).toLowerCase() === "captured";
    const desiredStatus = mapPaymentStatus(payment?.status);
    const nextStatus = verified ? desiredStatus : "failed";

    // A duplicate/late callback must never downgrade an already verified payment.
    if (!wasSuccessful) {
      donation.status = nextStatus;
      donation.completedAt = nextStatus === "pending" ? null : callbackReceivedAt;
      // Razorpay's payment id is kept only as the transaction reference;
      // trackingId / paymentId / orderStatus / verificationStatus are not stored.
      donation.payment = {
        gateway: "Razorpay",
        gatewayOrderId: razorpayOrderId,
        transactionId: toText(payment?.id),
        bankRefNo: toText(payment?.acquirer_data?.bank_transaction_id || payment?.acquirer_data?.rrn),
        paymentMode: toText(payment?.method),
        cardName: describeCardOrBank(payment),
        amount: Number.isFinite(Number(payment?.amount)) ? Number(payment.amount) / 100 : null,
        currency: toText(payment?.currency),
        statusCode: toText(payment?.error_code),
        statusMsg: toText(payment?.status),
        failureMessage: toText(payment?.error_description),
        responseCode: toText(payment?.error_reason),
        verificationMessage: verified
          ? captured
            ? "Razorpay signature verified and payment captured"
            : `Razorpay signature verified but payment is not captured (status: ${
                toText(payment?.status) || "unknown"
              })`
          : verificationErrors.join("; "),
        responseHash: crypto.createHash("sha256").update(signature).digest("hex"),
        callbackReceivedAt,
      };
      await donation.save();
    }

    if (!wasSuccessful && nextStatus === "success") {
      await sendDonationReceiptSafely(donation);
    }

    const finalStatus = wasSuccessful ? "success" : nextStatus;
    return paymentRedirect({
      status: finalStatus,
      orderId,
      reason: verified ? "" : "verification-failed",
    });
  } catch (err) {
    console.error("Razorpay callback error:", err);
    return paymentRedirect({ status: "failed", orderId, reason: "invalid-response" });
  }
}

export async function GET() {
  return paymentRedirect({ status: "failed", reason: "invalid-callback-method" });
}
