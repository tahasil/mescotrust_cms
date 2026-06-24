import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import VolunteersFeedbackSubmission from "@/models/VolunteersFeedbackSubmission";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const status = (searchParams.get("status") || "").trim().toLowerCase();
    const source = (searchParams.get("source") || "").trim();
    const search = (searchParams.get("search") || "").trim();
    const skip = (page - 1) * limit;

    await connectDB();

    const filter = {};
    if (status === "read") filter.isRead = true;
    if (status === "unread") filter.isRead = false;
    if (source) filter.source = source;
    if (search) {
      filter.$or = [
        { "payload.name": { $regex: search, $options: "i" } },
        { "payload.email": { $regex: search, $options: "i" } },
        { "payload.phone": { $regex: search, $options: "i" } },
        { "payload.message": { $regex: search, $options: "i" } },
      ];
    }

    const [items, total, sourceList] = await Promise.all([
      VolunteersFeedbackSubmission.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      VolunteersFeedbackSubmission.countDocuments(filter),
      VolunteersFeedbackSubmission.distinct("source"),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      sources: Array.isArray(sourceList)
        ? sourceList.filter(Boolean).sort((a, b) => a.localeCompare(b))
        : [],
    }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
