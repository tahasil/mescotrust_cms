import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import DonateNowSubmission from "@/models/DonateNowSubmission";
import ThemeConfig from "@/models/ThemeConfig";
import { encrypt } from "@/lib/ccavenue";
import * as razorpay from "@/lib/razorpay";
import {
  CCAVENUE,
  RAZORPAY,
  generateOrderId,
  getActiveGateway,
  getGatewayLabel,
  getSiteUrl,
} from "@/lib/paymentGateway";

function toSafeString(value, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function toDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function getGatewayUrl(configuredUrl) {
  const url = new URL(configuredUrl);
  if (!url.pathname || url.pathname === "/") {
    url.pathname = "/transaction/transaction.do";
  }
  url.searchParams.set("command", "initiateTransaction");
  return url.toString();
}

function verifyDonorProof(token) {
  const [payloadEncoded, signature, ...extra] = String(token || "").split(".");
  if (!payloadEncoded || !signature || extra.length) return null;
  const expected = crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET || "donor_lookup_secret")
    .update(payloadEncoded)
    .digest("base64url");
  if (
    expected.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadEncoded, "base64url").toString("utf8"));
    if (!payload?.verified || !payload?.sid || Date.now() > Number(payload?.exp || 0)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
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

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    const normalizedEmail = toSafeString(donor.email, 254).toLowerCase();
    const normalizedMobile = toDigits(donor.mobile);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (normalizedMobile.length < 10 || normalizedMobile.length > 15) {
      return NextResponse.json({ error: "A valid mobile number is required" }, { status: 400 });
    }

    // PAYMENT_GATEWAY decides which provider collects this donation.
    const activeGateway = getActiveGateway();

    const merchantId = process.env.CCAVENUE_MERCHANT_ID;
    const accessCode = process.env.CCAVENUE_ACCESS_CODE;
    const workingKey = process.env.CCAVENUE_WORKING_KEY;
    const gatewayUrl = process.env.CCAVENUE_GATEWAY_URL;

    const gatewayConfigured =
      activeGateway === RAZORPAY
        ? razorpay.isConfigured()
        : Boolean(merchantId && accessCode && workingKey && gatewayUrl);

    if (!gatewayConfigured) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    let resolvedGatewayUrl = "";
    let siteUrl;
    try {
      if (activeGateway === CCAVENUE) {
        resolvedGatewayUrl = getGatewayUrl(gatewayUrl);
      }
      siteUrl = getSiteUrl();
    } catch {
      return NextResponse.json(
        { error: "Payment gateway URL configuration is invalid" },
        { status: 500 },
      );
    }

    await connectDB();

    const orderId = generateOrderId();
    const normalizedDonor = {
      name: toSafeString(donor.name),
      email: normalizedEmail,
      mobile: normalizedMobile,
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

    if (donorType === "existing") {
      const linkedId = lookupMeta.matchedSubmissionId;
      const donorProof = verifyDonorProof(body?.lookup?.verificationProof);
      if (
        !mongoose.Types.ObjectId.isValid(linkedId) ||
        donorProof?.sid !== linkedId ||
        donorProof?.email !== normalizedEmail ||
        donorProof?.mobile !== normalizedMobile.slice(-10)
      ) {
        return NextResponse.json(
          { error: "Existing donor verification is required" },
          { status: 400 },
        );
      }
      const linkedDonation = await DonateNowSubmission.findById(linkedId)
        .select("donor.email donor.mobile")
        .lean();
      const lookupQuery = lookupMeta.query.toLowerCase();
      const linkedEmail = toSafeString(linkedDonation?.donor?.email).toLowerCase();
      const lookupMobile = toDigits(lookupMeta.query).slice(-10);
      const linkedMobile = toDigits(linkedDonation?.donor?.mobile).slice(-10);
      const linkMatches =
        lookupMeta.method === "email"
          ? Boolean(lookupQuery && lookupQuery === linkedEmail)
          : Boolean(lookupMobile && lookupMobile === linkedMobile);
      if (!linkedDonation || !lookupMeta.matched || !linkMatches) {
        return NextResponse.json(
          { error: "Existing donor verification could not be confirmed" },
          { status: 400 },
        );
      }
    } else {
      lookupMeta.matched = false;
      lookupMeta.matchedSubmissionId = "";
    }

    const redirectUrl = `${siteUrl}/api/payment/callback`;
    const cancelUrl = `${siteUrl}/api/payment/callback`;

    // Save donate-now submission with pending status
    const donation = await DonateNowSubmission.create({
      orderId,
      amount: normalizedAmount,
      currency: "INR",
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
      initiatedAt: new Date(),
      payment: {
        gateway: getGatewayLabel(activeGateway),
        amount: normalizedAmount,
        currency: "INR",
        verificationStatus: "pending",
      },
    });

    if (activeGateway === RAZORPAY) {
      let razorpayOrder;
      try {
        razorpayOrder = await razorpay.createOrder({
          amount: normalizedAmount,
          currency: "INR",
          receipt: orderId,
          notes: {
            orderId,
            purpose: toSafeString(purpose, 200),
            purposeId: toSafeString(purposeId, 100),
            zakat: toSafeString(zakat || "No", 20),
            pan: normalizedDonor.pan,
            note: toSafeString(note, 200),
          },
        });
      } catch (orderErr) {
        console.error("Razorpay order creation failed:", orderErr?.message || orderErr);
        donation.status = "failed";
        donation.completedAt = new Date();
        donation.payment.verificationStatus = "invalid";
        donation.payment.verificationMessage = `Razorpay order creation failed: ${
          orderErr?.message || "unknown error"
        }`;
        await donation.save().catch(() => {});
        return NextResponse.json(
          { error: "Failed to initiate payment" },
          { status: 502 },
        );
      }

      // Razorpay callbacks identify the order by its own id, not ours.
      donation.payment.gatewayOrderId = razorpayOrder.id;
      await donation.save();

      const theme = await ThemeConfig.findOne({}).select("siteTitle").lean();

      return NextResponse.json({
        provider: RAZORPAY,
        orderId,
        keyId: razorpay.getCredentials().keyId,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        callbackUrl: `${siteUrl}/api/payment/razorpay/callback`,
        name: toSafeString(theme?.siteTitle, 100) || "Donation",
        description: toSafeString(purpose, 200) || "Donation",
        prefill: {
          name: normalizedDonor.name,
          email: normalizedDonor.email,
          contact: normalizedDonor.mobile,
        },
        notes: razorpayOrder.notes || {},
      });
    }

    // Build CCAvenue request parameters
    const params = new URLSearchParams({
      merchant_id: merchantId,
      order_id: orderId,
      currency: "INR",
      amount: normalizedAmount.toFixed(2),
      redirect_url: redirectUrl,
      cancel_url: cancelUrl,
      language: "EN",
      billing_name: normalizedDonor.name,
      billing_email: normalizedDonor.email,
      billing_tel: normalizedDonor.mobile,
      billing_address: normalizedDonor.address,
      billing_city: normalizedDonor.city,
      billing_state: normalizedDonor.state,
      billing_zip: normalizedDonor.pincode,
      billing_country: normalizedDonor.country || "India",
      merchant_param1: toSafeString(purpose),
      merchant_param2: toSafeString(zakat || "No"),
      merchant_param3: normalizedDonor.pan,
      merchant_param4: toSafeString(note),
      merchant_param5: toSafeString(purposeId),
    }).toString();

    const encRequest = encrypt(params, workingKey);

    return NextResponse.json({
      provider: CCAVENUE,
      encRequest,
      accessCode,
      gatewayUrl: resolvedGatewayUrl,
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
