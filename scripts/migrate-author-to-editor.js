/**
 * Migration M1 (TSUV → MESCO RBAC port, Phase 1).
 *
 * Decision 6.1: the "Author" role is dropped. Existing users with role/roleKey
 * "Author" are remapped to Editor. Idempotent — safe to re-run.
 *
 * Run AFTER taking a backup (`npm run backup-db` / mongodump) and BEFORE the
 * RBAC bootstrap (M2) enforces the new catalog.
 *
 * Usage: node scripts/migrate-author-to-editor.js [--dry-run]
 */
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env.local") });
require("dotenv").config({ path: path.join(projectRoot, ".env") });

const mongoose = require("mongoose");

const DRY_RUN = process.argv.includes("--dry-run");

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in .env.local or .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const users = mongoose.connection.db.collection("users");

  const filter = {
    $or: [{ role: { $regex: /^author$/i } }, { roleKey: "author" }],
  };

  const affected = await users.find(filter).project({ email: 1, role: 1, roleKey: 1 }).toArray();
  console.log(`Found ${affected.length} Author user(s):`);
  affected.forEach((u) => console.log(`  - ${u.email} (role=${u.role}, roleKey=${u.roleKey || "—"})`));

  if (affected.length === 0) {
    console.log("Nothing to migrate. ✔");
  } else if (DRY_RUN) {
    console.log("\n[dry-run] No changes written. Re-run without --dry-run to apply.");
  } else {
    const result = await users.updateMany(filter, {
      $set: { role: "Editor", roleKey: "editor", userType: "editor" },
    });
    console.log(`\nUpdated ${result.modifiedCount} user(s) → Editor. ✔`);
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Migration failed:", err.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
