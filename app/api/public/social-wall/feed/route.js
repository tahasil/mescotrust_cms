import { NextResponse } from "next/server";
import { getPublicSocialWallFeed } from "@/lib/socialWallModule/publicService";
import { toSafeString } from "@/lib/socialWallModule/utils";

export const dynamic = "force-dynamic";

function parsePlatformArray(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function parseFromSearchParams(searchParams) {
  const blockConfigRaw = searchParams.get("blockConfig");
  let blockConfig = {};
  if (blockConfigRaw) {
    try {
      const parsed = JSON.parse(blockConfigRaw);
      if (parsed && typeof parsed === "object") blockConfig = parsed;
    } catch {
      blockConfig = {};
    }
  }
  const platforms = parsePlatformArray(searchParams.get("platforms"));
  return {
    blockConfig: {
      ...(blockConfig || {}),
      ...(platforms.length > 0 ? { platforms } : {}),
      ...(searchParams.get("layoutMode") ? { layoutMode: searchParams.get("layoutMode") } : {}),
      ...(searchParams.get("sortBy") ? { sortBy: searchParams.get("sortBy") } : {}),
      ...(searchParams.get("sortOrder") ? { sortOrder: searchParams.get("sortOrder") } : {}),
      ...(searchParams.get("postLimit") ? { postLimit: searchParams.get("postLimit") } : {}),
      ...(searchParams.get("filtersEnabled")
        ? { filtersEnabled: searchParams.get("filtersEnabled") }
        : {}),
      ...(searchParams.get("cardStylePreset")
        ? { cardStylePreset: searchParams.get("cardStylePreset") }
        : {}),
    },
    limit: searchParams.get("limit"),
    cursor: searchParams.get("cursor"),
    featured: searchParams.get("featured"),
    platform: toSafeString(searchParams.get("platform")),
    search: toSafeString(searchParams.get("search")),
    device: toSafeString(searchParams.get("device")),
  };
}

async function handleRequest(input = {}) {
  const payload = await getPublicSocialWallFeed(input);
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    return handleRequest(parseFromSearchParams(searchParams));
  } catch (err) {
    return NextResponse.json(
      { items: [], nextCursor: null, error: err?.message || "Failed to load feed" },
      { status: 200, headers: { "Cache-Control": "public, max-age=30" } },
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    return handleRequest(body && typeof body === "object" ? body : {});
  } catch (err) {
    return NextResponse.json(
      { items: [], nextCursor: null, error: err?.message || "Failed to load feed" },
      { status: 200, headers: { "Cache-Control": "public, max-age=30" } },
    );
  }
}
