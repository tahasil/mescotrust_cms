import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Testimonial from "@/models/Testimonial";
import Component from "@/models/Component";

export const dynamic = "force-dynamic";

const DEFAULT_CARD_ITEMS = [
  {
    quote:
      "Would like to take this as an opportunity to thank MESCO for having accepted myself into its family and feel honoured to be associated now as a donor, proud to have been onboard with such a great organization since long back, and hope myself to carry and continue the same throughout.",
    name: "Mr. Mohsin Izhar Ahmed Shaikh",
    role: "Education Sponsor",
  },
  {
    quote:
      "MESCO is one such catalyst from the cluster of organizations working in development sector in Mumbai for last 50 years with an objective of working for the social upliftment of the backward section of the society.",
    name: "Ravinder S. Lohia",
    role: "PMO Manager, Nokia",
  },
  {
    quote:
      "It's almost 3 decades that I came to know about the good work MESCO was doing. I was impressed about their sincerity, transparency and passion.",
    name: "Mr. Kader Sopariwala",
    role: "Chairman Sopariwala Exports",
  },
];

const DEFAULT_SLIDER_ITEMS = [
  {
    quote:
      "Would like to take this as an opportunity to thank MESCO for having accepted myself into its family and feel honoured to be associated now as a donor, proud to have been onboard with such a great organization since long back, and hope myself to carry and continue the same throughout.",
    name: "Mr. Mohsin Izhar Ahmed Shaikh",
    role: "Education Sponsor",
  },
  {
    quote:
      "MESCO is one such catalyst from the cluster of organizations working in development sector in Mumbai for last 50 years with an objective of working for the social upliftment of the backward section of the society.",
    name: "Ravinder S. Lohia",
    role: "PMO Manager, Nokia",
  },
];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "testimonials";
}

async function generateUniqueShortcode(name, currentId = null) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;
  while (true) {
    const query = { shortcode: candidate };
    if (currentId) query._id = { $ne: currentId };
    const existing = await Testimonial.findOne(query).lean();
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

function normalizeItems(rawItems) {
  const list = Array.isArray(rawItems) ? rawItems : [];
  return list
    .map((item, idx) => ({
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

// Card-view typography/text colors, mirrored from the DonorTestimonials
// component settings so a shortcode embed renders with the same look.
function typographyFromComponentProps(compProps = {}) {
  return {
    quoteIconColorKey: String(compProps?.donorTestimonialsQuoteIconColorKey ?? "").trim(),
    quoteTextColorKey: String(compProps?.donorTestimonialsQuoteTextColorKey ?? "").trim(),
    nameColorKey: String(compProps?.donorTestimonialsNameColorKey ?? "").trim(),
    roleColorKey: String(compProps?.donorTestimonialsRoleColorKey ?? "").trim(),
    quoteIconFontSize: normalizeFontSize(compProps?.donorTestimonialsQuoteIconFontSize),
    quoteTextFontSize: normalizeFontSize(compProps?.donorTestimonialsQuoteTextFontSize),
    nameFontSize: normalizeFontSize(compProps?.donorTestimonialsNameFontSize),
    roleFontSize: normalizeFontSize(compProps?.donorTestimonialsRoleFontSize),
    paragraphAlign: String(
      compProps?.donorTestimonialsParagraphAlign ?? compProps?.paragraphAlign ?? "",
    ).trim(),
  };
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

async function ensureDefaultTestimonials() {
  // 1. Card view group seeded from the DonorTestimonials component settings.
  const cardDoc = await Testimonial.findOne({ shortcode: "donor-testimonials" }).lean();
  const donorCompProps = (
    await Component.findOne({ baseComponent: "DonorTestimonials" }).lean()
  )?.defaultProps || {};

  if (!cardDoc) {
    const rawItems = Array.isArray(donorCompProps?.donorTestimonialsItems)
      ? donorCompProps.donorTestimonialsItems
      : DEFAULT_CARD_ITEMS;

    await Testimonial.create({
      name: "Donor Testimonials",
      slug: "donor-testimonials",
      shortcode: "donor-testimonials",
      style: "card",
      description: "Donor testimonials card grid",
      status: "published",
      order: 1,
      subTitle: String(donorCompProps?.subTitle ?? "").trim(),
      mainTitle: String(donorCompProps?.mainTitle ?? "").trim(),
      ...typographyFromComponentProps(donorCompProps),
      items: normalizeItems(rawItems),
    });
  } else if (cardDoc.quoteTextFontSize == null) {
    // Backfill typography for records created before these fields existed so
    // the embed matches the component's configured look.
    await Testimonial.updateOne(
      { _id: cardDoc._id },
      { $set: typographyFromComponentProps(donorCompProps) },
    );
  }

  // 2. Slider view group seeded from the Testimonials component settings
  //    (the list managed at /admin/components/Testimonials/edit).
  const sliderDoc = await Testimonial.findOne({ shortcode: "testimonials-slider" }).lean();
  if (!sliderDoc) {
    const compDoc = await Component.findOne({ baseComponent: "Testimonials" }).lean();
    const compProps = compDoc?.defaultProps || {};

    const rawItems = Array.isArray(compProps?.testimonialsItems)
      ? compProps.testimonialsItems
      : DEFAULT_SLIDER_ITEMS;

    // Testimonials items carry `title`; the Testimonial model stores it as `role`.
    const items = rawItems.map((item) => ({
      quote: String(item?.quote || "").trim(),
      name: String(item?.name || "").trim(),
      role: String(item?.title ?? item?.role ?? "").trim(),
    }));

    await Testimonial.create({
      name: "Testimonials Slider",
      slug: "testimonials-slider",
      shortcode: "testimonials-slider",
      style: "slider",
      description: "Testimonials slider",
      status: "published",
      order: 2,
      subTitle: "Donor Testimonials",
      mainTitle: String(compProps?.testimonialsTitle ?? "").trim() || "Donor Testimonials",
      items: normalizeItems(items),
    });
  } else if (!sliderDoc.subTitle && !sliderDoc.mainTitle) {
    await Testimonial.updateOne(
      { _id: sliderDoc._id },
      { $set: { subTitle: "Donor Testimonials", mainTitle: "Donor Testimonials" } },
    );
  }
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    await ensureDefaultTestimonials();

    const { searchParams } = new URL(req.url);
    const search = String(searchParams.get("search") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { shortcode: { $regex: search, $options: "i" } },
        { subTitle: { $regex: search, $options: "i" } },
        { mainTitle: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Testimonial.find(filter)
        .sort({ order: 1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Testimonial.countDocuments(filter),
    ]);

    const formatted = items.map((doc, idx) => ({
      _id: doc._id,
      key: String(doc._id),
      order: doc.order || skip + idx + 1,
      name: doc.name,
      slug: doc.slug,
      shortcode: doc.shortcode,
      style: doc.style || "card",
      description: doc.description || "",
      status: doc.status || "published",
      subTitle: doc.subTitle || "",
      mainTitle: doc.mainTitle || "",
      itemCount: Array.isArray(doc.items) ? doc.items.length : 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return NextResponse.json({
      items: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[Testimonial API GET error]:", err);
    return NextResponse.json({ error: err.message || "Failed to load testimonials" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const body = await req.json();
    const name = String(body?.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Testimonial name is required" }, { status: 400 });
    }

    const style = body?.style === "slider" ? "slider" : "card";
    const requestedShortcode = String(body?.shortcode || "").trim();
    const shortcode = await generateUniqueShortcode(requestedShortcode || name);
    const items = normalizeItems(body?.items);

    const maxOrder = await Testimonial.findOne()
      .sort({ order: -1 })
      .select("order")
      .lean();

    const created = await Testimonial.create({
      name,
      slug: slugify(name),
      shortcode,
      style,
      description: String(body?.description || "").trim(),
      status: ["published", "draft", "archived"].includes(body?.status) ? body.status : "published",
      order: (Number(maxOrder?.order) || 0) + 1,
      subTitle: String(body?.subTitle ?? "").trim(),
      mainTitle: String(body?.mainTitle ?? "").trim(),
      ...normalizeTypographyInput(body),
      items: items.length > 0 ? items : normalizeItems(DEFAULT_CARD_ITEMS),
      createdBy: String(session?.id || ""),
      updatedBy: String(session?.id || ""),
    });

    return NextResponse.json(created.toObject(), { status: 201 });
  } catch (err) {
    console.error("[Testimonial API POST error]:", err);
    return NextResponse.json({ error: err.message || "Failed to create testimonial" }, { status: 500 });
  }
}
