import { NextResponse } from "next/server";
import { fetchAllLivePosts, getConfiguredPlatforms } from "@/lib/socialMediaFetcher";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/social-wall
 * Returns live social media posts fetched from configured platform APIs.
 * No auth required (public).
 */
export async function GET() {
  try {
    const platforms = getConfiguredPlatforms();
    if (platforms.length === 0) {
      return NextResponse.json(
        { livePosts: [], platforms: [], message: "No social media API keys configured" },
        { headers: { "Cache-Control": "public, max-age=60" } }
      );
    }

    const livePosts = await fetchAllLivePosts();
    return NextResponse.json(
      { livePosts, platforms },
      { headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=300" } }
    );
  } catch (err) {
    console.error("[Social Wall API] Error:", err.message);
    return NextResponse.json(
      { livePosts: [], platforms: [], error: "Failed to fetch social posts" },
      { status: 200, headers: { "Cache-Control": "public, max-age=60" } }
    );
  }
}
