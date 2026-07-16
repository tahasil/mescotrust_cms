/**
 * Header content in components collection (Component model, baseComponent: "Header").
 * GET: public. PUT: admin only.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import Component from "@/models/Component";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const HEADER_DEFAULTS = {
  menuName: "",
  navItems: [],
  headerSearchEnabled: false,
  headerSearchLabel: "",
  headerSearchOpenAriaLabel: "",
  headerSearchPlaceholder: "",
  headerSearchDialogLabel: "",
  headerSearchInputAriaLabel: "",
  headerSearchCloseAriaLabel: "",
  headerSearchMinCharsMessage: "",
  headerSearchLoadingMessage: "",
  headerSearchNoResultsMessage: "",
  headerSearchErrorMessage: "",
  headerSearchResultTypePageLabel: "",
  headerSearchResultTypeBlogLabel: "",
  headerSearchResultTypeEventLabel: "",
  headerSearchFallbackTitle: "",
  headerSearchFallbackMeta: "",
  logoType: "text",
  logoUrl: "",
  logoLightUrl: "",
  logoMobileUrl: "",
  logoDarkUrl: "",
  logoImageUrl: "",
  headerAnnouncementEnabled: false,
  headerAnnouncementItems: [],
  headerAnnouncementText: "",
  headerAnnouncementLinkUrl: "",
  headerAnnouncementLinkTarget: "_self",
  headerAnnouncementFontSize: 14,
  headerAnnouncementFontWeight: "600",
  headerAnnouncementTextColor: "#ffffff",
  headerAnnouncementBackgroundColor: "#d92d20",
  headerAnnouncementMarqueeSpeed: 20,
  headerAnnouncementDirection: "rtl",
  headerAnnouncementPaddingX: 24,
  headerVolunteerLabel: "",
  headerVolunteerHref: "",
  headerVolunteerHrefTarget: "_self",
  headerVolunteerIconUrl: "",
  headerVolunteerIconUrlMobile: "",
  headerDonateLabel: "",
  headerDonateHref: "",
  headerDonateIconUrl: "",
  headerBgColorKey: "headerBg",
  headerCtaBgColorKey: "headerCta",
  headerCtaTextColorKey: "primary",
  headerDonateBgColorKey: "gradient",
  headerDonateTextColorKey: "white",
  _sectionBg: "",
  _containerType: "container",
  _sectionPadding: "",
  _sectionBorderSize: "",
  _sectionBorderStyle: "",
  _sectionBorderColor: "",
  _sectionShadow: "",
};

const REMOVED_HEADER_KEYS = new Set([
  "headerAnnouncementLoopEnabled",
  "headerDonateIconUrlMobile",
  "volunteerModalTitle",
  "volunteerModalSuccessTitle",
  "volunteerModalSuccessDescription",
  "volunteerModalErrorTitle",
  "volunteerModalNameLabel",
  "volunteerModalEmailLabel",
  "volunteerModalSubjectLabel",
  "volunteerModalMessageLabel",
  "volunteerModalNamePlaceholder",
  "volunteerModalEmailPlaceholder",
  "volunteerModalSubjectPlaceholder",
  "volunteerModalMessagePlaceholder",
  "volunteerModalCancelLabel",
  "volunteerModalSendLabel",
  "volunteerModalSendingLabel",
  "volunteerModalNameRequiredMessage",
  "volunteerModalEmailRequiredMessage",
  "volunteerModalEmailInvalidMessage",
  "volunteerModalSubjectRequiredMessage",
  "volunteerModalSubjectMinMessage",
  "volunteerModalMessageRequiredMessage",
  "volunteerModalMessageMinMessage",
  "volunteerModalBtnBg",
  "volunteerModalBtnText",
  "volunteerModalCancelColor",
]);
const RESERVED_MENU_NAMES = new Set(["header", "footer"]);

function isReservedMenuName(name) {
  return RESERVED_MENU_NAMES.has(String(name || "").trim().toLowerCase());
}

function normalizeNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (Number.isFinite(min) && parsed < min) return min;
  if (Number.isFinite(max) && parsed > max) return max;
  return parsed;
}

function normalizeAnnouncementItem(item) {
  const out = item && typeof item === "object" ? item : {};
  return {
    text: out.text != null ? String(out.text).trim() : "",
    url: out.url != null ? String(out.url).trim() : "",
    target: String(out.target || "").trim() === "_blank" ? "_blank" : "_self",
  };
}

function normalizeHeaderProps(input) {
  const payload = input && typeof input === "object" ? input : {};
  const out = { ...HEADER_DEFAULTS, ...payload };
  if (!out.headerDonateIconUrl && payload?.headerDonateIconUrlMobile) {
    out.headerDonateIconUrl = String(payload.headerDonateIconUrlMobile || "").trim();
  }
  for (const key of REMOVED_HEADER_KEYS) {
    delete out[key];
  }
  out.headerSearchEnabled = out.headerSearchEnabled === true;
  out.headerAnnouncementEnabled = out.headerAnnouncementEnabled === true;
  out.headerAnnouncementItems = Array.isArray(out.headerAnnouncementItems)
    ? out.headerAnnouncementItems
        .map(normalizeAnnouncementItem)
        .filter((it) => it.text)
    : [];
  if (out.headerAnnouncementItems.length === 0) {
    const fallbackText = String(out.headerAnnouncementText || "").trim();
    if (fallbackText) {
      out.headerAnnouncementItems = [
        normalizeAnnouncementItem({
          text: fallbackText,
          url: out.headerAnnouncementLinkUrl,
          target: out.headerAnnouncementLinkTarget,
        }),
      ];
    }
  }
  out.headerAnnouncementLinkTarget =
    String(out.headerAnnouncementLinkTarget || "").trim() === "_blank"
      ? "_blank"
      : "_self";
  out.headerAnnouncementFontSize = normalizeNumber(
    out.headerAnnouncementFontSize,
    HEADER_DEFAULTS.headerAnnouncementFontSize,
    10,
    40,
  );
  out.headerAnnouncementMarqueeSpeed = normalizeNumber(
    out.headerAnnouncementMarqueeSpeed,
    HEADER_DEFAULTS.headerAnnouncementMarqueeSpeed,
    4,
    120,
  );
  out.headerAnnouncementDirection =
    String(out.headerAnnouncementDirection || "").trim().toLowerCase() === "ltr"
      ? "ltr"
      : "rtl";
  out.headerAnnouncementPaddingX = normalizeNumber(
    out.headerAnnouncementPaddingX,
    HEADER_DEFAULTS.headerAnnouncementPaddingX,
    0,
    120,
  );
  out.headerAnnouncementFontWeight =
    String(out.headerAnnouncementFontWeight || "").trim() ||
    HEADER_DEFAULTS.headerAnnouncementFontWeight;
  out.headerVolunteerHrefTarget =
    String(out.headerVolunteerHrefTarget || "").trim() === "_blank" ? "_blank" : "_self";
  out.menuName = String(out.menuName || "").trim();
  if (isReservedMenuName(out.menuName)) {
    out.menuName = "";
  }
  out.navItems = Array.isArray(out.navItems) ? out.navItems : [];
  for (const [key, value] of Object.entries(out)) {
    if (key === "navItems" || key === "menuName") continue;
    if (typeof value === "string") out[key] = value.trim();
  }
  return out;
}

export async function GET() {
  try {
    await connectDB();
    const doc = await Component.findOne({ baseComponent: "Header" })
      .sort({ updatedAt: -1 })
      .lean();
    const payload = normalizeHeaderProps(doc?.defaultProps);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[Header API] GET error:", err);
    return NextResponse.json(normalizeHeaderProps(null), { status: 200 });
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
    let doc = await Component.findOne({ baseComponent: "Header" }).sort({
      updatedAt: -1,
    });
    if (!doc) {
      const defaultProps = normalizeHeaderProps(payload);
      doc = await Component.create({
        name: "Header",
        displayName: "Header",
        type: "system",
        baseComponent: "Header",
        defaultProps: { ...defaultProps },
        layout: [],
        active: true,
      });
    } else {
      doc.defaultProps = normalizeHeaderProps({
        ...(doc.defaultProps || {}),
        ...payload,
      });
      doc.markModified("defaultProps");
      await doc.save();
    }

    revalidatePath("/", "layout");
    const out = normalizeHeaderProps(doc.defaultProps);
    return NextResponse.json(out, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    console.error("[Header API] PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
