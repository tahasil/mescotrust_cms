/**
 * Summarise playwright-artifacts/frontend-audit/results.json into a
 * grouped, human-readable breakdown used to write the final report.
 */
const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "playwright-artifacts", "frontend-audit", "results.json");
const r = JSON.parse(fs.readFileSync(file, "utf8"));

const norm = (u) => u.replace(r.target, "") || "/";

console.log("TARGET:", r.target, "| pages:", r.pageCount, "|", r.generatedAt, "\n");

/* ---------- aggregate issue messages ---------- */
const agg = new Map();
r.pages.forEach((p) => {
  p.issues.forEach((i) => {
    const key = `${i.sev}|${i.cat}|${i.msg.replace(/https?:\/\/[^\s)]+/g, "<url>").replace(/\d+/g, "#")}`;
    if (!agg.has(key)) agg.set(key, { sev: i.sev, cat: i.cat, msg: i.msg, urls: [] });
    agg.get(key).urls.push(norm(p.url));
  });
});

console.log("═══ AGGREGATED ISSUES (most common first) ═══\n");
const sorted = Array.from(agg.values()).sort((a, b) => {
  const rank = { critical: 0, major: 1, minor: 2 };
  return rank[a.sev] - rank[b.sev] || b.urls.length - a.urls.length;
});
sorted.forEach((a) => {
  console.log(`[${a.sev.toUpperCase()}] (${a.cat}) ×${a.urls.length}  — ${a.msg}`);
  if (a.urls.length <= 6) console.log(`        pages: ${a.urls.join(", ")}`);
  console.log("");
});

/* ---------- per page table ---------- */
console.log("\n═══ PER-PAGE TABLE ═══");
console.log("path | status | ms | titleLen | descLen | h1 | canon | ogImg | jsonLd | imgs | brokenImg | noAlt | links | kgb | dom | MB | issues");
r.pages.forEach((p) => {
  const d = p.detail;
  console.log(
    [
      norm(p.url).padEnd(38).slice(0, 38),
      String(p.status).padEnd(6),
      String(p.loadMs).padEnd(5),
      String(p.titleLength).padEnd(8),
      String(p.metaDescriptionLength).padEnd(7),
      String(p.h1Count).padEnd(3),
      (d.canonical ? "Y" : "N").padEnd(6),
      (d.og && d.og["og:image"] ? "Y" : "N").padEnd(6),
      String(d.jsonLd.count).padEnd(7),
      String(p.images.total).padEnd(4),
      String(p.images.broken).padEnd(9),
      String(p.images.missingAlt).padEnd(6),
      String(p.internalLinks).padEnd(5),
      String(p.weightMB).padEnd(4),
      String(p.domNodes).padEnd(5),
      p.issueCount,
    ].join(" | ")
  );
});

/* ---------- specials ---------- */
console.log("\n═══ SPECIALS ═══");
console.log(JSON.stringify(r.specials, null, 2));
console.log("\n═══ LINK CHECK ═══");
console.log(JSON.stringify(r.linkCheck, null, 2));
console.log("\n═══ MOBILE ═══");
console.log(JSON.stringify(r.mobile, null, 2));

/* ---------- titles dump ---------- */
console.log("\n═══ TITLES / DESCRIPTIONS ═══");
r.pages.forEach((p) => {
  console.log(`${norm(p.url)}\n   TITLE (${p.titleLength}): ${p.title}\n   DESC  (${p.metaDescriptionLength}): ${(p.detail.metaDescription || "").slice(0, 200)}\n   CANON: ${p.detail.canonical || "—"}`);
});

/* ---------- broken images dump ---------- */
console.log("\n═══ BROKEN IMAGES ═══");
r.pages.forEach((p) => {
  if (p.detail.images.broken.length) {
    console.log(`${norm(p.url)}`);
    p.detail.images.broken.forEach((b) => console.log(`   ✗ ${b.src}`));
  }
});

/* ---------- asset 4xx dump ---------- */
console.log("\n═══ ASSET 4xx/5xx ═══");
r.pages.forEach((p) => {
  const bad = (p.detail.errors.badResponses || []).filter((b) => !/\/api\/|\/admin/.test(b.url));
  if (bad.length) {
    console.log(`${norm(p.url)}`);
    bad.slice(0, 8).forEach((b) => console.log(`   ${b.status} ${b.url}`));
  }
});

/* ---------- js errors dump ---------- */
console.log("\n═══ JS / CONSOLE ERRORS ═══");
r.pages.forEach((p) => {
  const ce = p.detail.errors.consoleErrors || [];
  const pe = p.detail.errors.pageErrors || [];
  if (ce.length || pe.length) {
    console.log(`${norm(p.url)}`);
    pe.forEach((e) => console.log(`   [pageerror] ${e}`));
    [...new Set(ce)].slice(0, 5).forEach((e) => console.log(`   [console] ${e}`));
  }
});
