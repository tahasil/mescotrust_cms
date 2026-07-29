import { NextResponse } from "next/server";
import { requireSocialWallPermission } from "@/lib/socialWallModule/apiGuards";
import {
  clearSocialWallLogs,
  cleanupSocialWallLogs,
  refreshSocialWallTokens,
  runSocialWallSync,
} from "@/lib/socialWallModule/syncService";
import { invalidatePublicSocialWallFeedCache } from "@/lib/socialWallModule/publicService";
import { toPositiveInt, toSafeString } from "@/lib/socialWallModule/utils";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const action = toSafeString(body?.action).toLowerCase();
  const requiredPermission = ["cleanup-logs", "clear-logs"].includes(action)
    ? "social_wall.delete"
    : "social_wall.manage";
  const { error, session } = await requireSocialWallPermission(req, requiredPermission);
  if (error) return error;

  try {
    if (action === "cleanup-logs") {
      const result = await cleanupSocialWallLogs({
        olderThanDays: toPositiveInt(body?.olderThanDays, 45),
      });
      return NextResponse.json({ action, jobName: "social.cleanup.logs", ...result }, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }

    if (action === "clear-logs") {
      const result = await clearSocialWallLogs({
        kind: toSafeString(body?.kind || "all"),
      });
      return NextResponse.json({ action, jobName: "social.clear.logs", ...result }, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }

    if (action === "refresh-tokens") {
      const refreshResult = await refreshSocialWallTokens({
        requestedPlatforms: Array.isArray(body?.platforms) ? body.platforms : [],
        force: body?.force === true,
        requestedBy: session?.email || session?.name || "",
      });
      invalidatePublicSocialWallFeedCache();
      return NextResponse.json({ action, ...refreshResult }, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }

    const syncResult = await runSocialWallSync({
      requestedPlatforms: Array.isArray(body?.platforms) ? body.platforms : [],
      trigger: "scheduled",
      requestedBy: session?.email || session?.name || "",
    });
    invalidatePublicSocialWallFeedCache();
    return NextResponse.json(
      { action: action || "scheduled-sync", ...syncResult },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to run job" },
      { status: 500 },
    );
  }
}
