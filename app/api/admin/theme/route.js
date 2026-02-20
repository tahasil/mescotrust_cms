import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import ThemeConfig from "@/models/ThemeConfig";

function requireAdmin(session) {
  if (session?.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }
  return null;
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  const forbidden = requireAdmin(session);
  if (forbidden) return forbidden;

  try {
    await connectDB();
    let theme = await ThemeConfig.findOne().lean();
    if (!theme) {
      theme = { fontFamily: "system-ui, sans-serif", primaryColor: "#1890ff", direction: "ltr" };
    }
    return NextResponse.json(theme);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  const forbidden = requireAdmin(session);
  if (forbidden) return forbidden;

  try {
    const body = await req.json();
    const { fontFamily, primaryColor, direction } = body;
    await connectDB();
    let theme = await ThemeConfig.findOne();
    if (!theme) {
      theme = await ThemeConfig.create({
        fontFamily: fontFamily || "system-ui, sans-serif",
        primaryColor: primaryColor || "#1890ff",
        direction: direction || "ltr",
      });
    } else {
      if (fontFamily !== undefined) theme.fontFamily = fontFamily;
      if (primaryColor !== undefined) theme.primaryColor = primaryColor;
      if (direction !== undefined) theme.direction = direction;
      await theme.save();
    }
    return NextResponse.json(theme);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
