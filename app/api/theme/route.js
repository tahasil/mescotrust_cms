import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import ThemeConfig from "@/models/ThemeConfig";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  siteTitle: "Mesco Trust",
  logoType: "text",
  logoImageUrl: "",
  colors: [],
  fontFamily: "system-ui, sans-serif",
  fontSize: 16,
  headingFontFamily: "",
  headingFontSize: 0,
  lineHeight: 1.6,
  letterSpacing: 0,
  fontWeight: 400,
  headingFontWeight: 700,
  layoutWidth: 1200,
  defaultLocale: "en",
  direction: "ltr",
  googleFonts: [],
  customFontUrl: "",
};

function normalizeTheme(theme) {
  if (!theme) return { ...DEFAULTS };
  const out = { ...DEFAULTS, ...theme };
  if (!Array.isArray(out.colors) && (out.primaryColor || out.customColors?.length)) {
    const fromLegacy = [];
    if (out.primaryColor) fromLegacy.push({ name: "Primary", value: out.primaryColor });
    if (out.secondaryColor) fromLegacy.push({ name: "Secondary", value: out.secondaryColor });
    if (out.backgroundColor) fromLegacy.push({ name: "Background", value: out.backgroundColor });
    if (out.textColor) fromLegacy.push({ name: "Text", value: out.textColor });
    if (out.headingColor) fromLegacy.push({ name: "Heading", value: out.headingColor });
    if (out.linkColor) fromLegacy.push({ name: "Link", value: out.linkColor });
    if (out.sectionBgColor) fromLegacy.push({ name: "Section background", value: out.sectionBgColor });
    (out.customColors || []).forEach((c) => { if (c?.name && c?.value) fromLegacy.push({ name: c.name, value: c.value }); });
    out.colors = fromLegacy;
  }
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
      const fields = [
        "siteTitle", "logoType", "logoImageUrl", "colors",
        "fontFamily", "fontSize", "headingFontFamily", "headingFontSize", "lineHeight", "letterSpacing", "fontWeight", "headingFontWeight",
        "layoutWidth", "defaultLocale", "direction", "googleFonts", "customFontUrl",
      ];
      for (const f of fields) {
        if (body[f] !== undefined) theme[f] = body[f];
      }
      await theme.save();
    }
    return NextResponse.json(theme);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
