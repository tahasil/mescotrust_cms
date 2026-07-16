import { NextResponse } from "next/server";
import {
  cleanupSocialWallLogs,
  refreshSocialWallTokens,
  runSocialWallSync,
} from "@/lib/socialWallModule/syncService";
import { toPositiveInt, toSafeString } from "@/lib/socialWallModule/utils";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function readCronSecret(req, searchParams) {
  const authHeader = toSafeString(req.headers.get("authorization"));
  const headerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const queryToken = toSafeString(searchParams.get("secret"));
  return headerToken || queryToken;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const expectedSecret = toSafeString(process.env.SOCIAL_WALL_CRON_SECRET);
    if (!expectedSecret) {
      return NextResponse.json(
        { error: "SOCIAL_WALL_CRON_SECRET is not configured" },
        { status: 500 },
      );
    }
    const incomingSecret = readCronSecret(req, searchParams);
    if (!incomingSecret || incomingSecret !== expectedSecret) {
      return unauthorized();
    }

    const action = toSafeString(searchParams.get("action") || "scheduled-sync").toLowerCase();
    const requestedBy = "cron";
    const platforms = toSafeString(searchParams.get("platforms"))
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (action === "refresh-tokens") {
      const result = await refreshSocialWallTokens({
        requestedPlatforms: platforms,
        force: toSafeString(searchParams.get("force")) === "1",
        requestedBy,
      });
      return NextResponse.json(
        { action, ...result },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
      );
    }

    if (action === "cleanup-logs") {
      const result = await cleanupSocialWallLogs({
        olderThanDays: toPositiveInt(searchParams.get("olderThanDays"), 45),
      });
      return NextResponse.json(
        { action, jobName: "social.cleanup.logs", ...result },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
      );
    }

    const result = await runSocialWallSync({
      requestedPlatforms: platforms,
      trigger: "scheduled",
      requestedBy,
    });
    return NextResponse.json(
      { action: "scheduled-sync", ...result },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to run social wall cron action" },
      { status: 500 },
    );
  }
}

