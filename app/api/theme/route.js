import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import ThemeConfig from "@/models/ThemeConfig";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  siteTitle: "Mesco Trust",
  tagline: "",
  logoType: "text",
  logoLightUrl: "",
  logoMobileUrl: "",
  logoDarkUrl: "",
  logoImageUrl: "",
  faviconUrl: "",
  footerCopyrightText: "",
  primaryColor: "",
  secondaryColor: "",
  bodyBackground: "",
  sectionBackground: "",
  cardBackground: "",
  headerBackground: "",
  footerBackground: "",
  headingColor: "",
  paragraphColor: "",
  linkColor: "",
  hoverColor: "",
  mutedTextColor: "",
  borderColor: "",
  dividerColor: "",
  inputBorderColor: "",
  colors: [],
  headingFont: "",
  bodyFont: "system-ui, sans-serif",
  buttonFont: "",
  baseFontSize: 16,
  h1Size: 0,
  h2Size: 0,
  h3Size: 0,
  h4Size: 0,
  h5Size: 0,
  h6Size: 0,
  lineHeight: 1.6,
  letterSpacing: 0,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  googleFonts: [],
  customFontUrl: "",
  fontFamily: "",
  fontSize: 16,
  headingFontFamily: "",
  headingFontSize: 0,
  fontWeight: 400,
  headingFontWeight: 700,
  buttonRadius: 6,
  cardRadius: 8,
  inputRadius: 6,
  cardShadow: true,
  buttonShadow: false,
  headerLayout: "default",
  headerSticky: true,
  headerTransparent: false,
  headerVolunteerLabel: "Volunteer",
  headerVolunteerHref: "/volunteer",
  headerVolunteerIconUrl: "",
  headerVolunteerIconUrlMobile: "",
  headerDonateLabel: "Donate Now",
  headerDonateHref: "/donate",
  headerDonateIconUrl: "",
  headerDonateIconUrlMobile: "",
  megaMenu: false,
  dropdownStyle: "default",
  mobileMenuStyle: "drawer",
  footerColumnsCount: 4,
  footerLayoutStyle: "default",
  footerSocialIcons: true,
  buttonBackground: "",
  buttonTextColor: "",
  buttonHoverBackground: "",
  buttonHoverTextColor: "",
  buttonPadding: "8px 20px",
  cardStyle: "elevated",
  alertStyle: "default",
  badgeStyle: "default",
  tableStyle: "default",
  formStyle: "default",
  inputStyle: "default",
  mobileFontSize: 0,
  mobileSectionSpacing: "",
  hideSectionOnMobile: false,
  blogLayout: "grid",
  blogSidebarPosition: "right",
  blogFeaturedImageRatio: "16/9",
  blogMetaStyle: "minimal",
  customCss: "",
  customJs: "",
  headScripts: "",
  footerScripts: "",
  googleAnalyticsId: "",
  layoutWidth: 1200,
  defaultLocale: "en",
  direction: "ltr",
};

const THEME_FIELDS = [
  "siteTitle", "tagline", "logoType", "logoLightUrl", "logoMobileUrl", "logoDarkUrl", "logoImageUrl", "faviconUrl", "footerCopyrightText",
  "primaryColor", "secondaryColor", "bodyBackground", "sectionBackground", "cardBackground", "headerBackground", "footerBackground",
  "headingColor", "paragraphColor", "linkColor", "hoverColor", "mutedTextColor", "borderColor", "dividerColor", "inputBorderColor", "colors",
  "headingFont", "bodyFont", "buttonFont", "baseFontSize", "h1Size", "h2Size", "h3Size", "h4Size", "h5Size", "h6Size",
  "lineHeight", "letterSpacing", "fontWeightNormal", "fontWeightMedium", "fontWeightBold",
  "googleFonts", "customFontUrl", "fontFamily", "fontSize", "headingFontFamily", "headingFontSize", "fontWeight", "headingFontWeight",
  "buttonRadius", "cardRadius", "inputRadius", "cardShadow", "buttonShadow",
  "headerLayout", "headerSticky", "headerTransparent",
  "headerVolunteerLabel", "headerVolunteerHref", "headerVolunteerIconUrl", "headerVolunteerIconUrlMobile",
  "headerDonateLabel", "headerDonateHref", "headerDonateIconUrl", "headerDonateIconUrlMobile",
  "megaMenu", "dropdownStyle", "mobileMenuStyle",
  "footerColumnsCount", "footerLayoutStyle", "footerSocialIcons",
  "buttonBackground", "buttonTextColor", "buttonHoverBackground", "buttonHoverTextColor", "buttonPadding",
  "cardStyle", "alertStyle", "badgeStyle", "tableStyle", "formStyle", "inputStyle",
  "mobileFontSize", "mobileSectionSpacing", "hideSectionOnMobile",
  "blogLayout", "blogSidebarPosition", "blogFeaturedImageRatio", "blogMetaStyle",
  "customCss", "customJs", "headScripts", "footerScripts", "googleAnalyticsId",
  "layoutWidth", "defaultLocale", "direction",
];

function normalizeTheme(theme) {
  if (!theme) return { ...DEFAULTS };
  const out = { ...DEFAULTS, ...theme };
  if (!out.bodyFont && out.fontFamily) out.bodyFont = out.fontFamily;
  if (!out.headingFont && out.headingFontFamily) out.headingFont = out.headingFontFamily;
  if (out.baseFontSize == null && out.fontSize != null) out.baseFontSize = out.fontSize;
  if (!out.logoLightUrl && out.logoImageUrl) out.logoLightUrl = out.logoImageUrl;
  if (!Array.isArray(out.colors)) out.colors = [];
  return out;
}

export async function GET() {
  try {
    await connectDB();
    let theme = await ThemeConfig.findOne().lean();
    return NextResponse.json(normalizeTheme(theme));
  } catch {
    return NextResponse.json(DEFAULTS, { status: 200 });
  }
}

export async function PUT(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(token)) return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    await connectDB();
    let theme = await ThemeConfig.findOne();
    if (!theme) {
      theme = await ThemeConfig.create({ ...DEFAULTS, ...body });
    } else {
      for (const f of THEME_FIELDS) {
        if (body[f] !== undefined) theme[f] = body[f];
      }
      await theme.save();
    }
    return NextResponse.json(normalizeTheme(theme));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
