/**
 * Footer content in components collection (Component model, baseComponent: "Footer").
 * GET: public. PUT: admin only.
 */
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const FOOTER_DEFAULTS = {
  footerLogoUrl: "",
  footerAddress: "",
  footerEmail: "",
  footerPhone: "",
  footerCol1Links: [],
  footerCol2Links: [],
  footerSocialLinks: [],
  footerCopyrightText: "",
  footerBgColorKey: "",
  footerBackgroundImageUrl: "",
  footerTextColorKey: "",
  footerCopyrightBarColorKey: "",
};

function normalizeLink(it) {
  return { label: it?.label ?? "", url: it?.url ?? "" };
}

function normalizeSocial(it) {
  return {
    platform: it?.platform != null ? String(it.platform).trim() : "",
    url: it?.url != null ? String(it.url).trim() : "",
  };
}

function normalizeFooterProps(input) {
  const payload = input && typeof input === "object" ? input : {};
  const out = { ...FOOTER_DEFAULTS, ...payload };
  out.footerCol1Links = Array.isArray(out.footerCol1Links)
    ? out.footerCol1Links.map(normalizeLink)
    : [];
  out.footerCol2Links = Array.isArray(out.footerCol2Links)
    ? out.footerCol2Links.map(normalizeLink)
    : [];
  out.footerSocialLinks = Array.isArray(out.footerSocialLinks)
    ? out.footerSocialLinks.map(normalizeSocial)
    : [];
  for (const [key, value] of Object.entries(out)) {
    if (
      key === "footerCol1Links" ||
      key === "footerCol2Links" ||
      key === "footerSocialLinks"
    ) {
      continue;
    }
    if (typeof value === "string") out[key] = value.trim();
  }
  return out;
}

function toPayload(defaultProps) {
  const out = normalizeFooterProps(defaultProps);
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
    const doc = await Component.findOne({ baseComponent: "Footer" }).lean();
    const payload = toPayload(doc?.defaultProps);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[Footer API] GET error:", err);
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
    let doc = await Component.findOne({ baseComponent: "Footer" });
    if (!doc) {
      const defaultProps = normalizeFooterProps(payload);
      doc = await Component.create({
        name: "Footer",
        displayName: "Footer",
        type: "system",
        baseComponent: "Footer",
        defaultProps: { ...defaultProps },
        layout: [],
        active: true,
      });
    } else {
      doc.defaultProps = normalizeFooterProps({
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
    console.error("[Footer API] PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
