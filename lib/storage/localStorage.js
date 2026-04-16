const { mkdir, writeFile, unlink } = require("fs/promises");
const path = require("path");

function normalizeStorageKey(storageKey) {
  return String(storageKey || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
}

function toAbsolutePath(storageKey) {
  const key = normalizeStorageKey(storageKey);
  return path.join(process.cwd(), "public", key);
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
  toAbsolutePath,
  toPublicUrl,
  saveBuffer,
  deleteFile,
  createMediaStorageKey,
};
