/**
 * Saved-content fixes from the 7 Nov pending items list.
 *
 * D2: writes the two landlines the same way everywhere (+91 22 2444 1442).
 * D6: removes the placeholder routes from the saved sitemap.
 * E2: reports stored markup that looks like an injection attempt. Report only.
 *
 * Preview, read-only: node scripts/apply-uat-content-fixes.js
 * Write the changes:  node scripts/apply-uat-content-fixes.js --apply
 */
require("dotenv").config();
const { MongoClient } = require("mongodb");

const BOTH_LANDLINES = "+91 22 2444 1442 / +91 22 2444 8637";
const PHONE_COLLECTIONS = ["pages", "components", "appearance", "themeconfigs"];
const PLACEHOLDER_ROUTES = ["blog-details", "blogs", "event-deatils", "event-list"];
const SCAN_COLLECTIONS = [
  "blogs", "blogcategories", "blogcomments", "events", "faqs", "pages",
  "components", "testimonials", "testimonial_items", "teams", "galleries",
];

// The lookbehind leaves tel: links and longer digit runs alone.
const LANDLINE =
  /(?<![\d+:])(?:\(?\+?\s?91[\s-]*22\)?|\(?0?22\)?)?[\s-]*2444[\s-]?(1442|8637)(?!\d)/g;
const INJECTION = /<\/?script|<iframe|\bon(?:error|load|click|mouseover)\s*=|javascript:/i;

function normalizePhones(text) {
  // A legacy footer value has extra numbers fused straight onto the second landline.
  if (/24448637\d/.test(text)) return BOTH_LANDLINES;
  return text
    .replace(LANDLINE, (match, tail) => {
      const lead = /^\s/.test(match) ? " " : "";
      return `${lead}+91 22 2444 ${tail}`;
    })
    .replace(/(2444 1442)\s*,\s*(\+91 22 2444 8637)/g, "$1 / $2");
}

/** Every string in a document, with its dotted path. */
function collectStrings(value, path = []) {
  if (typeof value === "string") return [{ path: path.join("."), text: value }];
  if (!value || typeof value !== "object" || value instanceof Date) return [];
  if (value._bsontype) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    collectStrings(child, [...path, key]),
  );
}

function removeSitemapRoutes(xml) {
  const removed = [];
  const content = xml.replace(/\s*<url>[\s\S]*?<\/url>/g, (block) => {
    const loc = (block.match(/<loc>([^<]*)<\/loc>/) || [])[1] || "";
    const path = loc.replace(/^https?:\/\/[^/]+\//, "").replace(/\/$/, "");
    if (!PLACEHOLDER_ROUTES.includes(path)) return block;
    removed.push(loc);
    return "";
  });
  return { content, removed };
}

const label = (doc) => doc.slug || doc.baseComponent || doc.key || doc.module || doc._id;
const preview = (text, at = 0) =>
  text.slice(Math.max(0, at - 30), at + 70).replace(/\s+/g, " ");

async function fixPhones(db, apply) {
  let changed = 0;
  for (const name of PHONE_COLLECTIONS) {
    const collection = db.collection(name);
    for (const doc of await collection.find({}).toArray()) {
      const edits = collectStrings(doc)
        .map((entry) => ({ ...entry, next: normalizePhones(entry.text) }))
        .filter(({ text, next }) => text !== next);
      if (!edits.length) continue;

      const filter = { _id: doc._id };
      const set = { updatedAt: new Date() };
      for (const { path, text, next } of edits) {
        const at = text.search(/2444/);
        console.log(`  ${name} ${label(doc)} [${path}]`);
        console.log(`    - ...${preview(text, at)}...`);
        console.log(`    + ...${preview(next, next.search(/2444/))}...`);
        filter[path] = text;
        set[path] = next;
        changed += 1;
      }
      if (!apply) continue;
      const result = await collection.updateOne(filter, { $set: set });
      if (result.modifiedCount !== 1) {
        throw new Error(`Not updated, it may have changed: ${name} ${label(doc)}`);
      }
    }
  }
  return changed;
}

async function fixSitemap(db, apply) {
  const collection = db.collection("sitefilesettings");
  const doc = await collection.findOne({ fileType: "sitemap" });
  if (!doc?.content) {
    console.log("  no saved sitemap");
    return 0;
  }
  const { content, removed } = removeSitemapRoutes(doc.content);
  removed.forEach((loc) => console.log(`  remove ${loc}`));
  if (removed.length && apply) {
    await collection.updateOne(
      { _id: doc._id, content: doc.content },
      { $set: { content, updatedAt: new Date() } },
    );
  }
  return removed.length;
}

async function scanStoredMarkup(db) {
  let hits = 0;
  for (const name of SCAN_COLLECTIONS) {
    for (const doc of await db.collection(name).find({}).toArray()) {
      for (const { path, text } of collectStrings(doc)) {
        const at = text.search(INJECTION);
        if (at < 0) continue;
        hits += 1;
        console.log(`  ${name} ${label(doc)} [${path}] ...${preview(text, at)}...`);
      }
    }
  }
  return hits;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  const apply = process.argv.includes("--apply");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db();
    console.log(`${apply ? "APPLYING to" : "Preview of"} database ${db.databaseName}`);
    console.log("\nD2 phone numbers");
    const phones = await fixPhones(db, apply);
    console.log("\nD6 sitemap");
    const routes = await fixSitemap(db, apply);
    console.log("\nE2 stored markup (report only)");
    const hits = await scanStoredMarkup(db);
    const verb = apply ? "Changed" : "Would change";
    console.log(`\n${verb} ${phones} phone value(s) and ${routes} sitemap route(s). Stored markup hits: ${hits}.`);
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

module.exports = { normalizePhones, removeSitemapRoutes, collectStrings };
