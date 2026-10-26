const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), override: true });
const { performUnifiedSearch } = require("../lib/search/unifiedSearch");
const mongoose = require("mongoose");

async function test() {
  for (const term of ["Scholarship", "Zakat"]) {
    console.log(`\n=================== TESTING SEARCH: "${term}" ===================`);
    const res = await performUnifiedSearch({ query: term, limit: 20 });
    console.log(`Total results: ${res.total}`);
    console.log("Counts breakdown:", res.counts);
    console.log("\nTop Results:");
    res.items.slice(0, 10).forEach((it, i) => {
      console.log(`[#${i + 1}] [${it.typeLabel}] "${it.title}" (Score: ${it.relevanceScore})`);
      console.log(`     URL: ${it.url}`);
      console.log(`     Excerpt: ${it.excerpt.slice(0, 120)}...`);
    });
  }
  await mongoose.disconnect();
}

test().catch(console.error);
