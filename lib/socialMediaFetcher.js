/**
 * Server-side social feed aggregator used by SocialMediaWall.
 * Built as a registry so adding a new platform is mostly a new entry + fetcher.
 */

const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000;
const DEFAULT_GLOBAL_LIMIT = 20;
const DEFAULT_PLATFORM_LIMIT = 8;
const MAX_PLATFORM_LIMIT = 20;
const MAX_GLOBAL_LIMIT = 60;
const cache = new Map(); // key -> { timestamp, data }

function toSafeString(value) {
  return value == null ? "" : String(value).trim();
}

function toPositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.floor(num);
  if (rounded <= 0) return fallback;
  return rounded;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toIsoDate(value) {
  const raw = toSafeString(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function formatDisplayDate(value) {
  const iso = toIsoDate(value);
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function hashString(value) {
  const input = toSafeString(value);
  if (!input) return "x";
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

function makeCacheKey(platform, accountId, postLimit) {
  return `${platform}|${toSafeString(accountId)}|${toPositiveInt(postLimit, DEFAULT_PLATFORM_LIMIT)}`;
}

function getCache(cacheKey, ttlMs) {
  const ttl = toPositiveInt(ttlMs, DEFAULT_CACHE_TTL_MS);
  const entry = cache.get(cacheKey);
  if (!entry) return { fresh: null, stale: [] };
  const age = Date.now() - entry.timestamp;
  if (age < ttl) return { fresh: entry.data, stale: entry.data };
  return { fresh: null, stale: entry.data };
}

function setCache(cacheKey, data) {
  cache.set(cacheKey, {
    data: Array.isArray(data) ? data : [],
    timestamp: Date.now(),
  });
}

function normalizeBaseLivePost(post, defaults = {}) {
  const platform = toSafeString(post?.platform || defaults.platform).toLowerCase();
  const id = toSafeString(post?.id);
  const publishedAt = toIsoDate(post?.publishedAt || post?.date);
  const mediaTypeInput = toSafeString(post?.mediaType || "");
  const imageDesktop = toSafeString(post?.imageDesktop || post?.image);
  const imageMobile = toSafeString(post?.imageMobile || "");
  const videoUrl = toSafeString(post?.videoUrl);
  const hasVideo = !!videoUrl;
  const hasImage = !!(imageDesktop || imageMobile);
  const mediaType = mediaTypeInput || (hasVideo ? "video" : hasImage ? "image" : "text");

  return {
    id: id || `${platform}-${hashString(`${toSafeString(post?.postUrl)}-${toSafeString(post?.caption)}-${publishedAt}`)}`,
    platform,
    platformLabel: toSafeString(post?.platformLabel || defaults.platformLabel),
    username: toSafeString(post?.username || defaults.username),
    handle: toSafeString(post?.handle || defaults.handle),
    caption: toSafeString(post?.caption || post?.text),
    text: toSafeString(post?.text || post?.caption),
    imageDesktop,
    imageMobile,
    image: imageDesktop || imageMobile,
    videoUrl,
    mediaType,
    postUrl: toSafeString(post?.postUrl),
    date: formatDisplayDate(publishedAt),
    publishedAt,
    source: "live",
  };
}

function getPlatformUsername(config, fallback) {
  const preferred = toSafeString(config?.displayName || config?.handle || fallback);
  return preferred || fallback || "";
}

function getPlatformHandle(config, fallback = "") {
  const handle = toSafeString(config?.handle || fallback);
  if (!handle) return "";
  if (handle.startsWith("@")) return handle;
  return `@${handle}`;
}

function pickPlatformAccountId(config, envValue) {
  return toSafeString(config?.accountId || envValue);
}

async function fetchInstagramPosts(config) {
  const accessToken = toSafeString(process.env.INSTAGRAM_ACCESS_TOKEN);
  const accountId = pickPlatformAccountId(config, process.env.INSTAGRAM_USER_ID);
  const postLimit = clampNumber(
    toPositiveInt(config?.postLimit, DEFAULT_PLATFORM_LIMIT),
    1,
    MAX_PLATFORM_LIMIT,
  );
  if (!accessToken || !accountId) return [];

  const cacheKey = makeCacheKey("instagram", accountId, postLimit);
  const { fresh, stale } = getCache(cacheKey, config?.cacheTtlMs);
  if (fresh) return fresh;

  try {
    const url = `https://graph.instagram.com/${encodeURIComponent(accountId)}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username&limit=${postLimit}&access_token=${encodeURIComponent(accessToken)}`;
    const response = await fetch(url, { next: { revalidate: 0 } });
    if (!response.ok) throw new Error(`Instagram API ${response.status}`);
    const payload = await response.json();
    const posts = (Array.isArray(payload?.data) ? payload.data : []).map((item) =>
      normalizeBaseLivePost(
        {
          id: item?.id,
          platform: "instagram",
          platformLabel: "Instagram",
          username: getPlatformUsername(config, item?.username ? `@${item.username}` : ""),
          handle: getPlatformHandle(config, item?.username || ""),
          caption: item?.caption,
          text: item?.caption,
          imageDesktop:
            item?.media_type === "VIDEO"
              ? toSafeString(item?.thumbnail_url || "")
              : toSafeString(item?.media_url || ""),
          videoUrl: item?.media_type === "VIDEO" ? toSafeString(item?.media_url || "") : "",
          mediaType: item?.media_type === "VIDEO" ? "video" : "image",
          postUrl: item?.permalink,
          publishedAt: item?.timestamp,
        },
        {
          platform: "instagram",
          platformLabel: "Instagram",
          username: getPlatformUsername(config, "@instagram"),
          handle: getPlatformHandle(config, "instagram"),
        },
      ),
    );
    setCache(cacheKey, posts);
    return posts;
  } catch (error) {
    console.error("[SocialMediaFetcher] Instagram error:", error?.message || error);
    return stale;
  }
}

async function fetchFacebookPosts(config) {
  const accessToken = toSafeString(process.env.FACEBOOK_ACCESS_TOKEN);
  const accountId = pickPlatformAccountId(config, process.env.FACEBOOK_PAGE_ID);
  const postLimit = clampNumber(
    toPositiveInt(config?.postLimit, DEFAULT_PLATFORM_LIMIT),
    1,
    MAX_PLATFORM_LIMIT,
  );
  if (!accessToken || !accountId) return [];

  const cacheKey = makeCacheKey("facebook", accountId, postLimit);
  const { fresh, stale } = getCache(cacheKey, config?.cacheTtlMs);
  if (fresh) return fresh;

  try {
    const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(accountId)}/posts?fields=id,message,full_picture,created_time,permalink_url&limit=${postLimit}&access_token=${encodeURIComponent(accessToken)}`;
    const response = await fetch(url, { next: { revalidate: 0 } });
    if (!response.ok) throw new Error(`Facebook API ${response.status}`);
    const payload = await response.json();
    const posts = (Array.isArray(payload?.data) ? payload.data : []).map((item) =>
      normalizeBaseLivePost(
        {
          id: item?.id,
          platform: "facebook",
          platformLabel: "Facebook",
          username: getPlatformUsername(config, "Facebook"),
          handle: getPlatformHandle(config),
          caption: item?.message,
          text: item?.message,
          imageDesktop: item?.full_picture,
          mediaType: item?.full_picture ? "image" : "text",
          postUrl: item?.permalink_url,
          publishedAt: item?.created_time,
        },
        {
          platform: "facebook",
          platformLabel: "Facebook",
          username: getPlatformUsername(config, "Facebook"),
          handle: getPlatformHandle(config),
        },
      ),
    );
    setCache(cacheKey, posts);
    return posts;
  } catch (error) {
    console.error("[SocialMediaFetcher] Facebook error:", error?.message || error);
    return stale;
  }
}

async function fetchYoutubePosts(config) {
  const apiKey = toSafeString(process.env.YOUTUBE_API_KEY);
  const accountId = pickPlatformAccountId(config, process.env.YOUTUBE_CHANNEL_ID);
  const postLimit = clampNumber(
    toPositiveInt(config?.postLimit, DEFAULT_PLATFORM_LIMIT),
    1,
    MAX_PLATFORM_LIMIT,
  );
  if (!apiKey || !accountId) return [];

  const cacheKey = makeCacheKey("youtube", accountId, postLimit);
  const { fresh, stale } = getCache(cacheKey, config?.cacheTtlMs);
  if (fresh) return fresh;

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(accountId)}&maxResults=${postLimit}&order=date&type=video&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, { next: { revalidate: 0 } });
    if (!response.ok) throw new Error(`YouTube API ${response.status}`);
    const payload = await response.json();
    const posts = (Array.isArray(payload?.items) ? payload.items : []).map((item) => {
      const snippet = item?.snippet || {};
      const videoId = toSafeString(item?.id?.videoId);
      return normalizeBaseLivePost(
        {
          id: videoId || item?.etag,
          platform: "youtube",
          platformLabel: "YouTube",
          username: getPlatformUsername(config, snippet?.channelTitle || "YouTube"),
          handle: getPlatformHandle(config),
          caption: snippet?.title,
          text: snippet?.description,
          imageDesktop:
            toSafeString(snippet?.thumbnails?.high?.url) ||
            toSafeString(snippet?.thumbnails?.medium?.url) ||
            toSafeString(snippet?.thumbnails?.default?.url),
          mediaType: "video",
          postUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
          publishedAt: snippet?.publishedAt,
        },
        {
          platform: "youtube",
          platformLabel: "YouTube",
          username: getPlatformUsername(config, "YouTube"),
          handle: getPlatformHandle(config),
        },
      );
    });
    setCache(cacheKey, posts);
    return posts;
  } catch (error) {
    console.error("[SocialMediaFetcher] YouTube error:", error?.message || error);
    return stale;
  }
}

async function fetchTwitterPosts(config) {
  const bearer = toSafeString(process.env.TWITTER_BEARER_TOKEN);
  const accountId = pickPlatformAccountId(config, process.env.TWITTER_USER_ID);
  const postLimit = clampNumber(
    toPositiveInt(config?.postLimit, DEFAULT_PLATFORM_LIMIT),
    1,
    MAX_PLATFORM_LIMIT,
  );
  if (!bearer || !accountId) return [];

  const cacheKey = makeCacheKey("twitter", accountId, postLimit);
  const { fresh, stale } = getCache(cacheKey, config?.cacheTtlMs);
  if (fresh) return fresh;

  try {
    const apiLimit = clampNumber(postLimit, 5, 100);
    const url = `https://api.twitter.com/2/users/${encodeURIComponent(accountId)}/tweets?max_results=${apiLimit}&tweet.fields=created_at,text,attachments&expansions=attachments.media_keys&media.fields=url,preview_image_url,type`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
      next: { revalidate: 0 },
    });
    if (!response.ok) throw new Error(`Twitter API ${response.status}`);
    const payload = await response.json();
    const mediaMap = new Map();
    const medias = Array.isArray(payload?.includes?.media) ? payload.includes.media : [];
    for (const media of medias) {
      const key = toSafeString(media?.media_key);
      if (!key) continue;
      mediaMap.set(key, {
        type: toSafeString(media?.type).toLowerCase(),
        image: toSafeString(media?.url || media?.preview_image_url),
      });
    }
    const posts = (Array.isArray(payload?.data) ? payload.data : [])
      .map((item) => {
        const mediaKeys = Array.isArray(item?.attachments?.media_keys)
          ? item.attachments.media_keys
          : [];
        const firstMedia = mediaKeys.length > 0 ? mediaMap.get(mediaKeys[0]) : null;
        const mediaType =
          firstMedia?.type === "video"
            ? "video"
            : firstMedia?.type === "animated_gif"
              ? "video"
              : firstMedia?.type === "photo"
                ? "image"
                : "text";
        return normalizeBaseLivePost(
          {
            id: item?.id,
            platform: "twitter",
            platformLabel: "X (Twitter)",
            username: getPlatformUsername(config, "X"),
            handle: getPlatformHandle(config),
            caption: item?.text,
            text: item?.text,
            imageDesktop: firstMedia?.image || "",
            mediaType,
            postUrl: item?.id ? `https://x.com/i/status/${item.id}` : "",
            publishedAt: item?.created_at,
          },
          {
            platform: "twitter",
            platformLabel: "X (Twitter)",
            username: getPlatformUsername(config, "X"),
            handle: getPlatformHandle(config),
          },
        );
      })
      .slice(0, postLimit);
    setCache(cacheKey, posts);
    return posts;
  } catch (error) {
    console.error("[SocialMediaFetcher] Twitter error:", error?.message || error);
    return stale;
  }
}

const PLATFORM_DEFINITIONS = {
  instagram: {
    key: "instagram",
    label: "Instagram",
    supportsLive: true,
    defaultEnabled: true,
    fetcher: fetchInstagramPosts,
  },
  facebook: {
    key: "facebook",
    label: "Facebook",
    supportsLive: true,
    defaultEnabled: true,
    fetcher: fetchFacebookPosts,
  },
  youtube: {
    key: "youtube",
    label: "YouTube",
    supportsLive: true,
    defaultEnabled: true,
    fetcher: fetchYoutubePosts,
  },
  twitter: {
    key: "twitter",
    label: "X (Twitter)",
    supportsLive: true,
    defaultEnabled: true,
    fetcher: fetchTwitterPosts,
  },
  linkedin: {
    key: "linkedin",
    label: "LinkedIn",
    supportsLive: false,
    defaultEnabled: false,
    fetcher: null,
  },
  whatsapp: {
    key: "whatsapp",
    label: "WhatsApp",
    supportsLive: false,
    defaultEnabled: false,
    fetcher: null,
  },
  googlemaps: {
    key: "googlemaps",
    label: "Google Maps",
    supportsLive: false,
    defaultEnabled: false,
    fetcher: null,
  },
};

function normalizePlatformConfig(raw, index = 0) {
  const platform = toSafeString(raw?.platform || raw?.key).toLowerCase();
  if (!platform || !PLATFORM_DEFINITIONS[platform]) return null;
  const definition = PLATFORM_DEFINITIONS[platform];
  return {
    platform,
    label: definition.label,
    supportsLive: definition.supportsLive === true,
    active: raw?.active !== false,
    handle: toSafeString(raw?.handle),
    accountId: toSafeString(raw?.accountId),
    feedMode: ["live", "manual", "both"].includes(toSafeString(raw?.feedMode).toLowerCase())
      ? toSafeString(raw?.feedMode).toLowerCase()
      : "both",
    visibility: ["all", "desktop", "mobile", "none"].includes(
      toSafeString(raw?.visibility).toLowerCase(),
    )
      ? toSafeString(raw?.visibility).toLowerCase()
      : "all",
    postLimit: clampNumber(
      toPositiveInt(raw?.postLimit, DEFAULT_PLATFORM_LIMIT),
      1,
      MAX_PLATFORM_LIMIT,
    ),
    order: toPositiveInt(raw?.order, index + 1),
    cacheTtlMs: clampNumber(
      toPositiveInt(raw?.cacheTtlMs, DEFAULT_CACHE_TTL_MS),
      1,
      24 * 60 * 60 * 1000,
    ),
  };
}

export function getSupportedSocialPlatforms() {
  return Object.values(PLATFORM_DEFINITIONS).map((entry) => ({
    key: entry.key,
    label: entry.label,
    supportsLive: entry.supportsLive === true,
  }));
}

function buildDefaultPlatformConfigsFromEnv() {
  const defaults = [
    {
      platform: "instagram",
      active:
        !!toSafeString(process.env.INSTAGRAM_ACCESS_TOKEN) &&
        !!toSafeString(process.env.INSTAGRAM_USER_ID),
      accountId: toSafeString(process.env.INSTAGRAM_USER_ID),
      feedMode: "live",
      postLimit: DEFAULT_PLATFORM_LIMIT,
      order: 1,
    },
    {
      platform: "facebook",
      active:
        !!toSafeString(process.env.FACEBOOK_ACCESS_TOKEN) &&
        !!toSafeString(process.env.FACEBOOK_PAGE_ID),
      accountId: toSafeString(process.env.FACEBOOK_PAGE_ID),
      feedMode: "live",
      postLimit: DEFAULT_PLATFORM_LIMIT,
      order: 2,
    },
    {
      platform: "youtube",
      active:
        !!toSafeString(process.env.YOUTUBE_API_KEY) &&
        !!toSafeString(process.env.YOUTUBE_CHANNEL_ID),
      accountId: toSafeString(process.env.YOUTUBE_CHANNEL_ID),
      feedMode: "live",
      postLimit: DEFAULT_PLATFORM_LIMIT,
      order: 3,
    },
    {
      platform: "twitter",
      active:
        !!toSafeString(process.env.TWITTER_BEARER_TOKEN) &&
        !!toSafeString(process.env.TWITTER_USER_ID),
      accountId: toSafeString(process.env.TWITTER_USER_ID),
      feedMode: "live",
      postLimit: DEFAULT_PLATFORM_LIMIT,
      order: 4,
    },
  ];
  return defaults.map((item, index) => normalizePlatformConfig(item, index)).filter(Boolean);
}

function resolvePlatformConfigs(rawConfigs) {
  if (!Array.isArray(rawConfigs) || rawConfigs.length === 0) {
    return buildDefaultPlatformConfigsFromEnv();
  }
  const normalized = rawConfigs
    .map((item, index) => normalizePlatformConfig(item, index))
    .filter(Boolean);
  const dedup = new Map();
  for (const config of normalized) {
    dedup.set(config.platform, config);
  }
  return Array.from(dedup.values()).sort((a, b) => a.order - b.order);
}

function compareByDateDesc(first, second) {
  const firstTs = first?.publishedAt ? Date.parse(first.publishedAt) : 0;
  const secondTs = second?.publishedAt ? Date.parse(second.publishedAt) : 0;
  if (Number.isFinite(firstTs) && Number.isFinite(secondTs) && firstTs !== secondTs) {
    return secondTs - firstTs;
  }
  return 0;
}

/**
 * Fetch live posts from configured social platforms.
 *
 * @param {object} options
 * @param {Array<object>} [options.platformConfigs] Platform-level settings from component config.
 * @param {number} [options.globalLimit=20] Max posts returned across platforms.
 * @param {string} [options.orderMode=chronological] "chronological" | "platform-priority"
 */
export async function fetchAllLivePosts(options = {}) {
  const platformConfigs = resolvePlatformConfigs(options?.platformConfigs);
  const globalLimit = clampNumber(
    toPositiveInt(options?.globalLimit, DEFAULT_GLOBAL_LIMIT),
    1,
    MAX_GLOBAL_LIMIT,
  );
  const orderMode =
    toSafeString(options?.orderMode).toLowerCase() === "platform-priority"
      ? "platform-priority"
      : "chronological";
  const livePlatformConfigs = platformConfigs.filter((config) => {
    const definition = PLATFORM_DEFINITIONS[config.platform];
    if (!definition || typeof definition.fetcher !== "function") return false;
    if (config.active !== true) return false;
    return config.feedMode === "live" || config.feedMode === "both";
  });

  if (livePlatformConfigs.length === 0) return [];

  const fetchResults = await Promise.allSettled(
    livePlatformConfigs.map((config) => PLATFORM_DEFINITIONS[config.platform].fetcher(config)),
  );

  const orderMap = new Map();
  livePlatformConfigs.forEach((config, index) => {
    orderMap.set(config.platform, toPositiveInt(config.order, index + 1));
  });

  const collected = [];
  for (let i = 0; i < fetchResults.length; i += 1) {
    const result = fetchResults[i];
    const config = livePlatformConfigs[i];
    if (result.status !== "fulfilled" || !Array.isArray(result.value)) continue;
    const perPlatformLimit = clampNumber(
      toPositiveInt(config?.postLimit, DEFAULT_PLATFORM_LIMIT),
      1,
      MAX_PLATFORM_LIMIT,
    );
    const normalized = result.value
      .filter(Boolean)
      .slice(0, perPlatformLimit)
      .map((post) => ({
        ...post,
        platform: toSafeString(post?.platform || config.platform).toLowerCase(),
        _platformOrder: toPositiveInt(config?.order, 999),
      }));
    collected.push(...normalized);
  }

  collected.sort((first, second) => {
    if (orderMode === "platform-priority") {
      const firstOrder = orderMap.get(first.platform) ?? first._platformOrder ?? 999;
      const secondOrder = orderMap.get(second.platform) ?? second._platformOrder ?? 999;
      if (firstOrder !== secondOrder) return firstOrder - secondOrder;
      return compareByDateDesc(first, second);
    }
    return compareByDateDesc(first, second);
  });

  return collected.slice(0, globalLimit).map((post) => {
    const { _platformOrder, ...cleanPost } = post;
    return cleanPost;
  });
}

/**
 * Get live-capable platforms that are available from environment configuration.
 */
export function getConfiguredPlatforms(platformConfigs = []) {
  const configs = resolvePlatformConfigs(platformConfigs);
  return configs
    .filter((config) => {
      const definition = PLATFORM_DEFINITIONS[config.platform];
      if (!definition?.supportsLive) return false;
      if (config.active !== true) return false;
      return config.feedMode === "live" || config.feedMode === "both";
    })
    .map((config) => config.platform);
}
