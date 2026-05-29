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
  marqueeTitleColorKey: "",
};

function normalizeItem(it) {
  const desktop =
    it?.urlDesktop != null
      ? String(it.urlDesktop).trim()
      : it?.url != null
        ? String(it.url).trim()
        : "";
  const mobile =
    it?.urlMobile != null ? String(it.urlMobile).trim() : "";
  return {
    urlDesktop: desktop,
    urlMobile: mobile,
    url: desktop,
    alt: it?.alt != null ? String(it.alt).trim() : "",
  };
}

function normalizeMarqueeProps(input) {
  const payload = input && typeof input === "object" ? input : {};
  const out = { ...MARQUEE_DEFAULTS, ...payload };
  out.marqueeTitle =
    out.marqueeTitle != null
      ? String(out.marqueeTitle).trim()
      : MARQUEE_DEFAULTS.marqueeTitle;
  out.marqueeItems = Array.isArray(out.marqueeItems)
    ? out.marqueeItems.map(normalizeItem)
    : [];
  if (out.marqueeTitleColorKey != null) {
    out.marqueeTitleColorKey = String(out.marqueeTitleColorKey).trim();
  }
  for (const [key, value] of Object.entries(out)) {
    if (
      key === "marqueeTitle" ||
      key === "marqueeItems" ||
      key === "marqueeTitleColorKey"
    ) {
      continue;
    }
    if (typeof value === "string") out[key] = value.trim();
  }
  return out;
}

function toPayload(defaultProps) {
  const out = normalizeMarqueeProps(defaultProps);
  if (defaultProps && typeof defaultProps === "object") {
    for (const key of Object.keys(defaultProps)) {
      if (out[key] !== undefined) continue;
      const value = defaultProps[key];
      out[key] = typeof value === "string" ? value.trim() : value;
    }
  }
  return out;
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
    const payload = body && typeof body === "object" ? body : {};

    await connectDB();
    let doc = await Component.findOne({ baseComponent: "Marquee" });
    if (!doc) {
      const defaultProps = normalizeMarqueeProps(payload);
      doc = await Component.create({
        name: "Marquee",
        displayName: "Marquee",
        type: "system",
        baseComponent: "Marquee",
        defaultProps: { ...defaultProps },
        layout: [],
        active: true,
      });
    } else {
      doc.defaultProps = normalizeMarqueeProps({
        ...(doc.defaultProps || {}),
        ...payload,
      });
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
