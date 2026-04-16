function notImplemented(name) {
  const err = new Error(
    `S3 storage adapter method "${name}" is not implemented in this phase.`,
  );
  err.code = "S3_NOT_IMPLEMENTED";
  throw err;
}

async function saveBuffer() {
  return notImplemented("saveBuffer");
}

async function deleteFile() {
  return notImplemented("deleteFile");
}

function createMediaStorageKey({ mediaId, kind = "original", ext = ".bin" }) {
  const safeExt = String(ext || ".bin").startsWith(".")
    ? String(ext || ".bin")
    : `.${String(ext || "bin")}`;
  return `media/${mediaId}/${kind}${safeExt}`;
}

module.exports = {
  saveBuffer,
  deleteFile,
  createMediaStorageKey,
};
