import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const shortcodeParam = String(params?.shortcode || "").trim().toLowerCase();
  if (!shortcodeParam) {
    return NextResponse.json({ error: "Shortcode is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const query = mongoose.Types.ObjectId.isValid(shortcodeParam)
      ? { $or: [{ _id: shortcodeParam }, { shortcode: shortcodeParam }] }
      : { shortcode: shortcodeParam };

    const doc = await Team.findOne(query).lean();
    if (!doc) {
      return NextResponse.json({ error: `Team with shortcode "${shortcodeParam}" not found` }, { status: 404 });
    }

    if (doc.status === "archived") {
      return NextResponse.json({ error: "Team is archived" }, { status: 404 });
    }

    const members = Array.isArray(doc.members)
      ? [...doc.members].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
      : [];

    return NextResponse.json(
      {
        ...doc,
        members,
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch (err) {
    console.error("[Public Team API error]:", err);
    return NextResponse.json({ error: err.message || "Failed to load team" }, { status: 500 });
  }
}
