const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

test.describe("404 and SEO Status Code Verification Suite", () => {
  test("1. Existing homepage returns HTTP 200", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    expect(response.status()).toBe(200);
  });

  test("2. Existing About Us page returns HTTP 200", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/about-us/mesco-at-glance`, {
      waitUntil: "domcontentloaded",
    });
    expect(response.status()).toBe(200);
  });

  test("3. Existing Blog detail page returns HTTP 200", async ({ page }) => {
    const response = await page.goto(
      `${BASE_URL}/blog/future-of-education-technology-transforming-learning`,
      { waitUntil: "domcontentloaded" },
    );
    expect(response.status()).toBe(200);
  });

  test("4. Existing Event detail page returns HTTP 200", async ({ page }) => {
    const response = await page.goto(
      `${BASE_URL}/events/top-ranking-students-felicitation-function`,
      { waitUntil: "domcontentloaded" },
    );
    expect(response.status()).toBe(200);
  });

  test("5. Random non-existing URL returns HTTP 404", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/this-page-does-not-exist-12345`, {
      waitUntil: "domcontentloaded",
    });
    expect(response.status()).toBe(404);
  });

  test("6. Invalid Blog slug returns HTTP 404", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/blog/non-existing-blog-slug-xyz`, {
      waitUntil: "domcontentloaded",
    });
    expect(response.status()).toBe(404);
  });

  test("7. Invalid Event slug returns HTTP 404", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/events/non-existing-event-slug-xyz`, {
      waitUntil: "domcontentloaded",
    });
    expect(response.status()).toBe(404);
  });

  test("8. Permanently moved /home returns HTTP 301 and resolves to homepage", async ({
    request,
  }) => {
    const res = await request.get(`${BASE_URL}/home`, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers()["location"]).toBe("/");
  });

  test("9. Custom 404 page UI displays properly on desktop (1280x800)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto(`${BASE_URL}/non-existent-desktop-check`, {
      waitUntil: "domcontentloaded",
    });
    expect(response.status()).toBe(404);

    // Verify 404 Error badge
    const badge = page.locator(".not-found-badge");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("404");

    // Verify Title
    const title = page.locator(".not-found-title");
    await expect(title).toBeVisible();
    await expect(title).toContainText("Page Not Found");

    // Verify Description
    const desc = page.locator(".not-found-desc");
    await expect(desc).toBeVisible();

    // Verify Back to Home CTA
    const homeBtn = page.locator(".btn-shimmer-wrap");
    await expect(homeBtn).toBeVisible();
    await expect(homeBtn).toContainText("Back to Home");

    // Verify Section Exploration is removed
    const exploreArea = page.locator(".not-found-explore");
    await expect(exploreArea).toHaveCount(0);
  });

  test("10. Custom 404 page is responsive on tablet (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const response = await page.goto(`${BASE_URL}/non-existent-tablet-check`, {
      waitUntil: "domcontentloaded",
    });
    expect(response.status()).toBe(404);

    const title = page.locator(".not-found-title");
    await expect(title).toBeVisible();
    await expect(title).toContainText("Page Not Found");

    const homeBtn = page.locator(".btn-shimmer-wrap");
    await expect(homeBtn).toBeVisible();
  });

  test("11. Custom 404 page is responsive on mobile (375x667)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const response = await page.goto(`${BASE_URL}/non-existent-mobile-check`, {
      waitUntil: "domcontentloaded",
    });
    expect(response.status()).toBe(404);

    const title = page.locator(".not-found-title");
    await expect(title).toBeVisible();

    const homeBtn = page.locator(".btn-shimmer-wrap");
    await expect(homeBtn).toBeVisible();
  });

  test("12. 'Back to Home' button navigates back to homepage", async ({ page }) => {
    await page.goto(`${BASE_URL}/non-existent-nav-check`, {
      waitUntil: "domcontentloaded",
    });

    const homeBtn = page.locator(".btn-shimmer-wrap");
    await expect(homeBtn).toBeVisible();
    await homeBtn.click();

    await page.waitForURL(`${BASE_URL}/`, { timeout: 15000 });
    expect(page.url()).toBe(`${BASE_URL}/`);
  });
});
