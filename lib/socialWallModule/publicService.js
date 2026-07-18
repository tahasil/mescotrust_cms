import { getSocialWallSettings } from "@/lib/socialWallModule/settingsService";
import { getSocialWallPlatformConfigs } from "@/lib/socialWallModule/platformService";
import {
  listSocialWallPublicAvailablePlatforms,
  listSocialWallPublicFeed,
} from "@/lib/socialWallModule/postsService";
import {
  normalizeLayout,
  normalizeSortBy,
  normalizeSortOrder,
  toPositiveInt,
  toSafeString,
} from "@/lib/socialWallModule/utils";

const PUBLIC_FEED_CACHE_TTL_MS = 60 * 1000;
const PUBLIC_FEED_CACHE_MAX_ITEMS = 200;
const publicFeedCache = new Map();

export function invalidatePublicSocialWallFeedCache() {
  publicFeedCache.clear();
}

function toBoolean(value, fallback) {
  const raw = toSafeString(value).toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return fallback;
}

function normalizeBlockConfig(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(source, key);
  const selectedPlatforms = Array.isArray(source?.platforms)
    ? source.platforms.map((item) => toSafeString(item).toLowerCase()).filter(Boolean)
    : [];

  return {
    ...(hasOwn("enabled") ? { enabled: toBoolean(source.enabled, true) } : {}),
    ...(hasOwn("platforms") ? { platforms: selectedPlatforms } : {}),
    ...(hasOwn("layoutMode") ? { layoutMode: normalizeLayout(source.layoutMode) } : {}),
    ...(hasOwn("postLimit") ? { postLimit: toPositiveInt(source.postLimit, 12) } : {}),
    ...(hasOwn("filtersEnabled")
      ? { filtersEnabled: toBoolean(source.filtersEnabled, true) }
      : {}),
    ...(hasOwn("sortBy") ? { sortBy: normalizeSortBy(source.sortBy) } : {}),
    ...(hasOwn("sortOrder") ? { sortOrder: normalizeSortOrder(source.sortOrder) } : {}),
    ...(hasOwn("cardStylePreset")
      ? {
          cardStylePreset: ["clean", "outlined", "elevated"].includes(
            toSafeString(source.cardStylePreset).toLowerCase(),
          )
            ? toSafeString(source.cardStylePreset).toLowerCase()
            : "clean",
        }
      : {}),
    ...(hasOwn("showPlatformIcon")
      ? { showPlatformIcon: toBoolean(source.showPlatformIcon, true) }
      : {}),
    ...(hasOwn("showEngagement")
      ? { showEngagement: toBoolean(source.showEngagement, true) }
      : {}),
    ...(hasOwn("showDate") ? { showDate: toBoolean(source.showDate, true) } : {}),
    ...(hasOwn("infiniteScroll")
      ? { infiniteScroll: toBoolean(source.infiniteScroll, false) }
      : {}),
  };
}

function isPlatformConnectedForPublicFeed(row = {}) {
  if (row?.active !== true) return false;
  const mode = toSafeString(row?.mode).toLowerCase();
  if (mode === "live") {
    const hasCredential = row?.hasAccessToken === true || row?.hasApiKey === true;
    const hasAccount = row?.hasAccountId === true;
    return hasCredential && hasAccount;
  }
  return true;
}

function buildPublicFeedCacheKey(rawOptions = {}, effective = {}) {
  return JSON.stringify({
    limit: toPositiveInt(rawOptions?.limit, 12),
    cursor: toSafeString(rawOptions?.cursor),
    featured: toSafeString(rawOptions?.featured),
    platform: toSafeString(rawOptions?.platform).toLowerCase(),
    search: toSafeString(rawOptions?.search).toLowerCase(),
    device: toSafeString(rawOptions?.device).toLowerCase(),
    blockConfig: effective,
  });
}

function getCachedPublicFeed(key) {
  const entry = publicFeedCache.get(key);
  if (!entry) return { fresh: null, stale: null };
  const ageMs = Date.now() - Number(entry.timestamp || 0);
  if (ageMs <= PUBLIC_FEED_CACHE_TTL_MS) return { fresh: entry.value, stale: entry.value };
  return { fresh: null, stale: entry.value };
}

function setCachedPublicFeed(key, value) {
  publicFeedCache.set(key, { timestamp: Date.now(), value });
  if (publicFeedCache.size <= PUBLIC_FEED_CACHE_MAX_ITEMS) return;
  const oldestKey = publicFeedCache.keys().next().value;
  if (oldestKey) publicFeedCache.delete(oldestKey);
}

export async function getPublicSocialWallPlatforms() {
  const [settings, platformRows] = await Promise.all([
    getSocialWallSettings(),
    getSocialWallPlatformConfigs({ includeSecrets: false }),
  ]);
  return {
    settings,
    items: platformRows.map((row) => ({
      platform: row.platform,
      label: row.label,
      mode: row.mode,
      active: row.active,
      displayOrder: row.displayOrder,
      liveCapable: row.liveCapable,
      postLimit: row.postLimit,
      fetchIntervalMinutes: row.fetchIntervalMinutes,
    })),
  };
}

export async function getPublicSocialWallFeed(rawOptions = {}) {
  const [settings, platformRows] = await Promise.all([
    getSocialWallSettings(),
    getSocialWallPlatformConfigs({ includeSecrets: false }),
  ]);
  const defaults = {
    enabled: settings.moduleEnabled !== false,
    layoutMode: settings.defaultLayout,
    postLimit: settings.defaultPostLimit,
    filtersEnabled: settings.filtersEnabled !== false,
    sortBy: settings.defaultSortBy,
    sortOrder: settings.defaultSortOrder,
    cardStylePreset: settings.cardStylePreset,
    showPlatformIcon: true,
    showEngagement: true,
    showDate: true,
    infiniteScroll: false,
  };
  const blockConfig = normalizeBlockConfig(rawOptions?.blockConfig || rawOptions);
  const effective = {
    ...defaults,
    ...blockConfig,
    platforms:
      blockConfig.platforms && blockConfig.platforms.length > 0
        ? blockConfig.platforms
        : [],
  };
  const cacheKey = buildPublicFeedCacheKey(rawOptions, effective);

  if (effective.enabled === false || settings.moduleEnabled === false) {
    return {
      items: [],
      nextCursor: null,
      settings,
      blockConfig: effective,
      moduleEnabled: false,
    };
  }
  const { fresh, stale } = getCachedPublicFeed(cacheKey);
  if (fresh) return fresh;

  try {
    const preferredPlatforms = Array.isArray(effective.platforms)
      ? effective.platforms.map((item) => toSafeString(item).toLowerCase()).filter(Boolean)
      : [];
    const eligiblePlatformRows = platformRows.filter((row) => {
      if (!isPlatformConnectedForPublicFeed(row)) return false;
      if (preferredPlatforms.length === 0) return true;
      return preferredPlatforms.includes(toSafeString(row?.platform).toLowerCase());
    });
    const eligiblePlatforms = eligiblePlatformRows
      .map((row) => toSafeString(row?.platform).toLowerCase())
      .filter(Boolean);
    const availablePlatforms = await listSocialWallPublicAvailablePlatforms({
      platforms: eligiblePlatforms,
      device: rawOptions?.device,
    });
    const availableSet = new Set(availablePlatforms);
    const resolvedPlatformRows = eligiblePlatformRows.filter((row) =>
      availableSet.has(toSafeString(row?.platform).toLowerCase()),
    );
    const resolvedPlatforms = resolvedPlatformRows
      .map((row) => toSafeString(row?.platform).toLowerCase())
      .filter(Boolean);
    if (resolvedPlatforms.length === 0) {
      const emptyPayload = {
        items: [],
        nextCursor: null,
        settings,
        moduleEnabled: settings.moduleEnabled !== false,
        blockConfig: effective,
        platformConfigs: [],
        availablePlatforms: [],
      };
      setCachedPublicFeed(cacheKey, emptyPayload);
      return emptyPayload;
    }

    const feed = await listSocialWallPublicFeed({
      limit: rawOptions?.limit || effective.postLimit,
      cursor: rawOptions?.cursor,
      featured: rawOptions?.featured,
      platform: rawOptions?.platform,
      platforms: effective.platforms,
      allowedPlatforms: resolvedPlatforms,
      search: rawOptions?.search,
      device: rawOptions?.device,
      sortBy: effective.sortBy,
      sortOrder: effective.sortOrder,
    });

    const payload = {
      ...feed,
      settings,
      moduleEnabled: settings.moduleEnabled !== false,
      blockConfig: effective,
      platformConfigs: resolvedPlatformRows.map((row) => ({
        platform: row.platform,
        label: row.label,
        mode: row.mode,
        active: row.active,
        displayOrder: row.displayOrder,
        liveCapable: row.liveCapable,
        fetchIntervalMinutes: row.fetchIntervalMinutes,
      })),
      availablePlatforms: resolvedPlatforms,
    };
    setCachedPublicFeed(cacheKey, payload);
    return payload;
  } catch (error) {
    if (stale) {
      return {
        ...stale,
        cacheStale: true,
      };
    }
    throw error;
  }
}
