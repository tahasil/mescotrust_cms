/**
 * Admin loader verification.
 *
 * For every admin route (including discovered inner pages) this script:
 *   1. delays every admin/theme API response so the loading state is visible,
 *   2. samples the DOM while the page is loading,
 *   3. fails if any default Ant Design dot loader (`.ant-spin-dot-item`) is visible,
 *   4. fails if the visible loader is not the configured Admin Settings loader,
 *   5. fails if a list page never renders the shared skeleton.
 *
 * Run: node scripts/verify-admin-loaders.js
 * Optional: BASE_URL=http://localhost:3000 node scripts/verify-admin-loaders.js
 */
require("dotenv").config({ path: ".env" });

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { encode } = require("next-auth/jwt");

const playwright = require("playwright");
const User = require("../models/User");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const API_DELAY_MS = Number(process.env.API_DELAY_MS || 1500);
const OUTPUT_DIR = path.resolve(__dirname, "..", "playwright-artifacts", "admin-loaders");

const STATIC_ROUTES = [
  "/admin",
  "/admin/pages",
  "/admin/pages/new",
  "/admin/components",
  "/admin/appearance/header",
  "/admin/appearance/header-ribbon",
  "/admin/appearance/footer",
  "/admin/menus",
  "/admin/chatbot",
  "/admin/social-wall",
  "/admin/form-builder",
  "/admin/sliders",
  "/admin/popups",
  "/admin/team",
  "/admin/gallery",
  "/admin/blogs",
  "/admin/blogs/new",
  "/admin/blog-categories",
  "/admin/blog-comments",
  "/admin/events",
  "/admin/events/new",
  "/admin/media",
  "/admin/media/settings",
  "/admin/media/bulk-optimize",
  "/admin/subscribers",
  "/admin/event-registrations",
  "/admin/donations",
  "/admin/volunteer-form",
  "/admin/volunteers-feedback",
  "/admin/contacts",
  "/admin/career-submissions",
  "/admin/theme",
  "/admin/settings/admin-theme",
  "/admin/settings/frontend-theme",
  "/admin/settings/sitemap",
  "/admin/settings/robots",
  "/admin/users",
  "/admin/rbac/roles",
];

/** Routes that must render the shared skeleton (list screens). */
const SKELETON_ROUTES = [
  "/admin/pages",
  "/admin/components",
  "/admin/blogs",
  "/admin/blog-categories",
  "/admin/blog-comments",
  "/admin/events",
  "/admin/gallery",
  "/admin/team",
  "/admin/users",
  "/admin/menus",
  "/admin/subscribers",
  "/admin/event-registrations",
  "/admin/donations",
  "/admin/volunteer-form",
  "/admin/volunteers-feedback",
  "/admin/contacts",
  "/admin/career-submissions",
  "/admin/form-builder",
  "/admin/media/bulk-optimize",
  "/admin/rbac/roles",
];

/**
 * Server-rendered routes have no client loading state; their loading visuals
 * come from the App Router `loading.js` boundary during navigation.
 */
const SERVER_RENDERED_ROUTES = new Set(["/admin"]);

/** Collects in-app admin links so inner pages are covered too. */
function collectAdminLinks(html) {
  const found = new Set();
  const matches = String(html).match(/href="(\/admin[^"]*)"/g) || [];
  for (const raw of matches) {
    const href = raw.replace(/^href="/, "").replace(/"$/, "");
    if (!href || href.includes("/admin/login")) continue;
    found.add(href.split("?")[0].replace(/\/$/, "") || "/admin");
  }
  return Array.from(found);
}

function colorToRgba(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.startsWith("#")) {
    const hex = text.length === 4
      ? text.slice(1).split("").map((c) => c + c).join("")
      : text.slice(1);
    if (hex.length < 6) return "";
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  const nums = text.match(/-?[\d.]+/g);
  if (!nums || nums.length < 3) return text;
  const [r, g, b, a = "1"] = nums;
  return `rgba(${Number(r)}, ${Number(g)}, ${Number(b)}, ${Number(a)})`;
}

async function authenticateAdmin(context) {
  // Prefer the Super Admin so every admin route is reachable during the sweep.
  const admin = await User.findOne({
    status: "active",
    $or: [
      { roleKey: { $in: ["super_admin", "admin"] } },
      { role: { $in: ["Super Admin", "Admin"] } },
    ],
  })
    .sort({ roleKey: -1 })
    .lean();
  if (!admin) throw new Error("No active admin user found in the database.");

  const token = await encode({
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 60 * 60,
    token: {
      id: String(admin._id),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      roleKey: admin.roleKey || admin.role,
      permissionVersion: admin.permissionVersion || 1,
      sessionVersion: admin.sessionVersion || 1,
      permissionKeys: ["*"],
    },
  });

  await context.addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

/** Snapshot of everything that is loading-related at this instant. */
function collectSnapshot() {
  const isVisible = (element) => {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const defaultDots = Array.from(document.querySelectorAll(".ant-spin-dot-item")).filter(isVisible);
  const sharedSpinners = Array.from(document.querySelectorAll(".admin-loading-spinner")).filter(isVisible);
  const skeletons = Array.from(document.querySelectorAll(".admin-skeleton")).filter(isVisible);
  const pageSkeletons = Array.from(document.querySelectorAll(".admin-page-skeleton")).filter(isVisible);
  const routeOverlays = Array.from(document.querySelectorAll(".admin-route-loader.visible")).filter(isVisible);
  const antdRings = Array.from(document.querySelectorAll(".admin-shell .ant-spin .ant-spin-dot"))
    .filter(isVisible)
    .map((node) => {
      const style = window.getComputedStyle(node, "::after");
      return style.getPropertyValue("border-top-color") || "";
    });
  const cardSkeletons = Array.from(document.querySelectorAll(".admin-shell .ant-card-loading")).filter(isVisible);

  return {
    defaultDots: defaultDots.length,
    sharedSpinners: sharedSpinners.length,
    antdRings,
    skeletons: skeletons.length,
    pageSkeletons: pageSkeletons.length,
    routeOverlays: routeOverlays.length,
    cardSkeletons: cardSkeletons.length,
    loaderColorVariable: getComputedStyle(document.documentElement)
      .getPropertyValue("--admin-loader-color")
      .trim(),
    hasAdminShell: Boolean(document.querySelector(".admin-shell")),
  };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await mongoose.connect(process.env.MONGODB_URI);

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await authenticateAdmin(context);

  const page = await context.newPage();
  // Dev-mode compiles can take a while on a cold server.
  page.setDefaultTimeout(30_000);
  page.setDefaultNavigationTimeout(180_000);

  // Slow down admin data so every loading state is observable.
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/admin/") || url.includes("/api/theme")) {
      await new Promise((resolve) => setTimeout(resolve, API_DELAY_MS));
    }
    await route.continue();
  });

  // Baseline: read the configured loader colour from Admin Settings.
  await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded", timeout: 180_000 });
  await page
    .waitForFunction(() => Boolean(document.querySelector(".admin-shell")), null, { timeout: 60_000 })
    .catch(() => {});
  const configuredColor = await page.evaluate(async () => {
    const fromCss = getComputedStyle(document.documentElement)
      .getPropertyValue("--admin-loader-color")
      .trim();
    try {
      const response = await fetch("/api/theme");
      const text = await response.text();
      const data = JSON.parse(text);
      return String(data?.adminLoaderColor || fromCss || "").trim();
    } catch {
      return fromCss;
    }
  });
  const expectedRgba = colorToRgba(configuredColor);
  console.log(`Configured Admin Loader colour: ${configuredColor} (${expectedRgba})`);
  console.log(`API delay applied to admin APIs: ${API_DELAY_MS}ms\n`);

  // Discover inner pages (component/page/blog/event/gallery/team/form edit routes).
  const discovered = new Set();
  for (const route of ["/admin/components", "/admin/pages", "/admin/blogs", "/admin/events", "/admin/gallery", "/admin/team", "/admin/form-builder"]) {
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 180_000 });
      await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
      const links = await page.content();
      collectAdminLinks(links).forEach((href) => {
        if (/\/(edit|new|submit|comments|categories)(\/|$)/.test(href) || /\/[a-f0-9]{24}\/?$/.test(href)) {
          discovered.add(href);
        }
      });
    } catch (error) {
      console.log(`  ! discovery failed for ${route}: ${error.message}`);
    }
  }
  console.log(`Discovered ${discovered.size} inner pages from the UI.\n`);

  let routes = Array.from(new Set([...STATIC_ROUTES, ...discovered]));
  // Optional partial re-runs, e.g. ROUTE_FILTER=/admin/users,/admin/rbac
  const routeFilter = String(process.env.ROUTE_FILTER || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (routeFilter.length) {
    routes = routes.filter((route) => routeFilter.some((needle) => route.includes(needle)));
  }
  console.log(`Verifying ${routes.length} route(s).\n`);
  const results = [];
  let failures = 0;

  for (const route of routes) {
    const samples = [];
    let navError = "";
    try {
      // The server can hiccup while compiling/rendering; retry a few times.
      let lastError = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await page.goto(`${BASE_URL}${route}`, { waitUntil: "commit", timeout: 120_000 });
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
          await page.waitForTimeout(2500);
        }
      }
      if (lastError) throw lastError;
      // Wait for the admin shell marker so loader assertions are meaningful.
      await page
        .waitForFunction(() => Boolean(document.querySelector(".admin-shell")), null, { timeout: 60_000 })
        .catch(() => {});
      const deadline = Date.now() + API_DELAY_MS + 3000;
      while (Date.now() < deadline) {
        samples.push(await page.evaluate(collectSnapshot).catch(() => null));
        await page.waitForTimeout(120);
      }
    } catch (error) {
      navError = error.message;
    }

    const valid = samples.filter(Boolean);
    // Pre-hydration frames are server HTML; colour/class assertions only make
    // sense once the admin shell has hydrated.
    const hydrated = valid.filter((s) => s.hasAdminShell);
    const maxDefaultDots = valid.reduce((max, s) => Math.max(max, s.defaultDots), 0);
    const sawSharedLoader = valid.some(
      (s) => s.sharedSpinners > 0 || s.routeOverlays > 0 || s.skeletons > 0 || s.pageSkeletons > 0 || s.cardSkeletons > 0 || s.antdRings.length > 0,
    );
    const sawSkeleton = valid.some((s) => s.skeletons > 0 || s.pageSkeletons > 0 || s.cardSkeletons > 0);
    const loaderColors = Array.from(new Set(hydrated.map((s) => colorToRgba(s.loaderColorVariable)).filter(Boolean)));
    const ringColors = Array.from(new Set(hydrated.flatMap((s) => s.antdRings.map(colorToRgba)).filter(Boolean)));
    const wrongColors = ringColors.filter((color) => expectedRgba && color !== expectedRgba);

    const expectsSkeleton = SKELETON_ROUTES.includes(route);
    const problems = [];
    if (navError) problems.push(`navigation error: ${navError}`);
    if (hydrated.length === 0) problems.push("body.admin-shell marker missing after hydration");
    if (maxDefaultDots > 0) problems.push(`default antd dot loader visible (${maxDefaultDots})`);
    if (!sawSharedLoader && !SERVER_RENDERED_ROUTES.has(route)) {
      problems.push("no admin loader observed while loading");
    }
    if (expectsSkeleton && !sawSkeleton) problems.push("shared skeleton never rendered");
    if (wrongColors.length) problems.push(`ring colour mismatch: ${wrongColors.join(", ")}`);
    if (loaderColors.length > 1) problems.push(`--admin-loader-color inconsistent: ${loaderColors.join(", ")}`);
    if (expectedRgba && loaderColors.length && !loaderColors.includes(expectedRgba)) {
      problems.push(`--admin-loader-color ${loaderColors.join(", ")} != configured ${expectedRgba}`);
    }

    const status = problems.length === 0 ? "PASS" : "FAIL";
    if (problems.length) failures += 1;
    results.push({ route, status, problems });

    const counts = hydrated.reduce(
      (acc, s) => ({
        spinner: Math.max(acc.spinner, s.sharedSpinners),
        rings: Math.max(acc.rings, s.antdRings.length),
        skeleton: Math.max(acc.skeleton, s.skeletons + s.pageSkeletons + s.cardSkeletons),
        overlay: Math.max(acc.overlay, s.routeOverlays),
        dots: Math.max(acc.dots, s.defaultDots),
      }),
      { spinner: 0, rings: 0, skeleton: 0, overlay: 0, dots: 0 },
    );

    console.log(
      `${status}  ${route.padEnd(46)} dots:${counts.dots} ring:${counts.rings} spinner:${counts.spinner} skeleton:${counts.skeleton} overlay:${counts.overlay}${
        problems.length ? ` -> ${problems.join("; ")}` : ""
      }`,
    );
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "admin-loader-report.json"),
    JSON.stringify({ configuredColor, routes: results }, null, 2),
  );

  console.log(`\nChecked ${results.length} admin routes.`);
  console.log(failures === 0 ? "ALL ADMIN PAGES USE THE CONFIGURED ADMIN LOADER" : `${failures} route(s) failed.`);
  console.log(`Report: ${path.join(OUTPUT_DIR, "admin-loader-report.json")}`);

  await browser.close();
  await mongoose.disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error("Verification failed:", error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});