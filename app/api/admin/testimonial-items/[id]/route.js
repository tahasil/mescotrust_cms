import { NextResponse } from "next/server";
import { scrubUnsafeUrls } from "@/lib/security/urlScrub";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import TestimonialItem from "@/models/TestimonialItem";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params?.id;
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
    return NextResponse.json({ error: "Valid item ID is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await TestimonialItem.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Testimonial item not found" }, { status: 404 });
    }

    const body = scrubUnsafeUrls(await req.json());
    if (body.quote !== undefined) doc.quote = String(body.quote).trim();
    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.role !== undefined) doc.role = String(body.role).trim();
    if (body.showInSlider !== undefined) doc.showInSlider = body.showInSlider === true;
    if (body.order !== undefined) doc.order = Number(body.order) || doc.order;
    doc.updatedBy = String(session?.id || "");
    await doc.save();

    return NextResponse.json(doc.toObject());
  } catch (err) {
    console.error("[Testimonial Item API PUT error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update testimonial item" },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params?.id;
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
    return NextResponse.json({ error: "Valid item ID is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await TestimonialItem.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Testimonial item not found" }, { status: 404 });
    }

    await TestimonialItem.deleteOne({ _id: doc._id });
    return NextResponse.json({ success: true, message: "Testimonial item deleted" });
  } catch (err) {
    console.error("[Testimonial Item API DELETE error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete testimonial item" },
      { status: 500 },
    );
  }
}
