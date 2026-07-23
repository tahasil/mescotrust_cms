import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import SocialWallPost from "@/models/SocialWallPost";

export const dynamic = "force-dynamic";

const UPSTREAM_CACHE_SECONDS = 24 * 60 * 60;
const MEDIA_TIMEOUT_MS = 10000;

const ALLOWED_HOST_SUFFIXES = [
  "cdninstagram.com",
  "fbcdn.net",
  "facebook.com",
  "ytimg.com",
  "googleusercontent.com",
  "twimg.com",
  "licdn.com",
  "pinimg.com",
  "sc-cdn.net",
];

function safeUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (!ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function collectMedia(post = {}) {
  const values = [];
  const add = (value) => {
    const url = String(value || "").trim();
    if (url && !values.includes(url)) values.push(url);
  };
  add(post.thumbnailUrl);
  add(post.mediaUrl);
  const children = Array.isArray(post?.rawPayload?.children?.data)
    ? post.rawPayload.children.data
    : [];
  children.forEach((item) => {
    add(item?.thumbnail_url);
    add(item?.media_url);
    add(item?.url);
  });
  const attachments = Array.isArray(post?.rawPayload?.attachments?.data)
    ? post.rawPayload.attachments.data
    : [];
  attachments.forEach((item) => {
    add(item?.media?.image?.src);
    add(item?.media?.source);
    add(item?.media?.url);
    add(item?.subattachments?.data?.[0]?.media?.image?.src);
  });
  return values.slice(0, 8);
}

async function fetchUpstreamMedia(url, source) {
  if (!url) return null;
  const response = await fetch(url, {
    next: { revalidate: UPSTREAM_CACHE_SECONDS },
    signal: AbortSignal.timeout(MEDIA_TIMEOUT_MS),
    headers: {
      Accept: source === "video" ? "video/*,*/*;q=0.8" : "image/avif,image/webp,image/*,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0 (compatible; MescoTrustSocialWall/1.0)",
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const expected = source === "video" ? contentType.startsWith("video/") : contentType.startsWith("image/");
  if (!response.ok || !expected || !response.body) return null;
  return { response, contentType };
}

async function findCurrentInstagramImage(post = {}) {
  const postUrl = String(post?.postUrl || "").trim().replace(/[?#].*$/, "").replace(/\/$/, "");
  if (!/^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\//i.test(postUrl)) return null;
  const embed = await fetch(`${postUrl}/embed/captioned/`, {
    next: { revalidate: 60 * 60 },
    signal: AbortSignal.timeout(MEDIA_TIMEOUT_MS),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MescoTrustSocialWall/1.0)" },
  });
  if (!embed.ok) return null;
  const html = await embed.text();
  const matches = html.match(/https:\\?\/\\?\/[^"'\s<]+(?:\.jpg|\.webp)[^"'\s<]*/gi) || [];
  const candidates = matches
    .map((value) => value.replace(/\\\//g, "/").replace(/&amp;/g, "&").replace(/\\u0026/g, "&"))
    .filter((value) => /(?:t51\.82787-15|t51\.2885-15)/i.test(value));
  const preferred = candidates.find((value) => /s(?:640|750|1080)x/i.test(value)) || candidates[0];
  return safeUrl(preferred);
}

export async function GET(req, { params }) {
  const id = String(params?.id || "").trim();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid media id" }, { status: 400 });
  }

  await connectDB();
  const post = await SocialWallPost.findOne({ _id: id, status: "approved" }).lean();
  if (!post) return NextResponse.json({ error: "Media not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const requestedSource = searchParams.get("source") || "media";
  const source = ["media", "author", "video"].includes(requestedSource)
    ? requestedSource
    : "media";
  const requestedIndex = Number.parseInt(searchParams.get("index") || "0", 10);
  const index = Number.isFinite(requestedIndex)
    ? Math.max(0, Math.min(7, requestedIndex))
    : 0;
  const candidate = source === "author"
    ? post.authorImage
    : source === "video"
      ? post.videoUrl
      : collectMedia(post)[index];
  const upstreamUrl = safeUrl(candidate);
  if (!upstreamUrl) return NextResponse.json({ error: "Unsupported media URL" }, { status: 404 });

  try {
    let result = await fetchUpstreamMedia(upstreamUrl, source);
    if (!result && post.platform === "instagram" && source !== "author" && source !== "video") {
      result = await fetchUpstreamMedia(await findCurrentInstagramImage(post), source);
    }
    if (!result) {
      return NextResponse.json({ error: "Upstream media unavailable" }, { status: 404 });
    }
    return new NextResponse(result.response.body, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Upstream media unavailable" }, { status: 404 });
  }
}
