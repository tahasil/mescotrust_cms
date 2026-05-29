/**
 * Full MongoDB backup (all collections + indexes) using EJSON.
 *
 * Usage:
 *   node scripts/backup-db-full.js
 *   node scripts/backup-db-full.js --uri "<MONGODB_URI>"
 *   node scripts/backup-db-full.js --out backup/full/my-backup
 */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
// EJSON via mongoose's bundled bson (avoids a direct "bson" dependency).
const { EJSON } = mongoose.mongo.BSON;

const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env.local") });
require("dotenv").config({ path: path.join(projectRoot, ".env") });

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    out[key] = value;
  }
  return out;
}

function maskMongoUri(uri) {
  if (!uri) return "";
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
}

function getDbNameFromUri(uri) {
  try {
    const withoutQuery = uri.split("?")[0];
    const name = withoutQuery.split("/").pop();
    return name || "test";
  } catch {
    return "test";
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function run() {
  const args = parseArgs(process.argv);
  const uri = args.uri || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MongoDB URI. Pass --uri or set MONGODB_URI.");
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const defaultOut = path.join(projectRoot, "backup", "full", timestamp);
  const outDir = path.resolve(projectRoot, args.out || defaultOut);
  ensureDir(outDir);

  console.log("Mongo URI :", maskMongoUri(uri));
  console.log("Output dir:", outDir);

  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db;

  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name).sort();
  const stats = [];

  for (const name of collectionNames) {
    const collection = db.collection(name);
    const docs = await collection.find({}).toArray();
    const indexes = await collection.indexes();

    const docsPath = path.join(outDir, `${name}.ejson`);
    const indexesPath = path.join(outDir, `${name}._indexes.ejson`);

    fs.writeFileSync(docsPath, EJSON.stringify(docs, null, 2), "utf8");
    fs.writeFileSync(indexesPath, EJSON.stringify(indexes, null, 2), "utf8");

    stats.push({
      name,
      count: docs.length,
      indexes: indexes.length,
    });
    console.log(`OK ${name}: ${docs.length} docs, ${indexes.length} indexes`);
  }

  const meta = {
    createdAt: new Date().toISOString(),
    sourceUriMasked: maskMongoUri(uri),
    sourceDbName: getDbNameFromUri(uri),
    collectionCount: collectionNames.length,
    collections: stats,
  };
  const metaPath = path.join(outDir, "_meta.json");
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");

  await conn.close();

  console.log("\nBackup complete.");
  console.log("Meta file:", metaPath);
}

run().catch(async (err) => {
  try {
    await mongoose.disconnect();
  } catch {}
  console.error("Backup failed:", err.message);
  process.exit(1);
});

