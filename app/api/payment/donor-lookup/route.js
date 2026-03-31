import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Donation from "@/models/Donation";

/**
 * Auto-fill: lookup previous donor by email or mobile.
 * Returns donor details from the most recent successful donation.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q || q.length < 3) {
      return NextResponse.json({ donor: null });
    }

    await connectDB();

    const donation = await Donation.findOne({
      status: "success",
      $or: [
        { "donor.email": { $regex: new RegExp(`^${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
        { "donor.mobile": q },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!donation) {
      return NextResponse.json({ donor: null });
    }

    return NextResponse.json({
      donor: {
        name: donation.donor.name || "",
        email: donation.donor.email || "",
        mobile: donation.donor.mobile || "",
        pan: donation.donor.pan || "",
        address: donation.donor.address || "",
        city: donation.donor.city || "",
        state: donation.donor.state || "",
        country: donation.donor.country || "",
        pincode: donation.donor.pincode || "",
      },
    });
  } catch (err) {
    return NextResponse.json({ donor: null });
  }
}
