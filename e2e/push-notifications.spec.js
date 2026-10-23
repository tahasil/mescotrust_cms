const { test, expect } = require("@playwright/test");
const { encode } = require("next-auth/jwt");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

const User = require("../models/User");
const PushNotification = require("../models/PushNotification");
const PushNotificationSettings = require("../models/PushNotificationSettings");

async function authenticateAdmin(context) {
  const admin = await User.findOne({
    status: "active",
    $or: [
      { roleKey: "super_admin" },
      { role: "Super Admin" },
      { roleKey: "admin" },
      { role: "Admin" },
    ],
  })
    .sort({ roleKey: -1 })
    .lean();
  expect(admin, "An active admin user is required for the admin UI test").toBeTruthy();

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

test.describe.serial("Push Notifications Module Flow-Wise E2E", () => {
  let createdTitle = `Test Playwright Notification ${Date.now()}`;

  test.beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    await PushNotificationSettings.findOneAndUpdate(
      { moduleName: "push-settings" },
      { $set: { showBellIcon: true } },
      { upsert: true }
    );
  });

  test.beforeEach(async ({ context, page }) => {
    page.on("pageerror", (err) => console.log(">>> BROWSER PAGEERROR:", err.message));
    page.on("console", (msg) => {
      console.log(`>>> BROWSER ${msg.type().toUpperCase()}:`, msg.text());
    });
    page.on("response", async (res) => {
      if (res.status() >= 400) {
        let body = "";
        try {
          body = await res.text();
        } catch {}
        console.log(`>>> HTTP ${res.status()} ${res.url()}:`, body);
      }
    });

    // Pre-accept cookie consent so the banner never intercepts pointer events
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem("mesco_cookie_consent", "accepted");
      } catch {}
    });
  });

  test.afterAll(async () => {
    // Cleanup any test notifications created during the test
    try {
      await PushNotification.deleteMany({
        title: { $regex: /Playwright Notification/i },
      });
      await PushNotificationSettings.findOneAndUpdate(
        { moduleName: "push-settings" },
        { $set: { showBellIcon: false } }
      );
    } catch {
      /* ignore */
    }
  });

  test("Step 1: Public Frontend - Direct Notification Card, Bell Toggle, and Title Verification", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // The Notifications card appears directly on the page
    const card = page.locator(".mesco-push-card");
    await expect(card).toBeVisible({ timeout: 30_000 });

    // Verify title is "Notifications" (not "Browser Notifications")
    await expect(card.locator(".mesco-push-card-title")).toHaveText("Notifications");

    // Close the card
    await card.locator(".mesco-push-close-btn").click();
    await expect(card).not.toBeVisible();

    // Floating bell button is visible and toggles card back open
    const bellBtn = page.locator(".mesco-push-bell-btn");
    await expect(bellBtn).toBeVisible({ timeout: 10_000 });
    await bellBtn.click();
    await expect(card).toBeVisible({ timeout: 10_000 });
  });

  test("Step 2: Admin Navigation and Module Load", async ({ context, page }) => {
    await authenticateAdmin(context);

    // Navigate to Admin Dashboard
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    // Locate Push Notifications in sidebar
    const sidebarLink = page.locator('a[href="/admin/push-notifications"]').first();
    await expect(sidebarLink).toBeVisible({ timeout: 15_000 });

    // Click navigation item
    await sidebarLink.click();
    await page.waitForURL("**/admin/push-notifications", { timeout: 15_000 });

    // Verify page title and metric overview cards
    await expect(page.locator("text=Push Notifications").first()).toBeVisible();
    await expect(page.locator("text=Active Subscribers").first()).toBeVisible();
    await expect(page.locator("text=Broadcasts Sent").first()).toBeVisible();
    await expect(page.locator("text=Delivery Rate").first()).toBeVisible();
  });

  test("Step 2b: Admin Card & Bell Icon Settings Drawer Verification", async ({ context, page }) => {
    await authenticateAdmin(context);
    await page.goto("/admin/push-notifications", { waitUntil: "networkidle" });

    // Open Card Settings Drawer
    const settingsBtn = page.locator('button[data-testid="card-settings-btn"]');
    await expect(settingsBtn).toBeVisible({ timeout: 10_000 });
    const [initialGet] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/settings") && res.request().method() === "GET" && res.status() === 200),
      settingsBtn.click(),
    ]);
    expect(initialGet.ok()).toBeTruthy();

    // Verify Drawer opens with 560px and correct title
    await expect(page.locator(".ant-drawer-title:has-text('Notification Settings')")).toBeVisible({ timeout: 10_000 });

    // Verify Show Card on Frontend card is REMOVED from the drawer
    await expect(page.locator("text=Show Card on Frontend")).not.toBeVisible();

    // Verify Show Bell Icon on Frontend card is present
    await expect(page.locator("text=Show Bell Icon on Frontend")).toBeVisible();
    await expect(page.locator("text=When enabled, a floating bell icon button will appear on the bottom-left")).toBeVisible();

    // Ensure switch is ON initially, then toggle OFF
    const bellSwitch = page.locator('.ant-drawer-open button[data-testid="show-bell-icon-switch"]');
    await expect(bellSwitch).toBeVisible({ timeout: 10_000 });
    await expect(bellSwitch).toBeEnabled({ timeout: 10_000 });
    // If already checked, click to uncheck
    if (await bellSwitch.evaluate((el) => el.getAttribute("aria-checked") === "true")) {
      await bellSwitch.click();
    }
    await expect(bellSwitch).not.toHaveClass(/ant-switch-checked/);

    // Verify Save Settings works cleanly with switch OFF
    const saveBtn = page.locator('button[data-testid="save-card-settings-btn"]');
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    const [putResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/settings") && res.request().method() === "PUT" && res.status() === 200),
      saveBtn.click(),
    ]);
    expect(putResponse.ok()).toBeTruthy();

    // Drawer should close after save
    await expect(page.locator(".ant-drawer-title:has-text('Notification Settings')")).not.toBeVisible({ timeout: 10_000 });

    const [getSettings] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/settings") && res.request().method() === "GET" && res.status() === 200),
      settingsBtn.click(),
    ]);
    expect(getSettings.ok()).toBeTruthy();
    await expect(page.locator(".ant-drawer-title:has-text('Notification Settings')")).toBeVisible({ timeout: 10_000 });
    await expect(bellSwitch).toBeEnabled({ timeout: 10_000 });
    await expect(bellSwitch).not.toHaveClass(/ant-switch-checked/);

    // Close drawer
    await page.locator(".ant-drawer-close").first().click();
    await expect(page.locator(".ant-drawer-title:has-text('Notification Settings')")).not.toBeVisible({ timeout: 10_000 });

    // Verify on Frontend: bell button is NOT visible, card IS visible
    const publicPage = await context.newPage();
    await publicPage.goto("/", { waitUntil: "networkidle" });
    await expect(publicPage.locator(".mesco-push-bell-btn")).not.toBeVisible({ timeout: 10_000 });
    await expect(publicPage.locator(".mesco-push-card")).toBeVisible({ timeout: 10_000 });
    await publicPage.close();
  });

  test("Step 3: Admin Create Draft Notification with Live Preview", async ({ context, page }) => {
    await authenticateAdmin(context);
    await page.goto("/admin/push-notifications", { waitUntil: "networkidle" });
    await expect(page.locator(".ant-table")).toBeVisible({ timeout: 20_000 });

    // Click Create Notification button
    const createBtn = page.locator('button[data-testid="create-notification-btn"]');
    await expect(createBtn).toBeVisible({ timeout: 15_000 });
    await createBtn.click();

    // Wait for drawer to open
    await expect(page.locator(".ant-drawer-title:has-text('Create')")).toBeVisible({ timeout: 15_000 });
    const drawer = page.locator(".push-notification-drawer, .ant-drawer-content").first();

    const testMessage = "This is an automated test push message sent by Playwright.";

    // Fill form
    await drawer.locator("#title").fill(createdTitle);
    await drawer.locator("#message").fill(testMessage);

    // Verify live OS preview reflects input
    const previewBox = drawer.locator(".ant-card").first();
    await expect(previewBox.locator(`text=${createdTitle}`)).toBeVisible();
    await expect(previewBox.locator(`text=${testMessage}`)).toBeVisible();

    // Click Save as Draft
    const saveDraftBtn = drawer.locator('button[data-testid="save-draft-btn"]');
    await saveDraftBtn.click();

    // Drawer should close
    await expect(page.locator(".ant-drawer-title")).not.toBeVisible({ timeout: 15_000 });

    // Table should show the draft row
    const row = page.locator("tr").filter({ hasText: createdTitle });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.locator("text=Draft")).toBeVisible();
  });

  test("Step 4: Admin Edit Draft Notification", async ({ context, page }) => {
    await authenticateAdmin(context);
    await page.goto("/admin/push-notifications", { waitUntil: "networkidle" });
    await expect(page.locator(".ant-table")).toBeVisible({ timeout: 20_000 });

    // Find the draft row
    const row = page.locator("tr").filter({ hasText: createdTitle });
    await expect(row).toBeVisible({ timeout: 15_000 });

    // Click Edit button
    const editBtn = row.locator('button[data-testid="table-edit-btn"]');
    await expect(editBtn).toBeVisible({ timeout: 10_000 });
    await editBtn.click();

    // Drawer opens
    await expect(page.locator(".ant-drawer-title:has-text('Edit')")).toBeVisible({ timeout: 15_000 });
    const drawer = page.locator(".push-notification-drawer, .ant-drawer-content").first();

    // Update message
    const updatedMessage = "This message was updated by Playwright edit flow.";
    await drawer.locator("#message").fill(updatedMessage);

    // Save as Draft
    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/push-notifications") && res.request().method() === "PUT" && res.status() === 200,
        { timeout: 35_000 }
      ),
      drawer.locator('button[data-testid="save-draft-btn"]').click(),
    ]);
    await expect(page.locator(".ant-drawer-open")).not.toBeVisible({ timeout: 15_000 });

    // Check table has updated message snippet
    await expect(page.locator(`text=${updatedMessage}`).first()).toBeVisible({ timeout: 15_000 });
  });

  test("Step 5: Admin Send Notification Immediately and Verify Status", async ({ context, page }) => {
    await authenticateAdmin(context);
    await page.goto("/admin/push-notifications", { waitUntil: "networkidle" });
    await expect(page.locator(".ant-table")).toBeVisible({ timeout: 20_000 });

    // Find the test draft row
    const row = page.locator("tr").filter({ hasText: createdTitle });
    await expect(row).toBeVisible({ timeout: 15_000 });

    // Click Send button
    const sendBtn = row.locator('button[data-testid="table-send-btn"]');
    await expect(sendBtn).toBeVisible({ timeout: 10_000 });
    await sendBtn.click();

    // Confirm in popconfirm
    const confirmBtn = page.locator('.ant-popconfirm button:has-text("Send")').last();
    await expect(confirmBtn).toBeVisible({ timeout: 10_000 });
    
    const [sendResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/send") && res.status() === 200, { timeout: 35_000 }),
      confirmBtn.click(),
    ]);
    expect(sendResponse.ok()).toBeTruthy();

    // Row status should transition to Sent
    await expect(row.locator("text=Sent")).toBeVisible({ timeout: 20_000 });
  });

  test("Step 6: Admin View Delivery Details Modal", async ({ context, page }) => {
    await authenticateAdmin(context);
    await page.goto("/admin/push-notifications", { waitUntil: "networkidle" });
    await expect(page.locator(".ant-table")).toBeVisible({ timeout: 20_000 });

    // Find the sent test notification
    const row = page.locator("tr").filter({ hasText: createdTitle });
    await expect(row).toBeVisible({ timeout: 15_000 });

    // Click Details button
    const detailsBtn = row.locator('button[data-testid="table-details-btn"]');
    await expect(detailsBtn).toBeVisible({ timeout: 10_000 });
    await detailsBtn.click();

    // Modal should be visible
    await expect(page.locator(".ant-modal-title:has-text('Notification Delivery & Details')")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("text=Delivery Handoff Rate").first()).toBeVisible();

    // Close modal
    await page.locator('.ant-modal-footer button:has-text("Close")').click();
    await expect(page.locator(".ant-modal-title")).not.toBeVisible({ timeout: 10_000 });
  });

  test("Step 7: Admin Delete Notification Record", async ({ context, page }) => {
    await authenticateAdmin(context);
    await page.goto("/admin/push-notifications", { waitUntil: "networkidle" });
    await expect(page.locator(".ant-table")).toBeVisible({ timeout: 20_000 });

    // Locate the test notification
    const row = page.locator("tr").filter({ hasText: createdTitle });
    await expect(row).toBeVisible({ timeout: 15_000 });

    // Click Delete button
    const deleteBtn = row.locator('button[data-testid="table-delete-btn"]');
    await expect(deleteBtn).toBeVisible({ timeout: 10_000 });
    await deleteBtn.click();

    // Confirm Popconfirm
    const confirmDelete = page.locator('.ant-popconfirm button:has-text("Delete")').last();
    await expect(confirmDelete).toBeVisible({ timeout: 10_000 });
    await confirmDelete.click({ force: true });

    // Row should be removed from the table
    await expect(row).not.toBeVisible({ timeout: 15_000 });
  });
});
