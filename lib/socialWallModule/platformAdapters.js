import {
  SOCIAL_WALL_MAX_SYNC_POST_LIMIT,
  SOCIAL_WALL_PLATFORM_DEFINITIONS,
} from "@/lib/socialWallModule/constants";
import {
  clampNumber,
  hashString,
  toIsoDate,
  toPositiveInt,
  toSafeString,
} from "@/lib/socialWallModule/utils";

const PLATFORM_MAP = new Map(
  SOCIAL_WALL_PLATFORM_DEFINITIONS.map((item) => [item.platform, item]),
);

function pickWithEnv(primary, envName) {
  const direct = toSafeString(primary);
  if (direct) return direct;
  return envName ? toSafeString(process.env[envName]) : "";
}

function normalizePost(raw, defaults = {}) {
  const platform = toSafeString(raw?.platform || defaults.platform).toLowerCase();
  const publishedAt = toIsoDate(raw?.publishedAt || raw?.date) || new Date().toISOString();
  const caption = toSafeString(raw?.caption || raw?.text);
  const mediaTypeInput = toSafeString(raw?.mediaType).toLowerCase();
  const mediaUrl = toSafeString(raw?.mediaUrl || raw?.image || raw?.imageDesktop);
  const thumbnailUrl = toSafeString(raw?.thumbnailUrl || raw?.image || raw?.imageDesktop);
  const videoUrl = toSafeString(raw?.videoUrl);
  const mediaType =
    mediaTypeInput && ["image", "video", "text"].includes(mediaTypeInput)
      ? mediaTypeInput
      : videoUrl
        ? "video"
        : mediaUrl || thumbnailUrl
          ? "image"
          : "text";
  const postId =
    toSafeString(raw?.postId || raw?.id) ||
    `${platform}-${hashString(`${toSafeString(raw?.postUrl)}-${caption}-${publishedAt}`)}`;

  const likesCount = toPositiveInt(raw?.likesCount ?? raw?.likes ?? 0, 0);
  const commentsCount = toPositiveInt(raw?.commentsCount ?? raw?.comments ?? 0, 0);
  const sharesCount = toPositiveInt(raw?.sharesCount ?? raw?.shares ?? 0, 0);

  return {
    platform,
    postId,
    authorName: toSafeString(raw?.authorName || raw?.username || defaults.authorName),
    authorHandle: toSafeString(raw?.authorHandle || raw?.handle || defaults.authorHandle),
    authorImage: toSafeString(raw?.authorImage),
    caption,
    mediaType,
    mediaUrl,
    thumbnailUrl,
    videoUrl,
    postUrl: toSafeString(raw?.postUrl),
    publishedAt,
    likesCount,
    commentsCount,
    sharesCount,
    hashtags: Array.isArray(raw?.hashtags)
      ? raw.hashtags.map((tag) => toSafeString(tag)).filter(Boolean)
      : [],
    rawPayload: raw?.rawPayload || raw || null,
  };
}

function createValidationResult({ valid = true, errors = [], warnings = [] } = {}) {
  return {
    valid: valid !== false,
    errors: Array.isArray(errors) ? errors.filter(Boolean) : [],
    warnings: Array.isArray(warnings) ? warnings.filter(Boolean) : [],
  };
}

function validateLiveBasics(config = {}, { requiresApiKey = false } = {}) {
  const accessToken = toSafeString(config?.accessToken);
  const accountId = toSafeString(config?.accountId);
  const apiKey = toSafeString(config?.apiKey);
  const mode = toSafeString(config?.mode).toLowerCase();
  const active = config?.active === true;

  if (!active || mode !== "live") {
    return createValidationResult({ valid: true });
  }

  const warnings = [];
  if (requiresApiKey) {
    if (!apiKey) warnings.push("apiKey is missing for live mode");
  } else if (!accessToken) {
    warnings.push("accessToken is missing for live mode");
  }
  if (!accountId) warnings.push("accountId is missing for live mode");
  return createValidationResult({ valid: true, warnings });
}

function createUnsupportedRefreshResult(reason = "Token refresh is not supported for this platform") {
  return {
    ok: false,
    skipped: true,
    reason,
    accessToken: "",
    refreshToken: "",
    accessTokenExpiresAt: null,
  };
}

async function parseErrorPayload(response) {
  try {
    const payload = await response.json();
    if (payload && typeof payload === "object") return payload;
    return null;
  } catch {
    return null;
  }
}

async function fetchInstagram(platformConfig) {
  const accessToken = pickWithEnv(platformConfig?.accessToken, "INSTAGRAM_ACCESS_TOKEN");
  const accountId = pickWithEnv(platformConfig?.accountId, "INSTAGRAM_USER_ID");
  if (!accessToken || !accountId) return [];

  const limit = clampNumber(
    toPositiveInt(platformConfig?.postLimit, 12),
    1,
    SOCIAL_WALL_MAX_SYNC_POST_LIMIT,
  );
  const url =
    `https://graph.instagram.com/${encodeURIComponent(accountId)}/media` +
    "?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username" +
    `&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`;

  const response = await fetch(url, { next: { revalidate: 0 } });
  if (!response.ok) throw new Error(`INSTAGRAM_API_${response.status}`);
  const payload = await response.json();
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map((item) =>
    normalizePost(
      {
        platform: "instagram",
        postId: item?.id,
        authorName: item?.username ? `@${item.username}` : "Instagram",
        authorHandle: item?.username ? `@${item.username}` : "",
        caption: item?.caption,
        mediaType: item?.media_type === "VIDEO" ? "video" : "image",
        mediaUrl: item?.media_type === "VIDEO" ? item?.thumbnail_url : item?.media_url,
        thumbnailUrl: item?.thumbnail_url || item?.media_url,
        videoUrl: item?.media_type === "VIDEO" ? item?.media_url : "",
        postUrl: item?.permalink,
        publishedAt: item?.timestamp,
        rawPayload: item,
      },
      { platform: "instagram" },
    ),
  );
}

async function refreshInstagramToken(config = {}) {
  const accessToken = pickWithEnv(config?.accessToken, "INSTAGRAM_ACCESS_TOKEN");
  if (!accessToken) {
    return createUnsupportedRefreshResult("accessToken is missing");
  }
  const url =
    "https://graph.instagram.com/refresh_access_token" +
    `?grant_type=ig_refresh_token&access_token=${encodeURIComponent(accessToken)}`;
  const response = await fetch(url, { next: { revalidate: 0 } });
  if (!response.ok) {
    throw new Error(`INSTAGRAM_TOKEN_REFRESH_${response.status}`);
  }
  const payload = await response.json().catch(() => ({}));
  const refreshedToken = toSafeString(payload?.access_token) || accessToken;
  const expiresInSeconds = Math.max(0, toPositiveInt(payload?.expires_in, 0));
  return {
    ok: true,
    skipped: false,
    reason: "",
    accessToken: refreshedToken,
    refreshToken: "",
    accessTokenExpiresAt:
      expiresInSeconds > 0 ? new Date(Date.now() + expiresInSeconds * 1000) : null,
  };
}

async function fetchFacebook(platformConfig) {
  const accessToken = pickWithEnv(platformConfig?.accessToken, "FACEBOOK_ACCESS_TOKEN");
  const accountId = pickWithEnv(platformConfig?.accountId, "FACEBOOK_PAGE_ID");
  if (!accessToken || !accountId) return [];

  const limit = clampNumber(
    toPositiveInt(platformConfig?.postLimit, 12),
    1,
    SOCIAL_WALL_MAX_SYNC_POST_LIMIT,
  );
  const url =
    `https://graph.facebook.com/v19.0/${encodeURIComponent(accountId)}/posts` +
    "?fields=id,message,full_picture,created_time,permalink_url" +
    `&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`;

  const response = await fetch(url, { next: { revalidate: 0 } });
  const payload = await parseErrorPayload(response);
  if (!response.ok) {
    const apiError = payload?.error || {};
    const message = toSafeString(apiError?.message || "Facebook API request failed");
    const code = toSafeString(apiError?.code);
    const subcode = toSafeString(apiError?.error_subcode);
    const reasonParts = [
      `FACEBOOK_API_${response.status}`,
      code ? `CODE_${code}` : "",
      subcode ? `SUBCODE_${subcode}` : "",
    ].filter(Boolean);
    throw new Error(`${reasonParts.join("_")}: ${message}`);
  }
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map((item) =>
    normalizePost(
      {
        platform: "facebook",
        postId: item?.id,
        authorName: "Facebook",
        caption: item?.message,
        mediaType: item?.full_picture ? "image" : "text",
        mediaUrl: item?.full_picture,
        thumbnailUrl: item?.full_picture,
        postUrl: item?.permalink_url,
        publishedAt: item?.created_time,
        rawPayload: item,
      },
      { platform: "facebook" },
    ),
  );
}

async function fetchYoutube(platformConfig) {
  const apiKey = pickWithEnv(platformConfig?.apiKey, "YOUTUBE_API_KEY");
  const channelId = pickWithEnv(platformConfig?.accountId, "YOUTUBE_CHANNEL_ID");
  if (!apiKey || !channelId) return [];

  const limit = clampNumber(
    toPositiveInt(platformConfig?.postLimit, 12),
    1,
    SOCIAL_WALL_MAX_SYNC_POST_LIMIT,
  );
  const url =
    "https://www.googleapis.com/youtube/v3/search" +
    `?part=snippet&channelId=${encodeURIComponent(channelId)}` +
    `&maxResults=${limit}&order=date&type=video&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, { next: { revalidate: 0 } });
  if (!response.ok) throw new Error(`YOUTUBE_API_${response.status}`);
  const payload = await response.json();
  const rows = Array.isArray(payload?.items) ? payload.items : [];
  return rows.map((item) => {
    const snippet = item?.snippet || {};
    const videoId = toSafeString(item?.id?.videoId);
    return normalizePost(
      {
        platform: "youtube",
        postId: videoId || toSafeString(item?.etag),
        authorName: toSafeString(snippet?.channelTitle || "YouTube"),
        caption: snippet?.title,
        mediaType: "video",
        mediaUrl:
          toSafeString(snippet?.thumbnails?.high?.url) ||
          toSafeString(snippet?.thumbnails?.medium?.url) ||
          toSafeString(snippet?.thumbnails?.default?.url),
        thumbnailUrl:
          toSafeString(snippet?.thumbnails?.high?.url) ||
          toSafeString(snippet?.thumbnails?.medium?.url) ||
          toSafeString(snippet?.thumbnails?.default?.url),
        postUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
        publishedAt: snippet?.publishedAt,
        rawPayload: item,
      },
      { platform: "youtube" },
    );
  });
}

function stripBearerPrefix(value) {
  const raw = toSafeString(value);
  return raw.replace(/^Bearer\s+/i, "").trim();
}

function extractTwitterUsername(value) {
  const raw = toSafeString(value);
  if (!raw) return "";
  if (/^\d+$/.test(raw)) return "";
  let candidate = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      const host = toSafeString(parsed.hostname).toLowerCase().replace(/^www\./, "");
      if (host === "x.com" || host === "twitter.com") {
        candidate = parsed.pathname.split("/").filter(Boolean)[0] || "";
      }
    } catch {
      candidate = raw;
    }
  }
  candidate = candidate.replace(/^@/, "");
  return /^[A-Za-z0-9_]{1,15}$/.test(candidate) ? candidate : "";
}

async function resolveTwitterAccountId(accountInput, bearer) {
  const accountId = toSafeString(accountInput);
  if (!accountId) return "";
  if (/^\d+$/.test(accountId)) return accountId;
  const username = extractTwitterUsername(accountId);
  if (!username) return "";
  const lookupUrl = `https://api.twitter.com/2/users/by/username/${encodeURIComponent(username)}?user.fields=id`;
  const response = await fetch(lookupUrl, {
    headers: { Authorization: `Bearer ${bearer}` },
    next: { revalidate: 0 },
  });
  if (!response.ok) throw new Error(`TWITTER_USER_LOOKUP_${response.status}`);
  const payload = await response.json();
  return toSafeString(payload?.data?.id);
}

async function fetchTwitter(platformConfig) {
  const bearer = stripBearerPrefix(
    pickWithEnv(platformConfig?.accessToken, "TWITTER_BEARER_TOKEN"),
  );
  const accountInput = pickWithEnv(platformConfig?.accountId, "TWITTER_USER_ID");
  if (!bearer || !accountInput) return [];
  const accountId = await resolveTwitterAccountId(accountInput, bearer);
  if (!accountId) return [];

  const limit = clampNumber(
    toPositiveInt(platformConfig?.postLimit, 12),
    5,
    SOCIAL_WALL_MAX_SYNC_POST_LIMIT,
  );
  const url =
    `https://api.twitter.com/2/users/${encodeURIComponent(accountId)}/tweets` +
    `?max_results=${limit}` +
    "&tweet.fields=created_at,text,attachments,public_metrics" +
    "&expansions=attachments.media_keys" +
    "&media.fields=url,preview_image_url,type";

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${bearer}` },
    next: { revalidate: 0 },
  });
  if (!response.ok) throw new Error(`TWITTER_API_${response.status}`);
  const payload = await response.json();
  const mediaByKey = new Map();
  const medias = Array.isArray(payload?.includes?.media) ? payload.includes.media : [];
  medias.forEach((media) => {
    const key = toSafeString(media?.media_key);
    if (!key) return;
    mediaByKey.set(key, {
      type: toSafeString(media?.type).toLowerCase(),
      image: toSafeString(media?.url || media?.preview_image_url),
    });
  });
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map((item) => {
    const mediaKeys = Array.isArray(item?.attachments?.media_keys)
      ? item.attachments.media_keys
      : [];
    const media = mediaKeys.length > 0 ? mediaByKey.get(mediaKeys[0]) : null;
    const metrics = item?.public_metrics || {};
    return normalizePost(
      {
        platform: "twitter",
        postId: item?.id,
        authorName: "X",
        caption: item?.text,
        mediaType:
          media?.type === "video" || media?.type === "animated_gif"
            ? "video"
            : media?.type === "photo"
              ? "image"
              : "text",
        mediaUrl: media?.image || "",
        thumbnailUrl: media?.image || "",
        postUrl: item?.id ? `https://x.com/i/status/${item.id}` : "",
        publishedAt: item?.created_at,
        likesCount: toPositiveInt(metrics?.like_count, 0),
        commentsCount: toPositiveInt(metrics?.reply_count, 0),
        sharesCount: toPositiveInt(metrics?.retweet_count, 0),
        rawPayload: item,
      },
      { platform: "twitter" },
    );
  });
}

function createManualOnlyAdapter(platform) {
  return {
    platform,
    fetchLatestPosts: async () => [],
    validateConfig: async () => createValidationResult({ valid: true }),
  };
}

const SOCIAL_WALL_ADAPTERS = Object.freeze({
  instagram: {
    platform: "instagram",
    fetchLatestPosts: fetchInstagram,
    refreshAccessToken: refreshInstagramToken,
    validateConfig: async (config) => validateLiveBasics(config),
  },
  facebook: {
    platform: "facebook",
    fetchLatestPosts: fetchFacebook,
    validateConfig: async (config) => validateLiveBasics(config),
  },
  youtube: {
    platform: "youtube",
    fetchLatestPosts: fetchYoutube,
    validateConfig: async (config) => validateLiveBasics(config, { requiresApiKey: true }),
  },
  twitter: {
    platform: "twitter",
    fetchLatestPosts: fetchTwitter,
    validateConfig: async (config) => validateLiveBasics(config),
  },
  linkedin: createManualOnlyAdapter("linkedin"),
  pinterest: createManualOnlyAdapter("pinterest"),
  snapchat: createManualOnlyAdapter("snapchat"),
});

function getAdapter(platform) {
  return SOCIAL_WALL_ADAPTERS[toSafeString(platform).toLowerCase()] || null;
}

export function getSocialWallSupportedPlatforms() {
  return SOCIAL_WALL_PLATFORM_DEFINITIONS.map((item) => ({
    platform: item.platform,
    label: item.label,
    liveCapable: item.liveCapable === true,
    defaultMode: item.defaultMode,
  }));
}

export function getSocialWallAdapter(platform) {
  return getAdapter(platform);
}

export async function validateSocialWallPlatformConfig(platformConfig = {}) {
  const platform = toSafeString(platformConfig?.platform).toLowerCase();
  const adapter = getAdapter(platform);
  if (!adapter || typeof adapter.validateConfig !== "function") {
    return createValidationResult({
      valid: false,
      errors: [`Unsupported platform: ${platform || "unknown"}`],
    });
  }
  return adapter.validateConfig(platformConfig);
}

export async function refreshSocialWallPlatformAccessToken(platformConfig = {}) {
  const platform = toSafeString(platformConfig?.platform).toLowerCase();
  const adapter = getAdapter(platform);
  if (!adapter || typeof adapter.refreshAccessToken !== "function") {
    return createUnsupportedRefreshResult(
      `Token refresh is not supported for ${platform || "this platform"}`,
    );
  }
  return adapter.refreshAccessToken(platformConfig);
}

export async function fetchSocialWallPostsByPlatform(platformConfig = {}) {
  const platform = toSafeString(platformConfig?.platform).toLowerCase();
  if (!platform) return [];

  const definition = PLATFORM_MAP.get(platform);
  if (!definition) return [];
  if (!platformConfig?.active) return [];
  if (toSafeString(platformConfig?.mode).toLowerCase() !== "live") return [];
  if (definition.liveCapable !== true) return [];

  const adapter = getAdapter(platform);
  if (!adapter || typeof adapter.fetchLatestPosts !== "function") return [];

  const validation = await validateSocialWallPlatformConfig(platformConfig);
  if (validation?.valid === false) {
    throw new Error(`VALIDATION_${validation.errors?.join(", ") || "INVALID_CONFIG"}`);
  }
  return adapter.fetchLatestPosts(platformConfig);
}
