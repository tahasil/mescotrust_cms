/**
 * Header content in components collection (Component model, baseComponent: "Header").
 * GET: public. PUT: admin only.
 */
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const HEADER_KEYS = [
  "logoType",
  "logoLightUrl",
  "logoMobileUrl",
  "logoImageUrl",
  "headerVolunteerLabel",
  "headerVolunteerHref",
  "headerVolunteerIconUrl",
  "headerVolunteerIconUrlMobile",
  "headerDonateLabel",
  "headerDonateHref",
  "headerDonateIconUrl",
  "headerDonateIconUrlMobile",
  "headerBgColorKey",
  "headerCtaBgColorKey",
  "headerCtaTextColorKey",
  "headerDonateBgColorKey",
  "headerDonateTextColorKey",
];

const HEADER_DEFAULTS = {
  logoType: "text",
  logoLightUrl: "",
  logoMobileUrl: "",
  logoImageUrl: "",
  headerVolunteerLabel: "",
  headerVolunteerHref: "",
  headerVolunteerIconUrl: "",
  headerVolunteerIconUrlMobile: "",
  headerDonateLabel: "",
  headerDonateHref: "",
  headerDonateIconUrl: "",
  headerDonateIconUrlMobile: "",
  headerBgColorKey: "headerBg",
  headerCtaBgColorKey: "headerCta",
  headerCtaTextColorKey: "primary",
  headerDonateBgColorKey: "gradient",
  headerDonateTextColorKey: "white",
};

function toPayload(defaultProps) {
  const out = { ...HEADER_DEFAULTS };
  if (defaultProps && typeof defaultProps === "object") {
    for (const k of HEADER_KEYS) {
      if (defaultProps[k] != null) out[k] = String(defaultProps[k]).trim();
    }
  }
  return out;
}

export async function GET() {
  try {
    await connectDB();
    const doc = await Component.findOne({ baseComponent: "Header" }).lean();
    const payload = toPayload(doc?.defaultProps);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[Header API] GET error:", err);
    return NextResponse.json(toPayload(null), { status: 200 });
  }
}

export async function PUT(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(token)) return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    const defaultProps = { ...HEADER_DEFAULTS };
    for (const k of HEADER_KEYS) {
      if (body[k] !== undefined) {
        defaultProps[k] = typeof body[k] === "string" ? String(body[k]).trim() : body[k];
      }
    }

    await connectDB();
    let doc = await Component.findOne({ baseComponent: "Header" });
    if (!doc) {
      doc = await Component.create({
        name: "Header",
        displayName: "Header",
        type: "system",
        baseComponent: "Header",
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
    console.error("[Header API] PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
