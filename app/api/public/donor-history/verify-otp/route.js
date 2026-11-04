import { connectDB } from "@/lib/db";
import DonorHistoryOtp from "@/models/DonorHistoryOtp";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  VERIFY_OTP_FAILED_MESSAGE,
  getHistoryKey,
  isValidChallengeId,
  issueHistorySession,
  otpMatches,
  toDigits,
} from "@/lib/donations/donorHistoryAuth";
import {
  historyUnavailable,
  jsonNoStore,
  readJsonBody,
  setHistorySessionCookie,
} from "@/lib/donations/donorHistoryServer";

export const dynamic = "force-dynamic";

const checkIpRateLimit = createRateLimiter({ windowMs: 60_000, max: 10 });

function failed() {
  // One message for every failure (unknown challenge, wrong code, expired,
  // locked out), so a guess reveals nothing about whether a code exists.
  return jsonNoStore({ error: VERIFY_OTP_FAILED_MESSAGE }, { status: 400 });
}

export async function POST(req) {
  if (!checkIpRateLimit(getClientIp(req))) {
    return jsonNoStore(
      { error: "Too many attempts. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const key = getHistoryKey();
  if (!key) return historyUnavailable("NEXTAUTH_SECRET is not set");

  const body = await readJsonBody(req);
  const challengeId = String(body?.challengeId ?? "").trim().toLowerCase();
  const code = toDigits(body?.code);
  if (!isValidChallengeId(challengeId) || code.length !== OTP_LENGTH) return failed();

  try {
    await connectDB();
    const now = new Date();

    // Count the attempt atomically before comparing, so parallel guesses
    // can't get past the attempt limit.
    const otp = await DonorHistoryOtp.findOneAndUpdate(
      {
        challengeId,
        consumedAt: null,
        invalidatedAt: null,
        expiresAt: { $gt: now },
        attempts: { $lt: OTP_MAX_ATTEMPTS },
      },
      { $inc: { attempts: 1 } },
      { new: true },
    ).lean();

    if (!otp || !otpMatches(challengeId, code, otp.codeHash, key)) return failed();

    const consumed = await DonorHistoryOtp.updateOne(
      { challengeId, consumedAt: null },
      { $set: { consumedAt: now } },
    );
    if (!consumed.modifiedCount) return failed();

    const res = jsonNoStore({ ok: true, email: otp.email });
    return setHistorySessionCookie(res, req, issueHistorySession(otp.email, key));
  } catch (err) {
    console.error("[donor-history] verify-otp failed:", err?.message || err);
    return jsonNoStore(
      { error: "We couldn't check that code right now. Please try again." },
      { status: 500 },
    );
  }
}
