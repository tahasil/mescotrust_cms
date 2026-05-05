const { mkdir, writeFile, unlink } = require("fs/promises");
const fs = require("fs");
const path = require("path");

function normalizeStorageKey(storageKey) {
  return String(storageKey || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
}

let cachedPublicRoot = "";

function getRuntimeEntryFile() {
  const argvEntry = process?.argv?.[1] ? path.resolve(process.argv[1]) : "";
  if (argvEntry) return argvEntry;
  return require?.main?.filename ? path.resolve(require.main.filename) : "";
}

function resolvePublicRoot() {
  if (cachedPublicRoot) return cachedPublicRoot;

  const explicit = String(process.env.MEDIA_PUBLIC_DIR || "").trim();
  if (explicit) {
    cachedPublicRoot = path.resolve(explicit);
    return cachedPublicRoot;
  }

  const runtimeEntry = getRuntimeEntryFile();
  const runtimeDir = runtimeEntry ? path.dirname(runtimeEntry) : "";

  const candidates = [
    runtimeDir ? path.join(runtimeDir, "public") : "",
    path.join(process.cwd(), "public"),
    path.resolve(__dirname, "../../public"),
    path.resolve(__dirname, "../../../public"),
  ]
    .filter(Boolean)
    .map((p) => path.resolve(p));

  const uniqueCandidates = Array.from(new Set(candidates));
  const existing = uniqueCandidates.find((candidate) => fs.existsSync(candidate));

  cachedPublicRoot = existing || uniqueCandidates[0] || path.join(process.cwd(), "public");
  return cachedPublicRoot;
}

function toAbsolutePath(storageKey) {
  const key = normalizeStorageKey(storageKey);
  return path.join(resolvePublicRoot(), key);
}

function toPublicUrl(storageKey) {
  const key = normalizeStorageKey(storageKey);
  return `/${key}`;
}

async function saveBuffer({ storageKey, buffer }) {
  const key = normalizeStorageKey(storageKey);
  const abs = toAbsolutePath(key);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buffer);
  return {
    storageProvider: "local",
    storageKey: key,
    url: toPublicUrl(key),
    absolutePath: abs,
  };
}

async function deleteFile({ storageKey }) {
  try {
    await unlink(toAbsolutePath(storageKey));
  } catch {
    // no-op if file already missing
  }
}

function createMediaStorageKey({ mediaId, kind = "original", ext = ".bin" }) {
  const safeExt = String(ext || ".bin").startsWith(".")
    ? String(ext || ".bin")
    : `.${String(ext || "bin")}`;
  const date = new Date();
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `uploads/media/${y}/${m}/${mediaId}/${kind}${safeExt}`;
}

module.exports = {
  normalizeStorageKey,
  resolvePublicRoot,
  toAbsolutePath,
  toPublicUrl,
  saveBuffer,
  deleteFile,
  createMediaStorageKey,
};
