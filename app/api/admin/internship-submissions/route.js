import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import InternshipSubmission from "@/models/InternshipSubmission";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const status = (searchParams.get("status") || "").trim().toLowerCase();
    const role = (searchParams.get("role") || searchParams.get("position") || "").trim();
    const search = (searchParams.get("search") || "").trim();
    const skip = (page - 1) * limit;

    await connectDB();

    const filter = {};
    if (status === "read") filter.isRead = true;
    else if (status === "unread") filter.isRead = false;
    else if (status && status !== "all") filter.status = status;

    if (role && role !== "all") filter.roleTitle = role;

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { roleTitle: { $regex: search, $options: "i" } },
        { customRole: { $regex: search, $options: "i" } },
        { skills: { $regex: search, $options: "i" } },
        { currentCity: { $regex: search, $options: "i" } },
        { statement: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total, rolesList] = await Promise.all([
      InternshipSubmission.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InternshipSubmission.countDocuments(filter),
      InternshipSubmission.distinct("roleTitle"),
    ]);

    return NextResponse.json(
      {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        roles: Array.isArray(rolesList)
          ? rolesList.filter(Boolean).sort((a, b) => a.localeCompare(b))
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

