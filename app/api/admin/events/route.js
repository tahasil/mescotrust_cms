import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import { normalizeSlug } from "@/lib/slug";
import { syncMediaUsageForEvent } from "@/lib/media/usageTracker";
import { validateEventImages } from "@/lib/eventImageValidation";

function parseOptionalDate(v) {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const skip = (page - 1) * limit;

    await connectDB();
    const [items, total] = await Promise.all([
      Event.find().sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Event.countDocuments(),
    ]);
    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
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
      featured,
      eventLink,
      tags,
      status,
      meta,
      locale,
    } = body;

    const imageValidationErrors = await validateEventImages({
      featuredImageDesktop,
      featuredImageMobile,
    });
    if (imageValidationErrors.length > 0) {
      return NextResponse.json(
        { error: imageValidationErrors[0] },
        { status: 400 },
      );
    }

    const result = normalizeSlug(rawSlug || title);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const slug = result.slug;

    await connectDB();
    const existing = await Event.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "An event with this slug already exists" }, { status: 400 });
    }

    const doc = await Event.create({
      title: title || "Untitled",
      slug,
      description: description || "",
      content: content || "",
      featuredImageDesktop: featuredImageDesktop || "",
      featuredImageMobile: featuredImageMobile || "",
      startDate: parseOptionalDate(startDate),
      endDate: parseOptionalDate(endDate),
      time: time || "",
      location: isOnline ? "" : location || "",
      isOnline: Boolean(isOnline),
      featured: featured === true,
      eventLink: eventLink || "",
      tags: Array.isArray(tags) ? tags : [],
      status: status || "draft",
      meta: meta || {},
      ...(locale && { locale }),
      createdBy: session.email || "",
      updatedBy: session.email || "",
    });
    await syncMediaUsageForEvent(doc);
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
