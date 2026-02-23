import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import ThemeConfig from "@/models/ThemeConfig";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  fontFamily: "system-ui, sans-serif",
  fontSize: 16,
  headingFontFamily: "",
  headingFontSize: 0,
  lineHeight: 1.6,
  letterSpacing: 0,
  fontWeight: 400,
  headingFontWeight: 700,
  primaryColor: "#1890ff",
  secondaryColor: "#722ed1",
  backgroundColor: "#ffffff",
  textColor: "#333333",
  linkColor: "",
  layoutWidth: 1200,
  defaultLocale: "en",
  direction: "ltr",
  googleFonts: [],
  customFontUrl: "",
};

export async function GET() {
  try {
    await connectDB();
    let theme = await ThemeConfig.findOne().lean();
    if (!theme) theme = { ...DEFAULTS };
    return NextResponse.json(theme);
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
        "fontFamily", "fontSize", "headingFontFamily",
        "headingFontSize", "lineHeight", "letterSpacing", "fontWeight", "headingFontWeight",
        "primaryColor", "secondaryColor", "backgroundColor", "textColor", "linkColor",
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
