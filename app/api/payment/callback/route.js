import crypto from "crypto";
import { connectDB } from "@/lib/db";
import DonateNowSubmission from "@/models/DonateNowSubmission";
import ThemeConfig from "@/models/ThemeConfig";
import { decrypt, parseResponse } from "@/lib/ccavenue";
import { sendDonationReceipt } from "@/lib/email";

export const dynamic = "force-dynamic";

function toText(value) {
  return String(value ?? "").trim();
}

function mapPaymentStatus(orderStatus) {
  const normalized = toText(orderStatus).toLowerCase();
  if (normalized === "success") return "success";
  if (["aborted", "cancelled", "canceled"].includes(normalized)) return "cancelled";
  return "failed";
}

function verifyGatewayResponse(donation, data, desiredStatus) {
  const errors = [];
  const responseAmount = Number(data.amount);
  const responseCurrency = toText(data.currency).toUpperCase();
  const responseMerchantId = toText(data.merchant_id);
  const expectedMerchantId = toText(process.env.CCAVENUE_MERCHANT_ID);

  if (toText(data.order_id) !== toText(donation.orderId)) {
    errors.push("Order ID does not match");
  }
  if (responseMerchantId && expectedMerchantId && responseMerchantId !== expectedMerchantId) {
    errors.push("Merchant ID does not match");
  }
  if (Number.isFinite(responseAmount)) {
    if (Math.abs(responseAmount - Number(donation.amount)) >= 0.01) {
      errors.push("Amount does not match");
    }
  } else if (desiredStatus === "success") {
    errors.push("Payment amount is missing");
  }
  if (responseCurrency) {
    if (responseCurrency !== toText(donation.currency || "INR").toUpperCase()) {
      errors.push("Currency does not match");
    }
  } else if (desiredStatus === "success") {
    errors.push("Payment currency is missing");
  }
  if (desiredStatus === "success" && !toText(data.tracking_id)) {
    errors.push("Tracking ID is missing");
  }

  return errors;
}

function paymentRedirect({ status, orderId = "", reason = "" }) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";
  const target = new URL("/donate-now", configured);
  target.searchParams.set("donation", status === "success" ? "success" : "failed");
  if (orderId) target.searchParams.set("order", orderId);
  if (status && status !== "success") target.searchParams.set("status", status);
  if (reason) target.searchParams.set("reason", reason);
  return Response.redirect(target, 303);
}

/**
 * CCAvenue browser callback. Decryption authenticates the response with the
 * working key; order, amount and currency are then reconciled with our pending
 * record before a payment can become successful.
 */
export async function POST(req) {
  let orderId = "";
  try {
    const workingKey = process.env.CCAVENUE_WORKING_KEY;
    if (!workingKey) {
      return paymentRedirect({ status: "failed", reason: "config" });
    }

    const formData = await req.formData();
    const encResp = toText(formData.get("encResp"));
    if (!encResp) {
      return paymentRedirect({ status: "failed", reason: "no-response" });
    }

    const data = parseResponse(decrypt(encResp, workingKey));
    orderId = toText(data.order_id);
    if (!orderId) {
      return paymentRedirect({ status: "failed", reason: "missing-order" });
    }

    await connectDB();
    const donation = await DonateNowSubmission.findOne({ orderId });
    if (!donation) {
      return paymentRedirect({ status: "failed", orderId, reason: "order-not-found" });
    }

    const desiredStatus = mapPaymentStatus(data.order_status);
    const verificationErrors = verifyGatewayResponse(donation, data, desiredStatus);
    const verified = verificationErrors.length === 0;
    const nextStatus = verified ? desiredStatus : "failed";
    const wasSuccessful = donation.status === "success";
    const trackingId = toText(data.tracking_id);
    const callbackReceivedAt = new Date();

    // A duplicate/late callback must never downgrade an already verified payment.
    if (!wasSuccessful) {
      donation.status = nextStatus;
      donation.completedAt = nextStatus === "pending" ? null : callbackReceivedAt;
      donation.payment = {
        gateway: "CCAvenue",
        trackingId,
        transactionId: toText(data.transaction_id) || trackingId,
        paymentId: toText(data.payment_id) || trackingId,
        bankRefNo: toText(data.bank_ref_no),
        paymentMode: toText(data.payment_mode),
        cardName: toText(data.card_name),
        orderStatus: toText(data.order_status),
        amount: Number.isFinite(Number(data.amount)) ? Number(data.amount) : null,
        currency: toText(data.currency),
        statusCode: toText(data.status_code),
        statusMsg: toText(data.status_message),
        failureMessage: toText(data.failure_message),
        responseCode: toText(data.response_code),
        verificationStatus: verified ? "verified" : "mismatch",
        verificationMessage: verified
          ? "Encrypted callback verified and matched to the donation order"
          : verificationErrors.join("; "),
        responseHash: crypto.createHash("sha256").update(encResp).digest("hex"),
        callbackReceivedAt,
      };
      await donation.save();
    }

    if (!wasSuccessful && nextStatus === "success") {
      try {
        const theme = await ThemeConfig.findOne({}).lean();
        const orgInfo = theme
          ? {
              siteTitle: theme.siteTitle,
              footerEmail: theme.footerEmail,
              footerPhone: theme.footerPhone,
              footerAddress: theme.footerAddress,
              logoLightUrl: theme.logoLightUrl,
              logoImageUrl: theme.logoImageUrl,
            }
          : {};
        await sendDonationReceipt(donation.toObject(), orgInfo);
      } catch (mailErr) {
        console.error("[PaymentCallback] Receipt email failed:", mailErr?.message || mailErr);
      }
    }

    const finalStatus = wasSuccessful ? "success" : nextStatus;
    return paymentRedirect({
      status: finalStatus,
      orderId,
      reason: verified ? "" : "verification-failed",
    });
  } catch (err) {
    console.error("Payment callback error:", err);
    return paymentRedirect({ status: "failed", orderId, reason: "invalid-response" });
  }
}

export async function GET() {
  return paymentRedirect({ status: "failed", reason: "invalid-callback-method" });
}
