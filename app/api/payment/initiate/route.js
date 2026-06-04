import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DonateNowSubmission from "@/models/DonateNowSubmission";
import { encrypt, generateOrderId } from "@/lib/ccavenue";

function toSafeString(value) {
  return String(value ?? "").trim();
}

function toDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { amount, purpose, purposeId, zakat, note, donor } = body;

    // Validate required fields
    if (!amount || !donor?.name || !donor?.email || !donor?.mobile || !purpose) {
      return NextResponse.json(
        { error: "Amount, purpose, name, email, and mobile are required" },
        { status: 400 }
      );
    }

    if (Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    const merchantId = process.env.CCAVENUE_MERCHANT_ID;
    const accessCode = process.env.CCAVENUE_ACCESS_CODE;
    const workingKey = process.env.CCAVENUE_WORKING_KEY;
    const gatewayUrl = process.env.CCAVENUE_GATEWAY_URL;

    if (!merchantId || !accessCode || !workingKey || !gatewayUrl) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    await connectDB();

    const orderId = generateOrderId();
    const normalizedDonor = {
      name: toSafeString(donor.name),
      email: toSafeString(donor.email).toLowerCase(),
      mobile: toDigits(donor.mobile) || toSafeString(donor.mobile),
      pan: toSafeString(donor.pan).toUpperCase(),
      address: toSafeString(donor.address),
      city: toSafeString(donor.city),
      state: toSafeString(donor.state),
      country: toSafeString(donor.country || "India"),
      pincode: toSafeString(donor.pincode),
    };
    const normalizedAdditionalFields =
      body?.additionalFields && typeof body.additionalFields === "object"
        ? body.additionalFields
        : {};
    const lookupMeta =
      body?.lookup && typeof body.lookup === "object"
        ? {
            query: toSafeString(body.lookup.query),
            method: ["email", "mobile"].includes(body.lookup.method)
              ? body.lookup.method
              : "none",
            matched: Boolean(body.lookup.matched),
            matchedSubmissionId: toSafeString(body.lookup.matchedSubmissionId),
          }
        : {
            query: "",
            method: "none",
            matched: false,
            matchedSubmissionId: "",
          };
    const studentsCount = toSafeString(body?.studentsCount);
    const interestMoney = toSafeString(body?.interestMoney || "No");
    const pagePath = toSafeString(body?.pagePath);
    const donorType =
      toSafeString(body?.donorType).toLowerCase() === "existing"
        ? "existing"
        : "new";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const redirectUrl = `${siteUrl}/api/payment/callback`;
    const cancelUrl = `${siteUrl}/api/payment/callback`;

    // Save donate-now submission with pending status
    await DonateNowSubmission.create({
      orderId,
      amount: Number(amount),
      currency: toSafeString(body?.currency || "INR") || "INR",
      purpose: toSafeString(purpose),
      purposeId: toSafeString(purposeId),
      zakat: zakat || "No",
      interestMoney,
      studentsCount,
      note: toSafeString(note),
      donor: normalizedDonor,
      additionalFields: normalizedAdditionalFields,
      termsAccepted: Boolean(body?.termsAccepted),
      purposeRuleSnapshot:
        body?.purposeRuleSnapshot && typeof body.purposeRuleSnapshot === "object"
          ? body.purposeRuleSnapshot
          : {},
      paymentSettingsSnapshot:
        body?.paymentSettingsSnapshot &&
        typeof body.paymentSettingsSnapshot === "object"
          ? body.paymentSettingsSnapshot
          : {},
      lookup: lookupMeta,
      donorType,
      source: toSafeString(body?.source || "DonateNow"),
      pagePath,
      status: "pending",
    });

    // Build CCAvenue request parameters
    const params = [
      `merchant_id=${merchantId}`,
      `order_id=${orderId}`,
      `currency=INR`,
      `amount=${Number(amount).toFixed(2)}`,
      `redirect_url=${redirectUrl}`,
      `cancel_url=${cancelUrl}`,
      `language=EN`,
      `billing_name=${normalizedDonor.name}`,
      `billing_email=${normalizedDonor.email}`,
      `billing_tel=${toDigits(normalizedDonor.mobile) || normalizedDonor.mobile}`,
      `billing_address=${normalizedDonor.address || ""}`,
      `billing_city=${normalizedDonor.city || ""}`,
      `billing_state=${normalizedDonor.state || ""}`,
      `billing_zip=${normalizedDonor.pincode || ""}`,
      `billing_country=${normalizedDonor.country || "India"}`,
      `merchant_param1=${toSafeString(purpose)}`,
      `merchant_param2=${zakat || "No"}`,
      `merchant_param3=${normalizedDonor.pan || ""}`,
      `merchant_param4=${toSafeString(note) || ""}`,
      `merchant_param5=${toSafeString(purposeId) || ""}`,
    ].join("&");

    const encRequest = encrypt(params, workingKey);

    return NextResponse.json({
      encRequest,
      accessCode,
      gatewayUrl: `${gatewayUrl}?command=initiateTransaction`,
      orderId,
    });
  } catch (err) {
    console.error("Payment initiate error:", err);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
