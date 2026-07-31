# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: payment-gateway.spec.js >> CCAvenue Donate Now payment flow >> live sandbox checkout reaches a usable CCAvenue payment form
- Location: e2e\payment-gateway.spec.js:218:3

# Error details

```
Error: expect(received).not.toMatch(expected)

Expected pattern: not /10002|Working is empty/i
Received string:      "10002
Working is empty
You will be redirected to merchant’s website in
seconds
localhost:3000"
```

# Test source

```ts
  175 |       { roleKey: { $in: ["super_admin", "admin"] } },
  176 |       { role: { $in: ["Super Admin", "Admin"] } },
  177 |     ],
  178 |   })
  179 |     .sort({ roleKey: 1 })
  180 |     .lean();
  181 |   expect(admin, "An active admin user is required for the admin UI assertion").toBeTruthy();
  182 | 
  183 |   const token = await encode({
  184 |     secret: process.env.NEXTAUTH_SECRET,
  185 |     maxAge: 60 * 60,
  186 |     token: {
  187 |       id: String(admin._id),
  188 |       email: admin.email,
  189 |       name: admin.name,
  190 |       role: admin.role,
  191 |       roleKey: admin.roleKey || admin.role,
  192 |       permissionVersion: admin.permissionVersion || 1,
  193 |       sessionVersion: admin.sessionVersion || 1,
  194 |       permissionKeys: ["*"],
  195 |     },
  196 |   });
  197 |   await context.addCookies([
  198 |     {
  199 |       name: "next-auth.session-token",
  200 |       value: token,
  201 |       domain: "localhost",
  202 |       path: "/",
  203 |       httpOnly: true,
  204 |       sameSite: "Lax",
  205 |     },
  206 |   ]);
  207 | }
  208 | 
  209 | test.describe("CCAvenue Donate Now payment flow", () => {
  210 |   test.beforeAll(async () => {
  211 |     await mongoose.connect(process.env.MONGODB_URI);
  212 |   });
  213 | 
  214 |   test.afterAll(async () => {
  215 |     await mongoose.disconnect();
  216 |   });
  217 | 
  218 |   test("live sandbox checkout reaches a usable CCAvenue payment form", async ({ page }, testInfo) => {
  219 |     const diagnostics = captureBrowserDiagnostics(page);
  220 |     const stamp = Date.now();
  221 |     const donor = {
  222 |       ...makeDonor(stamp, "Gateway"),
  223 |       note: `PAYMENT-E2E-GATEWAY-${stamp}`,
  224 |     };
  225 |     let gatewayRequestMetadata = null;
  226 |     page.on("request", (request) => {
  227 |       if (!request.url().includes("test.ccavenue.com/transaction/transaction.do")) return;
  228 |       const form = request.postDataJSON() || {};
  229 |       gatewayRequestMetadata = {
  230 |         url: request.url(),
  231 |         method: request.method(),
  232 |         fields: Object.keys(form).sort(),
  233 |         encryptedRequestLength: String(form.encRequest || "").length,
  234 |         accessCodeLength: String(form.access_code || "").length,
  235 |       };
  236 |     });
  237 | 
  238 |     await openDonationForm(page);
  239 |     await fillNewDonorForm(page, donor);
  240 |     await page.screenshot({ path: testInfo.outputPath("donation-form-filled.png"), fullPage: true });
  241 | 
  242 |     const initiateResponsePromise = page.waitForResponse(
  243 |       (response) => response.url().includes("/api/payment/initiate") && response.request().method() === "POST",
  244 |       { timeout: 60_000 },
  245 |     );
  246 |     await page.getByRole("button", { name: "Donate Now", exact: true }).click();
  247 |     const initiateResponse = await initiateResponsePromise;
  248 |     expect(initiateResponse.ok()).toBeTruthy();
  249 |     const initiate = await initiateResponse.json();
  250 |     expect(initiate.orderId).toMatch(/^DON_/);
  251 | 
  252 |     await page.waitForURL(/test\.ccavenue\.com/i, { timeout: 60_000, waitUntil: "domcontentloaded" });
  253 |     await page.screenshot({ path: testInfo.outputPath("ccavenue-gateway.png"), fullPage: true });
  254 |     const gatewayText = await page.locator("body").innerText();
  255 |     await testInfo.attach("gateway-request-metadata.json", {
  256 |       body: Buffer.from(JSON.stringify(gatewayRequestMetadata, null, 2)),
  257 |       contentType: "application/json",
  258 |     });
  259 |     await testInfo.attach("gateway-page.txt", {
  260 |       body: Buffer.from(gatewayText),
  261 |       contentType: "text/plain",
  262 |     });
  263 |     await attachDiagnostics(testInfo, diagnostics);
  264 | 
  265 |     const pending = await DonateNowSubmission.findOne({ orderId: initiate.orderId }).lean();
  266 |     expect(pending).toBeTruthy();
  267 |     expect(pending.status).toBe("pending");
  268 |     expect(pending.donor.email).toBe(donor.email);
  269 |     expect(gatewayRequestMetadata).toMatchObject({
  270 |       method: "POST",
  271 |       fields: ["access_code", "encRequest"],
  272 |     });
  273 |     expect(gatewayRequestMetadata.encryptedRequestLength).toBeGreaterThan(100);
  274 | 
> 275 |     expect(gatewayText).not.toMatch(/10002|Working is empty/i);
      |                             ^ Error: expect(received).not.toMatch(expected)
  276 |     expect(gatewayText).toMatch(/card|net banking|upi|payment/i);
  277 |   });
  278 | 
  279 |   for (const scenario of [
  280 |     { name: "success", gatewayStatus: "Success", dbStatus: "success", ui: /Donation successful/i },
  281 |     { name: "failed", gatewayStatus: "Failure", dbStatus: "failed", ui: /Payment unsuccessful/i },
  282 |     { name: "cancelled", gatewayStatus: "Aborted", dbStatus: "cancelled", ui: /Payment cancelled/i },
  283 |   ]) {
  284 |     test(`encrypted callback persists ${scenario.name} status and gateway details`, async ({ page }, testInfo) => {
  285 |       const diagnostics = captureBrowserDiagnostics(page);
  286 |       const pending = await createPendingDonation(scenario.name);
  287 |       const gateway = encryptedGatewayResponse(pending, scenario.gatewayStatus, {
  288 |         failure_message: scenario.dbStatus === "success" ? "" : `${scenario.name} by sandbox test`,
  289 |       });
  290 | 
  291 |       await postGatewayCallback(page, gateway.encResp);
  292 |       await expect(page.getByText(scenario.ui).first()).toBeVisible({ timeout: 60_000 });
  293 | 
  294 |       const saved = await DonateNowSubmission.findOne({ orderId: pending.orderId }).lean();
  295 |       expect(saved.status).toBe(scenario.dbStatus);
  296 |       expect(saved.donor).toMatchObject(pending.donor);
  297 |       expect(saved.amount).toBe(pending.amount);
  298 |       expect(saved.payment).toMatchObject({
  299 |         gateway: "CCAvenue",
  300 |         trackingId: gateway.trackingId,
  301 |         transactionId: `TXN_${gateway.trackingId}`,
  302 |         paymentId: `PAY_${gateway.trackingId}`,
  303 |         bankRefNo: `BANK_${gateway.trackingId}`,
  304 |         orderStatus: scenario.gatewayStatus,
  305 |         amount: pending.amount,
  306 |         currency: "INR",
  307 |         verificationStatus: "verified",
  308 |       });
  309 |       expect(saved.payment.callbackReceivedAt).toBeTruthy();
  310 |       expect(saved.completedAt).toBeTruthy();
  311 |       expect(saved.createdAt).toBeTruthy();
  312 |       await page.screenshot({ path: testInfo.outputPath(`${scenario.name}-callback-result.png`), fullPage: true });
  313 |       await testInfo.attach("saved-donation.json", {
  314 |         body: Buffer.from(
  315 |           JSON.stringify(
  316 |             {
  317 |               orderId: saved.orderId,
  318 |               donor: saved.donor,
  319 |               amount: saved.amount,
  320 |               currency: saved.currency,
  321 |               status: saved.status,
  322 |               payment: saved.payment,
  323 |               createdAt: saved.createdAt,
  324 |               completedAt: saved.completedAt,
  325 |             },
  326 |             null,
  327 |             2,
  328 |           ),
  329 |         ),
  330 |         contentType: "application/json",
  331 |       });
  332 |       await attachDiagnostics(testInfo, diagnostics);
  333 | 
  334 |       if (scenario.dbStatus !== "success") return;
  335 | 
  336 |       await authenticateAdmin(page.context());
  337 |       await page.goto("/admin/donations", { waitUntil: "domcontentloaded" });
  338 |       const search = page.getByPlaceholder("Search donor/order/purpose...");
  339 |       await expect(search).toBeVisible({ timeout: 60_000 });
  340 |       await search.fill(saved.orderId);
  341 |       const row = page.locator("tr", { hasText: saved.orderId });
  342 |       await expect(row).toContainText(saved.donor.name, { timeout: 30_000 });
  343 |       await expect(row).toContainText("SUCCESS");
  344 |       await expect(row).toContainText(saved.payment.transactionId);
  345 |       await row.getByRole("button").click();
  346 |       const modal = page.getByRole("dialog", { name: "Donation Details" });
  347 |       await expect(modal).toContainText(saved.payment.paymentId);
  348 |       await expect(modal).toContainText(saved.payment.bankRefNo);
  349 |       await expect(modal).toContainText("verified");
  350 |       await page.screenshot({ path: testInfo.outputPath("admin-success-record.png"), fullPage: true });
  351 |     });
  352 |   }
  353 | 
  354 |   test("successful callback with mismatched amount is rejected", async ({ page }, testInfo) => {
  355 |     const diagnostics = captureBrowserDiagnostics(page);
  356 |     const pending = await createPendingDonation("mismatch", 250);
  357 |     const gateway = encryptedGatewayResponse(pending, "Success", { amount: "1.00" });
  358 | 
  359 |     await postGatewayCallback(page, gateway.encResp);
  360 |     await expect(page.getByText(/Payment unsuccessful/i).first()).toBeVisible({ timeout: 60_000 });
  361 |     const saved = await DonateNowSubmission.findOne({ orderId: pending.orderId }).lean();
  362 |     expect(saved.status).toBe("failed");
  363 |     expect(saved.payment.verificationStatus).toBe("mismatch");
  364 |     expect(saved.payment.verificationMessage).toContain("Amount does not match");
  365 |     await attachDiagnostics(testInfo, diagnostics);
  366 |   });
  367 | });
  368 | 
```