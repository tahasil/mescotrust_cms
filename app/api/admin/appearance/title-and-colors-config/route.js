import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/apiAuth";
import ThemeConfig from "@/models/ThemeConfig";
import { SITE_SETTINGS_QUERY } from "@/lib/siteSettings";
import { mergeAppearanceTitleAndColorsConfig } from "@/lib/appearanceTitleAndColorsConfig";

export const dynamic = "force-dynamic";

function getRawConfigFromBody(body) {
  if (!body || typeof body !== "object") return {};
  if (body.config && typeof body.config === "object") return body.config;
  return body;
}

export async function GET(req) {
  const session = await requirePermission(req, "appearance.settings_access");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const settings = await ThemeConfig.findOne(SITE_SETTINGS_QUERY)
      .sort({ updatedAt: -1, _id: -1 })
      .lean();
    const mergedConfig = mergeAppearanceTitleAndColorsConfig(
      settings?.appearanceTitleAndColorsConfig,
    );
    return NextResponse.json(
      { config: mergedConfig },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch (error) {
    const fallback = mergeAppearanceTitleAndColorsConfig();
    return NextResponse.json(
      { config: fallback, error: error?.message || "Failed to load config" },
      { status: 200 },
    );
  }
}

export async function PUT(req) {
  const session = await requirePermission(req, "appearance.settings_access");
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const rawConfig = getRawConfigFromBody(body);
    const mergedConfig = mergeAppearanceTitleAndColorsConfig(rawConfig);

    await connectDB();
    await ThemeConfig.findOneAndUpdate(
      SITE_SETTINGS_QUERY,
      {
        $set: {
          themeKey: "default",
          appearanceTitleAndColorsConfig: mergedConfig,
        },
      },
      {
        new: true,
        upsert: true,
        sort: { updatedAt: -1, _id: -1 },
        setDefaultsOnInsert: true,
        strict: false,
      },
    );

    return NextResponse.json(
      { config: mergedConfig },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to save config" },
      { status: 500 },
    );
  }
}
