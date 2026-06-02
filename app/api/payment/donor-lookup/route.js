import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DonateNowSubmission from "@/models/DonateNowSubmission";
import { maskEmail, maskMobile } from "@/lib/donateNowConfig";

const SAFE_REUSABLE_FIELDS = ["name", "address", "city", "state", "country", "pincode"];

function toTrimmedString(value) {
  return String(value ?? "").trim();
}

function toDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getReusableFieldKeys(rawValue) {
  return String(rawValue ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => SAFE_REUSABLE_FIELDS.includes(item));
}

/**
 * Auto-fill: lookup previous donor by email or mobile.
 * Returns only non-sensitive donor details from the most recent successful donation.
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
    const mobileDigits = toDigits(q);
    const lookupByEmail = isValidEmail(email);
    const lookupByMobile = mobileDigits.length >= 10 && mobileDigits.length <= 15;
    if (!lookupByEmail && !lookupByMobile) {
      return NextResponse.json({ found: false, donor: null });
    }

    await connectDB();

    const donation = await DonateNowSubmission.findOne({
      status: "success",
      $or: [
        ...(lookupByEmail
          ? [
              {
                "donor.email": {
                  $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
                },
              },
            ]
          : []),
        ...(lookupByMobile ? [{ "donor.mobile": mobileDigits }] : []),
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!donation) {
      return NextResponse.json({ found: false, donor: null });
    }

    const allowedFields = include.length > 0 ? include : SAFE_REUSABLE_FIELDS;
    const donorReusable = {};
    allowedFields.forEach((fieldKey) => {
      donorReusable[fieldKey] = toTrimmedString(donation?.donor?.[fieldKey] || "");
    });

    return NextResponse.json({
      found: true,
      donor: donorReusable,
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
    return NextResponse.json({ found: false, donor: null });
  }
}
