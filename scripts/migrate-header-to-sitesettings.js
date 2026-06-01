/**
 * M5 — Seed sitesettings with the Header's current effective theme values.
 *
 * Before the Appearance cutover, lib/layoutData.js let the Header `Component`
 * OVERRIDE sitesettings for the keys in HEADER_COMPONENT_OVERRIDE_KEYS, so the live
 * header rendered from the Component while sitesettings held stale/divergent values.
 * To make Appearance (sitesettings) authoritative WITHOUT changing the render, we
 * copy the Header Component's value for each of those override keys into the
 * sitesettings doc. After this runs, sitesettings == the current rendered header, so
 * flipping layoutData to read header theme fields from sitesettings is render-neutral.
 *
 * Idempotent. Run: node scripts/migrate-header-to-sitesettings.js   (reads MONGODB_URI)
 */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

function readOverrideKeys() {
  const src = fs.readFileSync(
    path.join(__dirname, "..", "lib", "layoutData.js"),
    "utf8",
  );
  const m = src.match(
    /HEADER_COMPONENT_OVERRIDE_KEYS\s*=\s*new Set\(\[([\s\S]*?)\]\)/,
  );
  if (!m) throw new Error("Could not locate HEADER_COMPONENT_OVERRIDE_KEYS");
  return m[1]
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");
  const overrideKeys = readOverrideKeys();
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const header = await db
    .collection("components")
    .findOne({ baseComponent: "Header" });
  if (!header || !header.defaultProps) {
    console.log("No Header component / defaultProps — nothing to seed.");
    await mongoose.disconnect();
    return;
  }
  const hp = header.defaultProps;

  const ss = await db.collection("sitesettings").findOne({});
  if (!ss) throw new Error("No sitesettings doc found");

  const set = {};
  const changes = [];
  for (const key of overrideKeys) {
    if (!(key in hp)) continue; // only seed keys the component actually contributes
    const newVal = hp[key];
    const oldVal = ss[key];
    set[key] = newVal;
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push(
        `${key}: ${JSON.stringify(oldVal)?.slice(0, 30)} -> ${JSON.stringify(newVal)?.slice(0, 30)}`,
      );
    }
  }

  await db
    .collection("sitesettings")
    .updateOne({ _id: ss._id }, { $set: set });

  console.log(
    `Seeded ${Object.keys(set).length} header override keys into sitesettings (${changes.length} changed value):`,
  );
  changes.forEach((c) => console.log("  " + c));
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
