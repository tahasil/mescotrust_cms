/**
 * Backup MongoDB collections to JSON files.
 * Run: node scripts/backup-db.js
 * Output: backup/YYYY-MM-DD_HH-mm-ss/*.json
 */
const path = require("path");
const fs = require("fs");

const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env.local") });
require("dotenv").config({ path: path.join(projectRoot, ".env") });

const mongoose = require("mongoose");

const BACKUP_DIR = path.join(projectRoot, "backup");
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const OUT_DIR = path.join(BACKUP_DIR, TIMESTAMP);

const COLLECTIONS = [
  { name: "users", model: "User" },
  { name: "themeconfigs", model: "ThemeConfig" },
  { name: "menus", model: "Menu" },
  { name: "pages", model: "Page" },
  { name: "components", model: "Component" },
  { name: "sitecomponentmetas", model: "SiteComponentMeta" },
];

async function backup() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await mongoose.connect(MONGODB_URI);

  for (const { name, model } of COLLECTIONS) {
    try {
      const Model = require(path.join(projectRoot, "models", model + ".js"));
      const docs = await Model.find({}).lean();
      const filePath = path.join(OUT_DIR, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), "utf8");
      console.log(`OK ${name}: ${docs.length} documents → ${filePath}`);
    } catch (err) {
      console.error(`FAIL ${name}:`, err.message);
    }
  }

  const metaPath = path.join(OUT_DIR, "_backup_meta.json");
  fs.writeFileSync(
    metaPath,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      collections: COLLECTIONS.map((c) => c.name),
    }),
    "utf8"
  );
  console.log("Backup meta →", metaPath);

  await mongoose.disconnect();
  console.log("\nBackup done:", OUT_DIR);
  process.exit(0);
}

backup().catch((err) => {
  console.error(err);
  process.exit(1);
});
