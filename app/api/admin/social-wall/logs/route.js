import { NextResponse } from "next/server";
import { requireSocialWallPermission } from "@/lib/socialWallModule/apiGuards";
import { listSocialWallLogs } from "@/lib/socialWallModule/syncService";
import { toPositiveInt, toSafeString } from "@/lib/socialWallModule/utils";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = await requireSocialWallPermission(req, "social_wall.view");
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const data = await listSocialWallLogs({
      page: toPositiveInt(searchParams.get("page"), 1),
      limit: toPositiveInt(searchParams.get("limit"), 20),
      kind: toSafeString(searchParams.get("kind")),
    });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to load logs" },
      { status: 500 },
    );
  }
}
