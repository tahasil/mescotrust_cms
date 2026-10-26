const { test, expect } = require("@playwright/test");

test.describe("Advanced Header Search & Results Page", () => {
  test("header search input debounces, shows categorized results, and navigates to search page", async ({
    page,
  }) => {
    // 1. Visit Home Page
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    // 2. Open Search Box in Header (Desktop)
    const searchTrigger = page.locator(".appearance-desktop .appearance-search");
    await expect(searchTrigger).toBeVisible({ timeout: 15000 });
    // Ensure element is interactive
    await page.waitForTimeout(1000);
    await searchTrigger.click();

    // 3. Search dialog overlay should become visible
    const searchDialog = page.locator(".appearance-search-overlay.is-open");
    await expect(searchDialog).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator(".appearance-search-input");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("scholarship");

    // 4. Dropdown results should appear
    const searchResults = page.locator(".appearance-search-results");
    await expect(searchResults).toBeVisible();

    // Wait for at least one result
    const resultItem = page.locator(".appearance-search-result").first();
    await expect(resultItem).toBeVisible({ timeout: 15000 });

    // View All button should be visible
    const viewAllBtn = page.locator(".appearance-search-view-all");
    await expect(viewAllBtn).toBeVisible();
    await expect(viewAllBtn).toContainText("scholarship");

    // 5. Submit search via Enter key
    await searchInput.press("Enter");

    // 6. Should navigate to /search?q=scholarship
    await expect(page).toHaveURL(/.*\/search\?q=scholarship/, { timeout: 10000 });

    // 7. Verify Search Results Page UI
    const searchTitle = page.locator(".search-title");
    await expect(searchTitle).toBeVisible();
    await expect(searchTitle).toContainText("scholarship");

    // Filter tabs should be visible
    const tabsBar = page.locator(".search-tabs-bar");
    await expect(tabsBar).toBeVisible();

    const allTab = page.locator(".search-tab-btn", { hasText: "All" });
    await expect(allTab).toBeVisible();

    const reportsTab = page.locator(".search-tab-btn", { hasText: "Annual Reports" });
    await expect(reportsTab).toBeVisible();

    // Verify result cards exist
    const cards = page.locator(".search-result-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // 8. Test filter tab switching to Annual Reports
    await reportsTab.click();

    // Result cards should all be Annual Reports
    const reportBadge = page.locator(".search-type-badge", { hasText: "Annual Report" }).first();
    await expect(reportBadge).toBeVisible({ timeout: 10000 });

    // 9. Search for "Zakat" on the search results page
    const pageSearchInput = page.locator(".search-input-field");
    await expect(pageSearchInput).toBeVisible();
    await pageSearchInput.fill("Zakat");
    await page.locator(".search-submit-btn").click();

    // Should update URL and page content
    await expect(page).toHaveURL(/.*\/search\?q=Zakat/, { timeout: 10000 });
    await expect(searchTitle).toContainText("Zakat");

    const zakatCards = page.locator(".search-result-card");
    await expect(zakatCards.first()).toBeVisible({ timeout: 15000 });
    const zakatCount = await zakatCards.count();
    expect(zakatCount).toBeGreaterThan(0);
  });

  test("mobile header search works seamlessly on small screens", async ({
    page,
  }) => {
    // 1. Set mobile viewport (iPhone 12 / common mobile width)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    // 2. Click mobile hamburger to open menu
    const hamburger = page.locator(".current-mobile .site-header-hamburger");
    await expect(hamburger).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);
    await hamburger.click();

    // 3. Click search button in mobile menu
    const mobileSearchBtn = page.locator(".current-mobile .site-mobile-menu button", { hasText: /search/i });
    await expect(mobileSearchBtn).toBeVisible({ timeout: 10000 });
    await mobileSearchBtn.click();

    // 4. Mobile search overlay opens
    const mobileInput = page.locator(".current-mobile input[type='search']");
    await expect(mobileInput).toBeVisible({ timeout: 10000 });
    await mobileInput.fill("Scholarship");

    // 5. Hit Enter to submit
    await mobileInput.press("Enter");

    // 6. Verifies navigation to /search?q=Scholarship
    await expect(page).toHaveURL(/.*\/search\?q=Scholarship/, { timeout: 10000 });

    // 7. Search Results Page is responsive and displays cards
    const resultsCard = page.locator(".search-result-card").first();
    await expect(resultsCard).toBeVisible({ timeout: 15000 });
  });
});

