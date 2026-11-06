/**
 * Automated Contract Test Suite for CMS Documentation Hub and Sidebar Submenus
 * Run: node scripts/test-documentation-contracts.js
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

let passed = 0;
let failed = 0;

function runScenario(description, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${description}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log("\n========================================================");
console.log(" Running CMS Documentation & Sidebar Submenus Contract Tests");
console.log("========================================================\n");

// Scenario 1: Sidebar Extension with Submenus in AdminLayoutClient.js
runScenario("Scenario 1: Sidebar Extension includes 'Documentation' group with comprehensive submenus", () => {
  const filePath = path.join(__dirname, "..", "components", "admin", "AdminLayoutClient.js");
  const content = fs.readFileSync(filePath, "utf-8");

  assert(content.includes('key: "group:admin:documentation"'), "AdminLayoutClient.js must define group:admin:documentation");
  assert(content.includes('label: "Documentation"'), "AdminLayoutClient.js must label the group 'Documentation'");
  assert(content.includes("ReadOutlined"), "AdminLayoutClient.js must use ReadOutlined icon");

  // Check key submenus
  const requiredSubmenuKeys = [
    "/admin/documentation",
    "/admin/documentation/dashboard",
    "/admin/documentation/pages",
    "/admin/documentation/components",
    "/admin/documentation/appearance-header",
    "/admin/documentation/appearance-header-ribbon",
    "/admin/documentation/appearance-footer",
    "/admin/documentation/menus",
    "/admin/documentation/chatbot",
    "/admin/documentation/social-wall",
    "/admin/documentation/form-builder",
    "/admin/documentation/sliders",
    "/admin/documentation/popups",
    "/admin/documentation/push-notifications",
    "/admin/documentation/team",
    "/admin/documentation/testimonials",
    "/admin/documentation/gallery",
    "/admin/documentation/faqs",
    "/admin/documentation/blogs",
    "/admin/documentation/events",
    "/admin/documentation/media",
    "/admin/documentation/submissions",
    "/admin/documentation/settings",
    "/admin/documentation/users",
    "/admin/documentation/rbac",
  ];

  requiredSubmenuKeys.forEach((key) => {
    assert(content.includes(`key: "${key}"`), `Submenu key '${key}' must exist in AdminLayoutClient.js`);
  });
});

// Scenario 2: RBAC permissions catalog includes documentation module and controls
runScenario("Scenario 2: RBAC permission catalog includes Documentation module, generates permissions and controls routes", () => {
  const filePath = path.join(__dirname, "..", "lib", "rbac", "catalog.js");
  const content = fs.readFileSync(filePath, "utf-8");

  assert(
    content.includes('{ key: "documentation", label: "Documentation", actions: ["view"] }'),
    "ADMIN_MODULES must include documentation module with ['view'] action",
  );
  assert(
    content.includes('documentation: "documentation"'),
    'API_MODULE_ALIASES must alias documentation to "documentation"',
  );
  assert(
    content.includes('"/admin/documentation": "documentation.view"'),
    'MENU_PERMISSIONS must require "documentation.view" for "/admin/documentation"',
  );
  assert(
    content.includes('if (key.startsWith("/admin/documentation")) return "documentation.view";'),
    'getPermissionForMenuKey must guard all /admin/documentation submenus with "documentation.view"',
  );
  assert(
    content.includes('if (path.startsWith("/admin/documentation")) return "documentation.view";'),
    'getPermissionForAdminPage must guard all /admin/documentation routes with "documentation.view"',
  );
  assert(
    content.includes('PERMISSION_CATALOG_VERSION = "mescotrust-admin-v11-2026-11-06"'),
    "PERMISSION_CATALOG_VERSION must be incremented to trigger RBAC bootstrap sync",
  );
});

// Scenario 3: Individual Guide Route & Printable Sheet Component Exist
runScenario("Scenario 3: Route app/admin/(authenticated)/documentation/[module]/page.js and DocumentGuideSheet exist", () => {
  const routePath = path.join(__dirname, "..", "app", "admin", "(authenticated)", "documentation", "[module]", "page.js");
  const sheetPath = path.join(__dirname, "..", "components", "admin", "documentation", "DocumentGuideSheet.js");
  const hubPath = path.join(__dirname, "..", "components", "admin", "documentation", "DocumentationHub.js");

  assert(fs.existsSync(routePath), "[module]/page.js dynamic route must exist");
  assert(fs.existsSync(sheetPath), "DocumentGuideSheet.js component must exist");
  assert(fs.existsSync(hubPath), "DocumentationHub.js component must exist");

  const sheetContent = fs.readFileSync(sheetPath, "utf-8");
  assert(sheetContent.includes("ThemeAdminCard"), "DocumentGuideSheet must use standard ThemeAdminCard layout");
  assert(sheetContent.includes("Open page"), "DocumentGuideSheet must provide 'Open page' action");
  assert(sheetContent.includes("Admin panel guide"), "DocumentGuideSheet header must contain 'Admin panel guide'");
  assert(sheetContent.includes("Previous"), "DocumentGuideSheet must have Previous button");
  assert(sheetContent.includes("Next →"), "DocumentGuideSheet must have Next button");
  assert(!sheetContent.includes("All Documentation Guides"), "Middle button must be removed");
  assert(sheetContent.includes("@page {"), "DocumentGuideSheet must define @page A4 print configuration");
  assert(sheetContent.includes("print-color-adjust: exact"), "DocumentGuideSheet must force exact print color adjustment");
  assert(sheetContent.includes("doc-divider-line"), "DocumentGuideSheet must have solid divider line for screen and print");

  const layoutPath = path.join(__dirname, "..", "components", "admin", "AdminLayoutClient.js");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");
  assert(layoutContent.includes("@media print"), "AdminLayoutClient must include global @media print rules");
  assert(layoutContent.includes("margin-left: 0 !important"), "AdminLayoutClient must zero out margin-left in print mode");
});

// Scenario 4: Documentation Data Catalog Completeness
runScenario("Scenario 4: Catalog lib/documentation/adminGuidesData.js contains all 24 required modules with aliases", () => {
  const dataPath = path.join(__dirname, "..", "lib", "documentation", "adminGuidesData.js");
  assert(fs.existsSync(dataPath), "adminGuidesData.js must exist");

  const content = fs.readFileSync(dataPath, "utf-8");

  const requiredModules = [
    "dashboard",
    "pages",
    "components",
    "appearance-header",
    "appearance-header-ribbon",
    "appearance-footer",
    "menus",
    "chatbot",
    "social-wall",
    "form-builder",
    "sliders",
    "popups",
    "push-notifications",
    "team",
    "testimonials",
    "gallery",
    "faqs",
    "blogs",
    "events",
    "media",
    "submissions",
    "settings",
    "users",
    "rbac",
  ];

  requiredModules.forEach((modId) => {
    assert(
      content.includes(`id: "${modId}"`),
      `adminGuidesData.js must document module '${modId}'`,
    );
  });
});

// Scenario 5: Beginner-Friendly Step-by-Step Format Integrity Matching User Reference
runScenario("Scenario 5: Every module guide contains structured tables, numbered steps, and 'A few things to keep in mind'", () => {
  const dataPath = path.join(__dirname, "..", "lib", "documentation", "adminGuidesData.js");
  const content = fs.readFileSync(dataPath, "utf-8");

  const startToken = "export const ADMIN_MODULE_GUIDES = [";
  const startIdx = content.indexOf(startToken);
  const endIdx = content.lastIndexOf("];");
  assert(startIdx !== -1 && endIdx !== -1, "Must find ADMIN_MODULE_GUIDES in data file");

  const rawArray = content.slice(startIdx + "export const ADMIN_MODULE_GUIDES = ".length, endIdx + 2);
  const tmpPath = path.join(__dirname, "_tmp_test_guides.js");
  fs.writeFileSync(tmpPath, "module.exports = " + rawArray + ";", "utf-8");
  const guides = require(tmpPath);
  fs.unlinkSync(tmpPath);

  assert(guides.length >= 24, `Expected at least 24 modules, found ${guides.length}`);

  guides.forEach((g) => {
    assert(g.id, `Module must have an id`);
    assert(g.title, `Module ${g.id} must have a title`);
    assert(g.documentTitle, `Module ${g.id} must have a documentTitle`);
    assert(g.documentSubtitle, `Module ${g.id} must have a documentSubtitle`);
    assert(g.auditReference, `Module ${g.id} must have an auditReference`);
    assert(g.adminRoute, `Module ${g.id} must have an adminRoute`);
    assert(g.summary, `Module ${g.id} must have a summary`);
    assert(Array.isArray(g.sections) && g.sections.length > 0, `Module ${g.id} must have sections`);
    assert(Array.isArray(g.keepInMind) && g.keepInMind.length > 0, `Module ${g.id} must have keepInMind takeaways`);
  });

  // Verify Pages matches PDF 1
  const pagesGuide = guides.find((g) => g.id === "pages");
  assert(pagesGuide, "Pages guide must exist");
  assert(pagesGuide.tables.some((t) => t.title.includes("Draft and Published")), "Pages guide must include Draft and Published table");
  assert(pagesGuide.sections.some((s) => s.title.includes("Creating a new page")), "Pages guide must include Creating a new page");
  assert(pagesGuide.sections.some((s) => s.title.includes("Publishing a page")), "Pages guide must include Publishing a page");
  assert(pagesGuide.sections.some((s) => s.title.includes("Taking a page offline again")), "Pages guide must include Taking a page offline again");
  assert(pagesGuide.sections.some((s) => s.title.includes("Deleting a page")), "Pages guide must include Deleting a page");

  // Verify Menus matches PDF 2
  const menusGuide = guides.find((g) => g.id === "menus");
  assert(menusGuide, "Menus guide must exist");
  assert(menusGuide.tables.some((t) => t.title.includes("Field Controls")), "Menus guide must include Field controls table");
  assert(menusGuide.sections.some((s) => s.title.includes("Changing the order")), "Menus guide must include Changing the order");

  // Verify Sliders matches PDF 3
  const slidersGuide = guides.find((g) => g.id === "sliders");
  assert(slidersGuide, "Sliders guide must exist");
  assert(slidersGuide.tables.some((t) => t.title.includes("sliders available")), "Sliders guide must include sliders available table");
  assert(slidersGuide.sections.some((s) => s.title.includes("Changing the slides")), "Sliders guide must include Changing the slides");
  assert(slidersGuide.sections.some((s) => s.title.includes("Hiding a slider")), "Sliders guide must include Hiding a slider");
});

// Scenario 6: Comprehensive Step-by-Step Guidance & Metadata Integrity
runScenario("Scenario 6: Every module in adminGuidesData contains structured headings, action steps, and valid metadata", () => {
  const dataPath = path.join(__dirname, "..", "lib", "documentation", "adminGuidesData.js");
  const { ADMIN_MODULE_GUIDES } = require(dataPath);

  assert(Array.isArray(ADMIN_MODULE_GUIDES), "ADMIN_MODULE_GUIDES must be an array");
  assert(ADMIN_MODULE_GUIDES.length >= 24, "Must have at least 24 module guides");

  ADMIN_MODULE_GUIDES.forEach((guide) => {
    assert(guide.id && typeof guide.id === "string", `Guide must have valid id: ${JSON.stringify(guide)}`);
    assert(guide.title && typeof guide.title === "string", `Guide ${guide.id} must have title`);
    assert(guide.adminRoute && guide.adminRoute.startsWith("/admin"), `Guide ${guide.id} must have adminRoute`);
    assert(guide.whereManaged && typeof guide.whereManaged === "string", `Guide ${guide.id} must describe whereManaged`);
    assert(Array.isArray(guide.sections) && guide.sections.length > 0, `Guide ${guide.id} must have sections`);
    assert(Array.isArray(guide.keepInMind) && guide.keepInMind.length > 0, `Guide ${guide.id} must have keepInMind points`);

    // Verify at least one section has structured steps
    const hasSteps = guide.sections.some((s) => Array.isArray(s.steps) && s.steps.length > 0);
    assert(hasSteps, `Guide ${guide.id} must contain at least one section with step-by-step action items`);
  });
});

// Scenario 7: In-App Hub Links to Individual Sub-Pages
runScenario("Scenario 7: DocumentationHub component links directly to sub-routes (/admin/documentation/[module])", () => {
  const hubPath = path.join(__dirname, "..", "components", "admin", "documentation", "DocumentationHub.js");
  const content = fs.readFileSync(hubPath, "utf-8");

  assert(content.includes("/admin/documentation/"), "DocumentationHub must link directly to module sub-pages");
  assert(content.includes("Read Guide →"), "DocumentationHub must contain Read Guide action linking to sub-page");
});

console.log("\n========================================================");
console.log(` Test Summary: ${passed} Passed, ${failed} Failed`);
console.log("========================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All contract tests passed successfully!");
}
