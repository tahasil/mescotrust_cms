const path = require("path");
const { readFile } = require("fs/promises");
const { getStorageAdapter } = require("../storage");
const { IMAGE_MIME_TO_EXT, IMAGE_UPLOAD_MIME_TYPES } = require("./constants");
const { getEffectiveQuality } = require("./settings");
const { calculateSavingsPercentage } = require("./variants");
const {
  normalizeCropForSource,
  validateTargetDimensionsAgainstSource,
} = require("./cropContract");

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
  const normalized = String(ext || "").trim().toLowerCase();
  if (!normalized) return "";
  return normalized.startsWith(".") ? normalized : `.${normalized}`;
}

function normalizeRotationDegrees(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  const wrapped = ((numeric % 360) + 360) % 360;
  return Number(wrapped.toFixed(3));
}

function getRotatedSourceDimensions({ width, height, rotationDegrees }) {
  const angle = (normalizeRotationDegrees(rotationDegrees) * Math.PI) / 180;
  const rotatedWidth =
    Math.abs(Math.cos(angle) * width) + Math.abs(Math.sin(angle) * height);
  const rotatedHeight =
    Math.abs(Math.sin(angle) * width) + Math.abs(Math.cos(angle) * height);
  return {
    width: Math.max(1, Math.ceil(rotatedWidth)),
    height: Math.max(1, Math.ceil(rotatedHeight)),
  };
}

function clampQuality(value, fallback = 75) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(40, Math.min(100, Math.round(parsed)));
}

function buildQualityCandidates(baseQuality) {
  const start = clampQuality(baseQuality);
  const values = [start];
  for (let next = start - 5; next >= 40; next -= 5) {
    values.push(next);
  }
  return Array.from(new Set(values));
}

function resolveInputExt({ originalName, mimeType }) {
  const fromMime = IMAGE_MIME_TO_EXT[String(mimeType || "").toLowerCase()] || "";
  if (fromMime) return fromMime;
  return normalizeExt(path.extname(String(originalName || ""))) || ".bin";
}

async function storeFile(adapter, key, buffer) {
  return adapter.saveBuffer({ storageKey: key, buffer });
}

async function encodeJpg({ sharp, inputBuffer, quality }) {
  return sharp(inputBuffer, { failOn: "none" })
    .flatten({ background: "#ffffff" })
    .jpeg({
      quality,
      mozjpeg: true,
      chromaSubsampling: "4:2:0",
    })
    .toBuffer({ resolveWithObject: true });
}

async function encodePng({ sharp, inputBuffer, quality, compressionMode }) {
  const usePalette = compressionMode !== "lossless";
  return sharp(inputBuffer, { failOn: "none" })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: usePalette,
      quality: usePalette ? clampQuality(quality, 80) : undefined,
      effort: usePalette ? 10 : undefined,
    })
    .toBuffer({ resolveWithObject: true });
}

async function encodeWebp({ sharp, inputBuffer, quality, compressionMode, webpEffort }) {
  return sharp(inputBuffer, { failOn: "none" })
    .webp({
      quality,
      effort: webpEffort,
      lossless: compressionMode === "lossless",
    })
    .toBuffer({ resolveWithObject: true });
}

async function encodeAvif({ sharp, inputBuffer, quality, compressionMode, avifEffort }) {
  return sharp(inputBuffer, { failOn: "none" })
    .avif({
      quality,
      effort: avifEffort,
      lossless: compressionMode === "lossless",
    })
    .toBuffer({ resolveWithObject: true });
}

function isLossyOriginalFormat(ext, mimeType) {
  const normalizedExt = normalizeExt(ext);
  const normalizedMime = String(mimeType || "").toLowerCase();
  return (
    normalizedExt === ".jpg" ||
    normalizedExt === ".jpeg" ||
    normalizedExt === ".webp" ||
    normalizedExt === ".avif" ||
    normalizedMime === "image/jpeg" ||
    normalizedMime === "image/jpg" ||
    normalizedMime === "image/webp" ||
    normalizedMime === "image/avif"
  );
}

async function encodeOriginalByFormat({
  sharp,
  inputBuffer,
  ext,
  mimeType,
  quality,
  compressionMode,
  webpEffort,
  avifEffort,
}) {
  const normalizedExt = normalizeExt(ext);
  const normalizedMime = String(mimeType || "").toLowerCase();

  if (
    normalizedExt === ".jpg" ||
    normalizedExt === ".jpeg" ||
    normalizedMime === "image/jpeg" ||
    normalizedMime === "image/jpg"
  ) {
    return encodeJpg({ sharp, inputBuffer, quality });
  }

  if (normalizedExt === ".png" || normalizedMime === "image/png") {
    return encodePng({ sharp, inputBuffer, quality, compressionMode });
  }

  if (normalizedExt === ".webp" || normalizedMime === "image/webp") {
    return encodeWebp({
      sharp,
      inputBuffer,
      quality,
      compressionMode,
      webpEffort,
    });
  }

  if (normalizedExt === ".avif" || normalizedMime === "image/avif") {
    return encodeAvif({
      sharp,
      inputBuffer,
      quality,
      compressionMode,
      avifEffort,
    });
  }

  return {
    data: inputBuffer,
    info: {
      size: inputBuffer.length,
    },
  };
}

async function encodeOriginalWithAdaptiveQuality({
  sharp,
  inputBuffer,
  ext,
  mimeType,
  quality,
  compressionMode,
  webpEffort,
  avifEffort,
  maxBytes = null,
}) {
  const qualityCandidates = buildQualityCandidates(quality);
  const canAdapt =
    Number.isFinite(maxBytes) &&
    maxBytes > 0 &&
    isLossyOriginalFormat(ext, mimeType);
  let best = null;

  for (const nextQuality of qualityCandidates) {
    const encoded = await encodeOriginalByFormat({
      sharp,
      inputBuffer,
      ext,
      mimeType,
      quality: nextQuality,
      compressionMode,
      webpEffort,
      avifEffort,
    });
    const encodedSize = Number(encoded.info?.size) || encoded.data.length;
    if (!best || encodedSize < best.size) {
      best = {
        size: encodedSize,
        encoded,
      };
    }
    if (!canAdapt) {
      break;
    }
    if (encodedSize <= maxBytes) {
      return encoded;
    }
  }

  return best?.encoded ||
    encodeOriginalByFormat({
      sharp,
      inputBuffer,
      ext,
      mimeType,
      quality,
      compressionMode,
      webpEffort,
      avifEffort,
    });
}

async function optimizeAndStoreUpload({
  buffer,
  mimeType,
  originalName,
  mediaId,
  settings,
  storageProvider = "local",
  crop = null,
  targetWidth = null,
  targetHeight = null,
  rotation = 0,
}) {
  const adapter = getStorageAdapter(storageProvider);
  const ext = resolveInputExt({ originalName, mimeType });
  const isImage = isImageMimeType(mimeType);
  const now = Date.now();

  if (!isImage) {
    const originalKey = adapter.createMediaStorageKey({
      mediaId,
      kind: "original",
      ext,
    });
    const originalStored = await storeFile(adapter, originalKey, buffer);
    return {
      storageProvider,
      storageKey: originalStored.storageKey,
      fileName: path.basename(originalStored.storageKey),
      filename: path.basename(originalStored.storageKey),
      originalName,
      mimeType,
      ext,
      url: originalStored.url,
      originalUrl: originalStored.url,
      publicUrl: `/media/${mediaId}?size=original&format=auto`,
      size: buffer.length,
      originalSize: buffer.length,
      optimizedSize: buffer.length,
      savingsPercentage: 0,
      webpUrl: "",
      avifUrl: "",
      width: 0,
      height: 0,
      originalWidth: 0,
      originalHeight: 0,
      cropX: 0,
      cropY: 0,
      cropWidth: 0,
      cropHeight: 0,
      finalWidth: 0,
      finalHeight: 0,
      status: "ready",
      generatedSizes: {},
      processedAt: now,
    };
  }

  const sharp = getSharpOrNull();
  if (!sharp) {
    throw new Error("Sharp dependency is required for raster image processing.");
  }

  const sourceMetadata = await sharp(buffer, { failOn: "none" }).metadata();
  const sourceWidth = Number(sourceMetadata.width) || 0;
  const sourceHeight = Number(sourceMetadata.height) || 0;
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error("Unable to determine source image dimensions.");
  }
  const rotationDegrees = normalizeRotationDegrees(rotation);
  const rotatedSource = getRotatedSourceDimensions({
    width: sourceWidth,
    height: sourceHeight,
    rotationDegrees,
  });

  const normalizedCrop =
    normalizeCropForSource({
      crop,
      sourceWidth: rotatedSource.width,
      sourceHeight: rotatedSource.height,
    }) || {
      left: 0,
      top: 0,
      width: rotatedSource.width,
      height: rotatedSource.height,
    };
  validateTargetDimensionsAgainstSource({
    targetWidth,
    targetHeight,
    sourceWidth: rotatedSource.width,
    sourceHeight: rotatedSource.height,
    cropWidth: normalizedCrop.width,
    cropHeight: normalizedCrop.height,
  });

  let transformPipeline = sharp(buffer, { failOn: "none" }).rotate();
  if (rotationDegrees !== 0) {
    transformPipeline = transformPipeline.rotate(rotationDegrees);
  }
  transformPipeline = transformPipeline.extract({
    left: normalizedCrop.left,
    top: normalizedCrop.top,
    width: normalizedCrop.width,
    height: normalizedCrop.height,
  });

  if (Number.isInteger(targetWidth) && Number.isInteger(targetHeight)) {
    transformPipeline = transformPipeline.resize({
      width: targetWidth,
      height: targetHeight,
      fit: "fill",
    });
  }

  const transformedOriginal = await transformPipeline.toBuffer({
    resolveWithObject: true,
  });
  const transformedBuffer = transformedOriginal.data;
  const finalWidth = Number(transformedOriginal.info?.width) || 0;
  const finalHeight = Number(transformedOriginal.info?.height) || 0;

  const quality = getEffectiveQuality(settings);
  const compressionMode = String(settings?.compressionMode || "glossy");
  const webpEffort = Number(settings?.webpEffort ?? 4);
  const avifEffort = Number(settings?.avifEffort ?? 4);
  const enableWebP = Boolean(settings?.enableWebP);
  const enableAVIF = Boolean(settings?.enableAVIF);
  const isOriginalJpg = ext === ".jpg" || ext === ".jpeg";
  const shouldEnforceNotLargerThanSource = Boolean(crop);
  const maxOriginalBytes = shouldEnforceNotLargerThanSource ? buffer.length : null;

  const encodedOriginal = await encodeOriginalWithAdaptiveQuality({
    sharp,
    inputBuffer: transformedBuffer,
    ext,
    mimeType,
    quality,
    compressionMode,
    webpEffort,
    avifEffort,
    maxBytes: maxOriginalBytes,
  });
  const originalBinarySize =
    Number(encodedOriginal.info?.size) || encodedOriginal.data.length;

  const originalKey = adapter.createMediaStorageKey({
    mediaId,
    kind: "original",
    ext,
  });
  const originalStored = await storeFile(adapter, originalKey, encodedOriginal.data);

  let jpgUrl = originalStored.url;
  let jpgSize = originalBinarySize;
  if (!isOriginalJpg) {
    const encodedJpg = await encodeJpg({
      sharp,
      inputBuffer: transformedBuffer,
      quality,
    });
    const jpgKey = adapter.createMediaStorageKey({
      mediaId,
      kind: "original-jpg",
      ext: ".jpg",
    });
    const savedJpg = await storeFile(adapter, jpgKey, encodedJpg.data);
    jpgUrl = savedJpg.url;
    jpgSize = Number(encodedJpg.info?.size) || encodedJpg.data.length;
  }

  let webpUrl = "";
  let webpSize = 0;
  if (enableWebP) {
    const encodedWebp = await encodeWebp({
      sharp,
      inputBuffer: transformedBuffer,
      quality,
      compressionMode,
      webpEffort,
    });
    const webpKey = adapter.createMediaStorageKey({
      mediaId,
      kind: "original-webp",
      ext: ".webp",
    });
    const savedWebp = await storeFile(adapter, webpKey, encodedWebp.data);
    webpUrl = savedWebp.url;
    webpSize = Number(encodedWebp.info?.size) || encodedWebp.data.length;
  }

  let avifUrl = "";
  let avifSize = 0;
  if (enableAVIF) {
    const encodedAvif = await encodeAvif({
      sharp,
      inputBuffer: transformedBuffer,
      quality,
      compressionMode,
      avifEffort,
    });
    const avifKey = adapter.createMediaStorageKey({
      mediaId,
      kind: "original-avif",
      ext: ".avif",
    });
    const savedAvif = await storeFile(adapter, avifKey, encodedAvif.data);
    avifUrl = savedAvif.url;
    avifSize = Number(encodedAvif.info?.size) || encodedAvif.data.length;
  }

  const sizeCandidates = [
    originalBinarySize,
    jpgSize,
    webpSize,
    avifSize,
  ].filter((value) => Number.isFinite(value) && value > 0);
  const bestSize = sizeCandidates.length
    ? Math.min(...sizeCandidates)
    : originalBinarySize;

  return {
    storageProvider,
    storageKey: originalStored.storageKey,
    fileName: path.basename(originalStored.storageKey),
    filename: path.basename(originalStored.storageKey),
    originalName,
    mimeType,
    ext,
    url: originalStored.url,
    originalUrl: originalStored.url,
    publicUrl: `/media/${mediaId}?size=original&format=auto`,
    size: originalBinarySize,
    originalSize: buffer.length,
    optimizedSize: bestSize,
    savingsPercentage: calculateSavingsPercentage(buffer.length, bestSize),
    webpUrl,
    avifUrl,
    width: finalWidth,
    height: finalHeight,
    originalWidth: sourceWidth,
    originalHeight: sourceHeight,
    cropX: normalizedCrop.left,
    cropY: normalizedCrop.top,
    cropWidth: normalizedCrop.width,
    cropHeight: normalizedCrop.height,
    finalWidth,
    finalHeight,
    status: "ready",
    generatedSizes: {
      original: {
        width: finalWidth,
        height: finalHeight,
        size: originalBinarySize,
        jpgUrl,
        webpUrl,
        avifUrl,
      },
    },
    processedAt: now,
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
