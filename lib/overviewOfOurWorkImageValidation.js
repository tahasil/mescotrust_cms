import path from "path";
import { readFile } from "fs/promises";
import sharp from "sharp";
import Media from "@/models/Media";

export const OVERVIEW_WORK_BG_MIN_WIDTH = 580;
export const OVERVIEW_WORK_BG_MIN_HEIGHT = 704;
export const OVERVIEW_WORK_BG_MIN_TEXT =
  `${OVERVIEW_WORK_BG_MIN_WIDTH} \u00D7 ${OVERVIEW_WORK_BG_MIN_HEIGHT} pixels`;

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
  if (resolved !== publicRoot && !resolved.startsWith(`${publicRoot}${path.sep}`)) {
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
  const metadata = await sharp(Buffer.from(arrayBuffer), { failOn: "none" }).metadata();
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

function resolveOverviewItems(props) {
  if (!props || typeof props !== "object") return [];
  if (Array.isArray(props.overviewOfOurWorkItems)) return props.overviewOfOurWorkItems;
  if (Array.isArray(props.awardsRecognitionItems)) return props.awardsRecognitionItems;
  if (Array.isArray(props.items)) return props.items;
  return [];
}

function resolveDesktopBackgroundUrl(item) {
  if (!item || typeof item !== "object") return "";
  return String(
    item.bgImageUrlDesktop ??
      item.bgImageUrl ??
      item.bgImage ??
      item.bgImageUrlMobile ??
      "",
  ).trim();
}

export async function validateOverviewOfOurWorkBackgroundImages(props, options = {}) {
  const labelPrefix =
    options?.labelPrefix != null ? String(options.labelPrefix).trim() : "";
  const errors = [];
  const items = resolveOverviewItems(props);
  const dimensionCache = new Map();
  const invalidBackgroundItemIndices = [];

  for (let i = 0; i < items.length; i += 1) {
    const imageUrl = resolveDesktopBackgroundUrl(items[i]);
    if (imageUrl) {
      const cacheKey = imageUrl;
      try {
        let dims = dimensionCache.get(cacheKey);
        if (!dims) {
          dims = await getImageDimensions(imageUrl);
          dimensionCache.set(cacheKey, dims);
        }
        if (
          !Number.isFinite(dims.width) ||
          !Number.isFinite(dims.height) ||
          dims.width < OVERVIEW_WORK_BG_MIN_WIDTH ||
          dims.height < OVERVIEW_WORK_BG_MIN_HEIGHT
        ) {
          invalidBackgroundItemIndices.push(i + 1);
        }
      } catch {
        invalidBackgroundItemIndices.push(i + 1);
      }
    }

  }

  if (invalidBackgroundItemIndices.length > 0) {
    const prefix = labelPrefix ? `${labelPrefix}: ` : "";
    const itemLabels = invalidBackgroundItemIndices
      .map((index) => `#${index}`)
      .join(", ");
    errors.push(
      `${prefix}Image size must be at least ${OVERVIEW_WORK_BG_MIN_TEXT}. Invalid item(s): ${itemLabels}.`,
    );
  }

  return errors;
}
