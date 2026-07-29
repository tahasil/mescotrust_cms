import { NextResponse } from "next/server";
import { requireSocialWallPermission } from "@/lib/socialWallModule/apiGuards";
import { listSocialWallPostsForAdmin } from "@/lib/socialWallModule/postsService";
import { toPositiveInt, toSafeString } from "@/lib/socialWallModule/utils";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = await requireSocialWallPermission(req, "social_wall.view");
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const data = await listSocialWallPostsForAdmin({
      page: toPositiveInt(searchParams.get("page"), 1),
      limit: toPositiveInt(searchParams.get("limit"), 20),
      platform: toSafeString(searchParams.get("platform")),
      status: toSafeString(searchParams.get("status")),
      featured: toSafeString(searchParams.get("featured")),
      search: toSafeString(searchParams.get("search")),
      dateFrom: toSafeString(searchParams.get("dateFrom")),
      dateTo: toSafeString(searchParams.get("dateTo")),
    });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to load posts" },
      { status: 500 },
    );
  }
}
