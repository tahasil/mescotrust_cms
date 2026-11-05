import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import TestimonialItem from "@/models/TestimonialItem";

export const dynamic = "force-dynamic";

export async function PUT(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const body = await req.json();
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(String(id)));

    if (validIds.length === 0) {
      return NextResponse.json({ error: "No valid item ids provided" }, { status: 400 });
    }

    await Promise.all(
      validIds.map((id, index) =>
        TestimonialItem.updateOne({ _id: id }, { $set: { order: index + 1 } }),
      ),
    );

    const items = await TestimonialItem.find({}).sort({ order: 1, updatedAt: -1 }).lean();
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[Testimonial Item API reorder error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to reorder testimonial items" },
      { status: 500 },
    );
  }
}
