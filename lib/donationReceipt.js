import ThemeConfig from "@/models/ThemeConfig";
import { sendDonationReceipt } from "@/lib/email";

/**
 * Send the donor receipt for a successful donation. Never throws — a mail
 * failure must not change the payment outcome shown to the donor.
 */
export async function sendDonationReceiptSafely(donation) {
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
    await sendDonationReceipt(
      typeof donation?.toObject === "function" ? donation.toObject() : donation,
      orgInfo,
    );
  } catch (mailErr) {
    console.error("[PaymentCallback] Receipt email failed:", mailErr?.message || mailErr);
  }
}
