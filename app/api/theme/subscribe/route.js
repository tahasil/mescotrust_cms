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

const SUBSCRIBE_DEFAULTS = {
  subscribeSubtitle: "",
  subscribeTitle: "",
  subscribePlaceholder: "",
  subscribeButtonText: "",
  subscribeBgDesktop: "",
  subscribeBgMobile: "",
  subscribeBgUrl: "",
  subscribeSubtitleColorKey: "",
  subscribeTitleColorKey: "",
  subscribeButtonBgColorKey: "",
  subscribeButtonTextColorKey: "",
};

function normalizeSubscribeProps(input) {
  const payload = input && typeof input === "object" ? input : {};
  const out = { ...SUBSCRIBE_DEFAULTS, ...payload };

  const bgDesktop =
    out.subscribeBgDesktop != null
      ? String(out.subscribeBgDesktop).trim()
      : out.subscribeBgUrl != null
        ? String(out.subscribeBgUrl).trim()
        : "";
  out.subscribeBgDesktop = bgDesktop;
  out.subscribeBgUrl = bgDesktop;
  out.subscribeBgMobile =
    out.subscribeBgMobile != null ? String(out.subscribeBgMobile).trim() : "";

  for (const [key, value] of Object.entries(out)) {
    if (
      key === "subscribeBgDesktop" ||
      key === "subscribeBgUrl" ||
      key === "subscribeBgMobile"
    ) {
      continue;
    }
    if (typeof value === "string") out[key] = value.trim();
  }
  return out;
}

function toPayload(defaultProps) {
  const out = normalizeSubscribeProps(defaultProps);
  if (defaultProps && typeof defaultProps === "object") {
    for (const key of Object.keys(defaultProps)) {
      if (out[key] !== undefined) continue;
      const value = defaultProps[key];
      out[key] = typeof value === "string" ? value.trim() : value;
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
    const payload = body && typeof body === "object" ? body : {};

    await connectDB();
    let doc = await Component.findOne({ baseComponent: "Subscribe" });
    if (!doc) {
      const defaultProps = normalizeSubscribeProps(payload);
      doc = await Component.create({
        name: "Subscribe",
        displayName: "Subscribe",
        type: "system",
        baseComponent: "Subscribe",
        defaultProps: { ...defaultProps },
        layout: [],
        active: true,
      });
    } else {
      doc.defaultProps = normalizeSubscribeProps({
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
    console.error("[Subscribe API] PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
