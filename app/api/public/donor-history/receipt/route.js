import { connectDB } from "@/lib/db";
import DonateNowSubmission from "@/models/DonateNowSubmission";
import { createRateLimiter } from "@/lib/rateLimit";
import { sendDonationReceiptSafely } from "@/lib/donationReceipt";
import { getHistoryFilter } from "@/lib/donations/donorHistoryAuth";
import {
  getHistorySession,
  historyUnavailable,
  jsonNoStore,
  readJsonBody,
  signedOutResponse,
} from "@/lib/donations/donorHistoryServer";

export const dynamic = "force-dynamic";

const checkReceiptLimit = createRateLimiter({ windowMs: 10 * 60_000, max: 3 });

/** Re-sends the receipt for one of the signed-in donor's own donations. */
export async function POST(req) {
  const { key, session } = getHistorySession(req);
  if (!key) return historyUnavailable("NEXTAUTH_SECRET is not set");
  if (!session) return signedOutResponse(req);

  const body = await readJsonBody(req);
  const orderId = String(body?.orderId ?? "").trim();
  if (!orderId || orderId.length > 100) {
    return jsonNoStore({ error: "Missing donation reference." }, { status: 400 });
  }

  if (!checkReceiptLimit(`${session.email}:${orderId}`)) {
    return jsonNoStore(
      {
        error:
          "You've asked for this receipt a few times already. Please check your inbox and spam folder, or try again in 10 minutes.",
      },
      { status: 429 },
    );
  }

  try {
    await connectDB();
    // Scoped to the session email, so one donor can never trigger a receipt
    // for someone else's order.
    const donation = await DonateNowSubmission.findOne({
      ...getHistoryFilter(session.email),
      orderId,
    }).lean();
    if (!donation) {
      return jsonNoStore({ error: "We couldn't find that donation." }, { status: 404 });
    }

    const result = await sendDonationReceiptSafely(donation, { adminCopy: false });
    if (!result?.sent || !result?.delivered) {
      console.error("[donor-history] receipt not delivered:", result?.error || "no mail provider");
      return jsonNoStore(
        { error: "We couldn't send the receipt right now. Please try again later." },
        { status: 502 },
      );
    }

    return jsonNoStore({ ok: true, message: `Receipt sent to ${session.email}.` });
  } catch (err) {
    console.error("[donor-history] receipt failed:", err?.message || err);
    return jsonNoStore(
      { error: "We couldn't send the receipt right now. Please try again later." },
      { status: 500 },
    );
  }
}
