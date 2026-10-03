const { test, expect } = require("@playwright/test");
const { encode } = require("next-auth/jwt");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

const { encrypt } = require("../lib/ccavenue");
const DonateNowSubmission = require("../models/DonateNowSubmission");
const User = require("../models/User");

function fieldByLabel(page, label) {
  return page.locator("label", { hasText: label }).locator("..").locator("input, textarea").first();
}

async function selectAntOption(page, placeholder, optionText) {
  await page.locator(`.ant-select:has(.ant-select-selection-placeholder:text-is("${placeholder}"))`).click();
  await page.locator(".ant-select-item-option", { hasText: optionText }).last().click();
}

function captureBrowserDiagnostics(page) {
  const consoleMessages = [];
  const failedRequests = [];
  const badResponses = [];

  page.on("console", (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
  page.on("pageerror", (error) => consoleMessages.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) =>
    failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || "failed"}`),
  );
  page.on("response", (response) => {
    if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
  });

  return { consoleMessages, failedRequests, badResponses };
}

async function attachDiagnostics(testInfo, diagnostics) {
  await testInfo.attach("browser-console.log", {
    body: Buffer.from(diagnostics.consoleMessages.join("\n") || "No console messages"),
    contentType: "text/plain",
  });
  await testInfo.attach("failed-requests.log", {
    body: Buffer.from(diagnostics.failedRequests.join("\n") || "No failed requests"),
    contentType: "text/plain",
  });
  await testInfo.attach("http-errors.log", {
    body: Buffer.from(diagnostics.badResponses.join("\n") || "No HTTP responses >= 400"),
    contentType: "text/plain",
  });
}

async function openDonationForm(page) {
  await page.goto("/donate-now", { waitUntil: "domcontentloaded" });
  const acceptCookies = page.getByRole("button", { name: "Accept All" });
  if (await acceptCookies.count()) await acceptCookies.click({ force: true }).catch(() => {});

  const donorTypePlaceholder = page.locator(".ant-select-selection-placeholder", {
    hasText: "Select donor type",
  });
  await donorTypePlaceholder.evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await expect(donorTypePlaceholder).toBeVisible({ timeout: 20_000 });
}

async function fillNewDonorForm(page, donor) {
  await selectAntOption(page, "Select donor type", "New Donor");
  await fieldByLabel(page, "Full Name").fill(donor.name);
  await fieldByLabel(page, "PAN No.").fill(donor.pan);
  await fieldByLabel(page, "Email ID").fill(donor.email);
  await fieldByLabel(page, "Mobile No.").fill(donor.mobile);
  await fieldByLabel(page, "Pincode").fill(donor.pincode);
  await fieldByLabel(page, "City").fill(donor.city);
  await fieldByLabel(page, "State").fill(donor.state);
  await fieldByLabel(page, "Country").fill(donor.country);
  await fieldByLabel(page, "Address").fill(donor.address);
  await fieldByLabel(page, "Note").fill(donor.note);
}

function makeDonor(stamp, scenario) {
  return {
    name: `Playwright ${scenario} Donor`,
    email: `playwright.${scenario.toLowerCase()}.${stamp}@example.com`,
    mobile: `9${String(stamp).slice(-9)}`,
    pan: "ABCDE1234F",
    pincode: "400001",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    address: "Playwright E2E, Mumbai",
  };
}

async function createPendingDonation(scenario, amount = 125) {
  const stamp = Date.now() + Math.floor(Math.random() * 10000);
  const orderId = `DON_E2E_${scenario.toUpperCase()}_${stamp}`;
  const donor = makeDonor(stamp, scenario);
  const donation = await DonateNowSubmission.create({
    orderId,
    amount,
    currency: "INR",
    purpose: "Playwright Payment E2E",
    purposeId: "playwright-payment-e2e",
    zakat: "No",
    interestMoney: "No",
    studentsCount: "1",
    note: `PAYMENT-E2E-${scenario.toUpperCase()}-${stamp}`,
    donor,
    donorType: "new",
    source: "Playwright E2E",
    pagePath: "/donate-now",
    status: "pending",
    payment: {
      gateway: "CCAvenue",
      amount,
      currency: "INR",
    },
  });
  return donation.toObject();
}

function encryptedGatewayResponse(donation, orderStatus, overrides = {}) {
  const trackingId = overrides.tracking_id || String(Date.now());
  const params = new URLSearchParams({
    order_id: donation.orderId,
    merchant_id: process.env.CCAVENUE_MERCHANT_ID,
    order_status: orderStatus,
    tracking_id: trackingId,
    transaction_id: overrides.transaction_id || `TXN_${trackingId}`,
    payment_id: overrides.payment_id || `PAY_${trackingId}`,
    bank_ref_no: overrides.bank_ref_no || `BANK_${trackingId}`,
    payment_mode: overrides.payment_mode || "Credit Card",
    card_name: overrides.card_name || "Visa",
    status_code: overrides.status_code || (orderStatus === "Success" ? "0" : "1"),
    status_message: overrides.status_message || orderStatus,
    failure_message: overrides.failure_message || "",
    response_code: overrides.response_code || (orderStatus === "Success" ? "0" : "1"),
    amount: String(overrides.amount ?? donation.amount.toFixed(2)),
    currency: overrides.currency || donation.currency,
  });
  return {
    encResp: encrypt(params.toString(), process.env.CCAVENUE_WORKING_KEY),
    trackingId,
  };
}

async function postGatewayCallback(page, encResp) {
  await page.goto("/donate-now", { waitUntil: "domcontentloaded" });
  const callbackResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/payment/callback") && response.request().method() === "POST",
    { timeout: 60_000 },
  );
  await page.evaluate((encryptedResponse) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/payment/callback";
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "encResp";
    input.value = encryptedResponse;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  }, encResp);
  const callbackResponse = await callbackResponsePromise;
  expect(callbackResponse.status()).toBe(303);
  await page.waitForURL((url) => url.pathname === "/donate-now", { timeout: 60_000 });
}

async function authenticateAdmin(context) {
  const admin = await User.findOne({
    status: "active",
    $or: [
      { roleKey: { $in: ["super_admin", "admin"] } },
      { role: { $in: ["Super Admin", "Admin"] } },
    ],
  })
    .sort({ roleKey: 1 })
    .lean();
  expect(admin, "An active admin user is required for the admin UI assertion").toBeTruthy();

  const token = await encode({
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 60 * 60,
    token: {
      id: String(admin._id),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      roleKey: admin.roleKey || admin.role,
      permissionVersion: admin.permissionVersion || 1,
      sessionVersion: admin.sessionVersion || 1,
      permissionKeys: ["*"],
    },
  });
  await context.addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

test.describe("CCAvenue Donate Now payment flow", () => {
  test.beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  test.afterAll(async () => {
    await mongoose.disconnect();
  });

  test("live sandbox checkout reaches a usable CCAvenue payment form", async ({ page }, testInfo) => {
    const diagnostics = captureBrowserDiagnostics(page);
    const stamp = Date.now();
    const donor = {
      ...makeDonor(stamp, "Gateway"),
      note: `PAYMENT-E2E-GATEWAY-${stamp}`,
    };
    let gatewayRequestMetadata = null;
    page.on("request", (request) => {
      if (!request.url().includes("test.ccavenue.com/transaction/transaction.do")) return;
      const form = request.postDataJSON() || {};
      gatewayRequestMetadata = {
        url: request.url(),
        method: request.method(),
        fields: Object.keys(form).sort(),
        encryptedRequestLength: String(form.encRequest || "").length,
        accessCodeLength: String(form.access_code || "").length,
      };
    });

    await openDonationForm(page);
    await fillNewDonorForm(page, donor);
    await page.screenshot({ path: testInfo.outputPath("donation-form-filled.png"), fullPage: true });

    const initiateResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/payment/initiate") && response.request().method() === "POST",
      { timeout: 60_000 },
    );
    await page.getByRole("button", { name: "Donate Now", exact: true }).click();
    const initiateResponse = await initiateResponsePromise;
    expect(initiateResponse.ok()).toBeTruthy();
    const initiate = await initiateResponse.json();
    expect(initiate.orderId).toMatch(/^DON_/);

    await page.waitForURL(/test\.ccavenue\.com/i, { timeout: 60_000, waitUntil: "domcontentloaded" });
    await page.screenshot({ path: testInfo.outputPath("ccavenue-gateway.png"), fullPage: true });
    const gatewayText = await page.locator("body").innerText();
    await testInfo.attach("gateway-request-metadata.json", {
      body: Buffer.from(JSON.stringify(gatewayRequestMetadata, null, 2)),
      contentType: "application/json",
    });
    await testInfo.attach("gateway-page.txt", {
      body: Buffer.from(gatewayText),
      contentType: "text/plain",
    });
    await attachDiagnostics(testInfo, diagnostics);

    const pending = await DonateNowSubmission.findOne({ orderId: initiate.orderId }).lean();
    expect(pending).toBeTruthy();
    expect(pending.status).toBe("pending");
    expect(pending.donor.email).toBe(donor.email);
    expect(gatewayRequestMetadata).toMatchObject({
      method: "POST",
      fields: ["access_code", "encRequest"],
    });
    expect(gatewayRequestMetadata.encryptedRequestLength).toBeGreaterThan(100);

    expect(gatewayText).not.toMatch(/10002|Working is empty/i);
    expect(gatewayText).toMatch(/card|net banking|upi|payment/i);
  });

  for (const scenario of [
    { name: "success", gatewayStatus: "Success", dbStatus: "success", ui: /Donation successful/i },
    { name: "failed", gatewayStatus: "Failure", dbStatus: "failed", ui: /Payment unsuccessful/i },
    { name: "cancelled", gatewayStatus: "Aborted", dbStatus: "cancelled", ui: /Payment cancelled/i },
  ]) {
    test(`encrypted callback persists ${scenario.name} status and gateway details`, async ({ page }, testInfo) => {
      const diagnostics = captureBrowserDiagnostics(page);
      const pending = await createPendingDonation(scenario.name);
      const gateway = encryptedGatewayResponse(pending, scenario.gatewayStatus, {
        failure_message: scenario.dbStatus === "success" ? "" : `${scenario.name} by sandbox test`,
      });

      await postGatewayCallback(page, gateway.encResp);
      await expect(page.getByText(scenario.ui).first()).toBeVisible({ timeout: 60_000 });

      const saved = await DonateNowSubmission.findOne({ orderId: pending.orderId }).lean();
      expect(saved.status).toBe(scenario.dbStatus);
      expect(saved.donor).toMatchObject(pending.donor);
      expect(saved.amount).toBe(pending.amount);
      expect(saved.payment).toMatchObject({
        gateway: "CCAvenue",
        transactionId: `TXN_${gateway.trackingId}`,
        bankRefNo: `BANK_${gateway.trackingId}`,
        amount: pending.amount,
        currency: "INR",
      });
      // Gateway identifiers that must never be persisted.
      expect(saved.payment.trackingId).toBeUndefined();
      expect(saved.payment.paymentId).toBeUndefined();
      expect(saved.payment.orderStatus).toBeUndefined();
      expect(saved.payment.verificationStatus).toBeUndefined();
      expect(saved.payment.callbackReceivedAt).toBeTruthy();
      expect(saved.completedAt).toBeTruthy();
      expect(saved.createdAt).toBeTruthy();
      await page.screenshot({ path: testInfo.outputPath(`${scenario.name}-callback-result.png`), fullPage: true });
      await testInfo.attach("saved-donation.json", {
        body: Buffer.from(
          JSON.stringify(
            {
              orderId: saved.orderId,
              donor: saved.donor,
              amount: saved.amount,
              currency: saved.currency,
              status: saved.status,
              payment: saved.payment,
              createdAt: saved.createdAt,
              completedAt: saved.completedAt,
            },
            null,
            2,
          ),
        ),
        contentType: "application/json",
      });
      await attachDiagnostics(testInfo, diagnostics);

      if (scenario.dbStatus !== "success") return;

      await authenticateAdmin(page.context());
      await page.goto("/admin/donations", { waitUntil: "domcontentloaded" });
      const search = page.getByPlaceholder("Search donor/order/purpose...");
      await expect(search).toBeVisible({ timeout: 60_000 });
      await search.fill(saved.orderId);
      const row = page.locator("tr", { hasText: saved.orderId });
      await expect(row).toContainText(saved.donor.name, { timeout: 30_000 });
      await expect(row).toContainText("SUCCESS");
      await expect(row).toContainText(saved.payment.transactionId);
      await row.getByRole("button").click();
      const modal = page.getByRole("dialog", { name: "Donation Details" });
      await expect(modal).toContainText(saved.payment.bankRefNo);
      // Removed fields must not appear anywhere in the details modal.
      for (const removedLabel of [
        "Purpose ID",
        "Payment ID",
        "Tracking ID",
        "Gateway Status",
        "Verification Status",
      ]) {
        await expect(modal).not.toContainText(removedLabel);
      }
      await page.screenshot({ path: testInfo.outputPath("admin-success-record.png"), fullPage: true });
    });
  }

  test("successful callback with mismatched amount is rejected", async ({ page }, testInfo) => {
    const diagnostics = captureBrowserDiagnostics(page);
    const pending = await createPendingDonation("mismatch", 250);
    const gateway = encryptedGatewayResponse(pending, "Success", { amount: "1.00" });

    await postGatewayCallback(page, gateway.encResp);
    await expect(page.getByText(/Payment unsuccessful/i).first()).toBeVisible({ timeout: 60_000 });
    const saved = await DonateNowSubmission.findOne({ orderId: pending.orderId }).lean();
    expect(saved.status).toBe("failed");
    expect(saved.payment.verificationStatus).toBe("mismatch");
    expect(saved.payment.verificationMessage).toContain("Amount does not match");
    await attachDiagnostics(testInfo, diagnostics);
  });
});
