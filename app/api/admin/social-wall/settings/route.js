import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/socialWallModule/apiGuards";
import {
  getSocialWallSettings,
  updateSocialWallSettings,
} from "@/lib/socialWallModule/settingsService";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = await requireAdminSession(req);
  if (error) return error;

  try {
    const settings = await getSocialWallSettings();
    return NextResponse.json(settings, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to load settings" },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  const { error, session } = await requireAdminSession(req);
  if (error) return error;

  try {
    const body = await req.json();
    const settings = await updateSocialWallSettings(body || {}, {
      updatedBy: session?.email || session?.name || "",
    });
    return NextResponse.json(settings, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to save settings" },
      { status: 500 },
    );
  }
}
