import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import TestimonialItem from "@/models/TestimonialItem";
import Component from "@/models/Component";

export const dynamic = "force-dynamic";

const DEFAULT_POOL_ITEMS = [
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

function normalizeItemInput(body = {}, fallbackOrder = 1) {
  return {
    quote: String(body?.quote || "").trim(),
    name: String(body?.name || "").trim(),
    role: String(body?.role || "").trim(),
    showInSlider: body?.showInSlider === true,
    order: Number(body?.order) || fallbackOrder,
  };
}

async function ensureDefaultTestimonialItems() {
  const count = await TestimonialItem.countDocuments();
  const [sliderComp, cardComp] = await Promise.all([
    Component.findOne({ baseComponent: "Testimonials" }).lean(),
    Component.findOne({ baseComponent: "DonorTestimonials" }).lean(),
  ]);

  if (count === 0) {
    // Seed the shared pool from the slider component first (the fuller list),
    // then any card-component entries that are not already in the pool.
    const items = [];
    const seen = new Set();
    const push = (quote, name, role, fromSlider) => {
      const q = String(quote || "").trim();
      const n = String(name || "").trim();
      if (!q || !n) return;
      const key = q.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      items.push({
        quote: q,
        name: n,
        role: String(role || "").trim(),
        showInSlider: fromSlider === true,
        order: items.length + 1,
      });
    };

    (sliderComp?.defaultProps?.testimonialsItems || []).forEach((item) =>
      push(item?.quote, item?.name, item?.title, true),
    );
    (cardComp?.defaultProps?.donorTestimonialsItems || []).forEach((item) =>
      push(item?.quote, item?.name, item?.role, false),
    );

    const source = items.length > 0 ? items : DEFAULT_POOL_ITEMS;
    await TestimonialItem.insertMany(
      source.map((item, idx) => ({ ...item, order: idx + 1 })),
    );
    return;
  }

  // Backfill showInSlider for pool rows created before the flag existed:
  // anything matching the slider component's list belongs in the slider.
  const needsBackfill = await TestimonialItem.exists({
    $or: [{ showInSlider: { $exists: false } }, { showInSlider: null }],
  });
  if (needsBackfill) {
    const sliderQuotes = new Set(
      (sliderComp?.defaultProps?.testimonialsItems || []).map((item) =>
        String(item?.quote || "").trim().toLowerCase(),
      ),
    );
    const docs = await TestimonialItem.find({}).select("quote").lean();
    await Promise.all(
      docs.map((doc) =>
        TestimonialItem.updateOne(
          { _id: doc._id },
          { $set: { showInSlider: sliderQuotes.has(String(doc.quote || "").trim().toLowerCase()) } },
        ),
      ),
    );
  }
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    await ensureDefaultTestimonialItems();

    const items = await TestimonialItem.find({})
      .sort({ order: 1, updatedAt: -1 })
      .lean();

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[Testimonial Item API GET error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load testimonial items" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const body = await req.json();
    const quote = String(body?.quote || "").trim();
    const name = String(body?.name || "").trim();
    if (!quote || !name) {
      return NextResponse.json({ error: "Quote and name are required" }, { status: 400 });
    }

    const maxOrder = await TestimonialItem.findOne()
      .sort({ order: -1 })
      .select("order")
      .lean();

    const created = await TestimonialItem.create({
      ...normalizeItemInput(body, (Number(maxOrder?.order) || 0) + 1),
      createdBy: String(session?.id || ""),
      updatedBy: String(session?.id || ""),
    });

    return NextResponse.json(created.toObject(), { status: 201 });
  } catch (err) {
    console.error("[Testimonial Item API POST error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create testimonial item" },
      { status: 500 },
    );
  }
}
