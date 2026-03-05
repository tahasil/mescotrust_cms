/**
 * Test: Update Subscribe fields in DB and verify. Same logic as API PUT.
 * Run: node scripts/test-subscribe-db-update.js
 */
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env.local") });
require("dotenv").config({ path: path.join(projectRoot, ".env") });

const mongoose = require("mongoose");

const THEME_QUERY = { $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }] };
const SUBSCRIBE_KEYS = ["subscribeSubtitle", "subscribeTitle", "subscribePlaceholder", "subscribeButtonText", "subscribeBgUrl"];

async function test() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  const ThemeConfig = require(path.join(projectRoot, "models", "ThemeConfig"));

  const testValue = "TEST_" + Date.now();
  const subscribeWrite = {
    subscribeSubtitle: testValue,
    subscribeTitle: "DB update test",
    subscribePlaceholder: "test placeholder",
    subscribeButtonText: "Test",
    subscribeBgUrl: "/images/test.png",
    updatedAt: new Date(),
  };

  const before = await ThemeConfig.findOne(THEME_QUERY).sort({ updatedAt: -1 }).lean();
  console.log("Before — theme found:", !!before, "subscribeSubtitle:", before?.subscribeSubtitle);

  const updated = await ThemeConfig.findOneAndUpdate(
    THEME_QUERY,
    { $set: subscribeWrite },
    { sort: { updatedAt: -1 }, new: true }
  );

  if (!updated) {
    console.error("findOneAndUpdate returned null — no document matched THEME_QUERY");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log("After update — subscribeSubtitle:", updated.subscribeSubtitle);
  if (updated.subscribeSubtitle !== testValue) {
    console.error("FAIL: Value not updated in returned doc");
    process.exit(1);
  }

  const verify = await ThemeConfig.findOne(THEME_QUERY).sort({ updatedAt: -1 }).lean();
  console.log("Verify (fresh read) — subscribeSubtitle:", verify?.subscribeSubtitle);
  if (verify?.subscribeSubtitle !== testValue) {
    console.error("FAIL: Value not persisted in DB");
    process.exit(1);
  }

  console.log("OK: Subscribe fields updated and verified in DB.");
  await mongoose.disconnect();
  process.exit(0);
}

test().catch((err) => {
  console.error(err);
  process.exit(1);
});
