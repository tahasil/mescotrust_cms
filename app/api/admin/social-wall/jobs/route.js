import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/socialWallModule/apiGuards";
import {
  cleanupSocialWallLogs,
  refreshSocialWallTokens,
  runSocialWallSync,
} from "@/lib/socialWallModule/syncService";
import { toPositiveInt, toSafeString } from "@/lib/socialWallModule/utils";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { error, session } = await requireAdminSession(req);
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const action = toSafeString(body?.action).toLowerCase();

    if (action === "cleanup-logs") {
      const result = await cleanupSocialWallLogs({
        olderThanDays: toPositiveInt(body?.olderThanDays, 45),
      });
      return NextResponse.json({ action, jobName: "social.cleanup.logs", ...result }, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }

    if (action === "refresh-tokens") {
      const refreshResult = await refreshSocialWallTokens({
        requestedPlatforms: Array.isArray(body?.platforms) ? body.platforms : [],
        force: body?.force === true,
        requestedBy: session?.email || session?.name || "",
      });
      return NextResponse.json({ action, ...refreshResult }, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }

    const syncResult = await runSocialWallSync({
      requestedPlatforms: Array.isArray(body?.platforms) ? body.platforms : [],
      trigger: "scheduled",
      requestedBy: session?.email || session?.name || "",
    });
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
