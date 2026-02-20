import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ThemeSettings, SiteSettings } from "@/models";

export async function GET() {
  await connectDB();
  const theme = await ThemeSettings.findOne().lean();
  const site = await SiteSettings.findOne().lean();
  return NextResponse.json({ theme: theme ?? {}, site: site ?? {} });
}
