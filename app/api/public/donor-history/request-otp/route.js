import { connectDB } from "@/lib/db";
import DonateNowSubmission from "@/models/DonateNowSubmission";
import DonorHistoryOtp from "@/models/DonorHistoryOtp";
import ThemeConfig from "@/models/ThemeConfig";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";
import { isEmailConfigured, sendDonorHistoryOtp } from "@/lib/email";
import {
  OTP_MAX_ATTEMPTS,
  OTP_MAX_SENDS_PER_WINDOW,
  OTP_RESEND_COOLDOWN_MS,
  OTP_SEND_WINDOW_MS,
  OTP_TTL_MS,
  buildMobileMatch,
  generateChallengeId,
  generateOtp,
  getHistoryKey,
  hashOtp,
  isValidEmail,
  maskEmailForDisplay,
  normalizeEmail,
  parseIdentifier,
} from "@/lib/donations/donorHistoryAuth";
import {
  historyUnavailable,
  jsonNoStore,
  readJsonBody,
} from "@/lib/donations/donorHistoryServer";

export const dynamic = "force-dynamic";

// Each request tells the donor whether the email/mobile has donations, so
// the per-IP limit is what slows down anyone trying a list of addresses.
const checkIpRateLimit = createRateLimiter({ windowMs: 60_000, max: 10 });

const seconds = (ms) => Math.max(1, Math.ceil(ms / 1000));
const minutes = (ms) => Math.max(1, Math.ceil(ms / 60_000));

function identifierLabel(identifier) {
  return identifier.type === "email" ? "email address" : "mobile number";
}

/**
 * Finds the email a code should go to.
 *   found        -> a successful, non-deleted donation matches
 *   no-completed -> only pending/failed/cancelled donations match
 *   not-found    -> nothing matches
 */
async function resolveRecipient(identifier) {
  const match =
    identifier.type === "email"
      ? { "donor.email": identifier.email }
      : buildMobileMatch(identifier.variants);

  // A mobile can appear on donations made with different emails. The code
  // goes to the email on the most recent successful one, and the history the
  // donor sees is for that email only.
  const latest = await DonateNowSubmission.findOne({
    ...match,
    status: "success",
    isDeleted: { $ne: true },
  })
    .sort({ completedAt: -1, createdAt: -1 })
    .select({ "donor.email": 1 })
    .lean();

  const email = normalizeEmail(
    identifier.type === "email" ? identifier.email : latest?.donor?.email,
  );
  if (latest && isValidEmail(email)) return { status: "found", email };

  const anyAttempt = await DonateNowSubmission.exists({ ...match, isDeleted: { $ne: true } });
  return { status: anyAttempt ? "no-completed" : "not-found", email: "" };
}

/**
 * Sends a new code, or explains why it can't yet. When a usable code was
 * already sent, its challenge is returned so the donor can still enter it.
 */
async function issueChallenge(email, key) {
  const now = Date.now();
  const sentTo = maskEmailForDisplay(email);
  const recent = await DonorHistoryOtp.find({
    email,
    createdAt: { $gt: new Date(now - OTP_SEND_WINDOW_MS) },
  })
    .sort({ createdAt: -1 })
    .select({ challengeId: 1, createdAt: 1, expiresAt: 1, consumedAt: 1, invalidatedAt: 1, attempts: 1 })
    .lean();

  const latest = recent[0];
  const latestIsActive =
    latest &&
    !latest.consumedAt &&
    !latest.invalidatedAt &&
    new Date(latest.expiresAt).getTime() > now &&
    Number(latest.attempts || 0) < OTP_MAX_ATTEMPTS;
  const cooldownLeftMs = latest
    ? new Date(latest.createdAt).getTime() + OTP_RESEND_COOLDOWN_MS - now
    : 0;
  const capReached = recent.length >= OTP_MAX_SENDS_PER_WINDOW;
  const capLeftMs = capReached
    ? new Date(recent[recent.length - 1].createdAt).getTime() + OTP_SEND_WINDOW_MS - now
    : 0;

  if (cooldownLeftMs > 0 || capReached) {
    const waitMs = Math.max(cooldownLeftMs, capLeftMs);
    if (latestIsActive) {
      return {
        status: 200,
        body: {
          ok: true,
          challengeId: latest.challengeId,
          sentTo,
          message: capReached
            ? `You've asked for several codes in the last hour. Use the latest code we emailed to ${sentTo}; you can ask for a new one in about ${minutes(waitMs)} minute(s).`
            : `We emailed a code to ${sentTo} less than a minute ago. Enter it below.`,
          resendAfterSeconds: seconds(waitMs),
          expiresInSeconds: seconds(new Date(latest.expiresAt).getTime() - now),
        },
      };
    }
    return {
      status: 429,
      body: {
        error: capReached
          ? `You've asked for several codes in the last hour. Please try again in about ${minutes(waitMs)} minute(s).`
          : `Please wait ${seconds(waitMs)} seconds before asking for another code.`,
        retryAfterSeconds: seconds(waitMs),
      },
    };
  }

  const challengeId = generateChallengeId();
  const code = generateOtp();
  await DonorHistoryOtp.create({
    challengeId,
    email,
    codeHash: hashOtp(challengeId, code, key),
    expiresAt: new Date(now + OTP_TTL_MS),
    purgeAt: new Date(now + OTP_SEND_WINDOW_MS),
  });

  const theme = await ThemeConfig.findOne({}).select({ siteTitle: 1 }).lean();
  const result = await sendDonorHistoryOtp({
    to: email,
    code,
    orgName: theme?.siteTitle,
    validMinutes: minutes(OTP_TTL_MS),
  });

  if (!result.delivered) {
    console.error("[donor-history] code email not delivered:", result.error || "no mail provider");
    // The donor never got this code, so it shouldn't count as their active one.
    await DonorHistoryOtp.updateOne({ challengeId }, { $set: { invalidatedAt: new Date() } });
    return {
      status: 502,
      body: { error: "We couldn't send the email right now. Please try again in a few minutes." },
    };
  }

  // Only the newest code works.
  await DonorHistoryOtp.updateMany(
    { email, challengeId: { $ne: challengeId }, consumedAt: null, invalidatedAt: null },
    { $set: { invalidatedAt: new Date() } },
  );

  return {
    status: 200,
    body: {
      ok: true,
      challengeId,
      sentTo,
      message: `We've emailed a 6-digit code to ${sentTo}. It expires in ${minutes(OTP_TTL_MS)} minutes.`,
      resendAfterSeconds: seconds(OTP_RESEND_COOLDOWN_MS),
      expiresInSeconds: seconds(OTP_TTL_MS),
    },
  };
}

export async function POST(req) {
  if (!checkIpRateLimit(getClientIp(req))) {
    return jsonNoStore(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const key = getHistoryKey();
  if (!key) return historyUnavailable("NEXTAUTH_SECRET is not set");
  if (!isEmailConfigured()) return historyUnavailable("no mail provider configured");

  const body = await readJsonBody(req);
  const identifier = parseIdentifier(body?.identifier);
  if (!identifier) {
    return jsonNoStore(
      { error: "Enter a valid email address or mobile number." },
      { status: 400 },
    );
  }

  try {
    await connectDB();
    const recipient = await resolveRecipient(identifier);
    const label = identifierLabel(identifier);

    // "Not found" is an ordinary answer, not a failure, so it's a 200 with
    // `ok: false` rather than an HTTP error in the visitor's console.
    if (recipient.status === "not-found") {
      return jsonNoStore({
        ok: false,
        found: false,
        message: `We couldn't find any donations for this ${label}. Please check it's the one you used when donating.`,
      });
    }
    if (recipient.status === "no-completed") {
      return jsonNoStore({
        ok: false,
        found: true,
        completed: false,
        message: `We found donation attempts for this ${label}, but none were completed, so there's no donation history to show yet.`,
      });
    }

    const { status, body: result } = await issueChallenge(recipient.email, key);
    return jsonNoStore(result, { status });
  } catch (err) {
    console.error("[donor-history] request-otp failed:", err?.message || err);
    return jsonNoStore(
      { error: "We couldn't send a code right now. Please try again." },
      { status: 500 },
    );
  }
}
