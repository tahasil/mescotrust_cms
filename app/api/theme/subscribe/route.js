/**
 * Subscribe data is stored in the components collection (Component model),
 * one doc with baseComponent: "Subscribe" and defaultProps: { subscribeSubtitle, ... }.
 * GET: public. PUT: admin only.
 */
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const SUBSCRIBE_KEYS = ["subscribeSubtitle", "subscribeTitle", "subscribePlaceholder", "subscribeButtonText", "subscribeBgUrl"];
const SUBSCRIBE_DEFAULTS = {
  subscribeSubtitle: "",
  subscribeTitle: "",
  subscribePlaceholder: "",
  subscribeButtonText: "",
  subscribeBgUrl: "",
};

function toPayload(defaultProps) {
  const out = { ...SUBSCRIBE_DEFAULTS };
  if (defaultProps && typeof defaultProps === "object") {
    for (const k of SUBSCRIBE_KEYS) {
      if (defaultProps[k] != null) out[k] = String(defaultProps[k]).trim();
    }
  }
  return out;
}

/** GET: return Subscribe props from components collection (public) */
export async function GET() {
  try {
    await connectDB();
    const doc = await Component.findOne({ baseComponent: "Subscribe" }).lean();
    const payload = toPayload(doc?.defaultProps);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[Subscribe API] GET error:", err);
    return NextResponse.json(toPayload(null), { status: 200 });
  }
}

/** PUT: update Subscribe props in components collection (admin only) */
export async function PUT(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(token)) return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    const defaultProps = { ...SUBSCRIBE_DEFAULTS };
    for (const k of SUBSCRIBE_KEYS) {
      if (body[k] !== undefined) {
        defaultProps[k] = typeof body[k] === "string" ? String(body[k]).trim() : body[k];
      }
    }

    await connectDB();
    let doc = await Component.findOne({ baseComponent: "Subscribe" });
    if (!doc) {
      doc = await Component.create({
        name: "Subscribe",
        displayName: "Subscribe",
        type: "system",
        baseComponent: "Subscribe",
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
    console.error("[Subscribe API] PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
