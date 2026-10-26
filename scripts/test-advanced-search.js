const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), override: true });
const mongoose = require("mongoose");
const { performUnifiedSearch } = require("../lib/search/unifiedSearch");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("       MESCO ADVANCED SEARCH TEST SUITE           ");
  console.log("==================================================\n");

  // Test 1: Search for a keyword available in a Page Title
  console.log("--- Test 1: Page Title Search ('Careers') ---");
  const t1 = await performUnifiedSearch({ query: "Careers" });
  assert(t1.total > 0, "Careers query returns results");
  const t1Page = t1.items.find((it) => it.type === "page" && it.title.toLowerCase().includes("careers"));
  assert(Boolean(t1Page), "Careers page found in results");
  assert(t1Page?.url === "/get-involved/careers", `Careers page URL is correct (${t1Page?.url})`);

  // Test 2: Search for a keyword available inside Page Content
  console.log("\n--- Test 2: Page Content Search ('Poverty') ---");
  const t2 = await performUnifiedSearch({ query: "Poverty" });
  assert(t2.total > 0, "Poverty query returns results");
  const t2Page = t2.items.find((it) => it.type === "page");
  assert(Boolean(t2Page), "Found page matching content keyword 'Poverty'");

  // Test 3: Search for an Event Title and Description ('Felicitation')
  console.log("\n--- Test 3: Event Search ('Felicitation') ---");
  const t3 = await performUnifiedSearch({ query: "Felicitation" });
  assert(t3.total > 0, "Felicitation query returns results");
  const t3Event = t3.items.find((it) => it.type === "event");
  assert(Boolean(t3Event), "Found Event in results");
  assert(t3Event?.title.includes("Felicitation"), `Event title matches (${t3Event?.title})`);
  assert(t3Event?.url.startsWith("/events/"), `Event URL is valid (${t3Event?.url})`);

  // Test 4: Search for Blog Title and Content ('Technology')
  console.log("\n--- Test 4: Blog Search ('Technology') ---");
  const t4 = await performUnifiedSearch({ query: "Technology" });
  assert(t4.total > 0, "Technology query returns results");
  const t4Blog = t4.items.find((it) => it.type === "blog");
  assert(Boolean(t4Blog), "Found Blog in results");
  assert(t4Blog?.url.startsWith("/blog/"), `Blog URL is valid (${t4Blog?.url})`);

  // Test 5: Search for News content ('HSC' or 'Selected Students')
  console.log("\n--- Test 5: News Search ('HSC') ---");
  const t5 = await performUnifiedSearch({ query: "HSC" });
  assert(t5.total > 0, "HSC query returns results");
  const t5News = t5.items.find((it) => it.type === "news");
  assert(Boolean(t5News), "Found News item in results");
  assert(t5News?.title.includes("HSC"), `News title matches (${t5News?.title})`);

  // Test 6: Search text available only inside Annual Report PDF ('Hilaluddin')
  console.log("\n--- Test 6: Deep PDF Text Search ('Hilaluddin') ---");
  const t6 = await performUnifiedSearch({ query: "Hilaluddin" });
  assert(t6.total > 0, "Hilaluddin query returns results");
  const t6Report = t6.items.find((it) => it.type === "report");
  assert(Boolean(t6Report), "Found Annual Report matching deep PDF text");
  assert(Boolean(t6Report?.isPdf), "Report is flagged as PDF");
  assert(t6Report?.excerpt.toLowerCase().includes("hilaluddin"), `PDF excerpt contains matched keyword (${t6Report?.excerpt})`);

  // Test 7: Specific Test Keyword "Scholarship"
  console.log("\n--- Test 7: Mandatory Keyword 'Scholarship' ---");
  const t7 = await performUnifiedSearch({ query: "Scholarship" });
  assert(t7.total > 0, "Scholarship query returns results");
  assert(t7.counts.reports > 0, `Scholarship matched ${t7.counts.reports} Annual Reports`);
  assert(t7.counts.news > 0, `Scholarship matched ${t7.counts.news} News items`);
  assert(t7.counts.pages > 0, `Scholarship matched ${t7.counts.pages} Pages`);

  // Test 8: Specific Test Keyword "Zakat"
  console.log("\n--- Test 8: Mandatory Keyword 'Zakat' ---");
  const t8 = await performUnifiedSearch({ query: "Zakat" });
  assert(t8.total > 0, "Zakat query returns results");
  assert(t8.counts.news > 0, `Zakat matched ${t8.counts.news} News items (InMedia clipping)`);
  assert(t8.counts.reports > 0, `Zakat matched ${t8.counts.reports} Annual Reports (PDF text)`);
  assert(t8.counts.pages > 0, `Zakat matched ${t8.counts.pages} Pages`);

  // Test 9: Category Filters
  console.log("\n--- Test 9: Category Filters ---");
  const t9Reports = await performUnifiedSearch({ query: "Scholarship", type: "reports" });
  assert(t9Reports.items.every((it) => it.type === "report"), "Filter type 'reports' returns only report items");
  assert(t9Reports.items.length === t9Reports.counts.reports, "Report items count matches counts.reports");

  const t9Pages = await performUnifiedSearch({ query: "Scholarship", type: "pages" });
  assert(t9Pages.items.every((it) => it.type === "page"), "Filter type 'pages' returns only page items");

  const t9News = await performUnifiedSearch({ query: "Scholarship", type: "news" });
  assert(t9News.items.every((it) => it.type === "news"), "Filter type 'news' returns only news items");

  // Test 10: Verify Draft and Unpublished Content is Excluded
  console.log("\n--- Test 10: Draft / Unpublished Exclusion ---");
  // Draft blog title: "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet"
  const t10DraftBlog = await performUnifiedSearch({ query: "dolorem ipsum" });
  const hasDraftBlog = t10DraftBlog.items.some((it) => it.title.includes("Neque porro"));
  assert(!hasDraftBlog, "Draft blogs are completely excluded from search results");

  // Draft page: "Study Centre" (status: draft)
  const t10DraftPage = await performUnifiedSearch({ query: "Study Centre" });
  const hasDraftPage = t10DraftPage.items.some((it) => it.type === "page" && it.title === "Study Centre");
  assert(!hasDraftPage, "Draft pages ('Study Centre') are completely excluded from search results");

  // Test 11: Case-insensitivity & multi-word handling
  console.log("\n--- Test 11: Case-insensitivity & multi-word ---");
  const lowerRes = await performUnifiedSearch({ query: "scholarship" });
  const upperRes = await performUnifiedSearch({ query: "SCHOLARSHIP" });
  assert(lowerRes.total === upperRes.total, `Case-insensitive search returns identical counts (${lowerRes.total} === ${upperRes.total})`);

  const multiWord = await performUnifiedSearch({ query: "School Scholarship" });
  assert(multiWord.total > 0, "Multi-word search returns matches");

  // Test 12: Special Characters Safety
  console.log("\n--- Test 12: Special Characters Safety ---");
  const specialChars = await performUnifiedSearch({ query: "Scholarship ($&.+*?^)" });
  assert(Array.isArray(specialChars.items), "Search handles regex special characters safely without crashing");

  // Summary
  console.log("\n==================================================");
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log("==================================================");

  await mongoose.disconnect();
  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
