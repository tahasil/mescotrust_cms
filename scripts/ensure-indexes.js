/* eslint-disable no-console */
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");

const mongoose = require("mongoose");

// Load every model so its schema-level indexes are registered with mongoose.
// MESCO model set (incl. RBAC models + MESCO-only Donation/EventRegistration).
// Models from later TSUV→MESCO phases (Form, Popup, Portfolio, PortfolioCategory,
// Slider, Team, TeamCategory) are intentionally omitted — add them here as each
// phase lands. (syncAllIndexes also gracefully skips any model file that is
// missing, so a stale entry only logs a warning.)
const MODEL_FILES = [
  "AdminRole",
  "AppearanceColorConfig",
  "Blog",
  "BlogCategory",
  "BlogComment",
  "Component",
  "ContactSubmission",
  "Donation",
  "Event",
  "EventRegistration",
  "Form",
  "Media",
  "MediaJob",
  "MediaSettings",
  "Menu",
  "Page",
  "Permission",
  "PermissionAuditLog",
  "Portfolio",
  "PortfolioCategory",
  "RolePermission",
  "SiteComponentMeta",
  "Slider",
  "Subscriber",
  "Team",
  "TeamCategory",
  "ThemeConfig",
  "User",
];

/**
 * Create schema-declared indexes for every model. Assumes a mongoose
 * connection is already open (or will be opened via lib/db). Never
 * disconnects so it's safe to invoke from a long-running server process.
 *
 * Uses Model.createIndexes() (additive — never drops existing indexes) so
 * manual indexes added via Atlas or mongosh are preserved. Pass
 * `{ drop: true }` to use Model.syncIndexes() (destructive — drops any
 * index not declared in the model schema). Recommended only for migration
 * scripts where you know what you're doing.
 */
async function syncAllIndexes({ drop = false } = {}) {
  for (const name of MODEL_FILES) {
    let Model;
    try {
      Model = require(path.join(projectRoot, "models", name));
    } catch (err) {
      console.warn(`[ensure-indexes] could not load model ${name}: ${err.message}`);
      continue;
    }
    if (!Model) continue;
    const fn = drop ? Model.syncIndexes : Model.createIndexes;
    if (typeof fn !== "function") continue;
    try {
      const result = await fn.call(Model);
      const summary = Array.isArray(result) && result.length === 0 ? "(no changes)" : result || "ok";
      console.log(`[ensure-indexes] ${name}:`, summary);
    } catch (err) {
      console.error(`[ensure-indexes] ${name} failed: ${err.message}`);
    }
  }
}

async function runStandalone() {
  require("dotenv").config({ path: path.join(projectRoot, ".env.local") });
  require("dotenv").config({ path: path.join(projectRoot, ".env") });
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in .env.local or .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  await syncAllIndexes();
  await mongoose.disconnect();
  console.log("[ensure-indexes] done");
}

if (require.main === module) {
  runStandalone().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { syncAllIndexes };
