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
  volunteerModalTitle: "",
  volunteerModalSuccessTitle: "",
  volunteerModalSuccessDescription: "",
  volunteerModalErrorTitle: "",
  volunteerModalNameLabel: "",
  volunteerModalEmailLabel: "",
  volunteerModalSubjectLabel: "",
  volunteerModalMessageLabel: "",
  volunteerModalNamePlaceholder: "",
  volunteerModalEmailPlaceholder: "",
  volunteerModalSubjectPlaceholder: "",
  volunteerModalMessagePlaceholder: "",
  volunteerModalCancelLabel: "",
  volunteerModalSendLabel: "",
  volunteerModalSendingLabel: "",
  volunteerModalNameRequiredMessage: "",
  volunteerModalEmailRequiredMessage: "",
  volunteerModalEmailInvalidMessage: "",
  volunteerModalSubjectRequiredMessage: "",
  volunteerModalSubjectMinMessage: "",
  volunteerModalMessageRequiredMessage: "",
  volunteerModalMessageMinMessage: "",
  volunteerModalBtnBg: "",
  volunteerModalBtnText: "",
  volunteerModalCancelColor: "",
  _sectionBg: "",
  _containerType: "container",
  _sectionPadding: "",
  _sectionBorderSize: "",
  _sectionBorderStyle: "",
  _sectionBorderColor: "",
  _sectionShadow: "",
};

function normalizeHeaderProps(input) {
  const payload = input && typeof input === "object" ? input : {};
  const out = { ...HEADER_DEFAULTS, ...payload };
  out.headerSearchEnabled = out.headerSearchEnabled === true;
  out.menuName = String(out.menuName || "").trim();
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
