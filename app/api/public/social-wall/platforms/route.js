import { NextResponse } from "next/server";
import { getPublicSocialWallPlatforms } from "@/lib/socialWallModule/publicService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getPublicSocialWallPlatforms();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        items: [],
        settings: null,
        error: err?.message || "Failed to load platform metadata",
      },
      { status: 200, headers: { "Cache-Control": "public, max-age=30" } },
    );
  }
}
