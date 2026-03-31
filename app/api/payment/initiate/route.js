import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Donation from "@/models/Donation";
import { encrypt, generateOrderId } from "@/lib/ccavenue";

export async function POST(req) {
  try {
    const body = await req.json();
    const { amount, purpose, zakat, note, donor } = body;

    // Validate required fields
    if (!amount || !donor?.name || !donor?.email || !donor?.mobile) {
      return NextResponse.json(
        { error: "Amount, name, email, and mobile are required" },
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const redirectUrl = `${siteUrl}/api/payment/callback`;
    const cancelUrl = `${siteUrl}/api/payment/callback`;

    // Save donation with pending status
    await Donation.create({
      orderId,
      amount: Number(amount),
      currency: "INR",
      purpose: purpose || "",
      zakat: zakat || "No",
      note: note || "",
      donor: {
        name: donor.name,
        email: donor.email,
        mobile: donor.mobile,
        pan: donor.pan || "",
        address: donor.address || "",
        city: donor.city || "",
        state: donor.state || "",
        country: donor.country || "",
        pincode: donor.pincode || "",
      },
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
      `billing_name=${donor.name}`,
      `billing_email=${donor.email}`,
      `billing_tel=${donor.mobile}`,
      `billing_address=${donor.address || ""}`,
      `billing_city=${donor.city || ""}`,
      `billing_state=${donor.state || ""}`,
      `billing_zip=${donor.pincode || ""}`,
      `billing_country=${donor.country || "India"}`,
      `merchant_param1=${purpose || ""}`,
      `merchant_param2=${zakat || "No"}`,
      `merchant_param3=${donor.pan || ""}`,
      `merchant_param4=${note || ""}`,
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
