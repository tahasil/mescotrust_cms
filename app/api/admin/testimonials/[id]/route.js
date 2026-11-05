import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Testimonial from "@/models/Testimonial";

export const dynamic = "force-dynamic";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "testimonials";
}

function normalizeItems(rawItems) {
  const list = Array.isArray(rawItems) ? rawItems : [];
  return list
    .map((item, idx) => ({
      _id: item?._id || new mongoose.Types.ObjectId(),
      quote: String(item?.quote || "").trim(),
      name: String(item?.name || "").trim(),
      role: String(item?.role || "").trim(),
      order: item?.order != null ? Number(item.order) : idx + 1,
    }))
    .filter((item) => item.quote && item.name)
    .map((item, idx) => ({ ...item, order: idx + 1 }));
}

function normalizeFontSize(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeTypographyInput(body = {}) {
  return {
    quoteIconColorKey: String(body?.quoteIconColorKey ?? "").trim(),
    quoteTextColorKey: String(body?.quoteTextColorKey ?? "").trim(),
    nameColorKey: String(body?.nameColorKey ?? "").trim(),
    roleColorKey: String(body?.roleColorKey ?? "").trim(),
    quoteIconFontSize: normalizeFontSize(body?.quoteIconFontSize),
    quoteTextFontSize: normalizeFontSize(body?.quoteTextFontSize),
    nameFontSize: normalizeFontSize(body?.nameFontSize),
    roleFontSize: normalizeFontSize(body?.roleFontSize),
    paragraphAlign: String(body?.paragraphAlign ?? "").trim(),
  };
}

async function findTestimonialByIdOrShortcode(idOrCode) {
  const query = mongoose.Types.ObjectId.isValid(idOrCode)
    ? { _id: idOrCode }
    : { shortcode: String(idOrCode).toLowerCase() };
  return Testimonial.findOne(query);
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Testimonial ID is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await findTestimonialByIdOrShortcode(id);
    if (!doc) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    const testimonial = doc.toObject();
    if (Array.isArray(testimonial.items)) {
      testimonial.items.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    }

    return NextResponse.json(testimonial);
  } catch (err) {
    console.error("[Testimonial API GET Detail error]:", err);
    return NextResponse.json({ error: err.message || "Failed to load testimonial" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Testimonial ID is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await findTestimonialByIdOrShortcode(id);
    if (!doc) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    const body = await req.json();

    if (body.name) doc.name = String(body.name).trim();
    if (body.name) doc.slug = slugify(body.name);
    if (body.style !== undefined) {
      doc.style = body.style === "slider" ? "slider" : "card";
    }
    if (body.shortcode) {
      const newShortcode = slugify(body.shortcode);
      const existing = await Testimonial.findOne({
        shortcode: newShortcode,
        _id: { $ne: doc._id },
      }).lean();
      if (existing) {
        return NextResponse.json(
          { error: `Shortcode "${newShortcode}" is already in use by another testimonial` },
          { status: 400 },
        );
      }
      doc.shortcode = newShortcode;
    }
    if (body.description !== undefined) doc.description = String(body.description).trim();
    if (body.status !== undefined) doc.status = body.status;
    if (body.order !== undefined) doc.order = Number(body.order) || 0;
    if (body.subTitle !== undefined) doc.subTitle = String(body.subTitle).trim();
    if (body.mainTitle !== undefined) doc.mainTitle = String(body.mainTitle).trim();
    if (body.typography !== undefined || body.quoteTextFontSize !== undefined) {
      Object.assign(doc, normalizeTypographyInput(body));
    }
    if (body.items !== undefined) {
      doc.items = normalizeItems(body.items);
      doc.markModified("items");
    }

    doc.updatedBy = String(session?.id || "");
    await doc.save();

    return NextResponse.json(doc.toObject());
  } catch (err) {
    console.error("[Testimonial API PUT Detail error]:", err);
    return NextResponse.json({ error: err.message || "Failed to update testimonial" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "Testimonial ID is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await findTestimonialByIdOrShortcode(id);
    if (!doc) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    await Testimonial.deleteOne({ _id: doc._id });
    return NextResponse.json({ success: true, message: "Testimonial deleted successfully" });
  } catch (err) {
    console.error("[Testimonial API DELETE Detail error]:", err);
    return NextResponse.json({ error: err.message || "Failed to delete testimonial" }, { status: 500 });
  }
}
