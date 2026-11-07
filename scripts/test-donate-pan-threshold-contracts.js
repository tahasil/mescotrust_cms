/**
 * Contract tests for the Donate Now PAN rule: PAN is mandatory for donations
 * of ₹50,000 or more and optional below that. Offline, no database needed.
 *
 * Run with: npm run test:donate-pan
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  applyPanAmountRule,
  computeMultipleSchemesAmount,
  getDefaultDonateNowPurposes,
  getPurposeRuleState,
  isPanRequiredForAmount,
  normalizeDonateNowConfig,
  PAN_REQUIRED_MESSAGE,
  PAN_REQUIRED_MIN_AMOUNT,
} = require("../lib/donateNowConfig");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  [PASS] ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  [FAIL] ${name}`);
    console.error(error);
  }
}

console.log("=== Donate Now PAN Threshold Contract Tests ===");

test("threshold is ₹50,000 and the message states it", () => {
  assert.strictEqual(PAN_REQUIRED_MIN_AMOUNT, 50000);
  assert.ok(PAN_REQUIRED_MESSAGE.includes("₹50,000 or more"));
});

test("exactly ₹50,000 requires PAN and ₹49,999 does not", () => {
  assert.strictEqual(isPanRequiredForAmount(50000), true);
  assert.strictEqual(isPanRequiredForAmount(50001), true);
  assert.strictEqual(isPanRequiredForAmount(49999), false);
  assert.strictEqual(isPanRequiredForAmount(49999.99), false);
});

test("string amounts count and unusable amounts don't", () => {
  assert.strictEqual(isPanRequiredForAmount("50000"), true);
  for (const value of [0, "", null, undefined, NaN, "abc"]) {
    assert.strictEqual(isPanRequiredForAmount(value), false);
  }
});

test("the admin Required setting no longer forces PAN on small donations", () => {
  const { fieldConfig } = normalizeDonateNowConfig({});
  const state = getPurposeRuleState(null, {
    ...fieldConfig,
    pan: { ...fieldConfig.pan, required: true },
  });
  assert.strictEqual(state.required.has("pan"), true);
  assert.strictEqual(applyPanAmountRule(state, 500).required.has("pan"), false);
});

test("a purpose that lists PAN as required is also overridden below the threshold", () => {
  const { fieldConfig } = normalizeDonateNowConfig({});
  const state = getPurposeRuleState({ requiredFields: ["pan"] }, fieldConfig);
  assert.strictEqual(applyPanAmountRule(state, 49999).required.has("pan"), false);
});

test("at the threshold PAN is required, visible and enabled whatever the admin set", () => {
  const state = {
    hidden: new Set(["pan"]),
    disabled: new Set(["pan"]),
    required: new Set(),
  };
  const result = applyPanAmountRule(state, 50000);
  assert.strictEqual(result.required.has("pan"), true);
  assert.strictEqual(result.hidden.has("pan"), false);
  assert.strictEqual(result.disabled.has("pan"), false);
});

test("below the threshold an admin-hidden PAN stays hidden", () => {
  const state = {
    hidden: new Set(["pan"]),
    disabled: new Set(),
    required: new Set(),
  };
  assert.strictEqual(applyPanAmountRule(state, 1000).hidden.has("pan"), true);
});

test("the rule returns new sets and leaves other fields alone", () => {
  const state = {
    hidden: new Set(["note"]),
    disabled: new Set(["amount"]),
    required: new Set(["name"]),
  };
  const result = applyPanAmountRule(state, 60000);
  assert.strictEqual(state.required.has("pan"), false);
  assert.ok(result.hidden.has("note"));
  assert.ok(result.disabled.has("amount"));
  assert.ok(result.required.has("name"));
});

test("scheme totals decide: quantity and multiple schemes can cross the threshold", () => {
  const purposes = getDefaultDonateNowPurposes();
  const single = purposes.find((p) => Number(p.fixedAmount) === 30000);
  const small = purposes.find((p) => Number(p.fixedAmount) === 10000);
  assert.ok(single && small);

  const total = (map) => computeMultipleSchemesAmount(map, purposes);
  assert.strictEqual(isPanRequiredForAmount(total({ [single.id]: 1 })), false);
  assert.strictEqual(isPanRequiredForAmount(total({ [single.id]: 2 })), true);
  assert.strictEqual(
    isPanRequiredForAmount(total({ [single.id]: 1, [small.id]: 2 })),
    true,
  );
});

test("the payment route enforces the rule for every donor path", () => {
  const route = read("app/api/payment/initiate/route.js");
  const check = route.indexOf("isPanRequiredForAmount(normalizedAmount)");
  assert.ok(check > 0, "route must check the amount it charges");
  assert.ok(check > route.lastIndexOf("normalizedDonor = {"), "check must follow every donor branch");
  assert.ok(check < route.indexOf("DonateNowSubmission.create"), "check must run before anything is saved");
  assert.ok(!route.includes("isPanRequiredByDonateForm"), "the admin setting must not decide PAN");
});

test("the form applies the rule and submits the amount it tested", () => {
  const form = read("components/site/DonateNow/DonateNow.js");
  assert.ok(form.includes("applyPanAmountRule(purposeRuleState, payableAmount)"));
  assert.ok(form.includes("amount: payableAmount"));
});

test("the admin editor has no Required switch for PAN", () => {
  const editor = read("components/site/DonateNow/EditForm.js");
  assert.ok(editor.includes('item.key === "pan"'));
});

console.log(`\n=== Summary: ${passed}/${passed + failed} passed ===`);
process.exit(failed > 0 ? 1 : 0);
