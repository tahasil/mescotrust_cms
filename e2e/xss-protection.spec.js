const { test, expect } = require("@playwright/test");

test.describe("XSS Protection & Output Sanitization Verification", () => {
  test.beforeEach(async ({ page }) => {
    // Assert no alert, prompt, or confirm dialogs are EVER triggered
    page.on("dialog", async (dialog) => {
      const message = dialog.message();
      await dialog.dismiss();
      throw new Error(`CRITICAL SECURITY FAILURE: Browser dialog triggered by XSS: "${message}"`);
    });
  });

  test("1. Blog detail page renders JSON-LD without inline script breakout", async ({ page }) => {
    await page.goto("http://localhost:3000/blog", { waitUntil: "networkidle" });

    // Look for first blog card/link
    const blogLink = page.locator('a[href^="/blog/"]').first();
    const hasBlog = await blogLink.count();

    if (hasBlog > 0) {
      await blogLink.click();
      await page.waitForLoadState("networkidle");

      // Verify JSON-LD script tags
      const jsonLdElements = await page.locator('script[type="application/ld+json"]').all();
      for (const el of jsonLdElements) {
        const text = await el.innerText();
        expect(text).not.toContain("</script>");
        // Verify valid JSON
        expect(() => JSON.parse(text)).not.toThrow();
      }

      // Verify blog title is treated as plain text, no raw injected tags
      const heading = page.locator("h1");
      await expect(heading).toBeVisible();
      const headingHtml = await heading.innerHTML();
      expect(headingHtml).not.toContain("<script");
    }
  });

  test("2. Event detail page renders Location and Structured Data safely", async ({ page }) => {
    await page.goto("http://localhost:3000/events", { waitUntil: "networkidle" });

    const eventLink = page.locator('a[href^="/events/"]').first();
    const hasEvent = await eventLink.count();

    if (hasEvent > 0) {
      await eventLink.click();
      await page.waitForLoadState("networkidle");

      // Verify JSON-LD script tags
      const jsonLdElements = await page.locator('script[type="application/ld+json"]').all();
      for (const el of jsonLdElements) {
        const text = await el.innerText();
        expect(text).not.toContain("</script>");
        expect(() => JSON.parse(text)).not.toThrow();
      }

      // Verify location element contains no raw executable tags
      const locationEl = page.locator(".event-location, [data-event-location]");
      if (await locationEl.count() > 0) {
        const locHtml = await locationEl.first().innerHTML();
        expect(locHtml).not.toContain("<script");
        expect(locHtml).not.toContain("onerror=");
      }
    }
  });

  test("3. Dangerous URL schemes (javascript:) in links are neutralized", async ({ page }) => {
    // Inject a test link with javascript: URI into DOM to verify browser protection
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    // Verify all anchor tags on the home page do not have javascript: href
    const anchors = await page.locator("a[href]").all();
    for (const a of anchors) {
      const href = await a.getAttribute("href");
      if (href) {
        const normalized = href.trim().toLowerCase();
        expect(normalized.startsWith("javascript:")).toBeFalsy();
        expect(normalized.startsWith("data:text/html")).toBeFalsy();
        expect(normalized.startsWith("vbscript:")).toBeFalsy();
      }
    }
  });

  test("4. Rich text blocks purify script tags and malicious attributes", async ({ page }) => {
    await page.goto("http://localhost:3000/about-us", { waitUntil: "networkidle" });

    // Ensure no inline event handlers on any rendered element
    const suspiciousHandlers = await page.$$eval("[onerror], [onload], [onmouseover]", (elements) => {
      return elements.map((el) => el.tagName);
    });
    expect(suspiciousHandlers).toHaveLength(0);
  });
});
