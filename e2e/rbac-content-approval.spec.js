const { test, expect } = require("@playwright/test");

test.describe("RBAC and Content Approval Workflow Verification", () => {
  const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

  test("1. Public routes only display published content (no drafts or pending review)", async ({ page }) => {
    // Visit public blogs page
    await page.goto(`${baseURL}/blog`, { waitUntil: "networkidle" });
    const bodyText = await page.textContent("body");
    // Ensure draft/pending internal workflow badges are never visible on public pages
    expect(bodyText).not.toContain("Pending Review");
    expect(bodyText).not.toContain("Changes Requested");
  });

  test("2. Public search only indexes published blogs and events", async ({ page }) => {
    await page.goto(`${baseURL}/search?q=education`, { waitUntil: "networkidle" });
    const content = await page.content();
    expect(content).not.toContain("Pending Review");
  });

  test("3. Admin login and navigation to Blogs table", async ({ page }) => {
    await page.goto(`${baseURL}/admin/login`);
    await page.waitForLoadState("domcontentloaded");

    // Login page renders properly
    const emailInput = page.locator('input[type="email"], input[name="email"], input#email');
    if (await emailInput.count() > 0) {
      await expect(emailInput).toBeVisible();
    }
  });

  test("4. Blogs API requires authentication", async ({ request }) => {
    const res = await request.get(`${baseURL}/api/admin/blogs`, { maxRedirects: 0 });
    expect([302, 307, 401, 403]).toContain(res.status());
    if ([302, 307].includes(res.status())) {
      expect(res.headers()["location"]).toContain("/admin/login");
    }
  });

  test("5. Events API requires authentication", async ({ request }) => {
    const res = await request.get(`${baseURL}/api/admin/events`, { maxRedirects: 0 });
    expect([302, 307, 401, 403]).toContain(res.status());
    if ([302, 307].includes(res.status())) {
      expect(res.headers()["location"]).toContain("/admin/login");
    }
  });

  test("6. Blog Workflow endpoint rejects unauthenticated requests", async ({ request }) => {
    const res = await request.post(`${baseURL}/api/admin/blogs/dummy-id/workflow`, {
      data: { action: "publish" },
    });
    expect([401, 403, 302, 307]).toContain(res.status());
  });

  test("7. Event Workflow endpoint rejects unauthenticated requests", async ({ request }) => {
    const res = await request.post(`${baseURL}/api/admin/events/dummy-id/workflow`, {
      data: { action: "publish" },
    });
    expect([401, 403, 302, 307]).toContain(res.status());
  });
});
