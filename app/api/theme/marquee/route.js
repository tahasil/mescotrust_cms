/**
 * Marquee data in components collection (Component model, baseComponent: "Marquee").
 * GET: public. PUT: admin only.
 */
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const MARQUEE_DEFAULTS = {
  marqueeTitle: "Our CSR Partners | Awards & Recognition",
  marqueeItems: [],
};

function normalizeItem(it) {
  return {
    url: it?.url != null ? String(it.url).trim() : "",
    alt: it?.alt != null ? String(it.alt).trim() : "",
  };
}

function toPayload(defaultProps) {
  const title =
    defaultProps?.marqueeTitle != null
      ? String(defaultProps.marqueeTitle).trim()
      : MARQUEE_DEFAULTS.marqueeTitle;
  const items = Array.isArray(defaultProps?.marqueeItems)
    ? defaultProps.marqueeItems.map(normalizeItem)
    : MARQUEE_DEFAULTS.marqueeItems;
  return { marqueeTitle: title, marqueeItems: items };
}

export async function GET() {
  try {
    await connectDB();
    const doc = await Component.findOne({ baseComponent: "Marquee" }).lean();
    const payload = toPayload(doc?.defaultProps);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[Marquee API] GET error:", err);
    return NextResponse.json(toPayload(null), { status: 200 });
  }
}

export async function PUT(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(token)) return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    const marqueeTitle =
      body.marqueeTitle != null ? String(body.marqueeTitle).trim() : MARQUEE_DEFAULTS.marqueeTitle;
    const marqueeItems = Array.isArray(body.marqueeItems)
      ? body.marqueeItems.map(normalizeItem)
      : MARQUEE_DEFAULTS.marqueeItems;

    await connectDB();
    let doc = await Component.findOne({ baseComponent: "Marquee" });
    const defaultProps = { marqueeTitle, marqueeItems };
    if (!doc) {
      doc = await Component.create({
        name: "Marquee",
        displayName: "Marquee",
        type: "system",
        baseComponent: "Marquee",
        defaultProps,
        layout: [],
        active: true,
      });
    } else {
      doc.defaultProps = { ...(doc.defaultProps || {}), ...defaultProps };
      doc.markModified("defaultProps");
      await doc.save();
    }

    const out = toPayload(doc.defaultProps);
    return NextResponse.json(out, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[Marquee API] PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
