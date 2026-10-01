/** Deep-dive checks: soft-404 rendering, failing asset URLs, legacy duplicate pages. */
const { chromium } = require("@playwright/test");

const TARGET = "https://mesco-demo.aiolos.cloud";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  /* 1 — what does a soft-404 actually render? */
  console.log("═══ 1. SOFT-404 RENDER CHECK ═══");
  const p = await ctx.newPage();
  const r1 = await p.goto(TARGET + "/zzz-nope-12345", { waitUntil: "domcontentloaded" });
  console.log("status:", r1.status());
  console.log("title:", await p.title());
  const info = await p.evaluate(() => ({
    h1: Array.from(document.querySelectorAll("h1")).map((h) => h.textContent.trim()),
    h2: Array.from(document.querySelectorAll("h2")).map((h) => h.textContent.trim()).slice(0, 5),
    hasHeader: !!document.querySelector("header"),
    hasFooter: !!document.querySelector("footer"),
    bodyText: (document.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 220),
    canonical: document.querySelector('link[rel=canonical]')?.href || null,
    noindex: document.querySelector('meta[name=robots]')?.content || null,
  }));
  console.log(JSON.stringify(info, null, 2));
  await p.close();

  /* 2 — which resource 404s on these pages? */
  console.log("\n═══ 2. FAILING ASSETS ═══");
  for (const path of ["/about-us/managing-committee", "/about-us/our-team", "/media/image-gallery", "/media/video-gallery"]) {
    const pg = await ctx.newPage();
    const bad = [];
    pg.on("response", (res) => {
      if (res.status() >= 400) bad.push(`${res.status()} ${res.url()}`);
    });
    pg.on("requestfailed", (rq) => {
      bad.push(`FAIL ${(rq.failure() || {}).errorText} ${rq.url()}`);
    });
    await pg.goto(TARGET + path, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
    await pg.waitForTimeout(2500);
    console.log(`\n${path}`);
    if (bad.length === 0) console.log("  (none)");
    bad.slice(0, 10).forEach((b) => console.log("  " + b));
    await pg.close();
  }

  /* 3 — legacy / duplicate pages still live? */
  console.log("\n═══ 3. LEGACY / DUPLICATE PAGES ═══");
  const legacy = [
    "/blogs", "/blog-details", "/event-list", "/event-deatils",
    "/our-works/event-registration",
    "/blog/future-of-education-technology-transforming-learning",
    "/blog/neque-porro-quisquam-est-qui-dolorem-ipsum-quia-dolor-sit-amet-consectetur",
    "/blog/why-lorem-ipsum-is-used",
    "/events/neque-porro-quisquam-est-qui-dolorem-ipsum-quia-dolor-sit-amet",
    "/events/top-ranking-students-felicitation-function",
  ];
  for (const path of legacy) {
    const pg = await ctx.newPage();
    try {
      const res = await pg.goto(TARGET + path, { waitUntil: "domcontentloaded", timeout: 40000 });
      const t = await pg.title();
      const c = await pg.evaluate(() => document.querySelector('link[rel=canonical]')?.href || "—");
      const h1 = await pg.evaluate(() => Array.from(document.querySelectorAll("h1")).map((h) => h.textContent.trim()).slice(0, 2));
      console.log(`${String(res.status()).padEnd(4)} ${path}\n       title: ${t}\n       canonical: ${c}\n       h1: ${JSON.stringify(h1)}`);
    } catch (e) {
      console.log(`ERR  ${path} → ${e.message.slice(0, 70)}`);
    }
    await pg.close();
  }

  /* 4 — homepage weight breakdown */
  console.log("\n═══ 4. HOMEPAGE WEIGHT BREAKDOWN ═══");
  const hp = await ctx.newPage();
  await hp.goto(TARGET + "/", { waitUntil: "networkidle", timeout: 70000 });
  const perf = await hp.evaluate(() => {
    const res = performance.getEntriesByType("resource");
    const by = {};
    res.forEach((r) => {
      const k = r.initiatorType || "other";
      by[k] = (by[k] || 0) + (r.transferSize || 0);
    });
    const nav = performance.getEntriesByType("navigation")[0] || {};
    return {
      totalBytes: res.reduce((a, r) => a + (r.transferSize || 0), 0),
      requestCount: res.length,
      byType: by,
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
      loadEvent: Math.round(nav.loadEventEnd || 0),
      lcpish: Math.round(nav.responseEnd || 0),
      images: document.images.length,
      biggest: res.sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0)).slice(0, 8)
        .map((r) => `${Math.round((r.transferSize || 0) / 1024)} KB  ${r.name.slice(0, 95)}`),
    };
  });
  console.log(JSON.stringify(perf, null, 2));
  await hp.close();

  /* 5 — accessibility: which buttons / field lack names */
  console.log("\n═══ 5. UNNAMED CONTROLS (sample: /donate-now) ═══");
  const ap = await ctx.newPage();
  await ap.goto(TARGET + "/donate-now", { waitUntil: "networkidle", timeout: 60000 });
  const ctrl = await ap.evaluate(() => {
    const out = { buttons: [], fields: [], jsLinks: 0, jsSamples: [] };
    document.querySelectorAll("button").forEach((b) => {
      const name = (b.textContent || "").trim() || b.getAttribute("aria-label") || b.getAttribute("title");
      if (!name) out.buttons.push(b.outerHTML.slice(0, 150));
    });
    document.querySelectorAll("input,select,textarea").forEach((el) => {
      const t = (el.getAttribute("type") || "text").toLowerCase();
      if (["hidden", "submit", "button"].includes(t)) return;
      const id = el.getAttribute("id");
      const ok = (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
        el.closest("label") || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.getAttribute("title");
      if (!ok) out.fields.push(el.outerHTML.slice(0, 160));
    });
    document.querySelectorAll("a[href^='javascript:']").forEach((a) => {
      out.jsLinks += 1;
      if (out.jsSamples.length < 3) out.jsSamples.push((a.getAttribute("href") || "").slice(0, 60) + " :: " + (a.textContent || "").trim().slice(0, 30));
    });
    return out;
  });
  console.log(JSON.stringify(ctrl, null, 2));
  await ap.close();

  await browser.close();
})();
