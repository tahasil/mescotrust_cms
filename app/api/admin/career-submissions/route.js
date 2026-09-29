import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import CareerSubmission from "@/models/CareerSubmission";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const status = (searchParams.get("status") || "").trim().toLowerCase();
    const position = (searchParams.get("position") || "").trim();
    const search = (searchParams.get("search") || "").trim();
    const skip = (page - 1) * limit;

    await connectDB();

    const filter = {};
    if (status === "read") filter.isRead = true;
    else if (status === "unread") filter.isRead = false;
    else if (status && status !== "all") filter.status = status;

    if (position && position !== "all") filter.position = position;

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } },
        { currentCity: { $regex: search, $options: "i" } },
        { coverLetter: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total, positionsList] = await Promise.all([
      CareerSubmission.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CareerSubmission.countDocuments(filter),
      CareerSubmission.distinct("position"),
    ]);

    return NextResponse.json(
      {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        positions: Array.isArray(positionsList)
          ? positionsList.filter(Boolean).sort((a, b) => a.localeCompare(b))
          : [],
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to fetch submissions" }, { status: 500 });
  }
}
