import ThemeConfig from "@/models/ThemeConfig";
import { sendDonationReceipt } from "@/lib/email";

/**
 * Send the donor receipt for a successful donation. Never throws — a mail
 * failure must not change the payment outcome shown to the donor.
 *
 * The status guard below is the single source of truth for "receipts go out on
 * success only". Both gateway callbacks already call this inside their own
 * success branch, so this is defence in depth: a future caller that forgets
 * that check still cannot mail a donor for a failed or pending payment.
 */
export async function sendDonationReceiptSafely(donation) {
  const status = String(donation?.status || "").trim().toLowerCase();
  if (status !== "success") {
    console.log(`[DonationReceipt] Donation status is "${status || "unknown"}"; skipping receipt`);
    return { skipped: true };
  }

  try {
    const theme = await ThemeConfig.findOne({}).lean();
    // The receipt header is a text wordmark, not the site logo: most clients
    // block remote images, so no logo lookup is needed here.
    const orgInfo = {
      siteTitle: theme?.siteTitle,
      footerEmail: theme?.footerEmail,
    };
    await sendDonationReceipt(
      typeof donation?.toObject === "function" ? donation.toObject() : donation,
      orgInfo,
    );
  } catch (mailErr) {
    console.error("[PaymentCallback] Receipt email failed:", mailErr?.message || mailErr);
  }
}
