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
  subscribeSubtitle: "Subscribe to our newsletter for weekly and monthly news",
  subscribeTitle: "Be someone's",
  subscribeHeadingAccent: "tomorrow.",
  subscribePrimaryButtonLabel: "Donate Now",
  subscribePrimaryButtonUrl: "/donate",
  subscribePrimaryButtonTarget: "_self",
  subscribeSecondaryButtonLabel: "Become a Volunteer",
  subscribeSecondaryButtonUrl: "/volunteer",
  subscribeSecondaryButtonTarget: "_self",
  subscribePlaceholder: "you@example.com",
  subscribeButtonText: "Subscribe",
  subscribeSubtitleColorKey: "blackLight",
  subscribeTitleColorKey: "black",
  subscribeButtonBgColorKey: "dark",
  subscribeButtonTextColorKey: "warmWhite",
  subscribeAccentColorKey: "primary",
  subscribeOutlineColorKey: "blackLight",
  subscribePrimaryButtonBgColorKey: "primary",
  subscribePrimaryButtonTextColorKey: "white",
  subscribeSecondaryButtonBgColorKey: "dark",
  subscribeSecondaryButtonTextColorKey: "warmWhite",
  subscribeInputBorderColorKey: "border",
  subscribeInputBgColorKey: "white",
  subscribeInputTextColorKey: "black",
  subscribeFocusColorKey: "primary",
  subscribeErrorColorKey: "primary",
  subscribeSectionId: "",
  subscribeSectionBgType: "default",
  subscribeSectionBgImage: "",
  subscribeSectionBgColorKey: "",
  subscribeSectionPaddingTop: undefined,
  subscribeSectionPaddingRight: undefined,
  subscribeSectionPaddingBottom: undefined,
  subscribeSectionPaddingLeft: undefined,
  subscribeSectionMarginTop: undefined,
  subscribeSectionMarginBottom: undefined,
  subscribePageContainerBgType: "default",
  subscribePageContainerBgImage: "",
  subscribePageContainerBgColorKey: "",
  subscribePageContainerPaddingTop: undefined,
  subscribePageContainerPaddingRight: undefined,
  subscribePageContainerPaddingBottom: undefined,
  subscribePageContainerPaddingLeft: undefined,
  subscribePageContainerMarginTop: undefined,
  subscribePageContainerMarginBottom: undefined,
  _disableFadeAnimation: false,
};

const LEGACY_SUBSCRIBE_TITLE =
  "To get weekly & monthly news, Subscribe to our newsletter.";
const SUBSCRIBE_DESIGN_COLOR_KEYS = [
  "subscribeSubtitleColorKey",
  "subscribeTitleColorKey",
  "subscribeButtonBgColorKey",
  "subscribeButtonTextColorKey",
  "subscribeAccentColorKey",
  "subscribeOutlineColorKey",
  "subscribePrimaryButtonBgColorKey",
  "subscribePrimaryButtonTextColorKey",
  "subscribeSecondaryButtonBgColorKey",
  "subscribeSecondaryButtonTextColorKey",
  "subscribeInputBorderColorKey",
  "subscribeInputBgColorKey",
  "subscribeInputTextColorKey",
  "subscribeFocusColorKey",
  "subscribeErrorColorKey",
];

function normalizeSubscribeProps(input) {
  const payload = input && typeof input === "object" ? input : {};
  const out = Object.fromEntries(
    Object.entries(SUBSCRIBE_DEFAULTS).map(([key, fallback]) => {
      const value = payload[key];
      return [
        key,
        typeof value === "string"
          ? value.trim()
          : value != null
            ? value
            : fallback,
      ];
    }),
  );
  const isLegacySeed =
    out.subscribeTitle === LEGACY_SUBSCRIBE_TITLE &&
    !out.subscribeHeadingAccent;
  if (isLegacySeed) {
    out.subscribeTitle = SUBSCRIBE_DEFAULTS.subscribeTitle;
    out.subscribeHeadingAccent = SUBSCRIBE_DEFAULTS.subscribeHeadingAccent;
    out.subscribeSubtitle = SUBSCRIBE_DEFAULTS.subscribeSubtitle;
    out.subscribePrimaryButtonLabel = SUBSCRIBE_DEFAULTS.subscribePrimaryButtonLabel;
    out.subscribePrimaryButtonUrl = SUBSCRIBE_DEFAULTS.subscribePrimaryButtonUrl;
    out.subscribeSecondaryButtonLabel = SUBSCRIBE_DEFAULTS.subscribeSecondaryButtonLabel;
    out.subscribeSecondaryButtonUrl = SUBSCRIBE_DEFAULTS.subscribeSecondaryButtonUrl;
    out.subscribePlaceholder = SUBSCRIBE_DEFAULTS.subscribePlaceholder;
    for (const key of SUBSCRIBE_DESIGN_COLOR_KEYS) {
      out[key] = SUBSCRIBE_DEFAULTS[key];
    }
  }
  out.subscribePrimaryButtonTarget =
    out.subscribePrimaryButtonTarget === "_blank" ? "_blank" : "_self";
  out.subscribeSecondaryButtonTarget =
    out.subscribeSecondaryButtonTarget === "_blank" ? "_blank" : "_self";
  out.subscribeSectionBgType =
    out.subscribeSectionBgType === "image" || out.subscribeSectionBgType === "color"
      ? out.subscribeSectionBgType
      : "default";
  out.subscribePageContainerBgType =
    out.subscribePageContainerBgType === "image" ||
    out.subscribePageContainerBgType === "color"
      ? out.subscribePageContainerBgType
      : "default";
  out._disableFadeAnimation = out._disableFadeAnimation === true;
  return out;
}

function toPayload(defaultProps) {
  return normalizeSubscribeProps(defaultProps);
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
