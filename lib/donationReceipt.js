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
    const orgInfo = {
      siteTitle: theme?.siteTitle,
      footerEmail: theme?.footerEmail,
      // The receipt header sits on the dark navy band, so prefer the
      // dark-background logo variant. The site's own header is light, so
      // logoLightUrl alone would be a dark logo on a dark background.
      logoLightUrl: theme?.logoDarkUrl || theme?.logoLightUrl,
      logoImageUrl: theme?.logoImageUrl,
    };
    await sendDonationReceipt(
      typeof donation?.toObject === "function" ? donation.toObject() : donation,
      orgInfo,
    );
  } catch (mailErr) {
    console.error("[PaymentCallback] Receipt email failed:", mailErr?.message || mailErr);
  }
}
