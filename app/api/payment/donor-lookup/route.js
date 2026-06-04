import crypto from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DonateNowSubmission from "@/models/DonateNowSubmission";
import { maskEmail, maskMobile } from "@/lib/donateNowConfig";

const SAFE_REUSABLE_FIELDS = [
  "name",
  "pan",
  "email",
  "mobile",
  "address",
  "city",
  "state",
  "country",
  "pincode",
];

const VERIFICATION_TTL_MS = 10 * 60 * 1000;

function toTrimmedString(value) {
  return String(value ?? "").trim();
}

function toDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeRegex(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getReusableFieldKeys(rawValue) {
  return String(rawValue ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => SAFE_REUSABLE_FIELDS.includes(item));
}

function getMobileVariants(rawValue) {
  const digits = toDigits(rawValue);
  if (!digits) return [];
  const normalized = digits.replace(/^0+/, "");
  const variants = new Set([digits, normalized]);

  if (normalized.length > 10) {
    variants.add(normalized.slice(-10));
  }
  if (normalized.length === 10) {
    variants.add(`91${normalized}`);
    variants.add(`0${normalized}`);
  }

  return [...variants].filter(Boolean);
}

function getLookupOrConditions({
  email,
  lookupByEmail,
  mobileVariants,
  lookupByMobile,
}) {
  const conditions = [];
  if (lookupByEmail && email) {
    conditions.push({
      "donor.email": {
        $regex: new RegExp(`^${escapeRegex(email)}$`, "i"),
      },
    });
  }

  if (lookupByMobile && mobileVariants.length > 0) {
    conditions.push({ "donor.mobile": { $in: mobileVariants } });
    const national = mobileVariants.find((value) => value.length === 10);
    if (national) {
      // Flexible suffix fallback for records that may contain country code.
      conditions.push({
        "donor.mobile": {
          $regex: new RegExp(`${escapeRegex(national)}$`),
        },
      });
    }
  }
  return conditions;
}

function maskTail(value = "", keepLast = 4) {
  const raw = toTrimmedString(value);
  if (!raw) return "";
  if (raw.length <= keepLast) return "*".repeat(Math.max(4, raw.length));
  return `${"*".repeat(Math.max(4, raw.length - keepLast))}${raw.slice(-keepLast)}`;
}

function maskName(value = "") {
  const name = toTrimmedString(value);
  if (!name) return "";
  return name
    .split(/\s+/)
    .map((part) => {
      if (part.length <= 2) return `${part[0] || "*"}*`;
      if (part.length <= 5) return `${part.slice(0, 1)}***${part.slice(-1)}`;
      return `${part.slice(0, 2)}${"*".repeat(Math.max(3, part.length - 5))}${part.slice(-3)}`;
    })
    .join(" ");
}

function maskPan(value = "") {
  const pan = toTrimmedString(value).toUpperCase();
  return maskTail(pan, 4);
}

function maskAddress(value = "") {
  const address = toTrimmedString(value);
  if (!address) return "";
  const keep = Math.min(8, Math.max(4, Math.floor(address.length * 0.25)));
  if (address.length <= keep) return "*".repeat(address.length);
  return `${"*".repeat(address.length - keep)}${address.slice(-keep)}`;
}

function maskByField(fieldKey, value) {
  const normalized = toTrimmedString(value);
  if (!normalized) return "";
  if (fieldKey === "email") return maskEmail(normalized);
  if (fieldKey === "mobile") return maskMobile(normalized);
  if (fieldKey === "pan") return maskPan(normalized);
  if (fieldKey === "name") return maskName(normalized);
  if (fieldKey === "address") return maskAddress(normalized);
  if (fieldKey === "pincode") return maskTail(toDigits(normalized), 4);
  return maskTail(normalized, 4);
}

function getVerificationSecret() {
  return process.env.NEXTAUTH_SECRET || "donor_lookup_secret";
}

function createVerificationToken(payload) {
  const payloadJson = JSON.stringify(payload);
  const payloadEncoded = Buffer.from(payloadJson).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getVerificationSecret())
    .update(payloadEncoded)
    .digest("base64url");
  return `${payloadEncoded}.${signature}`;
}

function verifyVerificationToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", getVerificationSecret())
    .update(payloadEncoded)
    .digest("base64url");
  const safeMatch =
    expectedSignature.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  if (!safeMatch) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadEncoded, "base64url").toString("utf8"),
    );
    if (!payload?.sid || !payload?.exp || Date.now() > Number(payload.exp)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function logLookupDebug(stage, payload = {}) {
  if (process.env.NODE_ENV === "production") return;
  console.info("[donor-lookup]", stage, payload);
}

/**
 * Auto-fill lookup with masked donor data only.
 * Full donor details are returned only after verification (POST).
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = toTrimmedString(searchParams.get("q"));
    const include = getReusableFieldKeys(searchParams.get("include"));

    if (!q || q.length < 3) {
      return NextResponse.json({ found: false, donor: null });
    }

    const email = q.toLowerCase();
    const mobileVariants = getMobileVariants(q);
    const lookupByEmail = isValidEmail(email);
    const lookupByMobile = mobileVariants.some(
      (value) => value.length >= 10 && value.length <= 15,
    );
    if (!lookupByEmail && !lookupByMobile) {
      return NextResponse.json({ found: false, donor: null });
    }

    await connectDB();
    const matchConditions = getLookupOrConditions({
      email,
      lookupByEmail,
      mobileVariants,
      lookupByMobile,
    });
    if (matchConditions.length === 0) {
      return NextResponse.json({ found: false, donor: null });
    }

    logLookupDebug("request", {
      q,
      lookupByEmail,
      lookupByMobile,
      mobileVariants,
    });

    let donation = await DonateNowSubmission.findOne({
      status: "success",
      $or: matchConditions,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Fallback for donors with pending/failed/aborted but existing profile data.
    if (!donation) {
      donation = await DonateNowSubmission.findOne({
        $or: matchConditions,
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    if (!donation) {
      logLookupDebug("not-found", {
        q,
        lookupByEmail,
        lookupByMobile,
        mobileVariants,
      });
      return NextResponse.json({ found: false, donor: null });
    }

    const allowedFields = include.length > 0 ? include : SAFE_REUSABLE_FIELDS;
    const donorMasked = {};
    allowedFields.forEach((fieldKey) => {
      donorMasked[fieldKey] = maskByField(fieldKey, donation?.donor?.[fieldKey] || "");
    });

    const verificationToken = createVerificationToken({
      sid: String(donation?._id || ""),
      exp: Date.now() + VERIFICATION_TTL_MS,
    });
    const hasPan = toTrimmedString(donation?.donor?.pan).length >= 4;

    return NextResponse.json({
      found: true,
      donorMasked,
      requiresVerification: true,
      requiresPanLast4: hasPan,
      verificationToken,
      matchedStatus: toTrimmedString(donation?.status || ""),
      masked: {
        email: maskEmail(donation?.donor?.email || ""),
        mobile: maskMobile(donation?.donor?.mobile || ""),
      },
      matchedSubmissionId: String(donation?._id || ""),
      lastDonation: {
        amount: donation?.amount || 0,
        purpose: toTrimmedString(donation?.purpose),
        createdAt: donation?.createdAt || null,
      },
    });
  } catch (err) {
    logLookupDebug("error", {
      message: err?.message || "Unknown error",
    });
    return NextResponse.json({ found: false, donor: null });
  }
}

/**
 * Secure verification before exposing full donor details.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const token = toTrimmedString(body?.token);
    const email = toTrimmedString(body?.email).toLowerCase();
    const mobile = toTrimmedString(body?.mobile);
    const panLast4 = toTrimmedString(body?.panLast4).toUpperCase();
    const include = getReusableFieldKeys(body?.include);

    const tokenPayload = verifyVerificationToken(token);
    if (!tokenPayload?.sid) {
      return NextResponse.json(
        { verified: false, error: "Verification expired. Please lookup again." },
        { status: 401 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { verified: false, error: "Please enter a valid email for verification." },
        { status: 400 },
      );
    }
    const mobileVariants = getMobileVariants(mobile);
    if (!mobileVariants.some((value) => value.length >= 10 && value.length <= 15)) {
      return NextResponse.json(
        { verified: false, error: "Please enter a valid mobile for verification." },
        { status: 400 },
      );
    }

    await connectDB();
    const donation = await DonateNowSubmission.findById(tokenPayload.sid).lean();
    if (!donation) {
      return NextResponse.json(
        { verified: false, error: "Donor record not found." },
        { status: 404 },
      );
    }

    const donorEmail = toTrimmedString(donation?.donor?.email).toLowerCase();
    const donorMobileDigits = toDigits(donation?.donor?.mobile);
    const donorMobileNational = donorMobileDigits.slice(-10);
    const donorPan = toTrimmedString(donation?.donor?.pan).toUpperCase();

    const emailMatch = donorEmail && donorEmail === email;
    const mobileMatch = mobileVariants.some((value) => {
      const normalized = toDigits(value);
      return (
        normalized === donorMobileDigits ||
        normalized === donorMobileNational ||
        donorMobileDigits.endsWith(normalized) ||
        normalized.endsWith(donorMobileNational)
      );
    });
    const panRequired = donorPan.length >= 4;
    const panMatch = !panRequired || donorPan.slice(-4) === panLast4;

    if (!emailMatch || !mobileMatch || !panMatch) {
      logLookupDebug("verify-failed", {
        sid: tokenPayload.sid,
        emailMatch,
        mobileMatch,
        panMatch,
      });
      return NextResponse.json(
        {
          verified: false,
          error:
            "Verification failed. Please check email, mobile and PAN last 4 digits.",
        },
        { status: 401 },
      );
    }

    const allowedFields = include.length > 0 ? include : SAFE_REUSABLE_FIELDS;
    const donor = {};
    allowedFields.forEach((fieldKey) => {
      donor[fieldKey] = toTrimmedString(donation?.donor?.[fieldKey] || "");
    });

    return NextResponse.json({
      verified: true,
      donor,
      matchedSubmissionId: String(donation?._id || ""),
      matchedStatus: toTrimmedString(donation?.status || ""),
    });
  } catch (err) {
    logLookupDebug("verify-error", {
      message: err?.message || "Unknown error",
    });
    return NextResponse.json(
      { verified: false, error: "Verification failed. Please try again." },
      { status: 500 },
    );
  }
}
