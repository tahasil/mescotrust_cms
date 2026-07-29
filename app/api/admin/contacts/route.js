import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import ContactSubmission from "@/models/ContactSubmission";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const submissionType = (searchParams.get("submissionType") || "all").toLowerCase();
    const skip = (page - 1) * limit;
    const volunteerRegex = /volunteer/i;
    const volunteerFilter = {
      $or: [
        { source: volunteerRegex },
        { page: volunteerRegex },
        { "payload.subject": volunteerRegex },
      ],
    };
    const typeQuery =
      submissionType === "volunteer"
        ? volunteerFilter
        : submissionType === "contact"
          ? { $nor: volunteerFilter.$or }
          : {};
    const query = { ...typeQuery, isDeleted: { $ne: true } };

    await connectDB();
    const [items, total] = await Promise.all([
      ContactSubmission.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ContactSubmission.countDocuments(query),
    ]);
    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
