import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import ThemeConfig from "@/models/ThemeConfig";

export async function GET() {
  try {
    await connectDB();
    let theme = await ThemeConfig.findOne().lean();
    if (!theme) {
      theme = { fontFamily: "system-ui, sans-serif", primaryColor: "#1890ff", direction: "ltr" };
    }
    return NextResponse.json(theme);
  } catch (err) {
    return NextResponse.json(
      { fontFamily: "system-ui, sans-serif", primaryColor: "#1890ff", direction: "ltr" },
      { status: 200 }
    );
  }
}

export async function PUT(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (token.role !== "Admin") return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

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
