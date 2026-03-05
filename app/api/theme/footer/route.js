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

const FOOTER_KEYS = [
  "footerLogoUrl",
  "footerAddress",
  "footerEmail",
  "footerPhone",
  "footerCol1Links",
  "footerCol2Links",
  "footerCopyrightText",
  "footerBgColorKey",
  "footerBackgroundImageUrl",
  "footerTextColorKey",
  "footerCopyrightBarColorKey",
];

const FOOTER_DEFAULTS = {
  footerLogoUrl: "",
  footerAddress: "",
  footerEmail: "",
  footerPhone: "",
  footerCol1Links: [],
  footerCol2Links: [],
  footerCopyrightText: "",
  footerBgColorKey: "",
  footerBackgroundImageUrl: "",
  footerTextColorKey: "",
  footerCopyrightBarColorKey: "",
};

function normalizeLink(it) {
  return { label: it?.label ?? "", url: it?.url ?? "" };
}

function toPayload(defaultProps) {
  const out = { ...FOOTER_DEFAULTS };
  if (defaultProps && typeof defaultProps === "object") {
    for (const k of FOOTER_KEYS) {
      if (k === "footerCol1Links" || k === "footerCol2Links") {
        out[k] = Array.isArray(defaultProps[k]) ? defaultProps[k].map(normalizeLink) : [];
      } else if (defaultProps[k] != null) {
        out[k] = typeof defaultProps[k] === "string" ? String(defaultProps[k]).trim() : defaultProps[k];
      }
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
    const defaultProps = { ...FOOTER_DEFAULTS };
    for (const k of FOOTER_KEYS) {
      if (body[k] === undefined) continue;
      if (k === "footerCol1Links" || k === "footerCol2Links") {
        defaultProps[k] = Array.isArray(body[k]) ? body[k].map(normalizeLink) : [];
      } else {
        defaultProps[k] = typeof body[k] === "string" ? String(body[k]).trim() : body[k];
      }
    }

    await connectDB();
    let doc = await Component.findOne({ baseComponent: "Footer" });
    if (!doc) {
      doc = await Component.create({
        name: "Footer",
        displayName: "Footer",
        type: "system",
        baseComponent: "Footer",
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
    console.error("[Footer API] PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
