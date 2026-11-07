/**
 * Renames the CTA Banner primary button from "Donate Now" to "Become a Donor"
 * on every page and in the CTABanner component defaults. Links are untouched,
 * and so are custom labels such as "Sponsor a Family".
 *
 * Preview, read-only: node scripts/update-cta-banner-donate-label.js
 * Write the changes:  node scripts/update-cta-banner-donate-label.js --apply
 */
require("dotenv").config();
const { MongoClient } = require("mongodb");

const FIELD = "ctaBannerDonateText";
const OLD_LABEL = "Donate Now";
const NEW_LABEL = "Become a Donor";

/** Every saved CTA label in a document, however deeply it is nested. */
function collectLabels(value, path = []) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    if (key === FIELD && typeof child === "string") {
      return [{ path: [...path, key].join("."), label: child }];
    }
    return collectLabels(child, [...path, key]);
  });
}

const needsRename = ({ label }) =>
  label.trim().toLowerCase() === OLD_LABEL.toLowerCase();

async function updateCollection(collection, documents, describe, apply) {
  let changed = 0;
  for (const doc of documents) {
    const labels = collectLabels(doc);
    for (const entry of labels) {
      const action = needsRename(entry) ? "rename" : "keep  ";
      console.log(`  ${action} ${describe(doc)} [${entry.path}] "${entry.label}"`);
    }
    const targets = labels.filter(needsRename);
    if (!targets.length) continue;
    changed += targets.length;
    if (!apply) continue;

    // Matching on the old values means a label edited since the read is left alone.
    const filter = { _id: doc._id };
    const set = { updatedAt: new Date() };
    targets.forEach(({ path, label }) => {
      filter[path] = label;
      set[path] = NEW_LABEL;
    });
    const result = await collection.updateOne(filter, { $set: set });
    if (result.modifiedCount !== 1) {
      throw new Error(`Not updated, it may have changed: ${describe(doc)}`);
    }
  }
  return changed;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  const apply = process.argv.includes("--apply");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db();
    console.log(`${apply ? "APPLYING to" : "Preview of"} database ${db.databaseName}`);

    const pages = db.collection("pages");
    const pageDocs = await pages.find({}).toArray();
    const pageCount = await updateCollection(
      pages,
      pageDocs,
      (page) => `page ${page.slug} (${page.status})`,
      apply,
    );

    const components = db.collection("components");
    const componentDocs = await components.find({ baseComponent: "CTABanner" }).toArray();
    const componentCount = await updateCollection(
      components,
      componentDocs,
      () => "CTABanner component defaults",
      apply,
    );

    console.log(
      `${apply ? "Renamed" : "Would rename"} ${pageCount} page label(s) and ${componentCount} component default(s).`,
    );
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { collectLabels, needsRename };
