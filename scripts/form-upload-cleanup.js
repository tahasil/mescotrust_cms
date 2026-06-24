const path = require("path");
const fs = require("fs/promises");
const mongoose = require("mongoose");

const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env.local") });
require("dotenv").config({ path: path.join(projectRoot, ".env") });

const SubmissionFile = require("../models/SubmissionFile");

const PENDING_FILE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const PUBLIC_ROOT = path.resolve(projectRoot, "public");

function parseArgs(argv) {
  const args = new Set(argv || []);
  return {
    dryRun: args.has("--dry-run") || args.has("-d"),
  };
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

async function removeStoragePath(storagePath) {
  const raw = normalizeText(storagePath).replace(/\\/g, "/");
  if (!raw) return;

  const resolvedPath = path.resolve(
    path.isAbsolute(raw) ? raw : path.join(PUBLIC_ROOT, raw),
  );
  if (!resolvedPath.startsWith(PUBLIC_ROOT)) {
    throw new Error(`Refused to delete path outside public root: ${raw}`);
  }

  try {
    await fs.unlink(resolvedPath);
  } catch (err) {
    if (err?.code !== "ENOENT") {
      throw err;
    }
  }
}

async function run() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in .env.local or .env");
  }

  await mongoose.connect(uri);

  const cutoff = new Date(Date.now() - PENDING_FILE_MAX_AGE_MS);
  const pending = await SubmissionFile.find(
    {
      status: "pending",
      createdAt: { $lt: cutoff },
    },
    { _id: 1, storagePath: 1 },
  ).lean();

  let deletedFiles = 0;
  let deletedDocs = 0;
  let failures = 0;

  for (const file of pending) {
    try {
      if (dryRun) continue;
      await removeStoragePath(file.storagePath);
      await SubmissionFile.deleteOne({ _id: file._id, status: "pending" });
      deletedFiles += 1;
      deletedDocs += 1;
    } catch (err) {
      failures += 1;
      console.error(`[form-upload-cleanup] failed for ${String(file._id)}: ${err.message}`);
    }
  }

  console.log("[form-upload-cleanup] mode:", dryRun ? "dry-run" : "live");
  console.log("[form-upload-cleanup] cutoff:", cutoff.toISOString());
  console.log("[form-upload-cleanup] candidates:", pending.length);
  console.log("[form-upload-cleanup] deletedFiles:", deletedFiles);
  console.log("[form-upload-cleanup] deletedDocs:", deletedDocs);
  console.log("[form-upload-cleanup] failures:", failures);

  if (failures > 0) {
    process.exitCode = 1;
  }
}

run()
  .catch((err) => {
    console.error("[form-upload-cleanup] fatal:", err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // noop
    }
  });
