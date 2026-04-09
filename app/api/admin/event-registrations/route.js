import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import EventRegistration from "@/models/EventRegistration";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const status = searchParams.get("status");
    const eventTitle = searchParams.get("eventTitle");
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (eventTitle) filter.eventTitle = eventTitle;

    await connectDB();
    const [items, total] = await Promise.all([
      EventRegistration.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EventRegistration.countDocuments(filter),
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
