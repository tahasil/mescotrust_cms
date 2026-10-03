import { test, expect } from "@playwright/test";

/**
 * Testimonials carousel — clamped quote + full testimonial overlay.
 *
 * Guards the bugs hit while building this:
 *  1. Overflow was measured on the wrapper, but the clamp applies
 *     overflow:hidden on the inner .qQuoteText, so the wrapper's scrollHeight
 *     always equalled its clientHeight and nothing was ever reported as
 *     truncated.
 *  2. Measurement ran once on mount, before webfonts swapped in. The clamp
 *     pins the box to a fixed height, so ResizeObserver never fired.
 *  3. The card was anchored to the quote, but the section wrapper
 *     (FullWidthBackground) sets overflow:hidden and clipped it at the section
 *     edge — in either direction. It is now a viewport-centred portal.
 */

const CLAMP_SELECTOR = ".qQuoteWrap[data-quote-index]";
const OVERLAY = ".qTipOverlay";
const CARD = ".qTip";

/**
 * Opens the homepage and waits for the carousel.
 *
 * Does NOT wait for slide visibility: GSAP keeps slides visibility:hidden
 * until its ScrollTrigger fires, which is timing-dependent headless. Hidden
 * elements still report correct layout metrics.
 */
async function gotoTestimonials(page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await page.waitForFunction(
    () => document.querySelectorAll(".qSlidesTrack").length > 0,
    null,
    { timeout: 45_000 },
  );

  await page.evaluate(() => {
    document
      .querySelector(".qSlidesTrack")
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(2500);

  await page.waitForFunction(
    () => document.querySelectorAll(".qQuoteWrap.is-clamped").length > 0,
    null,
    { timeout: 20_000 },
  );
}

async function readMetrics(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-quote-index]")).map((wrap) => {
      const box = wrap.querySelector(".qQuoteText");
      return {
        index: Number(wrap.getAttribute("data-quote-index")),
        clampedClass: wrap.classList.contains("is-clamped"),
        boxClientHeight: box ? box.clientHeight : null,
        boxScrollHeight: box ? box.scrollHeight : null,
        lineClamp: box ? getComputedStyle(box).webkitLineClamp : null,
      };
    }),
  );
}

test.describe("Testimonials clamp + overlay", () => {
  test("only overflowing quotes get the clamped marker", async ({ page }) => {
    await gotoTestimonials(page);
    const metrics = await readMetrics(page);
    console.log("METRICS:", JSON.stringify(metrics));

    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics.some((m) => m.lineClamp === "5")).toBe(true);

    for (const m of metrics) {
      const overflowing = m.boxScrollHeight - m.boxClientHeight > 1;
      expect(m.clampedClass).toBe(overflowing);
    }
    expect(metrics.some((m) => m.clampedClass)).toBe(true);
  });

  test("clicking a clamped quote opens the centred overlay", async ({ page }) => {
    await gotoTestimonials(page);

    await expect(page.locator(OVERLAY)).toHaveCount(0);

    await page.locator(".qQuoteWrap.is-clamped").first().click({ force: true });
    await page.waitForTimeout(600);

    const card = page.locator(CARD);
    await expect(card).toBeVisible();
    await expect(page.locator(".qTipClose")).toBeVisible();
    // The red "Full" pill was removed — only the name and close button remain.
    await expect(page.locator(".qTipBadge")).toHaveCount(0);
    await expect(page.locator(".qTipTitle")).toBeVisible();

    const body = (await page.locator(".qTipBody").innerText()).trim();
    console.log("overlay body length:", body.length);
    expect(body.length).toBeGreaterThan(0);
  });

  test("overlay shows the complete quote, centred and unclipped", async ({ page }) => {
    await gotoTestimonials(page);

    const wrap = page.locator(".qQuoteWrap.is-clamped").first();
    const source = (await wrap.locator(".qQuoteText").innerText()).trim();
    await wrap.click({ force: true });
    await page.waitForTimeout(600);

    const overlayBody = (await page.locator(".qTipBody").innerText()).trim();
    expect(overlayBody).toBe(source);

    const box = await page.locator(CARD).boundingBox();
    const viewport = page.viewportSize();
    console.log("card box:", JSON.stringify(box));

    // Fully inside the viewport — the section overflow:hidden clip is gone.
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);

    // Centred horizontally.
    const centre = box.x + box.width / 2;
    expect(Math.abs(centre - viewport.width / 2)).toBeLessThan(2);
  });

  test("overlay is portalled to body, so no ancestor can clip it", async ({ page }) => {
    await gotoTestimonials(page);

    await page.locator(".qQuoteWrap.is-clamped").first().click({ force: true });
    await page.waitForTimeout(600);
    await expect(page.locator(OVERLAY)).toBeVisible();

    // Every ancestor up to body must not clip.
    const clipped = await page.evaluate(() => {
      const el = document.querySelector(".qTip");
      const hits = [];
      let node = el.parentElement;
      while (node && node !== document.body) {
        const overflowY = getComputedStyle(node).overflowY;
        const overflowX = getComputedStyle(node).overflowX;
        if (overflowY === "hidden" || overflowX === "hidden") {
          hits.push(node.className || node.tagName);
        }
        node = node.parentElement;
      }
      return hits;
    });
    console.log("clipping ancestors:", JSON.stringify(clipped));
    expect(clipped).toHaveLength(0);
  });

  test("overlay does not close when the pointer moves onto it", async ({ page }) => {
    await gotoTestimonials(page);

    const wrap = page.locator(".qQuoteWrap.is-clamped").first();
    await wrap.click({ force: true });
    await page.waitForTimeout(600);
    await expect(page.locator(CARD)).toBeVisible();

    // Move well away from the quote, onto the card itself.
    const box = await page.locator(CARD).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 30);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(700);

    // Must still be open.
    await expect(page.locator(CARD)).toBeVisible();
  });

  test("overlay follows the carousel to the next slide", async ({ page }) => {
    await gotoTestimonials(page);

    const wrap = page.locator(".qQuoteWrap.is-clamped").first();
    await wrap.click({ force: true });
    await page.waitForTimeout(600);

    const firstName = (await page.locator(".qTipTitle").innerText()).trim();
    console.log("opened for:", firstName);

    // Advance the carousel by clicking the last dot.
    const dots = page.locator(".qDot");
    const dotCount = await dots.count();
    if (dotCount < 2) {
      test.skip(true, "Carousel has a single slide");
      return;
    }
    await dots.nth(dotCount - 1).click({ force: true });
    await page.waitForTimeout(900);

    // The overlay must now present a different slide, or be gone if that
    // slide's quote is short — never the previous slide's stale content.
    const stillOpen = (await page.locator(CARD).count()) > 0;
    if (stillOpen) {
      const nowName = (await page.locator(".qTipTitle").innerText()).trim();
      console.log("now showing:", nowName);
      const activeQuote = (await page
        .locator(".qSlide.is-active .qQuoteText")
        .first()
        .innerText()).trim();
      const shownQuote = (await page.locator(".qTipBody").innerText()).trim();
      // Whatever it shows must match the slide that is now active.
      expect(shownQuote).toBe(activeQuote);
    }
  });

  test("overlay closes on Escape", async ({ page }) => {
    await gotoTestimonials(page);

    await page.locator(".qQuoteWrap.is-clamped").first().click({ force: true });
    await page.waitForTimeout(600);
    await expect(page.locator(CARD)).toBeVisible();

    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    await expect(page.locator(CARD)).toHaveCount(0);
  });

  test("overlay closes on close button and backdrop click", async ({ page }) => {
    await gotoTestimonials(page);

    // Close button.
    await page.locator(".qQuoteWrap.is-clamped").first().click({ force: true });
    await page.waitForTimeout(500);
    await page.locator(".qTipClose").click();
    await page.waitForTimeout(400);
    await expect(page.locator(CARD)).toHaveCount(0);

    // Backdrop.
    await page.locator(".qQuoteWrap.is-clamped").first().click({ force: true });
    await page.waitForTimeout(500);
    await page.locator(OVERLAY).click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(400);
    await expect(page.locator(CARD)).toHaveCount(0);
  });

  test("long quotes scroll inside the overlay instead of growing", async ({ page }) => {
    await gotoTestimonials(page);

    await page.locator(".qQuoteWrap.is-clamped").first().click({ force: true });
    await page.waitForTimeout(600);

    const scroll = await page.evaluate(() => {
      const el = document.querySelector(".qTipScroll");
      const card = document.querySelector(".qTip");
      return {
        overflowY: el ? getComputedStyle(el).overflowY : null,
        clientHeight: el ? el.clientHeight : null,
        scrollHeight: el ? el.scrollHeight : null,
        cardMaxHeight: card ? getComputedStyle(card).maxHeight : null,
      };
    });
    console.log("scroll state:", JSON.stringify(scroll));

    expect(scroll.overflowY).toBe("auto");
    expect(scroll.cardMaxHeight).not.toBe("none");
  });

  test("short quotes are not clickable", async ({ page }) => {
    await gotoTestimonials(page);

    const short = page.locator(".qQuoteWrap:not(.is-clamped)").first();
    if ((await short.count()) === 0) {
      test.skip(true, "Every quote on this page is long enough to clamp");
      return;
    }

    await short.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.locator(CARD)).toHaveCount(0);
  });

  test("all slides share the same height", async ({ page }) => {
    await gotoTestimonials(page);

    const heights = await page.locator(".qSlide").evaluateAll((nodes) =>
      nodes.map((n) => Math.round(n.getBoundingClientRect().height)),
    );
    console.log("slide heights:", JSON.stringify(heights));

    expect(heights.length).toBeGreaterThan(1);
    expect([...new Set(heights)]).toHaveLength(1);
  });
});