import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Donation from "@/models/Donation";
import ThemeConfig from "@/models/ThemeConfig";
import { decrypt, parseResponse } from "@/lib/ccavenue";
import { sendDonationReceipt } from "@/lib/email";

/**
 * CCAvenue posts encrypted response here after payment.
 * This is a form POST (application/x-www-form-urlencoded), not JSON.
 */
export async function POST(req) {
  try {
    const workingKey = process.env.CCAVENUE_WORKING_KEY;
    if (!workingKey) {
      return redirectTo("/donation/failed?reason=config");
    }

    // CCAvenue sends form-urlencoded data
    const formData = await req.formData();
    const encResp = formData.get("encResp");

    if (!encResp) {
      return redirectTo("/donation/failed?reason=no-response");
    }

    // Decrypt the response
    const decrypted = decrypt(encResp, workingKey);
    const data = parseResponse(decrypted);

    const orderId = data.order_id || "";
    const orderStatus = (data.order_status || "").toLowerCase();
    const trackingId = data.tracking_id || "";
    const bankRefNo = data.bank_ref_no || "";
    const paymentMode = data.payment_mode || "";
    const cardName = data.card_name || "";
    const statusCode = data.status_code || "";
    const statusMsg = data.status_message || "";

    // Map CCAvenue status to our status
    let status = "failed";
    if (orderStatus === "success") status = "success";
    else if (orderStatus === "aborted") status = "aborted";
    else status = "failed";

    // Update donation in database
    await connectDB();
    const donation = await Donation.findOne({ orderId });
    if (donation) {
      donation.status = status;
      donation.payment = {
        trackingId,
        bankRefNo,
        paymentMode,
        cardName,
        statusCode,
        statusMsg,
      };
      await donation.save();

      // Best-effort: send receipt email on success. Never blocks the redirect.
      if (status === "success") {
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
    }

    // Redirect user to success or failed page
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    if (status === "success") {
      return Response.redirect(
        `${siteUrl}/donation/success?order=${orderId}`,
        303
      );
    } else {
      return Response.redirect(
        `${siteUrl}/donation/failed?order=${orderId}&status=${status}`,
        303
      );
    }
  } catch (err) {
    console.error("Payment callback error:", err);
    return redirectTo("/donation/failed?reason=error");
  }
}

function redirectTo(path) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return Response.redirect(`${siteUrl}${path}`, 303);
}
