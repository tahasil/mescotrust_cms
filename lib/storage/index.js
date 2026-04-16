const local = require("./localStorage");
const s3 = require("./s3Storage");

function getStorageAdapter(provider = "local") {
  const p = String(provider || "local").toLowerCase();
  if (p === "s3") return s3;
  return local;
}

module.exports = { getStorageAdapter };
