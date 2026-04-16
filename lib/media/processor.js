const path = require("path");
const { readFile } = require("fs/promises");
const { getStorageAdapter } = require("../storage");
const {
  IMAGE_MIME_TO_EXT,
  IMAGE_UPLOAD_MIME_TYPES,
} = require("./constants");
const { getEffectiveQuality } = require("./settings");
const {
  buildVariantEntries,
  calculateSavingsPercentage,
} = require("./variants");

function getSharpOrNull() {
  try {
    // eslint-disable-next-line global-require
    return require("sharp");
  } catch {
    return null;
  }
}

function isImageMimeType(mimeType) {
  return IMAGE_UPLOAD_MIME_TYPES.includes(String(mimeType || "").toLowerCase());
}

function normalizeExt(ext) {
  const e = String(ext || "").trim().toLowerCase();
  if (!e) return "";
  return e.startsWith(".") ? e : `.${e}`;
}

function resolveInputExt({ originalName, mimeType }) {
  const fromMime = IMAGE_MIME_TO_EXT[String(mimeType || "").toLowerCase()] || "";
  if (fromMime) return fromMime;
  return normalizeExt(path.extname(String(originalName || ""))) || ".bin";
}

async function storeFile(adapter, key, buffer) {
  return adapter.saveBuffer({ storageKey: key, buffer });
}

function getResizeFit(cropMode) {
  if (cropMode === "cover") return "cover";
  if (cropMode === "contain") return "contain";
  return "inside";
}

async function encodeWithSharp({
  sharp,
  inputBuffer,
  width,
  fit,
  quality,
  compressionMode,
  webpEffort,
  avifEffort,
  fallbackFormat,
  enableWebP,
  enableAVIF,
}) {
  const base = sharp(inputBuffer, { failOn: "none" }).rotate();
  const resized =
    width && Number(width) > 0
      ? base.resize({
          width: Number(width),
          fit,
          withoutEnlargement: true,
        })
      : base;

  const fallbackPipeline = resized.clone();
  if (fallbackFormat === "png") {
    fallbackPipeline.png({
      compressionLevel: compressionMode === "lossless" ? 9 : 8,
      quality,
    });
  } else {
    fallbackPipeline.jpeg({
      quality,
      mozjpeg: true,
      chromaSubsampling: "4:2:0",
    });
  }
  const fallback = await fallbackPipeline.toBuffer({ resolveWithObject: true });

  const webp = enableWebP
    ? await resized
        .clone()
        .webp({
          quality,
          effort: webpEffort,
          lossless: compressionMode === "lossless",
        })
        .toBuffer({ resolveWithObject: true })
    : null;

  const avif = enableAVIF
    ? await resized
        .clone()
        .avif({
          quality,
          effort: avifEffort,
          lossless: compressionMode === "lossless",
        })
        .toBuffer({ resolveWithObject: true })
    : null;

  return { fallback, webp, avif };
}

async function optimizeAndStoreUpload({
  buffer,
  mimeType,
  originalName,
  mediaId,
  settings,
  storageProvider = "local",
}) {
  const adapter = getStorageAdapter(storageProvider);
  const ext = resolveInputExt({ originalName, mimeType });
  const quality = getEffectiveQuality(settings);
  const isImage = isImageMimeType(mimeType);
  const now = Date.now();

  const originalKey = adapter.createMediaStorageKey({
    mediaId,
    kind: "original",
    ext,
  });
  const originalStored = await storeFile(adapter, originalKey, buffer);

  const baseResult = {
    storageProvider,
    storageKey: originalStored.storageKey,
    fileName: path.basename(originalStored.storageKey),
    filename: path.basename(originalStored.storageKey),
    originalName,
    mimeType,
    ext,
    url: originalStored.url,
    originalUrl: originalStored.url,
    publicUrl: `/media/${mediaId}`,
    size: buffer.length,
    originalSize: buffer.length,
    optimizedSize: buffer.length,
    savingsPercentage: 0,
    webpUrl: "",
    avifUrl: "",
    width: 0,
    height: 0,
    status: "ready",
    generatedSizes: {},
    processedAt: now,
  };

  if (!isImage) return baseResult;

  const sharp = getSharpOrNull();
  if (!sharp) {
    return {
      ...baseResult,
      status: "failed",
      errorMessage:
        "Sharp dependency is not installed. Image was saved without optimization.",
    };
  }

  const metadata = await sharp(buffer, { failOn: "none" }).metadata();
  const width = Number(metadata.width) || 0;
  const height = Number(metadata.height) || 0;
  const cropMode = String(settings?.cropMode || "none");
  const fit = getResizeFit(cropMode);
  const compressionMode = String(settings?.compressionMode || "glossy");
  const webpEffort = Number(settings?.webpEffort ?? 4);
  const avifEffort = Number(settings?.avifEffort ?? 4);
  const variantEntries = buildVariantEntries(settings?.widths);
  const fallbackFormat = ext === ".png" ? "png" : "jpg";
  const enableWebP = Boolean(settings?.enableWebP);
  const enableAVIF = Boolean(settings?.enableAVIF);

  const generatedSizes = {};
  let bestUrl = originalStored.url;
  let bestSize = buffer.length;
  let bestWebp = "";
  let bestAvif = "";

  for (const [name, variantWidth] of variantEntries) {
    const encoded = await encodeWithSharp({
      sharp,
      inputBuffer: buffer,
      width: variantWidth,
      fit,
      quality,
      compressionMode,
      webpEffort,
      avifEffort,
      fallbackFormat,
      enableWebP,
      enableAVIF,
    });

    const fallbackExt = fallbackFormat === "png" ? ".png" : ".jpg";
    const fallbackKey = adapter.createMediaStorageKey({
      mediaId,
      kind: name,
      ext: fallbackExt,
    });
    const webpKey = adapter.createMediaStorageKey({
      mediaId,
      kind: `${name}-webp`,
      ext: ".webp",
    });
    const avifKey = adapter.createMediaStorageKey({
      mediaId,
      kind: `${name}-avif`,
      ext: ".avif",
    });

    const fallbackSaved = await storeFile(adapter, fallbackKey, encoded.fallback.data);
    const webpSaved = enableWebP && encoded.webp
      ? await storeFile(adapter, webpKey, encoded.webp.data)
      : null;
    const avifSaved = enableAVIF && encoded.avif
      ? await storeFile(adapter, avifKey, encoded.avif.data)
      : null;

    const fallbackSize = Number(encoded.fallback.info?.size) || encoded.fallback.data.length;
    const outputWidth = Number(encoded.fallback.info?.width) || 0;
    const outputHeight = Number(encoded.fallback.info?.height) || 0;

    generatedSizes[name] = {
      width: outputWidth,
      height: outputHeight,
      size: fallbackSize,
      jpgUrl: fallbackSaved.url,
      webpUrl: webpSaved?.url || "",
      avifUrl: avifSaved?.url || "",
    };

    const candidates = [fallbackSize];
    if (webpSaved && encoded.webp) {
      candidates.push(Number(encoded.webp.info?.size) || encoded.webp.data.length);
    }
    if (avifSaved && encoded.avif) {
      candidates.push(Number(encoded.avif.info?.size) || encoded.avif.data.length);
    }
    const localBest = Math.min(...candidates.filter((x) => Number.isFinite(x) && x > 0));

    if (name === "desktop") {
      bestUrl = fallbackSaved.url;
      bestWebp = webpSaved?.url || "";
      bestAvif = avifSaved?.url || "";
    }

    if (localBest > 0 && localBest < bestSize) bestSize = localBest;
  }

  return {
    ...baseResult,
    width,
    height,
    url: bestUrl,
    webpUrl: bestWebp,
    avifUrl: bestAvif,
    optimizedSize: bestSize,
    savingsPercentage: calculateSavingsPercentage(buffer.length, bestSize),
    generatedSizes,
  };
}

async function optimizeExistingMediaFromDisk({
  media,
  settings,
  storageProvider = "local",
}) {
  if (!media || !media._id) throw new Error("Media document required");
  const adapter = getStorageAdapter(storageProvider);
  const originalKey =
    media.storageKey ||
    String(media.originalUrl || media.url || "").replace(/^\/+/, "");
  if (!originalKey) throw new Error("Media has no source file key/url");

  const localAdapter = getStorageAdapter("local");
  const absolute = localAdapter.toAbsolutePath
    ? localAdapter.toAbsolutePath(originalKey)
    : null;
  if (!absolute) throw new Error("Cannot resolve source file path for optimization");
  const buffer = await readFile(absolute);

  return optimizeAndStoreUpload({
    buffer,
    mimeType: media.mimeType,
    originalName: media.originalName || media.fileName || media.filename,
    mediaId: String(media._id),
    settings,
    storageProvider: adapter === localAdapter ? "local" : storageProvider,
  });
}

module.exports = {
  isImageMimeType,
  resolveInputExt,
  optimizeAndStoreUpload,
  optimizeExistingMediaFromDisk,
};
