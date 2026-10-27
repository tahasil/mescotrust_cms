/**
 * Contract test suite for DonateNow Multiple Scheme Selection and Quantity Management.
 * Run with: node scripts/test-donate-multi-scheme-contracts.js
 */

const assert = require("assert");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

const {
  PURPOSE_ID_ALIASES,
  computeMultipleSchemesAmount,
} = require("../lib/donateNowConfig");
const DonateNowSubmission = require("../models/DonateNowSubmission");

const TEST_PURPOSES = [
  {
    id: "education-adoption-scheme",
    name: "Education Adoption Scheme",
    defaultAmount: 30000,
    fixedAmount: 30000,
    amountMode: "fixed",
  },
  {
    id: "educational-aid",
    name: "Educational Aid",
    defaultAmount: 10000,
    fixedAmount: 10000,
    amountMode: "fixed",
  },
  {
    id: "ration-support",
    name: "Ration Support",
    defaultAmount: 28000,
    fixedAmount: 28000,
    amountMode: "fixed",
  },
  {
    id: "sewing-machine-sponsorship",
    name: "Sewing Machine Sponsorship",
    defaultAmount: 9000,
    fixedAmount: 9000,
    amountMode: "fixed",
  },
];

// Helper identical to restorePreviousSchemes in DonateNow.js
function restorePreviousSchemes(lastDonation, selectablePurposes) {
  if (!lastDonation) return {};
  const restored = {};

  if (Array.isArray(lastDonation.schemes) && lastDonation.schemes.length > 0) {
    lastDonation.schemes.forEach((item) => {
      const rawId = String(item.schemeId || item.id || "").trim();
      const rawName = String(item.schemeName || item.name || "").trim().toLowerCase();
      const qty = Math.max(1, Number(item.quantity) || 1);

      const matched = selectablePurposes.find(
        (p) =>
          p.id === rawId ||
          PURPOSE_ID_ALIASES[rawId] === p.id ||
          p.name.toLowerCase() === rawName ||
          (p.cardTitle && p.cardTitle.toLowerCase() === rawName),
      );
      if (matched) {
        restored[matched.id] = (restored[matched.id] || 0) + qty;
      }
    });
  }

  if (Object.keys(restored).length === 0 && lastDonation.purpose) {
    const rawPurpose = String(lastDonation.purpose).trim();
    const defaultQty = Math.max(1, Number(lastDonation.studentsCount) || 1);

    if (rawPurpose.includes(",")) {
      const parts = rawPurpose.split(",");
      parts.forEach((part) => {
        const trimmed = part.trim();
        const matchWithQty = trimmed.match(/^(.*?)\s*\((?:Qty:\s*)?(\d+)\)$/i);
        const namePart = matchWithQty ? matchWithQty[1].trim() : trimmed;
        const partQty = matchWithQty ? Number(matchWithQty[2]) || 1 : 1;
        const matched = selectablePurposes.find(
          (p) =>
            p.name.toLowerCase() === namePart.toLowerCase() ||
            (p.cardTitle && p.cardTitle.toLowerCase() === namePart.toLowerCase()) ||
            p.id === namePart.toLowerCase() ||
            PURPOSE_ID_ALIASES[namePart] === p.id,
        );
        if (matched) {
          restored[matched.id] = partQty;
        }
      });
    }

    if (Object.keys(restored).length === 0) {
      const matched = selectablePurposes.find(
        (p) =>
          p.name.toLowerCase() === rawPurpose.toLowerCase() ||
          (p.cardTitle && p.cardTitle.toLowerCase() === rawPurpose.toLowerCase()) ||
          p.id === rawPurpose.toLowerCase() ||
          PURPOSE_ID_ALIASES[rawPurpose] === p.id,
      );
      if (matched) {
        restored[matched.id] = defaultQty;
      }
    }
  }

  return Object.keys(restored).length > 0 ? restored : {};
}

async function runTests() {
  console.log("=== Running DonateNow Multi-Scheme Contract Tests ===");
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

  // 1. Amount calculation logic
  test("computeMultipleSchemesAmount: 1 scheme x 1 qty", () => {
    const total = computeMultipleSchemesAmount(
      { "education-adoption-scheme": 1 },
      TEST_PURPOSES,
    );
    assert.strictEqual(Number(total), 30000);
  });

  test("computeMultipleSchemesAmount: 1 scheme x 3 qty", () => {
    const total = computeMultipleSchemesAmount(
      { "education-adoption-scheme": 3 },
      TEST_PURPOSES,
    );
    assert.strictEqual(Number(total), 90000);
  });

  test("computeMultipleSchemesAmount: Multiple schemes matching Figure 10 example", () => {
    // Education Adoption: 30000 x 2 = 60000
    // Sewing Machine Sponsorship: 9000 x 1 = 9000
    // Total = 69000
    const total = computeMultipleSchemesAmount(
      {
        "education-adoption-scheme": 2,
        "sewing-machine-sponsorship": 1,
      },
      TEST_PURPOSES,
    );
    assert.strictEqual(Number(total), 69000);
  });

  test("computeMultipleSchemesAmount: Multiple schemes matching prompt example table", () => {
    // Education Adoption (30000 x 2) + Educational Aid (10000 x 1) + Ration Support (28000 x 3) = 60000 + 10000 + 84000 = 154000
    const total = computeMultipleSchemesAmount(
      {
        "education-adoption-scheme": 2,
        "educational-aid": 1,
        "ration-support": 3,
      },
      TEST_PURPOSES,
    );
    assert.strictEqual(Number(total), 154000);
  });

  test("computeMultipleSchemesAmount: No schemes selected returns empty string / 0", () => {
    const total = computeMultipleSchemesAmount({}, TEST_PURPOSES);
    assert.strictEqual(total, "");
  });

  // 2. Existing donor scheme restoration logic
  test("restorePreviousSchemes: restores from structured schemes array", () => {
    const lastDonation = {
      schemes: [
        { schemeId: "education-adoption-scheme", quantity: 2 },
        { schemeId: "sewing-machine-sponsorship", quantity: 1 },
        { schemeId: "ration-support", quantity: 3 },
      ],
    };
    const restored = restorePreviousSchemes(lastDonation, TEST_PURPOSES);
    assert.deepStrictEqual(restored, {
      "education-adoption-scheme": 2,
      "sewing-machine-sponsorship": 1,
      "ration-support": 3,
    });
  });

  test("restorePreviousSchemes: restores from comma-separated string with quantities", () => {
    const lastDonation = {
      purpose: "Education Adoption Scheme (Qty: 2), Sewing Machine Sponsorship (Qty: 1), Ration Support (Qty: 3)",
    };
    const restored = restorePreviousSchemes(lastDonation, TEST_PURPOSES);
    assert.deepStrictEqual(restored, {
      "education-adoption-scheme": 2,
      "sewing-machine-sponsorship": 1,
      "ration-support": 3,
    });
  });

  test("restorePreviousSchemes: restores from legacy single purpose and studentsCount", () => {
    const lastDonation = {
      purpose: "Educational Aid",
      studentsCount: "4",
    };
    const restored = restorePreviousSchemes(lastDonation, TEST_PURPOSES);
    assert.deepStrictEqual(restored, {
      "educational-aid": 4,
    });
  });

  // 3. Database model & Payment initiate contract
  await testAsync("Database & Backend Initiate API: multi-scheme persistence", async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    const testOrderId = `TEST_MULTI_${Date.now()}`;
    const testDoc = await DonateNowSubmission.create({
      orderId: testOrderId,
      amount: 69000,
      currency: "INR",
      purpose: "Education Adoption Scheme (Qty: 2), Sewing Machine Sponsorship (Qty: 1)",
      schemes: [
        {
          schemeId: "education-adoption-scheme",
          schemeName: "Education Adoption Scheme",
          amount: 30000,
          quantity: 2,
          subtotal: 60000,
        },
        {
          schemeId: "sewing-machine-sponsorship",
          schemeName: "Sewing Machine Sponsorship",
          amount: 9000,
          quantity: 1,
          subtotal: 9000,
        },
      ],
      donor: {
        name: "Test Donor Multi",
        email: "multi.donor@test.com",
        mobile: "9876543210",
        pan: "ABCDE1234F",
      },
      source: "DonateNow",
      donorType: "new",
      status: "pending",
    });

    assert.ok(testDoc._id);
    assert.strictEqual(testDoc.schemes.length, 2);
    assert.strictEqual(testDoc.schemes[0].quantity, 2);
    assert.strictEqual(testDoc.schemes[0].subtotal, 60000);
    assert.strictEqual(testDoc.schemes[1].quantity, 1);
    assert.strictEqual(testDoc.schemes[1].subtotal, 9000);

    // Clean up test document
    await DonateNowSubmission.deleteOne({ _id: testDoc._id });
  });

  // 4. HTTP API Contract checks against local server
  await testAsync("HTTP API /api/payment/initiate validates trusted scheme prices", async () => {
    const res = await fetch("http://localhost:3000/api/payment/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000",
        "Host": "localhost:3000",
      },
      body: JSON.stringify({
        amount: 999999, // Tampered frontend amount!
        currency: "INR",
        schemes: [
          { schemeId: "education-adoption-scheme", quantity: 2 },
          { schemeId: "sewing-machine-sponsorship", quantity: 1 },
        ],
        donor: {
          name: "Test Secure Donor",
          email: "secure.donor@test.com",
          mobile: "9876543211",
          pan: "ABCDE1234F",
          country: "India",
        },
        donorType: "new",
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    assert.ok(data.orderId, "Should return orderId");

    // Fetch the created submission from DB to verify trusted price calculation
    const created = await DonateNowSubmission.findOne({ orderId: data.orderId }).lean();
    assert.ok(created, "Submission should exist in DB");
    // Trusted calculation: 30000 * 2 + 9000 * 1 = 69000 (NOT the tampered 999999)
    assert.strictEqual(created.amount, 69000, `Expected 69000, got ${created.amount}`);
    assert.strictEqual(created.schemes.length, 2);
    assert.strictEqual(created.schemes[0].quantity, 2);
    assert.strictEqual(created.schemes[1].quantity, 1);

    // Clean up
    await DonateNowSubmission.deleteOne({ orderId: data.orderId });
  });

  await testAsync("HTTP API /api/payment/donor-lookup returns lastDonation with schemes", async () => {
    // Seed an existing donation with schemes to test lookup
    const seedOrderId = `TEST_LOOKUP_${Date.now()}`;
    const testEmail = `existing.donor.${Date.now()}@example.com`;
    const testMobile = `98${String(Date.now()).slice(-8)}`;

    const seed = await DonateNowSubmission.create({
      orderId: seedOrderId,
      amount: 69000,
      currency: "INR",
      purpose: "Education Adoption Scheme (Qty: 2), Sewing Machine Sponsorship (Qty: 1)",
      schemes: [
        {
          schemeId: "education-adoption-scheme",
          schemeName: "Education Adoption Scheme",
          amount: 30000,
          quantity: 2,
          subtotal: 60000,
        },
        {
          schemeId: "sewing-machine-sponsorship",
          schemeName: "Sewing Machine Sponsorship",
          amount: 9000,
          quantity: 1,
          subtotal: 9000,
        },
      ],
      donor: {
        name: "Existing Verified Donor",
        email: testEmail,
        mobile: testMobile,
        pan: "ABCDE1234F",
      },
      source: "DonateNow",
      donorType: "new",
      status: "success",
    });

    // Test GET lookup
    const getRes = await fetch(
      `http://localhost:3000/api/payment/donor-lookup?q=${encodeURIComponent(testEmail)}&include=name,email,mobile`,
      {
        headers: {
          "Host": "localhost:3000",
        },
      },
    );
    const getData = await getRes.json();
    assert.strictEqual(getData.found, true, `GET lookup failed: ${JSON.stringify(getData)}`);
    assert.ok(getData.lastDonation, "lastDonation must be returned");
    assert.strictEqual(getData.lastDonation.schemes.length, 2);
    assert.strictEqual(getData.lastDonation.schemes[0].schemeId, "education-adoption-scheme");
    assert.strictEqual(getData.lastDonation.schemes[0].quantity, 2);

    // Test POST verify
    const postRes = await fetch("http://localhost:3000/api/payment/donor-lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000",
        "Host": "localhost:3000",
      },
      body: JSON.stringify({
        token: getData.verificationToken,
        email: testEmail,
        mobile: testMobile,
        include: "name,email,mobile,pan",
      }),
    });
    const postData = await postRes.json();
    assert.strictEqual(postData.verified, true, `POST verify failed: ${JSON.stringify(postData)}`);
    assert.ok(postData.lastDonation, "lastDonation must be returned on verification");
    assert.strictEqual(postData.lastDonation.schemes.length, 2);
    assert.strictEqual(postData.lastDonation.schemes[0].quantity, 2);

    // Clean up
    await DonateNowSubmission.deleteOne({ _id: seed._id });
  });

  console.log(`\n=== Summary: ${passed}/${total} passed ===`);
  await mongoose.disconnect();
  if (passed === total) {
    console.log("All contract tests PASSED!\n");
    process.exit(0);
  } else {
    console.error("Some tests failed!\n");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
