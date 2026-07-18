/**
 * Identify and restore missing local media files from DB references.
 *
 * Usage:
 *   node scripts/sync-missing-media.js
 *   node scripts/sync-missing-media.js --dry-run
 *   node scripts/sync-missing-media.js --base-url=https://example.com --concurrency=4 --limit=500
 */
const path = require("path");
const fs = require("fs");
const { mkdir, writeFile, rm } = require("fs/promises");

const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env") });

const { connectDB } = require("../lib/db");
const { getSiteUrl } = require("../lib/env");
const { getStorageAdapter } = require("../lib/storage");
const Media = require("../models/Media");
const mongoose = require("mongoose");

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".gif",
  ".svg",
  ".bmp",
  ".tif",
  ".tiff",
]);

function createTimeoutSignal(timeoutMs) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (typeof timer?.unref === "function") timer.unref();
  return controller.signal;
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    baseUrl: "",
    concurrency: 4,
    limit: 0,
    timeoutMs: 20000,
  };

  for (const raw of argv) {
    const arg = String(raw || "").trim();
    if (!arg) continue;
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (arg.startsWith("--base-url=")) {
      args.baseUrl = arg.slice("--base-url=".length).trim();
      continue;
    }
    if (arg.startsWith("--concurrency=")) {
      args.concurrency = Number(arg.slice("--concurrency=".length)) || args.concurrency;
      continue;
    }
    if (arg.startsWith("--limit=")) {
      args.limit = Number(arg.slice("--limit=".length)) || 0;
      continue;
    }
    if (arg.startsWith("--timeout-ms=")) {
      args.timeoutMs = Number(arg.slice("--timeout-ms=".length)) || args.timeoutMs;
      continue;
    }
  }

  args.concurrency = Math.max(1, Math.min(16, Math.floor(args.concurrency)));
  args.timeoutMs = Math.max(3000, Math.min(120000, Math.floor(args.timeoutMs)));
  args.limit = Math.max(0, Math.floor(args.limit));

  return args;
}

function sanitizeBaseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    return parsed.origin;
  } catch {
    return "";
  }
}

function maskMongoUri(uri) {
  const value = String(uri || "");
  if (!value) return "";
  return value.replace(/\/\/([^:/?#]+):([^@/]+)@/, "//$1:***@");
}

function normalizeToPath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const parsed = new URL(raw);
      return `${parsed.pathname}${parsed.search || ""}`;
    } catch {
      return "";
    }
  }
  return raw;
}

function toStorageKey(value) {
  const urlLike = normalizeToPath(value);
  if (!urlLike) return "";
  const pathOnly = urlLike.split("?")[0].trim();
  if (!pathOnly) return "";
  const cleaned = pathOnly.replace(/^\/+/, "");
  if (!cleaned) return "";
  if (cleaned.toLowerCase().startsWith("media/")) return "";
  return cleaned;
}

function fileHasImageExtension(value) {
  const cleaned = String(value || "").split("?")[0];
  const ext = path.extname(cleaned).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

function isPathInsideRoot(rootDir, targetPath) {
  const root = path.resolve(rootDir);
  const target = path.resolve(targetPath);
  if (target === root) return true;
  return target.startsWith(`${root}${path.sep}`);
}

function isImageDocument(media) {
  const mimeType = String(media?.mimeType || "").toLowerCase();
  if (mimeType.startsWith("image/")) return true;

  const fallbackCandidates = [
    media?.storageKey,
    media?.url,
    media?.originalUrl,
    media?.webpUrl,
    media?.avifUrl,
    media?.filename,
    media?.fileName,
  ];
  return fallbackCandidates.some((candidate) => fileHasImageExtension(candidate));
}

function addCandidateUrl(urlSet, sourceValue, baseUrl) {
  const raw = String(sourceValue || "").trim();
  if (!raw) return;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    urlSet.add(raw);
    return;
  }

  if (!baseUrl) return;

  const relative = raw.startsWith("/") ? raw : `/${raw}`;
  try {
    urlSet.add(new URL(relative, baseUrl).toString());
  } catch {
    // Ignore invalid URL composition.
  }
}

function collectFileCandidates(media, baseUrl) {
  const mediaId = String(media?._id || "").trim();
  const map = new Map();
  const seen = new Set();

  const add = (label, value) => {
    const raw = String(value || "").trim();
    if (!raw) return;
    const dedupeKey = `${label}::${raw}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const storageKey = label === "storageKey" ? toStorageKey(raw) || raw.replace(/^\/+/, "") : toStorageKey(raw);
    if (!storageKey) return;
    if (!fileHasImageExtension(storageKey)) return;

    if (!map.has(storageKey)) {
      map.set(storageKey, {
        mediaId,
        storageKey,
        labels: new Set(),
        urls: new Set(),
      });
    }

    const entry = map.get(storageKey);
    entry.labels.add(label);

    addCandidateUrl(entry.urls, raw, baseUrl);
    addCandidateUrl(entry.urls, storageKey, baseUrl);
  };

  add("storageKey", media?.storageKey);
  add("url", media?.url);
  add("originalUrl", media?.originalUrl);
  add("webpUrl", media?.webpUrl);
  add("avifUrl", media?.avifUrl);

  const sizes = media?.generatedSizes || {};
  for (const sizeName of Object.keys(sizes)) {
    const size = sizes[sizeName] || {};
    add(`generatedSizes.${sizeName}.jpgUrl`, size.jpgUrl);
    add(`generatedSizes.${sizeName}.webpUrl`, size.webpUrl);
    add(`generatedSizes.${sizeName}.avifUrl`, size.avifUrl);
  }

  if (mediaId && baseUrl) {
    for (const entry of map.values()) {
      addCandidateUrl(entry.urls, `/api/media/${mediaId}?format=original`, baseUrl);
      addCandidateUrl(entry.urls, `/media/${mediaId}?format=original`, baseUrl);
    }
  }

  return Array.from(map.values()).map((entry) => ({
    mediaId: entry.mediaId,
    storageKey: entry.storageKey,
    labels: Array.from(entry.labels),
    urls: Array.from(entry.urls),
  }));
}

async function pathExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function fetchBuffer(url, timeoutMs) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: createTimeoutSignal(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("text/html") || contentType.includes("application/json")) {
    throw new Error(`Unexpected content-type: ${contentType || "unknown"}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length) {
    throw new Error("Empty response body");
  }
  return bytes;
}

async function downloadMissingFile(task, timeoutMs) {
  const attempted = [];
  let lastError = "No download URLs available";

  for (const url of task.urls) {
    if (!url) continue;
    attempted.push(url);
    try {
      const data = await fetchBuffer(url, timeoutMs);
      await mkdir(path.dirname(task.absolutePath), { recursive: true });
      await writeFile(task.absolutePath, data);
      return { ok: true, sourceUrl: url, bytes: data.length, attempted };
    } catch (err) {
      lastError = err?.message || String(err);
    }
  }

  await rm(task.absolutePath, { force: true }).catch(() => {});
  return { ok: false, attempted, error: lastError };
}

async function runWithConcurrency(items, concurrency, worker) {
  const queue = Array.from(items);
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const next = queue.shift();
      if (!next) return;
      // eslint-disable-next-line no-await-in-loop
      await worker(next);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const startedAt = new Date();
  const args = parseArgs(process.argv.slice(2));
  const envBase = sanitizeBaseUrl(process.env.MEDIA_SYNC_SOURCE_URL || process.env.NEXT_PUBLIC_SITE_URL || getSiteUrl());
  const baseUrl = sanitizeBaseUrl(args.baseUrl || envBase);

  const summary = {
    totalImagesChecked: 0,
    totalFileReferencesChecked: 0,
    missingImagesFound: 0,
    successfullyDownloadedImages: 0,
    failedDownloads: 0,
    alreadyPresentLocally: 0,
    skippedWithoutUsablePath: 0,
  };

  const failures = [];
  const downloaded = [];
  const missingTasks = [];

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in .env");
  }

  if (!baseUrl) {
    throw new Error(
      "Missing source base URL. Set MEDIA_SYNC_SOURCE_URL or NEXT_PUBLIC_SITE_URL/NEXTAUTH_URL, or pass --base-url.",
    );
  }

  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available in this Node runtime.");
  }

  console.log("Media sync started");
  console.log("MongoDB:", maskMongoUri(mongoUri));
  console.log("Source base URL:", baseUrl);
  console.log("Dry run:", args.dryRun ? "yes" : "no");
  console.log("Concurrency:", args.concurrency);
  if (args.limit > 0) {
    console.log("Record limit:", args.limit);
  }
  console.log("");

  await connectDB();
  const localAdapter = getStorageAdapter("local");
  if (typeof localAdapter?.toAbsolutePath !== "function") {
    throw new Error("Local storage adapter is missing toAbsolutePath()");
  }
  const publicRoot = typeof localAdapter.resolvePublicRoot === "function"
    ? localAdapter.resolvePublicRoot()
    : path.join(projectRoot, "public");

  const query = Media.find({}).sort({ _id: 1 }).lean();
  if (args.limit > 0) query.limit(args.limit);
  const cursor = query.cursor();

  for await (const media of cursor) {
    if (!isImageDocument(media)) continue;
    summary.totalImagesChecked += 1;

    const candidates = collectFileCandidates(media, baseUrl);
    if (!candidates.length) {
      summary.skippedWithoutUsablePath += 1;
      continue;
    }

    for (const candidate of candidates) {
      summary.totalFileReferencesChecked += 1;
      const absolutePath = localAdapter.toAbsolutePath(candidate.storageKey);
      if (!isPathInsideRoot(publicRoot, absolutePath)) {
        summary.skippedWithoutUsablePath += 1;
        failures.push({
          mediaId: candidate.mediaId,
          storageKey: candidate.storageKey,
          absolutePath,
          error: "Resolved path is outside public root",
          attemptedUrls: [],
        });
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const exists = await pathExists(absolutePath);
      if (exists) {
        summary.alreadyPresentLocally += 1;
        continue;
      }

      summary.missingImagesFound += 1;
      missingTasks.push({
        ...candidate,
        absolutePath,
      });
    }
  }

  if (!args.dryRun && missingTasks.length > 0) {
    await runWithConcurrency(missingTasks, args.concurrency, async (task) => {
      const result = await downloadMissingFile(task, args.timeoutMs);
      if (result.ok) {
        summary.successfullyDownloadedImages += 1;
        downloaded.push({
          mediaId: task.mediaId,
          storageKey: task.storageKey,
          absolutePath: task.absolutePath,
          sourceUrl: result.sourceUrl,
          bytes: result.bytes,
        });
      } else {
        summary.failedDownloads += 1;
        failures.push({
          mediaId: task.mediaId,
          storageKey: task.storageKey,
          absolutePath: task.absolutePath,
          error: result.error,
          attemptedUrls: result.attempted,
        });
      }
    });
  } else if (args.dryRun) {
    summary.failedDownloads = 0;
    summary.successfullyDownloadedImages = 0;
  }

  const finishedAt = new Date();
  const report = {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    dryRun: args.dryRun,
    sourceBaseUrl: baseUrl,
    mongoUriMasked: maskMongoUri(mongoUri),
    summary,
    missing: missingTasks.map((task) => ({
      mediaId: task.mediaId,
      storageKey: task.storageKey,
      absolutePath: task.absolutePath,
      candidateUrls: task.urls,
      labels: task.labels,
    })),
    downloaded,
    failures,
  };

  const reportDir = path.join(projectRoot, "backup", "media-sync-reports");
  await mkdir(reportDir, { recursive: true });
  const reportName = `media-sync-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const reportPath = path.join(reportDir, reportName);
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("Summary report");
  console.log("- Total images checked:", summary.totalImagesChecked);
  console.log("- Missing images found:", summary.missingImagesFound);
  console.log(
    "- Successfully downloaded images:",
    args.dryRun ? "0 (dry-run)" : summary.successfullyDownloadedImages,
  );
  console.log("- Failed downloads:", args.dryRun ? "0 (dry-run)" : summary.failedDownloads);
  console.log("- Report file:", reportPath);

  if (!args.dryRun && failures.length > 0) {
    console.log("\nFailed downloads (first 20)");
    failures.slice(0, 20).forEach((failure, index) => {
      console.log(
        `${index + 1}. mediaId=${failure.mediaId} key=${failure.storageKey} error=${failure.error}`,
      );
    });
  }
}

main()
  .catch((err) => {
    console.error("Media sync failed:", err?.stack || err?.message || String(err));
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }
  });
