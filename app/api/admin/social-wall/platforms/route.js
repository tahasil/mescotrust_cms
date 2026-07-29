import { NextResponse } from "next/server";
import { requireSocialWallPermission } from "@/lib/socialWallModule/apiGuards";
import {
  getSocialWallPlatformConfigs,
  upsertSocialWallPlatformConfigs,
} from "@/lib/socialWallModule/platformService";
import { getSocialWallSupportedPlatforms } from "@/lib/socialWallModule/platformAdapters";
import { invalidatePublicSocialWallFeedCache } from "@/lib/socialWallModule/publicService";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = await requireSocialWallPermission(req, "social_wall.settings_access");
  if (error) return error;

  try {
    const items = await getSocialWallPlatformConfigs({ includeSecrets: false });
    return NextResponse.json(
      {
        supportedPlatforms: getSocialWallSupportedPlatforms(),
        items,
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to load platform configs" },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  const { error, session } = await requireSocialWallPermission(req, "social_wall.settings_access");
  if (error) return error;

  try {
    const body = await req.json();
    const items = await upsertSocialWallPlatformConfigs(
      Array.isArray(body?.items) ? body.items : [],
      {
        updatedBy: session?.email || session?.name || "",
      },
    );
    invalidatePublicSocialWallFeedCache();
    return NextResponse.json(
      {
        supportedPlatforms: getSocialWallSupportedPlatforms(),
        items,
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to save platform configs" },
      { status: 500 },
    );
  }
}
