/**
 * Contract test suite for DonateNow:
 * 1. Unified Donation Category Dropdown & Backward Compatibility
 * 2. Non-Zakat Scheme Allocation Rules (DON-04 - HCES)
 * 3. Multi-Scheme Category Validation & Persistence
 *
 * Run with: node scripts/test-donate-non-zakat-and-category-contracts.js
 */

const assert = require("assert");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

const {
  getDefaultDonateNowPurposes,
  isSchemeNonZakatOnly,
  getAllowedCategoriesForSchemes,
  DONATION_CATEGORY_OPTIONS,
} = require("../lib/donateNowConfig");
const DonateNowSubmission = require("../models/DonateNowSubmission");

async function runTests() {
  console.log("=== Running Donate Now Category & Non-Zakat (DON-04) Contract Tests ===");
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(err);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(err);
    }
  }

  // 1. Configuration & Eligibility checks
  test("DONATION_CATEGORY_OPTIONS includes supported categories", () => {
    const values = DONATION_CATEGORY_OPTIONS.map((o) => o.value);
    assert.ok(values.includes("Zakat"));
    assert.ok(values.includes("Non-Zakat"));
    assert.ok(values.includes("Interest Money"));
    assert.ok(values.includes("Other"));
  });

  test("HCES scheme is flagged as isNonZakatOnly with code HCES", () => {
    const purposes = getDefaultDonateNowPurposes();
    const hces = purposes.find((p) => p.id === "high-cost-education-scholarship");
    assert.ok(hces, "HCES scheme must exist in default purposes");
    assert.strictEqual(hces.code, "HCES");
    assert.strictEqual(hces.isNonZakatOnly, true);
    assert.deepStrictEqual(hces.allowedDonationTypes, ["Non-Zakat"]);
    assert.strictEqual(isSchemeNonZakatOnly(hces), true);
  });

  test("Non-restricted schemes (e.g. Educational Aid) allow all donation types", () => {
    const purposes = getDefaultDonateNowPurposes();
    const eduAid = purposes.find((p) => p.id === "educational-aid");
    assert.ok(eduAid, "Educational Aid must exist");
    assert.strictEqual(isSchemeNonZakatOnly(eduAid), false);
  });

  test("getAllowedCategoriesForSchemes: Non-Zakat only when HCES is selected", () => {
    const allowedSingle = getAllowedCategoriesForSchemes(["high-cost-education-scholarship"]);
    assert.deepStrictEqual(allowedSingle, ["Non-Zakat"]);

    const allowedMulti = getAllowedCategoriesForSchemes([
      "high-cost-education-scholarship",
      "educational-aid",
      "medical-aid",
    ]);
    assert.deepStrictEqual(allowedMulti, ["Non-Zakat"]);
  });

  test("getAllowedCategoriesForSchemes: All categories when non-restricted schemes selected", () => {
    const allowed = getAllowedCategoriesForSchemes(["educational-aid", "ration-support"]);
    assert.deepStrictEqual(allowed, ["Zakat", "Non-Zakat", "Interest Money", "Other"]);
  });

  // Connect to DB for integration / contract tests
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn("  [SKIP] Database tests skipped: MONGODB_URI not found");
    console.log(`\n=== Summary: ${passed}/${total} passed ===`);
    return;
  }

  await mongoose.connect(mongoUri);

  // 2. Database model tests
  await testAsync("DonateNowSubmission model supports donationCategory with backward compatibility", async () => {
    const orderId = `TEST_CAT_${Date.now()}`;
    const doc = await DonateNowSubmission.create({
      orderId,
      amount: 60000,
      currency: "INR",
      purpose: "High Cost Education Scholarship",
      donationCategory: "Non-Zakat",
      zakat: "No",
      interestMoney: "No",
      donor: {
        name: "Test Donor",
        email: "test.category@example.com",
        mobile: "9876543210",
        pan: "ABCDE1234F",
      },
      source: "DonateNow",
      donorType: "new",
      status: "pending",
    });

    assert.ok(doc._id);
    assert.strictEqual(doc.donationCategory, "Non-Zakat");
    assert.strictEqual(doc.zakat, "No");
    assert.strictEqual(doc.interestMoney, "No");

    // Clean up
    await DonateNowSubmission.deleteOne({ _id: doc._id });
  });

  // 3. HTTP API Contract checks against backend route
  await testAsync("HTTP API /api/payment/initiate REJECTS HCES when donationCategory is Zakat", async () => {
    const res = await fetch("http://localhost:3000/api/payment/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000",
        "Host": "localhost:3000",
      },
      body: JSON.stringify({
        amount: 60000,
        currency: "INR",
        donationCategory: "Zakat",
        zakat: "Yes",
        schemes: [
          { schemeId: "high-cost-education-scholarship", quantity: 1 },
        ],
        donor: {
          name: "Test Incompatible Donor",
          email: "incompatible@test.com",
          mobile: "9876543212",
          pan: "ABCDE1234F",
          country: "India",
        },
        donorType: "new",
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400, `Expected 400, got ${res.status}`);
    assert.ok(
      data.error && data.error.includes("accepts Non-Zakat donations only"),
      `Expected restriction error message, got: ${data.error}`,
    );
  });

  await testAsync("HTTP API /api/payment/initiate ACCEPTS HCES when donationCategory is Non-Zakat", async () => {
    const res = await fetch("http://localhost:3000/api/payment/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000",
        "Host": "localhost:3000",
      },
      body: JSON.stringify({
        amount: 60000,
        currency: "INR",
        donationCategory: "Non-Zakat",
        schemes: [
          { schemeId: "high-cost-education-scholarship", quantity: 1 },
        ],
        donor: {
          name: "Test Valid HCES Donor",
          email: "valid.hces@test.com",
          mobile: "9876543213",
          pan: "ABCDE1234F",
          country: "India",
        },
        donorType: "new",
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    assert.ok(data.orderId, "Should return orderId");

    const created = await DonateNowSubmission.findOne({ orderId: data.orderId }).lean();
    assert.ok(created);
    assert.strictEqual(created.donationCategory, "Non-Zakat");
    assert.strictEqual(created.zakat, "No");
    assert.strictEqual(created.interestMoney, "No");

    await DonateNowSubmission.deleteOne({ orderId: data.orderId });
  });

  await testAsync("HTTP API /api/payment/initiate REJECTS multi-scheme with HCES when category is Zakat", async () => {
    const res = await fetch("http://localhost:3000/api/payment/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000",
        "Host": "localhost:3000",
      },
      body: JSON.stringify({
        amount: 70000,
        currency: "INR",
        donationCategory: "Zakat",
        schemes: [
          { schemeId: "high-cost-education-scholarship", quantity: 1 },
          { schemeId: "educational-aid", quantity: 1 },
        ],
        donor: {
          name: "Test Multi Incompatible Donor",
          email: "multi.incompatible@test.com",
          mobile: "9876543214",
          pan: "ABCDE1234F",
          country: "India",
        },
        donorType: "new",
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400, `Expected 400, got ${res.status}`);
    assert.ok(
      data.error && data.error.includes("accepts Non-Zakat donations only"),
      `Expected restriction error message, got: ${data.error}`,
    );
  });

  await testAsync("HTTP API /api/payment/initiate ACCEPTS multi-scheme with HCES when category is Non-Zakat", async () => {
    const res = await fetch("http://localhost:3000/api/payment/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000",
        "Host": "localhost:3000",
      },
      body: JSON.stringify({
        amount: 70000,
        currency: "INR",
        donationCategory: "Non-Zakat",
        schemes: [
          { schemeId: "high-cost-education-scholarship", quantity: 1 },
          { schemeId: "educational-aid", quantity: 1 },
        ],
        donor: {
          name: "Test Multi Valid Donor",
          email: "multi.valid@test.com",
          mobile: "9876543215",
          pan: "ABCDE1234F",
          country: "India",
        },
        donorType: "new",
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    assert.ok(data.orderId, "Should return orderId");

    const created = await DonateNowSubmission.findOne({ orderId: data.orderId }).lean();
    assert.ok(created);
    assert.strictEqual(created.donationCategory, "Non-Zakat");
    assert.strictEqual(created.amount, 70000); // 60000 + 10000

    await DonateNowSubmission.deleteOne({ orderId: data.orderId });
  });

  await mongoose.disconnect();

  console.log(`\n=== Summary: ${passed}/${total} passed ===`);
  if (passed === total) {
    console.log("All category and Non-Zakat contract tests PASSED!\n");
  } else {
    console.error("Some tests failed!\n");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
