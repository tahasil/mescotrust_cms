import { NextResponse } from "next/server";
import {
  fetchAllLivePosts,
  getConfiguredPlatforms,
  getSupportedSocialPlatforms,
} from "@/lib/socialMediaFetcher";
import { getEffectiveSocialWallPlatformRows } from "@/lib/socialWallPlatformConfig";
import { getPublicSocialWallFeed } from "@/lib/socialWallModule/publicService";

export const dynamic = "force-dynamic";
const DEFAULT_PLATFORM_POST_LIMIT = 8;

function toSafeString(value) {
  return value == null ? "" : String(value).trim();
}

function toPositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.floor(num);
  return rounded > 0 ? rounded : fallback;
}

function normalizeFeedMode(value) {
  const mode = toSafeString(value).toLowerCase();
  if (mode === "manual" || mode === "both" || mode === "live") return mode;
  return "live";
}

function normalizeVisibility(value) {
  const visibility = toSafeString(value).toLowerCase();
  if (visibility === "desktop" || visibility === "mobile" || visibility === "none") {
    return visibility;
  }
  return "all";
}

function normalizeRequestPlatformConfig(raw) {
  const platform = toSafeString(raw?.platform).toLowerCase();
  if (!platform) return null;
  return {
    platform,
    feedMode: normalizeFeedMode(raw?.feedMode),
    visibility: normalizeVisibility(raw?.visibility),
    postLimit: toPositiveInt(raw?.postLimit, DEFAULT_PLATFORM_POST_LIMIT),
    handle: toSafeString(raw?.handle),
    profileUrl: toSafeString(raw?.profileUrl),
  };
}

function buildEffectivePlatformConfigs(
  runtimeRows,
  requestRows,
  { disableEnvFallback = false } = {},
) {
  const requestMap = new Map();
  (Array.isArray(requestRows) ? requestRows : []).forEach((item) => {
    const normalized = normalizeRequestPlatformConfig(item);
    if (normalized?.platform) requestMap.set(normalized.platform, normalized);
  });

  return (Array.isArray(runtimeRows) ? runtimeRows : [])
    .map((row, index) => {
      const platform = toSafeString(row?.platform).toLowerCase();
      if (!platform) return null;
      const override = requestMap.get(platform);
      return {
        platform,
        active: row?.active !== false,
        order: toPositiveInt(row?.displayOrder ?? row?.order, index + 1),
        accountId: toSafeString(row?.accountId),
        accessToken: toSafeString(row?.accessToken),
        apiKey: toSafeString(row?.apiKey),
        disableEnvFallback: disableEnvFallback === true,
        feedMode: override?.feedMode || "live",
        visibility: override?.visibility || "all",
        postLimit: toPositiveInt(override?.postLimit, DEFAULT_PLATFORM_POST_LIMIT),
        handle: override?.handle || "",
        profileUrl: override?.profileUrl || "",
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

function sanitizePlatformConfigsForResponse(configs) {
  return (Array.isArray(configs) ? configs : []).map((item) => ({
    platform: item?.platform,
    active: item?.active !== false,
    order: toPositiveInt(item?.order, 1),
    feedMode: normalizeFeedMode(item?.feedMode),
    visibility: normalizeVisibility(item?.visibility),
    postLimit: toPositiveInt(item?.postLimit, DEFAULT_PLATFORM_POST_LIMIT),
    handle: toSafeString(item?.handle),
    profileUrl: toSafeString(item?.profileUrl),
  }));
}

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
      view: searchParams.get("view"),
      module: searchParams.get("module"),
      limit: searchParams.get("limit"),
      cursor: searchParams.get("cursor"),
      platform: searchParams.get("platform"),
      featured: searchParams.get("featured"),
      search: searchParams.get("search"),
      device: searchParams.get("device"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
      blockConfig: searchParams.get("blockConfig"),
      legacy: searchParams.get("legacy"),
    };
  } catch {
    return {};
  }
}

function isModuleFeedRequest(config = {}, method = "GET") {
  const view = toSafeString(config?.view || config?.mode).toLowerCase();
  const moduleFlag = toSafeString(config?.module).toLowerCase();
  const legacyFlag = toSafeString(config?.legacy).toLowerCase();
  if (legacyFlag === "1" || legacyFlag === "true") return false;
  return (
    view === "module" ||
    view === "v2" ||
    moduleFlag === "1" ||
    moduleFlag === "true" ||
    toSafeString(method).toUpperCase() === "GET"
  );
}

async function handleFeedRequest(req) {
  try {
    const config = await parseRequestConfig(req);
    if (isModuleFeedRequest(config, req.method)) {
      let blockConfig = config?.blockConfig;
      if (typeof blockConfig === "string") {
        try {
          blockConfig = JSON.parse(blockConfig);
        } catch {
          blockConfig = {};
        }
      }
      const payload = await getPublicSocialWallFeed({
        blockConfig: blockConfig && typeof blockConfig === "object" ? blockConfig : {},
        limit: config?.limit,
        cursor: config?.cursor,
        platform: config?.platform,
        featured: config?.featured,
        search: config?.search,
        device: config?.device,
        sortBy: config?.sortBy,
        sortOrder: config?.sortOrder,
      });
      return NextResponse.json(payload, {
        headers:
          req.method === "POST"
            ? { "Cache-Control": "no-store, no-cache, must-revalidate" }
            : { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
      });
    }

    const runtime = await getEffectiveSocialWallPlatformRows();
    const effectivePlatformConfigs = buildEffectivePlatformConfigs(
      runtime?.rows,
      config?.platformConfigs,
      { disableEnvFallback: runtime?.source === "db" },
    );
    const platforms = getConfiguredPlatforms(effectivePlatformConfigs);
    const supportedPlatforms = getSupportedSocialPlatforms();
    const publicPlatformConfigs = sanitizePlatformConfigsForResponse(
      effectivePlatformConfigs,
    );

    if (platforms.length === 0) {
      return NextResponse.json(
        {
          livePosts: [],
          platforms: [],
          supportedPlatforms,
          platformConfigs: publicPlatformConfigs,
          message: "No active live social media platform configured",
        },
        { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
      );
    }

    const livePosts = await fetchAllLivePosts({
      platformConfigs: effectivePlatformConfigs,
      globalLimit: config?.globalLimit,
      orderMode: config?.orderMode,
    });

    const cacheHeader =
      req.method === "POST"
        ? "no-store, no-cache, must-revalidate"
        : "public, max-age=120, stale-while-revalidate=300";

    return NextResponse.json(
      {
        livePosts,
        platforms,
        supportedPlatforms,
        platformConfigs: publicPlatformConfigs,
      },
      { headers: { "Cache-Control": cacheHeader } },
    );
  } catch (err) {
    console.error("[Social Wall API] Error:", err.message);
    return NextResponse.json(
      {
        livePosts: [],
        platforms: [],
        supportedPlatforms: getSupportedSocialPlatforms(),
        platformConfigs: [],
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
