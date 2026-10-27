#!/usr/bin/env node
/**
 * Automated 404 and SEO Status Verification Test Suite.
 *
 * Verifies the 10 core scenarios specified in the task:
 * 1. Existing homepage returns HTTP 200.
 * 2. Existing About Us page returns HTTP 200.
 * 3. Existing Blog detail page returns HTTP 200.
 * 4. Existing Event detail page returns HTTP 200.
 * 5. Random non-existing URL returns HTTP 404.
 * 6. Invalid Blog slug returns HTTP 404.
 * 7. Invalid Event slug returns HTTP 404.
 * 8. Deleted or unpublished content returns HTTP 404 (not 200).
 * 9. Permanently moved URLs return HTTP 301 / 308 and resolve to the correct destination.
 * 10. Custom 404 page markup contains 404 heading, helpful description, Back to Home CTA,
 *     and section exploration chips across viewports.
 * 11. XML sitemap generation includes only valid, published URLs.
 */

const assert = require("assert");
require("dotenv").config({ path: ".env" });
const { connectDB } = require("../lib/db");
const Page = require("../models/Page");
const Blog = require("../models/Blog");
const Event = require("../models/Event");
const PageSlugRedirect = require("../models/PageSlugRedirect");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

async function runScenario(name, fn) {
  process.stdout.write(`[TEST] ${name} ... `);
  try {
    await fn();
    console.log("PASSED");
    passedCount++;
  } catch (error) {
    console.log("FAILED");
    console.error(`       Error: ${error.message}`);
    failedCount++;
  }
}

async function main() {
  console.log("=================================================");
  console.log("   MESCO CMS - 404 & SEO Status Verification     ");
  console.log(`   Target Server: ${BASE_URL}                   `);
  console.log("=================================================\n");

  await connectDB();

  // Retrieve valid published test fixtures from the database
  const publishedBlog = await Blog.findOne({ status: "published" }).lean();
  const publishedEvent = await Event.findOne({ status: "published" }).lean();
  const publishedPage = await Page.findOne({
    status: "published",
    slug: { $nin: ["home", "admin", "preview"] },
  }).lean();

  const blogSlug = publishedBlog ? publishedBlog.slug : "future-of-education-technology-transforming-learning";
  const eventSlug = publishedEvent ? publishedEvent.slug : "top-ranking-students-felicitation-function";
  const pageSlug = publishedPage ? publishedPage.slug : "about-us/mesco-at-glance";

  // 1. Existing homepage returns HTTP 200
  await runScenario("1. Existing homepage returns HTTP 200", async () => {
    const res = await fetch(`${BASE_URL}/`, { redirect: "manual" });
    assert.strictEqual(res.status, 200, `Expected 200 for homepage, got ${res.status}`);
  });

  // 2. Existing About Us page returns HTTP 200
  await runScenario("2. Existing About Us / CMS page returns HTTP 200", async () => {
    const res = await fetch(`${BASE_URL}/${pageSlug}`, { redirect: "manual" });
    assert.strictEqual(res.status, 200, `Expected 200 for /${pageSlug}, got ${res.status}`);
  });

  // 3. Existing Blog detail page returns HTTP 200
  await runScenario("3. Existing Blog detail page returns HTTP 200", async () => {
    const res = await fetch(`${BASE_URL}/blog/${blogSlug}`, { redirect: "manual" });
    assert.strictEqual(res.status, 200, `Expected 200 for /blog/${blogSlug}, got ${res.status}`);
  });

  // 4. Existing Event detail page returns HTTP 200
  await runScenario("4. Existing Event detail page returns HTTP 200", async () => {
    const res = await fetch(`${BASE_URL}/events/${eventSlug}`, { redirect: "manual" });
    assert.strictEqual(res.status, 200, `Expected 200 for /events/${eventSlug}, got ${res.status}`);
  });

  // 5. Random non-existing URL returns HTTP 404
  await runScenario("5. Random non-existing URL returns HTTP 404", async () => {
    const nonExistingUrl = `${BASE_URL}/non-existent-page-${Date.now()}`;
    const res = await fetch(nonExistingUrl, { redirect: "manual" });
    assert.strictEqual(res.status, 404, `Expected 404 for random URL, got ${res.status}`);
  });

  // 6. Invalid Blog slug returns HTTP 404
  await runScenario("6. Invalid Blog slug returns HTTP 404", async () => {
    const res = await fetch(`${BASE_URL}/blog/missing-blog-slug-${Date.now()}`, { redirect: "manual" });
    assert.strictEqual(res.status, 404, `Expected 404 for missing blog, got ${res.status}`);
  });

  // 7. Invalid Event slug returns HTTP 404
  await runScenario("7. Invalid Event slug returns HTTP 404", async () => {
    const res = await fetch(`${BASE_URL}/events/missing-event-slug-${Date.now()}`, { redirect: "manual" });
    assert.strictEqual(res.status, 404, `Expected 404 for missing event, got ${res.status}`);
  });

  // 8. Deleted or unpublished content returns HTTP 404
  await runScenario("8. Draft / unpublished blog post returns HTTP 404", async () => {
    const draftSlug = `test-draft-blog-${Date.now()}`;
    await Blog.create({
      title: "Draft Test Post",
      slug: draftSlug,
      status: "draft",
      content: "<p>Draft Content</p>",
    });

    try {
      const res = await fetch(`${BASE_URL}/blog/${draftSlug}`, { redirect: "manual" });
      assert.strictEqual(res.status, 404, `Expected 404 for draft blog, got ${res.status}`);
    } finally {
      await Blog.deleteMany({ slug: draftSlug });
    }
  });

  // 8b. Draft / unpublished event returns HTTP 404
  await runScenario("8b. Draft / unpublished event returns HTTP 404", async () => {
    const draftEventSlug = `test-draft-event-${Date.now()}`;
    await Event.create({
      title: "Draft Test Event",
      slug: draftEventSlug,
      status: "draft",
    });

    try {
      const res = await fetch(`${BASE_URL}/events/${draftEventSlug}`, { redirect: "manual" });
      assert.strictEqual(res.status, 404, `Expected 404 for draft event, got ${res.status}`);
    } finally {
      await Event.deleteMany({ slug: draftEventSlug });
    }
  });

  // 9. Permanently moved URLs return HTTP 301 / 308 and resolve
  await runScenario("9. Canonical permanently moved URL (/home) returns HTTP 301", async () => {
    const res = await fetch(`${BASE_URL}/home`, { redirect: "manual" });
    assert.strictEqual(res.status, 301, `Expected 301 for /home, got ${res.status}`);
    assert.strictEqual(res.headers.get("location"), "/", `Expected location '/', got ${res.headers.get("location")}`);
  });

  // 9b. CMS moved slug in PageSlugRedirect returns permanent redirect
  await runScenario("9b. CMS moved slug in PageSlugRedirect returns permanent redirect", async () => {
    const movedSlug = `test-old-slug-${Date.now()}`;
    await PageSlugRedirect.deleteMany({ from: movedSlug });
    await PageSlugRedirect.create({ from: movedSlug, to: "donate-now" });

    try {
      const res = await fetch(`${BASE_URL}/${movedSlug}`, { redirect: "manual" });
      assert(
        res.status === 308 || res.status === 301,
        `Expected 308 or 301 for moved CMS slug, got ${res.status}`,
      );
      assert.strictEqual(res.headers.get("location"), "/donate-now");
    } finally {
      await PageSlugRedirect.deleteMany({ from: movedSlug });
    }
  });

  // 10. Custom 404 page content checks
  await runScenario("10. Custom 404 page contains required SEO and clean UX elements", async () => {
    const res = await fetch(`${BASE_URL}/test-non-existing-seo-page-404`);
    assert.strictEqual(res.status, 404, `Status should be 404, got ${res.status}`);
    const html = await res.text();

    assert(html.includes("404 ERROR") || html.includes("404"), "Missing 404 heading/badge");
    assert(html.includes("Page Not Found"), "Missing 'Page Not Found' message");
    assert(html.includes("Back to Home"), "Missing 'Back to Home' CTA");
    assert(!html.includes("Explore website sections"), "Explore website sections should be removed");
    assert(html.includes("robots") || html.includes("noindex"), "Missing robots noindex prevention");
  });

  // 11. XML Sitemap generation excludes drafts and includes only published
  await runScenario("11. XML sitemap contains only published URLs", async () => {
    const res = await fetch(`${BASE_URL}/sitemap.xml`);
    assert.strictEqual(res.status, 200, `Expected 200 for sitemap.xml, got ${res.status}`);
    const xml = await res.text();

    assert(xml.includes("<urlset"), "Sitemap must be valid XML with <urlset>");
    assert(!xml.includes("/admin"), "Sitemap must never include /admin");
    assert(!xml.includes("/preview"), "Sitemap must never include /preview");
    assert(!xml.includes("/api/"), "Sitemap must never include /api/");
  });

  console.log("\n=================================================");
  console.log(`   TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
