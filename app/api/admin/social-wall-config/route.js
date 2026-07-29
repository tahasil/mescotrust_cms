import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";
import {
  getAdminSocialWallConfigPayload,
  saveSocialWallPlatformRows,
} from "@/lib/socialWallPlatformConfig";
import { invalidatePublicSocialWallFeedCache } from "@/lib/socialWallModule/publicService";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const session = await requirePermission(req, "social_wall.settings_access");
  if (session instanceof NextResponse) return session;

  try {
    const payload = await getAdminSocialWallConfigPayload();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Failed to load config" }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await requirePermission(req, "social_wall.settings_access");
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [];
    await saveSocialWallPlatformRows(items, { updatedBy: session?.email || "" });
    invalidatePublicSocialWallFeedCache();
    const payload = await getAdminSocialWallConfigPayload();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Failed to save config" }, { status: 500 });
  }
}
