import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Testimonial from "@/models/Testimonial";

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

    const doc = await Testimonial.findOne(query).lean();
    if (!doc) {
      return NextResponse.json(
        { error: `Testimonial with shortcode "${shortcodeParam}" not found` },
        { status: 404 },
      );
    }

    if (doc.status === "archived") {
      return NextResponse.json({ error: "Testimonial is archived" }, { status: 404 });
    }

    const items = Array.isArray(doc.items)
      ? [...doc.items].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
      : [];

    const effectiveSubTitle =
      doc.subTitle ||
      (doc.style === "slider" && !doc.mainTitle ? "Donor Testimonials" : doc.subTitle || "");

    return NextResponse.json(
      {
        ...doc,
        subTitle: effectiveSubTitle,
        items,
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch (err) {
    console.error("[Public Testimonial API error]:", err);
    return NextResponse.json({ error: err.message || "Failed to load testimonial" }, { status: 500 });
  }
}
