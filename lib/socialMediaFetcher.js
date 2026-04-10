/**
 * Server-side social media post fetcher with in-memory cache.
 * Fetches latest posts from Instagram, Facebook, YouTube, X/Twitter.
 * All API keys are optional — if not set, that platform is skipped.
 * LinkedIn, WhatsApp, Google Maps have no public post API — manual only.
 */

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const cache = new Map(); // key: platform, value: { data, timestamp }

function getCached(platform) {
  const entry = cache.get(platform);
  if (!entry) return null;
  if (Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  return null; // expired but keep stale for fallback
}

function getStale(platform) {
  const entry = cache.get(platform);
  return entry?.data || [];
}

function setCache(platform, data) {
  cache.set(platform, { data, timestamp: Date.now() });
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

/* ── Instagram (Meta Graph API) ── */
async function fetchInstagram() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!token || !userId) return [];

  const cached = getCached("instagram");
  if (cached) return cached;

  try {
    const url = `https://graph.instagram.com/${userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username&limit=10&access_token=${token}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Instagram API ${res.status}`);
    const json = await res.json();
    const posts = (json.data || []).map((item) => ({
      platform: "instagram",
      username: item.username ? `@${item.username}` : "@mescotrust",
      caption: item.caption || "",
      image: item.media_type === "VIDEO" ? (item.thumbnail_url || "") : (item.media_url || ""),
      date: formatDate(item.timestamp),
      postUrl: item.permalink || "",
      source: "live",
      _sortDate: item.timestamp || "",
    }));
    setCache("instagram", posts);
    return posts;
  } catch (err) {
    console.error("[SocialMediaFetcher] Instagram error:", err.message);
    return getStale("instagram");
  }
}

/* ── Facebook (Meta Graph API) ── */
async function fetchFacebook() {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  if (!token || !pageId) return [];

  const cached = getCached("facebook");
  if (cached) return cached;

  try {
    const url = `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message,full_picture,created_time,permalink_url&limit=10&access_token=${token}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Facebook API ${res.status}`);
    const json = await res.json();
    const posts = (json.data || []).map((item) => ({
      platform: "facebook",
      username: "MESCO Trust",
      caption: item.message || "",
      image: item.full_picture || "",
      date: formatDate(item.created_time),
      postUrl: item.permalink_url || "",
      source: "live",
      _sortDate: item.created_time || "",
    }));
    setCache("facebook", posts);
    return posts;
  } catch (err) {
    console.error("[SocialMediaFetcher] Facebook error:", err.message);
    return getStale("facebook");
  }
}

/* ── YouTube (Data API v3) ── */
async function fetchYouTube() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!apiKey || !channelId) return [];

  const cached = getCached("youtube");
  if (cached) return cached;

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=date&type=video&key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`YouTube API ${res.status}`);
    const json = await res.json();
    const posts = (json.items || []).map((item) => {
      const snippet = item.snippet || {};
      const videoId = item.id?.videoId || "";
      return {
        platform: "youtube",
        username: snippet.channelTitle || "MESCO Trust",
        caption: snippet.title || "",
        image: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || "",
        date: formatDate(snippet.publishedAt),
        postUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
        source: "live",
        _sortDate: snippet.publishedAt || "",
      };
    });
    setCache("youtube", posts);
    return posts;
  } catch (err) {
    console.error("[SocialMediaFetcher] YouTube error:", err.message);
    return getStale("youtube");
  }
}

/* ── X / Twitter (API v2) ── */
async function fetchTwitter() {
  const bearer = process.env.TWITTER_BEARER_TOKEN;
  const userId = process.env.TWITTER_USER_ID;
  if (!bearer || !userId) return [];

  const cached = getCached("twitter");
  if (cached) return cached;

  try {
    const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=created_at,text,attachments&expansions=attachments.media_keys&media.fields=url,preview_image_url,type`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${bearer}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`Twitter API ${res.status}`);
    const json = await res.json();
    const mediaMap = {};
    (json.includes?.media || []).forEach((m) => {
      mediaMap[m.media_key] = m.url || m.preview_image_url || "";
    });
    const posts = (json.data || []).map((tweet) => {
      const mediaKeys = tweet.attachments?.media_keys || [];
      const image = mediaKeys.length > 0 ? (mediaMap[mediaKeys[0]] || "") : "";
      return {
        platform: "twitter",
        username: "@mescotrust",
        caption: tweet.text || "",
        image,
        date: formatDate(tweet.created_at),
        postUrl: `https://x.com/i/status/${tweet.id}`,
        source: "live",
        _sortDate: tweet.created_at || "",
      };
    });
    setCache("twitter", posts);
    return posts;
  } catch (err) {
    console.error("[SocialMediaFetcher] Twitter error:", err.message);
    return getStale("twitter");
  }
}

/* ── Main: fetch all configured platforms ── */
export async function fetchAllLivePosts() {
  const results = await Promise.allSettled([
    fetchInstagram(),
    fetchFacebook(),
    fetchYouTube(),
    fetchTwitter(),
  ]);

  const allPosts = [];
  for (const result of results) {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      allPosts.push(...result.value);
    }
  }

  // Sort by date (newest first)
  allPosts.sort((a, b) => {
    if (!a._sortDate && !b._sortDate) return 0;
    if (!a._sortDate) return 1;
    if (!b._sortDate) return -1;
    return new Date(b._sortDate) - new Date(a._sortDate);
  });

  // Remove internal sort key
  return allPosts.map(({ _sortDate, ...post }) => post);
}

/**
 * Check which platforms have API keys configured.
 */
export function getConfiguredPlatforms() {
  const platforms = [];
  if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID) platforms.push("instagram");
  if (process.env.FACEBOOK_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID) platforms.push("facebook");
  if (process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID) platforms.push("youtube");
  if (process.env.TWITTER_BEARER_TOKEN && process.env.TWITTER_USER_ID) platforms.push("twitter");
  return platforms;
}
