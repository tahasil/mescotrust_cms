import { NextResponse } from "next/server";
import {
  fetchAllLivePosts,
  getConfiguredPlatforms,
  getSupportedSocialPlatforms,
} from "@/lib/socialMediaFetcher";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/social-wall
 * Returns live social media posts fetched from configured platform APIs.
 * No auth required (public).
 */
async function parseRequestConfig(req) {
  try {
    if (req.method === "POST") {
      const body = await req.json();
      return body && typeof body === "object" ? body : {};
    }
    const { searchParams } = new URL(req.url);
    const platformConfigsRaw = searchParams.get("platformConfigs");
    let platformConfigs = undefined;
    if (platformConfigsRaw) {
      try {
        const parsed = JSON.parse(platformConfigsRaw);
        if (Array.isArray(parsed)) platformConfigs = parsed;
      } catch {
        platformConfigs = undefined;
      }
    }
    return {
      platformConfigs,
      globalLimit: searchParams.get("globalLimit"),
      orderMode: searchParams.get("orderMode"),
    };
  } catch {
    return {};
  }
}

async function handleFeedRequest(req) {
  try {
    const config = await parseRequestConfig(req);
    const platforms = getConfiguredPlatforms(config?.platformConfigs);
    const supportedPlatforms = getSupportedSocialPlatforms();

    if (platforms.length === 0) {
      return NextResponse.json(
        {
          livePosts: [],
          platforms: [],
          supportedPlatforms,
          message: "No active live social media platform configured",
        },
        { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
      );
    }

    const livePosts = await fetchAllLivePosts({
      platformConfigs: Array.isArray(config?.platformConfigs) ? config.platformConfigs : undefined,
      globalLimit: config?.globalLimit,
      orderMode: config?.orderMode,
    });

    const cacheHeader =
      req.method === "POST"
        ? "no-store, no-cache, must-revalidate"
        : "public, max-age=120, stale-while-revalidate=300";

    return NextResponse.json(
      { livePosts, platforms, supportedPlatforms },
      { headers: { "Cache-Control": cacheHeader } },
    );
  } catch (err) {
    console.error("[Social Wall API] Error:", err.message);
    return NextResponse.json(
      {
        livePosts: [],
        platforms: [],
        supportedPlatforms: getSupportedSocialPlatforms(),
        error: "Failed to fetch social posts",
      },
      { status: 200, headers: { "Cache-Control": "public, max-age=60" } }
    );
  }
}

export async function GET(req) {
  return handleFeedRequest(req);
}

export async function POST(req) {
  return handleFeedRequest(req);
}
