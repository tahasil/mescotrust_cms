import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import { normalizeSlug } from "@/lib/slug";
import { clearUsageForRef, syncMediaUsageForEvent } from "@/lib/media/usageTracker";
import { revalidateEvents } from "@/lib/revalidateContent";

function parseOptionalDate(v) {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const doc = await Event.findById(id).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const body = await req.json();
    const {
      title,
      slug: rawSlug,
      description,
      content,
      featuredImageDesktop,
      featuredImageMobile,
      startDate,
      endDate,
      time,
      location,
      isOnline,
      eventLink,
      tags,
      status,
      meta,
      locale,
    } = body;

    await connectDB();
    const doc = await Event.findById(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (rawSlug !== undefined) {
      const result = normalizeSlug(rawSlug);
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      const existing = await Event.findOne({ slug: result.slug, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ error: "An event with this slug already exists" }, { status: 400 });
      }
      doc.slug = result.slug;
    }
    if (title !== undefined) doc.title = title;
    if (description !== undefined) doc.description = description;
    if (content !== undefined) doc.content = content;
    if (featuredImageDesktop !== undefined) doc.featuredImageDesktop = featuredImageDesktop;
    if (featuredImageMobile !== undefined) doc.featuredImageMobile = featuredImageMobile;
    if (startDate !== undefined) doc.startDate = parseOptionalDate(startDate);
    if (endDate !== undefined) doc.endDate = parseOptionalDate(endDate);
    if (time !== undefined) doc.time = time;
    if (isOnline !== undefined) doc.isOnline = Boolean(isOnline);
    if (location !== undefined && !doc.isOnline) doc.location = location;
    if (doc.isOnline) doc.location = "";
    if (eventLink !== undefined) doc.eventLink = eventLink;
    if (Array.isArray(tags)) doc.tags = tags;
    if (status !== undefined) doc.status = status;
    if (meta !== undefined) doc.meta = meta;
    if (locale !== undefined) doc.locale = locale;
    doc.updatedBy = session.email || "";

    await doc.save();
    await syncMediaUsageForEvent(doc);
    revalidateEvents(doc.slug);
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    await connectDB();
    const doc = await Event.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await clearUsageForRef("event", id);
    revalidateEvents(doc.slug);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
