/**
 * Audit Page <-> Menu link integrity.
 *
 * Reports every navigation link that would currently 404, plus every page
 * whose address has drifted away from its position in the menu tree. Those
 * two classes of breakage are what a Parent Menu change or a menu reorder
 * used to cause.
 *
 * Usage:
 *   node scripts/audit-menu-page-links.js          # report only (read-only)
 *   node scripts/audit-menu-page-links.js --fix    # report, then repair menus
 *
 * `--fix` only re-points menu items at the slug that actually resolves and
 * re-indexes `order`. It never moves or renames pages, so it is safe to run
 * on a live database.
 */

const path = require("path");
const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env"), override: true });

const mongoose = require("mongoose");

const SHOULD_FIX = process.argv.includes("--fix");

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // Plain collections — this script must work even if indexes were never built.
  const pagesCol = db.collection("pages");
  const menusCol = db.collection("menus");
  const redirectsCol = db.collection("pageslugredirects");

  const [pages, menus, redirects] = await Promise.all([
    pagesCol.find({}, { projection: { slug: 1, title: 1, status: 1 } }).toArray(),
    menusCol.find({}, { projection: { name: 1, items: 1 } }).toArray(),
    redirectsCol.find({}, { projection: { from: 1, to: 1 } }).toArray(),
  ]);

  const pageBySlug = new Map(pages.map((p) => [p.slug, p]));
  const redirectByFrom = new Map(redirects.map((r) => [r.from, r.to]));

  const followRedirect = (slug) => {
    let current = slug;
    const seen = new Set();
    for (let i = 0; i < 6; i += 1) {
      const next = redirectByFrom.get(current);
      if (!next || seen.has(next)) break;
      seen.add(next);
      current = next;
    }
    return current === slug ? null : current;
  };

  const slugifyLabel = (label) =>
    String(label || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const brokenLinks = [];
  const mispositioned = [];
  const orphanedPages = [];
  const fixedByRedirect = [];

  // --- 1. Every menu page-item must resolve to a real page -----------------
  const walkMenu = (items, ancestors, menuName) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (!item || typeof item !== "object") continue;

      if (item.type === "page" && item.pageSlug) {
        if (!pageBySlug.has(item.pageSlug)) {
          const target = followRedirect(item.pageSlug);
          if (target && pageBySlug.has(target)) {
            fixedByRedirect.push({
              menu: menuName,
              label: item.label,
              from: item.pageSlug,
              to: target,
            });
          } else {
            brokenLinks.push({
              menu: menuName,
              label: item.label || "(no label)",
              url: item.pageSlug,
            });
          }
        } else {
          // Page exists — does its address match where it sits in the menu?
          const folder = ancestors.filter(Boolean).join("/");
          const base = item.pageSlug.split("/").pop();
          const expected = folder ? `${folder}/${base}` : base;
          if (expected !== item.pageSlug) {
            mispositioned.push({
              menu: menuName,
              label: item.label,
              stored: item.pageSlug,
              expected,
            });
          }
        }
      }

      const children = Array.isArray(item.children) ? item.children : [];
      if (children.length) {
        walkMenu(children, [...ancestors, slugifyLabel(item.label)], menuName);
      }
    }
  };

  for (const menu of menus) walkMenu(menu.items, [], menu.name);

  // --- 2. Every page folder must exist as a container somewhere -----------
  const knownFolders = new Set();
  for (const page of pages) {
    if (page.slug.includes("/")) {
      knownFolders.add(page.slug.substring(0, page.slug.lastIndexOf("/")));
    }
  }
  for (const menu of menus) {
    const collectFolders = (items, ancestors) => {
      if (!Array.isArray(items)) return;
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const children = Array.isArray(item.children) ? item.children : [];
        if (children.length > 0) {
          const next = [...ancestors, slugifyLabel(item.label)];
          knownFolders.add(next.filter(Boolean).join("/"));
          collectFolders(children, next);
        }
      }
    };
    collectFolders(menu.items, []);
  }

  for (const page of pages) {
    if (!page.slug.includes("/")) continue;
    const folder = page.slug.substring(0, page.slug.lastIndexOf("/"));
    if (!knownFolders.has(folder)) {
      orphanedPages.push({ slug: page.slug, title: page.title, folder });
    }
  }

  // --- 3. Report ----------------------------------------------------------
  const line = "─".repeat(64);
  console.log(`\n${line}`);
  console.log("  PAGE ↔ MENU LINK AUDIT");
  console.log(line);
  console.log(`Pages: ${pages.length}   Menus: ${menus.length}   Redirects: ${redirects.length}\n`);

  console.log(`Broken menu links (404 in the header/footer): ${brokenLinks.length}`);
  for (const b of brokenLinks) {
    console.log(`  ✗ [${b.menu}] "${b.label}" → /${b.url}`);
  }
  if (!brokenLinks.length) console.log("  ✓ none");

  console.log(`\nPages whose address no longer matches their menu position: ${mispositioned.length}`);
  for (const m of mispositioned) {
    console.log(`  ! [${m.menu}] "${m.label}": stored /${m.stored} · expected /${m.expected}`);
  }
  if (!mispositioned.length) console.log("  ✓ none");

  console.log(`\nOrphaned pages (folder has no menu parent): ${orphanedPages.length}`);
  for (const o of orphanedPages) {
    console.log(`  ! /${o.slug} ("${o.title}") — no container for "/${o.folder}"`);
  }
  if (!orphanedPages.length) console.log("  ✓ none");

  if (fixedByRedirect.length) {
    console.log(`\nStale links healed by a recorded redirect: ${fixedByRedirect.length}`);
    for (const f of fixedByRedirect) {
      console.log(`  ↪ [${f.menu}] "${f.label}": /${f.from} → /${f.to}`);
    }
  }

  // --- 4. Optional repair -------------------------------------------------
  if (SHOULD_FIX) {
    console.log(`\n${line}`);
    console.log("  REPAIRING MENUS");
    console.log(line);
    // lib/menuPageSync.js is an ES module (transpiled by Next), so load it
    // with a dynamic import rather than require().
    const { repairAllMenus } = await import("../lib/menuPageSync.js");
    const result = await repairAllMenus();
    console.log(`Menus updated: ${result.changed.length ? result.changed.join(", ") : "none"}`);
    for (const w of result.warnings) console.log(`  ! ${w}`);
  } else if (brokenLinks.length || mispositioned.length) {
    console.log(`\nRun with --fix to re-point menu items at the slug that actually resolves.`);
  }

  console.log("");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});