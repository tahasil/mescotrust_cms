import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Donation from "@/models/Donation";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const status = searchParams.get("status") || "";
    const search = (searchParams.get("search") || "").trim();

    await connectDB();

    const filter = {};
    if (status && ["pending", "success", "failed", "aborted"].includes(status)) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { "donor.name": { $regex: search, $options: "i" } },
        { "donor.email": { $regex: search, $options: "i" } },
        { "donor.mobile": { $regex: search, $options: "i" } },
        { orderId: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Donation.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Donation.countDocuments(filter),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
