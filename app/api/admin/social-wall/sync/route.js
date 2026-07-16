import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/socialWallModule/apiGuards";
import { runSocialWallSync } from "@/lib/socialWallModule/syncService";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { error, session } = await requireAdminSession(req);
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const requestedPlatforms = Array.isArray(body?.platforms) ? body.platforms : [];
    const result = await runSocialWallSync({
      requestedPlatforms,
      trigger: "manual",
      requestedBy: session?.email || session?.name || "",
    });

    const hasCooldownSkip = Array.isArray(result?.platforms)
      ? result.platforms.some((item) => item?.errorCode === "SYNC_COOLDOWN")
      : false;
    const retryAfterSeconds = hasCooldownSkip
      ? Math.max(
          1,
          ...result.platforms
            .filter((item) => item?.errorCode === "SYNC_COOLDOWN")
            .map((item) => Number(item?.retryAfterSeconds || 0)),
        )
      : 0;

    if (hasCooldownSkip && result?.platforms?.every((item) => item?.status === "skipped")) {
      return NextResponse.json(
        {
          ...result,
          error: "SYNC_COOLDOWN",
          retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds) },
        },
      );
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Sync failed" },
      { status: 500 },
    );
  }
}
