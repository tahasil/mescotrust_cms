import path from "path";
import { readFile } from "fs/promises";
import sharp from "sharp";
import Media from "@/models/Media";

export const WELCOME_TO_MESCO_MIN_IMAGE_WIDTH = 1042;
export const WELCOME_TO_MESCO_MIN_IMAGE_HEIGHT = 1164;
export const WELCOME_TO_MESCO_MIN_IMAGE_TEXT =
  `${WELCOME_TO_MESCO_MIN_IMAGE_WIDTH} \u00D7 ${WELCOME_TO_MESCO_MIN_IMAGE_HEIGHT} pixels`;

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

async function getImageDimensions(url) {
  const mediaDims = await getImageDimensionsFromMediaRoute(url);
  if (mediaDims) return mediaDims;

  const localDims = await getImageDimensionsFromPublicPath(url);
  if (localDims) return localDims;

  const trimmed = String(url || "").trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return getImageDimensionsFromRemoteUrl(trimmed);
  }

  throw new Error("Unsupported image URL");
}

function resolveDesktopImageUrl(props) {
  if (!props || typeof props !== "object") return "";
  const candidates = [props.imageDesktop, props.imageUrl];
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) return value;
  }
  return "";
}

export async function validateWelcometoMESCOImage(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const imageUrl = resolveDesktopImageUrl(props);
  if (!imageUrl) return [];

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      width >= WELCOME_TO_MESCO_MIN_IMAGE_WIDTH &&
      height >= WELCOME_TO_MESCO_MIN_IMAGE_HEIGHT
    ) {
      return [];
    }
  } catch {}

  const prefix = labelPrefix ? `${labelPrefix}: ` : "";
  return [`${prefix}Image size must be at least ${WELCOME_TO_MESCO_MIN_IMAGE_TEXT}.`];
}
