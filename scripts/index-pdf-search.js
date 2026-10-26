const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), override: true });
const mongoose = require("mongoose");
const { connectDB } = require("../lib/db");
const { indexAllAnnualReports } = require("../lib/pdf/extractor");
const PdfSearchIndex = require("../models/PdfSearchIndex");

async function main() {
  console.log("=== INDEXING PDF SEARCH DOCUMENTS ===");
  await connectDB();

  console.log("Starting Annual Reports discovery & indexing...");
  const indexed = await indexAllAnnualReports();
  console.log(`Successfully indexed ${indexed.length} report(s).`);

  const all = await PdfSearchIndex.find({}).lean();
  console.log(`\nTotal indexed PDF records in DB: ${all.length}`);
  for (const doc of all) {
    console.log(`- [${doc.status}] "${doc.title}" (${doc.year || "No year"}) | Pages: ${doc.pageCount} | Characters: ${doc.extractedText ? doc.extractedText.length : 0} | URL: ${doc.url}`);
  }

  // Quick test query for Scholarship and Zakat
  for (const term of ["scholarship", "zakat"]) {
    const matches = await PdfSearchIndex.find({
      status: "ready",
      extractedText: { $regex: new RegExp(term, "i") },
    }).lean();
    console.log(`\nMatches for "${term}" in PDF text: ${matches.length}`);
    for (const m of matches) {
      console.log(`  -> Found in: ${m.title} (${m.url})`);
    }
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Indexing failed:", err);
  process.exit(1);
});
