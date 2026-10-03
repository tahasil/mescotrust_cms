/**
 * Strips the removed donation gateway identifiers from every existing
 * donate_now_submissions document.
 *
 * Removed fields (schema was changed in models/DonateNowSubmission.js):
 *   - purposeId                      (Purpose ID)
 *   - purposeRuleSnapshot.purpose.id (Purpose ID, nested copy)
 *   - payment.trackingId             (Tracking ID)
 *   - payment.paymentId              (Payment ID)
 *   - payment.orderStatus            (Gateway Status)
 *   - payment.verificationStatus     (Verification Status)
 *
 * payment.transactionId is intentionally KEPT — it still carries the gateway
 * reference used for reconciliation, and for CCAvenue it falls back to the
 * tracking id when the gateway sends no transaction_id.
 *
 * Usage:
 *   node scripts/migrate-strip-donation-gateway-fields.js            # dry run (default)
 *   node scripts/migrate-strip-donation-gateway-fields.js --apply     # perform the $unset
 *
 * Always run `npm run backup-db` first.
 */
require("dotenv").config();
const { MongoClient } = require("mongodb");

const COLLECTION = "donate_now_submissions";

/** Top-level and payment-scoped fields removed from the schema. */
const TOP_LEVEL_UNSET_FIELDS = ["purposeId"];
const PAYMENT_UNSET_FIELDS = [
  "payment.trackingId",
  "payment.paymentId",
  "payment.orderStatus",
  "payment.verificationStatus",
];

/**
 * purposeRuleSnapshot is `type: Object`, so its nested keys are stored verbatim.
 * MongoDB 4.2+ dotted $unset handles nested paths, which is what we rely on
 * here. A document whose purposeRuleSnapshot has no `purpose` key is skipped
 * automatically because $unset on a missing path is a no-op.
 */
const NESTED_UNSET_FIELDS = ["purposeRuleSnapshot.purpose.id"];

function buildUnset() {
  const unset = {};
  for (const field of [...TOP_LEVEL_UNSET_FIELDS, ...PAYMENT_UNSET_FIELDS, ...NESTED_UNSET_FIELDS]) {
    unset[field] = "";
  }
  return unset;
}

function buildMatchFilter(unset) {
  return { $or: Object.keys(unset).map((field) => ({ [field]: { $exists: true } })) };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required");

  const unset = buildUnset();
  const filter = buildMatchFilter(unset);

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const collection = client.db().collection(COLLECTION);
    const totalDocuments = await collection.countDocuments({});
    const affectedDocuments = await collection.countDocuments(filter);

    console.log(`Collection:            ${COLLECTION}`);
    console.log(`Documents in collection: ${totalDocuments}`);
    console.log(`Documents to update:    ${affectedDocuments}`);
    console.log(`Mode:                   ${apply ? "APPLY" : "DRY RUN (no changes)"}`);
    console.log("Fields to $unset:");
    for (const field of Object.keys(unset)) console.log(`  - ${field}`);

    if (!apply) {
      console.log("\nNo changes written. Re-run with --apply to perform the migration.");
      return;
    }

    if (affectedDocuments === 0) {
      console.log("\nNothing to migrate.");
      return;
    }

    const result = await collection.updateMany(filter, { $unset: unset });

    console.log("\nMigration complete.");
    console.log(`  matchedCount:  ${result.matchedCount}`);
    console.log(`  modifiedCount: ${result.modifiedCount}`);

    // Drop the index that existed only for the removed purposeId field.
    try {
      const indexes = await collection.indexes();
      const purposeIdIndex = indexes.find((idx) => idx.key && idx.key.purposeId === 1);
      if (purposeIdIndex?.name) {
        await collection.dropIndex(purposeIdIndex.name);
        console.log(`  dropped index:  ${purposeIdIndex.name}`);
      }
    } catch (indexErr) {
      console.warn(`  index cleanup skipped: ${indexErr.message}`);
    }

    const remaining = await collection.countDocuments(buildMatchFilter(unset));
    if (remaining > 0) {
      console.warn(`\nWARNING: ${remaining} document(s) still contain removed fields.`);
      process.exitCode = 1;
    } else {
      console.log("\nVerified: no removed fields remain in any document.");
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err?.message || err);
  process.exit(1);
});