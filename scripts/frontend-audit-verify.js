/** Post-fix verification: rendering, SEO, links, h1, a11y. */
const { chromium } = require("@playwright/test");
const BASE = process.argv[2] || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();

  /* 1. Homepage renders + CTAs point at real pages */
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  const home = await p.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("a.finaleButton")).map((a) => ({
      label: (a.textContent || "").trim(),
      href: a.getAttribute("href"),
    }));
    return {
      title: document.title,
      desc: document.querySelector('meta[name=description]')?.content || "",
      canonical: document.querySelector('link[rel=canonical]')?.href || "",
      robots: document.querySelector('meta[name=robots]')?.content || "",
      h1: Array.from(document.querySelectorAll("h1")).map((h) => h.textContent.trim()),
      ctaButtons: btns,
      javascriptLinks: document.querySelectorAll("a[href^='javascript:']").length,
      brokenImages: Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0).length,
    };
  });
  console.log("═══ HOMEPAGE ═══");
  console.log("title    :", home.title);
  console.log("desc     :", home.desc.slice(0, 110));
  console.log("canonical:", home.canonical);
  console.log("robots   :", home.robots || "(indexable)");
  console.log("h1       :", JSON.stringify(home.h1));
  console.log("CTA btns :", JSON.stringify(home.ctaButtons));
  console.log("javascript: links :", home.javascriptLinks, home.javascriptLinks === 0 ? "✅" : "❌");
  console.log("broken images     :", home.brokenImages, home.brokenImages === 0 ? "✅" : "❌");

  /* 2. A few pages: SEO + h1 count + nav dropdown hrefs */
  console.log("\n═══ PAGES ═══");
  const pages = [
    "/media/newsletter", "/media/image-gallery", "/about-us/managing-committee",
    "/about-us/our-team", "/blog", "/donate-now", "/get-involved/contact-us",
  ];
  for (const path of pages) {
    const res = await p.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 60000 });
    const d = await p.evaluate(() => ({
      title: document.title,
      desc: document.querySelector('meta[name=description]')?.content || "",
      canonical: document.querySelector('link[rel=canonical]')?.href || "",
      h1: Array.from(document.querySelectorAll("h1")).map((h) => h.textContent.trim().slice(0, 40)),
      broken: Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0).length,
      jsLinks: document.querySelectorAll("a[href^='javascript:']").length,
      chatbotLabel: !!document.querySelector('textarea[aria-label], textarea[id]'),
    }));
    console.log(`\n${path}  [${res.status()}]`);
    console.log(`  title (${d.title.length}) : ${d.title}`);
    console.log(`  desc  (${d.desc.length}) : ${d.desc.slice(0, 95)}`);
    console.log(`  canonical : ${d.canonical || "❌ MISSING"}`);
    console.log(`  h1 (${d.h1.length}) : ${JSON.stringify(d.h1)}`);
    console.log(`  broken img : ${d.broken}   js links : ${d.jsLinks}`);
  }

  /* 3. Drafted pages must no longer be reachable as pages */
  console.log("\n═══ DRAFTED PAGES (should show the not-found page) ═══");
  for (const path of ["/blogs", "/blog-details", "/event-list", "/event-deatils", "/our-works/event-registration"]) {
    const res = await p.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 40000 });
    const h1 = await p.evaluate(() => document.querySelector("h1")?.textContent.trim() || "");
    console.log(`  ${path.padEnd(32)} [${res.status()}]  h1="${h1}"`);
  }

  /* 4. Legacy CTA slugs are no longer linked */
  console.log("\n═══ /donate + /volunteer (should not be linked any more) ═══");
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  const stale = await p.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]"))
      .map((a) => a.getAttribute("href"))
      .filter((h) => h === "/donate" || h === "/volunteer")
  );
  console.log(stale.length === 0 ? "  ✅ no links to /donate or /volunteer" : `  ❌ still linked: ${stale.join(", ")}`);

  /* 5. sitemap + robots */
  console.log("\n═══ SITEMAP / ROBOTS ═══");
  const sm = await (await ctx.request.get(BASE + "/sitemap.xml")).text();
  const locs = (sm.match(/<loc>([^<]+)<\/loc>/g) || []).map((l) => l.replace(/<\/?loc>/g, ""));
  const local = locs.filter((u) => /localhost|127\.0\.0\.1/.test(u)).length;
  console.log(`  sitemap URLs : ${locs.length}`);
  console.log(`  localhost    : ${local}`);
  console.log(`  sample       : ${locs.slice(0, 3).join("  ")}`);
  const rb = await (await ctx.request.get(BASE + "/robots.txt")).text();
  console.log(`  robots sitemap line: ${(rb.match(/^Sitemap:.*$/m) || ["(none)"])[0]}`);

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
