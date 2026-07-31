import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import DonateNowSubmission from "@/models/DonateNowSubmission";

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const status = searchParams.get("status") || "";
    const search = (searchParams.get("search") || "").trim();
    const purposeId = (searchParams.get("purposeId") || "").trim();
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    await connectDB();

    const filter = { isDeleted: { $ne: true } };
    if (
      status &&
      ["pending", "success", "failed", "cancelled", "aborted"].includes(status)
    ) {
      filter.status = status;
    }
    if (search) {
      const safeSearch = escapeRegex(search.slice(0, 120));
      filter.$or = [
        { "donor.name": { $regex: safeSearch, $options: "i" } },
        { "donor.email": { $regex: safeSearch, $options: "i" } },
        { "donor.mobile": { $regex: safeSearch, $options: "i" } },
        { orderId: { $regex: safeSearch, $options: "i" } },
        { purpose: { $regex: safeSearch, $options: "i" } },
        { "payment.trackingId": { $regex: safeSearch, $options: "i" } },
        { "payment.transactionId": { $regex: safeSearch, $options: "i" } },
        { "payment.paymentId": { $regex: safeSearch, $options: "i" } },
        { "payment.bankRefNo": { $regex: safeSearch, $options: "i" } },
      ];
    }
    if (purposeId) {
      filter.purposeId = purposeId;
    }
    if (from || to) {
      const createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (Number.isNaN(fromDate.getTime())) {
          return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
        }
        createdAt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (Number.isNaN(toDate.getTime())) {
          return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
        }
        createdAt.$lte = toDate;
      }
      if (createdAt.$gte && createdAt.$lte && createdAt.$gte > createdAt.$lte) {
        return NextResponse.json(
          { error: "Start date cannot be after end date" },
          { status: 400 },
        );
      }
      filter.createdAt = createdAt;
    }

    const [items, total] = await Promise.all([
      DonateNowSubmission.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      DonateNowSubmission.countDocuments(filter),
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
