import path from "path";
import { readFile } from "fs/promises";
import sharp from "sharp";
import Media from "@/models/Media";

const MEDIA_ROUTE_RE = /^\/media\/([0-9a-fA-F]{24})(?:[/?#].*)?$/;

function parseMediaIdFromUrl(url) {
  const match = String(url || "").trim().match(MEDIA_ROUTE_RE);
  return match ? String(match[1] || "").trim() : "";
}

function toPublicFilePath(url) {
  const raw = String(url || "").trim();
  if (!raw.startsWith("/")) return "";

  const [pathOnly] = raw.split(/[?#]/, 1);
  const clean = String(pathOnly || "").trim();
  if (!clean) return "";

  const publicRoot = path.resolve(process.cwd(), "public");
  const relative = clean.replace(/^\/+/, "");
  const resolved = path.resolve(publicRoot, relative);
  if (
    resolved !== publicRoot &&
    !resolved.startsWith(`${publicRoot}${path.sep}`)
  ) {
    return "";
  }
  return resolved;
}

async function getImageDimensionsFromMediaRoute(url) {
  const mediaId = parseMediaIdFromUrl(url);
  if (!mediaId) return null;

  const media = await Media.findById(mediaId)
    .select({ width: 1, height: 1 })
    .lean();
  if (!media) throw new Error("Media not found");

  const width = Number(media.width) || 0;
  const height = Number(media.height) || 0;
  if (width <= 0 || height <= 0) {
    throw new Error("Media dimensions unavailable");
  }
  return { width, height };
}

async function getImageDimensionsFromPublicPath(url) {
  const absolutePath = toPublicFilePath(url);
  if (!absolutePath) return null;

  const buffer = await readFile(absolutePath);
  const metadata = await sharp(buffer, { failOn: "none" }).metadata();
  return {
    width: Number(metadata.width) || 0,
    height: Number(metadata.height) || 0,
  };
}

async function getImageDimensionsFromRemoteUrl(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const metadata = await sharp(Buffer.from(arrayBuffer), {
    failOn: "none",
  }).metadata();
  return {
    width: Number(metadata.width) || 0,
    height: Number(metadata.height) || 0,
  };
}

export async function getImageDimensionsForValidation(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) throw new Error("Image URL is required");

  const mediaDims = await getImageDimensionsFromMediaRoute(trimmed);
  if (mediaDims) return mediaDims;

  const localDims = await getImageDimensionsFromPublicPath(trimmed);
  if (localDims) return localDims;

  if (/^https?:\/\//i.test(trimmed)) {
    return getImageDimensionsFromRemoteUrl(trimmed);
  }

  throw new Error("Unsupported image URL");
}
