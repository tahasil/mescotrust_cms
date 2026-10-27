const { test, expect } = require("@playwright/test");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

const DonateNowSubmission = require("../models/DonateNowSubmission");

function fieldByLabel(page, label) {
  return page
    .locator("label", { hasText: label })
    .locator("..")
    .locator("input, textarea")
    .first();
}

async function openDonationForm(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("mesco_cookie_consent", "accepted");
    window.sessionStorage.setItem("mesco_push_dismissed", "1");
  });
  await page.goto("/donate-now", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const donorType = page.locator(
    '.ant-select:has(.ant-select-selection-placeholder:text-is("Select donor type")), .ant-select:has(.ant-select-selection-item)',
  ).first();
  await donorType.scrollIntoViewIfNeeded();
  await expect(donorType).toBeVisible({ timeout: 20_000 });
}

async function selectAntOption(page, placeholder, optionText) {
  const trigger = page
    .locator(
      `.ant-select:has(.ant-select-selection-placeholder:text-is("${placeholder}")), .ant-select:has(.ant-select-selection-item)`,
    )
    .first();
  await trigger.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await trigger.locator(".ant-select-selector").click();
  await page.waitForTimeout(500);
  const option = page
    .locator(`.ant-select-dropdown .ant-select-item-option[title="${optionText}"]`)
    .first();
  await option.waitFor({ state: "visible", timeout: 10000 });
  await option.click();
  await page.waitForTimeout(500);
}

test.describe("DonateNow Multiple Scheme Selection and Quantity Management", () => {
  test.beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  test.afterAll(async () => {
    await mongoose.disconnect();
  });

  test("New Donor: Multiple Scheme Selection, Dynamic Quantity, Sync with Student Count & Amount", async ({
    page,
  }) => {
    // 1. Open Donate Now page and scroll to form
    await openDonationForm(page);

    // 2. Verify all 14 scheme cards are rendered
    const schemeHeadings = page.locator("button h4");
    await expect(schemeHeadings.first()).toBeVisible({ timeout: 15000 });
    const count = await schemeHeadings.count();
    expect(count).toBeGreaterThanOrEqual(14);

    // 3. Select New Donor
    await selectAntOption(page, "Select donor type", "New Donor");

    // Let's locate the Education Adoption Scheme card
    const easCard = page
      .locator("button")
      .filter({ has: page.locator("h4", { hasText: "Education Adoption Scheme" }) })
      .first();
    await expect(easCard).toBeVisible();

    // Verify it is selected by default (or click to select it)
    const isEasSelected = (await easCard.locator(".qty-controls").count()) > 0;
    if (!isEasSelected) {
      await easCard.click();
    }

    // 4. Verify quantity selector inside the card has default quantity 1
    const easQtyValue = easCard.locator(".qty-value");
    await expect(easQtyValue).toHaveText("1");

    // Verify initial Amount for Education Adoption Scheme (₹30,000)
    const amountInput = fieldByLabel(page, "Amount");
    await expect(amountInput).toHaveValue("30000");

    // 5. Test Plus (+) button: Increase quantity to 2
    const easPlusBtn = easCard.locator(".qty-plus");
    await easPlusBtn.click();
    await expect(easQtyValue).toHaveText("2");
    await expect(amountInput).toHaveValue("60000");

    // Verify Select No. of Student synchronized with quantity 2
    const studentSelect = page
      .locator("label:has-text('Select No. of Student'), label:has-text('Select Student')")
      .locator("..")
      .locator(".ant-select-selection-item");
    if ((await studentSelect.count()) > 0) {
      await expect(studentSelect.first()).toHaveText("2");
    }

    // 6. Test Minus (-) button: Decrease quantity back to 1
    const easMinusBtn = easCard.locator(".qty-minus");
    await easMinusBtn.click();
    await expect(easQtyValue).toHaveText("1");
    await expect(amountInput).toHaveValue("30000");

    // 7. Test Minus (-) boundary: Quantity must never go below 1
    expect(await easMinusBtn.isDisabled()).toBe(true);

    // 8. Select multiple schemes: Click "Sewing Machine Sponsorship" card
    const sewingCard = page
      .locator("button")
      .filter({ has: page.locator("h4", { hasText: "Sewing Machine Sponsorship" }) })
      .first();
    await expect(sewingCard).toBeVisible();
    await sewingCard.click();

    // Both cards must be selected with their quantity controls
    await expect(easCard.locator(".qty-controls")).toBeVisible();
    await expect(sewingCard.locator(".qty-controls")).toBeVisible();
    await expect(sewingCard.locator(".qty-value")).toHaveText("1");

    // Total Amount: Education Adoption (30000 x 1) + Sewing Machine (9000 x 1) = 39000
    await expect(amountInput).toHaveValue("39000");

    // 9. When MULTIPLE schemes are selected:
    // Quantity select (Select No. of Student / Machines) must be disabled
    const quantitySelectWrap = page
      .locator("label:has-text('Student'), label:has-text('Machine'), label:has-text('No. of')")
      .locator("..")
      .locator(".ant-select")
      .first();
    await expect(quantitySelectWrap).toHaveClass(/ant-select-disabled/);

    // Purpose of Donation must be disabled with placeholder "Multiple Schemes Selected"
    const purposeSelectWrap = page
      .locator("label:has-text('Purpose of Donation')")
      .locator("..")
      .locator(".ant-select");
    await expect(purposeSelectWrap).toHaveClass(/ant-select-disabled/);
    const purposePlaceholder = purposeSelectWrap.locator(".ant-select-selection-placeholder");
    await expect(purposePlaceholder).toHaveText("Multiple Schemes Selected");

    // 10. Increase quantity on the second card independently
    const sewingPlusBtn = sewingCard.locator(".qty-plus");
    await sewingPlusBtn.click();
    await expect(sewingCard.locator(".qty-value")).toHaveText("2");
    // New total: (30000 x 1) + (9000 x 2) = 48000
    await expect(amountInput).toHaveValue("48000");

    // 11. Deselect the first scheme (Education Adoption Scheme)
    await easCard.click();
    await expect(easCard.locator(".qty-controls")).toHaveCount(0);

    // Now only ONE scheme is selected ("Sewing Machine Sponsorship" with qty 2)
    // Quantity select should be re-enabled
    await expect(quantitySelectWrap).not.toHaveClass(/ant-select-disabled/);
    await expect(purposeSelectWrap).not.toHaveClass(/ant-select-disabled/);
    await expect(amountInput).toHaveValue("18000");

    // 12. Deselect the remaining scheme
    await sewingCard.click();
    await expect(sewingCard.locator(".qty-controls")).toHaveCount(0);
    // Amount is cleared
    await expect(amountInput).toHaveValue("");
  });

  test("Existing Donor: Restore previously selected schemes and quantities upon verification", async ({
    page,
  }) => {
    // 1. Seed a historical donation record for an existing donor
    const stamp = Date.now();
    const testEmail = `donor.multi.${stamp}@example.com`;
    const testMobile = `98${String(stamp).slice(-8)}`;

    const seededDoc = await DonateNowSubmission.create({
      orderId: `DON_E2E_MULTI_${stamp}`,
      amount: 153000,
      currency: "INR",
      purpose: "Education Adoption Scheme (Qty: 2), Sewing Machine Sponsorship (Qty: 1), Ration Support (Qty: 3)",
      schemes: [
        {
          schemeId: "education-adoption-scheme",
          schemeName: "Education Adoption Scheme",
          amount: 30000,
          quantity: 2,
          subtotal: 60000,
        },
        {
          schemeId: "sewing-machine",
          schemeName: "Sewing Machine Sponsorship",
          amount: 9000,
          quantity: 1,
          subtotal: 9000,
        },
        {
          schemeId: "ration-support",
          schemeName: "Ration Support",
          amount: 28000,
          quantity: 3,
          subtotal: 84000,
        },
      ],
      donor: {
        name: "Historical Multi Donor",
        email: testEmail,
        mobile: testMobile,
        pan: "ABCDE1234F",
        address: "123 Marine Drive",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        pincode: "400001",
      },
      source: "DonateNow",
      donorType: "new",
      status: "success",
    });

    try {
      // 2. Open Donate Now page and select Existing Donor
      await openDonationForm(page);
      await selectAntOption(page, "Select donor type", "Existing Donor");
      await page.waitForTimeout(500);

      // 3. Lookup donor via email
      const lookupInput = fieldByLabel(page, "Email / Mobile No.");
      await lookupInput.waitFor({ state: "visible", timeout: 10000 });
      await lookupInput.fill(testEmail);
      await lookupInput.press("Enter");
      await page.waitForTimeout(1000);

      // Wait for Returning donor recognized panel
      const recognizedAlert = page.locator("text=Returning donor recognized");
      await expect(recognizedAlert).toBeVisible({ timeout: 15000 });

      // 4. Verify schemes and quantities automatically restored!
      const easCard = page
        .locator("button")
        .filter({ has: page.locator("h4", { hasText: "Education Adoption Scheme" }) })
        .first();
      const sewingCard = page
        .locator("button")
        .filter({ has: page.locator("h4", { hasText: "Sewing Machine Sponsorship" }) })
        .first();
      const rationCard = page
        .locator("button")
        .filter({ has: page.locator("h4", { hasText: "Ration Support" }) })
        .first();

      // All 3 cards must be selected with their respective quantities:
      // Education Adoption: 2
      // Sewing Machine: 1
      // Ration Support: 3
      await expect(easCard.locator(".qty-value")).toHaveText("2", { timeout: 10000 });
      await expect(sewingCard.locator(".qty-value")).toHaveText("1");
      await expect(rationCard.locator(".qty-value")).toHaveText("3");

      // Verify unselected cards do not have quantity controls
      const educationalAidCard = page
        .locator("button")
        .filter({ has: page.locator("h4", { hasText: "Educational Aid" }) })
        .first();
      await expect(educationalAidCard.locator(".qty-controls")).toHaveCount(0);

      // Verify total calculated amount: (30000 x 2) + (9000 x 1) + (28000 x 3) = 153,000
      const amountInput = fieldByLabel(page, "Amount");
      await expect(amountInput).toHaveValue("153000");

      // 5. Existing donor modifies quantities
      // Increase Sewing Machine Sponsorship quantity from 1 to 2
      const sewingPlusBtn = sewingCard.locator(".qty-plus");
      await sewingPlusBtn.click();
      await expect(sewingCard.locator(".qty-value")).toHaveText("2");
      // Amount updates to 153000 + 9000 = 162000
      await expect(amountInput).toHaveValue("162000");

      // 6. Deselect Ration Support
      await rationCard.click();
      await expect(rationCard.locator(".qty-controls")).toHaveCount(0);
      // Amount updates to 162000 - 84000 = 78000
      await expect(amountInput).toHaveValue("78000");
    } finally {
      // Clean up seeded document
      await DonateNowSubmission.deleteOne({ _id: seededDoc._id });
    }
  });
});
