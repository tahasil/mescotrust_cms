/**
 * Automated Contract Test Suite for FAQs Management & Shortcode Integration
 *
 * Verifies:
 * 1. models/Faq schema, validation, and indexes.
 * 2. lib/faqDefaults contains the 12 required FAQs across 8 categories from Document Section 6.
 * 3. RBAC catalog permissions (ADMIN_MODULES, aliases, menu permissions, route authorization).
 * 4. Shortcode parser & handler for global ([shortcode="faqs"]) and contextual ([shortcode="faqs:Category"]) shortcodes.
 * 5. Site component registry (SITE_COMPONENT_IDS, publicComponents.js, components/site/index.js).
 * 6. Permanent site-component wrapper invariant in components/site/Faqs/Faqs.js.
 * 7. Admin sidebar integration in components/admin/AdminLayoutClient.js.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

function runTests() {
  console.log("=================================================");
  console.log(" Running FAQs Management & Shortcode Test Suite ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`\x1b[32m✔ PASS:\x1b[0m ${name}`);
      passed++;
    } catch (err) {
      console.error(`\x1b[31m✖ FAIL:\x1b[0m ${name}`);
      console.error(err);
      failed++;
    }
  }

  // Scenario 1: Document Section 6 FAQs Requirements
  test("Scenario 1: lib/faqDefaults contains all 12 initial FAQs from Document Section 6", () => {
    const filePath = path.join(__dirname, "../lib/faqDefaults.js");
    assert(fs.existsSync(filePath), "lib/faqDefaults.js must exist");
    const content = fs.readFileSync(filePath, "utf-8");

    const expectedCategories = [
      "About MESCO",
      "Donations",
      "Scholarships",
      "Medical Assistance",
      "Relief of Poverty",
      "Volunteering",
      "Partnerships",
      "Contact",
    ];

    expectedCategories.forEach((cat) => {
      assert(
        content.includes(`"${cat}"`),
        `lib/faqDefaults must include category: ${cat}`
      );
    });

    const expectedQuestions = [
      "What is MESCO Trust?",
      "What are MESCO’s main areas of work?",
      "How can I support MESCO?",
      "Which programmes can I support?",
      "Does MESCO provide scholarships?",
      "How do I apply for a scholarship?",
      "Which documents are required?",
      "Does MESCO provide medical assistance?",
      "Can families request relief support?",
      "How can I volunteer with MESCO?",
      "Can an organisation collaborate with MESCO?",
      "How can I contact MESCO?",
    ];

    expectedQuestions.forEach((q) => {
      assert(
        content.includes(q),
        `lib/faqDefaults must include question: "${q}"`
      );
    });
  });

  // Scenario 2: models/Faq schema
  test("Scenario 2: models/Faq.js exists and defines question, answer, category, order, status, tags", () => {
    const filePath = path.join(__dirname, "../models/Faq.js");
    assert(fs.existsSync(filePath), "models/Faq.js must exist");
    const content = fs.readFileSync(filePath, "utf-8");

    assert(content.includes("question:"), "Must have question field");
    assert(content.includes("answer:"), "Must have answer field");
    assert(content.includes("category:"), "Must have category field");
    assert(content.includes("order:"), "Must have order field");
    assert(content.includes("status:"), "Must have status field");
    assert(content.includes("tags:"), "Must have tags field");
    assert(content.includes("isFeatured:"), "Must have isFeatured field");
  });

  // Scenario 3: Admin Sidebar Navigation
  test("Scenario 3: components/admin/AdminLayoutClient.js includes FAQs menu item with QuestionCircleOutlined", () => {
    const filePath = path.join(
      __dirname,
      "../components/admin/AdminLayoutClient.js"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    assert(
      content.includes("QuestionCircleOutlined"),
      "Must import QuestionCircleOutlined icon"
    );
    assert(
      content.includes('key: "/admin/faqs"'),
      'Must contain menu item with key: "/admin/faqs"'
    );
    assert(
      content.includes('<Link href="/admin/faqs"'),
      "Must link to /admin/faqs"
    );
    assert(content.includes("FAQs"), "Must display FAQs label");
  });

  // Scenario 4: RBAC Catalog Permissions
  test("Scenario 4: lib/rbac/catalog.js defines faqs module, alias, menu permission, and page authorization", () => {
    const filePath = path.join(__dirname, "../lib/rbac/catalog.js");
    const content = fs.readFileSync(filePath, "utf-8");

    assert(
      content.includes('{ key: "faqs", label: "FAQs", actions: CRUD_ACTIONS }'),
      "ADMIN_MODULES must include faqs module with CRUD_ACTIONS"
    );
    assert(
      content.includes('faqs: "faqs"'),
      'API_MODULE_ALIASES must alias faqs to "faqs"'
    );
    assert(
      content.includes('"/admin/faqs": "faqs.view"'),
      'MENU_PERMISSIONS must require "faqs.view" for "/admin/faqs"'
    );
    assert(
      content.includes('path.startsWith("/admin/faqs")'),
      "getPermissionForAdminPage must guard /admin/faqs routes"
    );
  });

  // Scenario 5: ShortCode Handler Integration
  test("Scenario 5: components/site/ShortCode/ShortCode.js parses and handles FAQ shortcodes", () => {
    const filePath = path.join(
      __dirname,
      "../components/site/ShortCode/ShortCode.js"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    assert(
      content.includes("isFaqShortcodeValue"),
      "Must define isFaqShortcodeValue helper"
    );
    assert(
      content.includes("parseFaqCategoryFromShortcode"),
      "Must define parseFaqCategoryFromShortcode helper"
    );
    assert(
      content.includes("<PublicSiteComponents.Faqs") && content.includes("categoryFilter={cat}"),
      "Must render PublicSiteComponents.Faqs with parsed categoryFilter"
    );
    assert(
      content.includes("if (isFaqShortcode)"),
      "Must have direct passthrough return condition for isFaqShortcode"
    );
  });

  // Scenario 6: Site Component Registration
  test("Scenario 6: Faqs is registered in SITE_COMPONENT_IDS and exports", () => {
    const regPath = path.join(__dirname, "../lib/siteComponentRegistry.js");
    const pubPath = path.join(__dirname, "../components/site/publicComponents.js");
    const idxPath = path.join(__dirname, "../components/site/index.js");

    const regContent = fs.readFileSync(regPath, "utf-8");
    const pubContent = fs.readFileSync(pubPath, "utf-8");
    const idxContent = fs.readFileSync(idxPath, "utf-8");

    assert(
      regContent.includes('"Faqs"'),
      'lib/siteComponentRegistry.js must include "Faqs"'
    );
    assert(
      pubContent.includes('export { default as Faqs } from "./Faqs/Faqs";'),
      "components/site/publicComponents.js must export Faqs"
    );
    assert(
      idxContent.includes("Faqs, FaqsEditForm"),
      "components/site/index.js must export Faqs and FaqsEditForm"
    );
    assert(
      idxContent.includes("Faqs: FaqsEditForm"),
      "EDITABLE_SITE_EDIT_FORMS must include Faqs"
    );
  });

  // Scenario 7: Permanent Site-Component Wrapper Invariant
  test("Scenario 7: components/site/Faqs/Faqs.js respects permanent outer wrapper invariant", () => {
    const filePath = path.join(__dirname, "../components/site/Faqs/Faqs.js");
    const content = fs.readFileSync(filePath, "utf-8");

    assert(
      content.includes("<FullWidthBackground"),
      "Must wrap in FullWidthBackground"
    );
    assert(
      content.includes("<PageContainer"),
      "Must wrap inside PageContainer"
    );
    assert(
      content.includes("sectionBgClassName"),
      "Must apply sectionBgClassName"
    );
    assert(
      content.includes("sectionBgStyle"),
      "Must apply managed sectionBgStyle"
    );
    assert(
      content.includes("pageContainerBgStyle"),
      "Must apply managed pageContainerBgStyle"
    );
  });

  // Scenario 8: Frontend FAQs Live Search, Category Tabs, Accordion & Schema.org JSON-LD
  test("Scenario 8: components/site/Faqs/Faqs.js implements search, category tabs, and Schema.org FAQPage JSON-LD", () => {
    const filePath = path.join(__dirname, "../components/site/Faqs/Faqs.js");
    const content = fs.readFileSync(filePath, "utf-8");

    assert(
      content.includes('type="application/ld+json"'),
      "Must output Schema.org JSON-LD"
    );
    assert(content.includes('"FAQPage"'), "JSON-LD must specify FAQPage type");
    assert(content.includes("searchQuery"), "Must support live search input");
    assert(
      content.includes("selectedCategory"),
      "Must support category filtering tabs"
    );
    assert(
      content.includes("toggleItem"),
      "Must support interactive accordion toggling"
    );
  });

  // Scenario 9: Admin APIs existence & contracts
  test("Scenario 9: Admin and Public FAQ APIs are properly defined", () => {
    const adminRoute = path.join(
      __dirname,
      "../app/api/admin/faqs/route.js"
    );
    const adminDetailRoute = path.join(
      __dirname,
      "../app/api/admin/faqs/[id]/route.js"
    );
    const adminSeedRoute = path.join(
      __dirname,
      "../app/api/admin/faqs/seed/route.js"
    );
    const publicRoute = path.join(
      __dirname,
      "../app/api/public/faqs/route.js"
    );

    assert(fs.existsSync(adminRoute), "Admin faqs route must exist");
    assert(fs.existsSync(adminDetailRoute), "Admin faqs [id] route must exist");
    assert(fs.existsSync(adminSeedRoute), "Admin faqs seed route must exist");
    assert(fs.existsSync(publicRoute), "Public faqs route must exist");

    const adminContent = fs.readFileSync(adminRoute, "utf-8");
    assert(
      adminContent.includes("requireAuth"),
      "Admin route must require authentication"
    );
    assert(
      adminContent.includes("ensureDefaultFaqs"),
      "Admin route must auto-seed default FAQs when empty"
    );

    const publicContent = fs.readFileSync(publicRoute, "utf-8");
    assert(
      publicContent.includes('status: "published"'),
      "Public route must only return published FAQs"
    );
  });

  // Scenario 10: Admin FAQs UI Page Features
  test("Scenario 10: Admin FAQs page includes shortcode helper, drawer CRUD, and RichTextEditor", () => {
    const adminPage = path.join(
      __dirname,
      "../app/admin/(authenticated)/faqs/page.js"
    );
    assert(fs.existsSync(adminPage), "app/admin/(authenticated)/faqs/page.js must exist");

    const pageContent = fs.readFileSync(adminPage, "utf-8");
    assert(
      pageContent.includes('[shortcode="faqs"]'),
      "Must display global shortcode"
    );
    assert(
      pageContent.includes("copyToClipboard"),
      "Must provide copy-to-clipboard functionality"
    );
    assert(
      pageContent.includes("openCreateDrawer") || pageContent.includes("openCreateModal"),
      "Must provide Add FAQ drawer"
    );
    assert(
      pageContent.includes("openEditDrawer") || pageContent.includes("openEditModal"),
      "Must provide Edit FAQ drawer"
    );
    assert(
      pageContent.includes("RichTextEditor"),
      "Must use RichTextEditor for Answer field"
    );
    assert(
      pageContent.includes("handleDelete"),
      "Must provide Delete FAQ confirmation"
    );
    assert(
      pageContent.includes("handleToggleStatus"),
      "Must provide quick status toggle Switch"
    );
  });

  // Scenario 11: Title and Subtitle Disabled State in ShortCode & Faqs
  test("Scenario 11: Disabling title and subtitle hides them in ShortCode and embedded Faqs", () => {
    const shortCodePath = path.join(
      __dirname,
      "../components/site/ShortCode/ShortCode.js"
    );
    const shortCodeEditPath = path.join(
      __dirname,
      "../components/site/ShortCode/EditForm.js"
    );
    const faqsPath = path.join(
      __dirname,
      "../components/site/Faqs/Faqs.js"
    );

    const scContent = fs.readFileSync(shortCodePath, "utf-8");
    const editContent = fs.readFileSync(shortCodeEditPath, "utf-8");
    const faqContent = fs.readFileSync(faqsPath, "utf-8");

    // ShortCode passes titleEnabled and subTitleEnabled to Faqs
    assert(
      scContent.includes("titleEnabled={titleEnabled}"),
      "ShortCode must forward titleEnabled to Faqs"
    );
    assert(
      scContent.includes("subTitleEnabled={subTitleEnabled}"),
      "ShortCode must forward subTitleEnabled to Faqs"
    );

    // Faqs checks both its own and ShortCode title/subtitle enabled flags
    assert(
      faqContent.includes("props?.shortCodeTitleEnabled !== false"),
      "Faqs must check shortCodeTitleEnabled"
    );
    assert(
      faqContent.includes("props?.shortCodeSubTitleEnabled !== false"),
      "Faqs must check shortCodeSubTitleEnabled"
    );

    // EditForm sets titleEnabled, faqsTitleEnabled and shortCodeTitleEnabled
    assert(
      editContent.includes("titleEnabled:"),
      "EditForm must save titleEnabled flag"
    );
    assert(
      editContent.includes("faqsTitleEnabled:"),
      "EditForm must save faqsTitleEnabled flag"
    );
  });

  test("Scenario 12: Color customization options are defined for category buttons, titles, descriptions, card borders, active questions, and active icons", () => {
    const configPath = path.join(__dirname, "../lib/titleAndColorsConfig.js");
    const faqPath = path.join(__dirname, "../components/site/Faqs/Faqs.js");
    const faqEditPath = path.join(__dirname, "../components/site/Faqs/EditForm.js");

    const configContent = fs.readFileSync(configPath, "utf-8");
    const faqContent = fs.readFileSync(faqPath, "utf-8");
    const faqEditContent = fs.readFileSync(faqEditPath, "utf-8");

    // Check titleAndColorsConfig has FAQ color keys
    assert(configContent.includes("faqsCategoryBtnBgColorKey"), "Must configure category button bg color");
    assert(configContent.includes("faqsCategoryBtnTextColorKey"), "Must configure category button text color");
    assert(configContent.includes("faqsCategoryActiveBtnBgColorKey"), "Must configure active category button bg color");
    assert(configContent.includes("faqsCategoryActiveBtnTextColorKey"), "Must configure active category button text color");
    assert(configContent.includes("faqsQuestionTextColorKey"), "Must configure question title color");
    assert(configContent.includes("faqsAnswerTextColorKey"), "Must configure answer description color");
    assert(configContent.includes("faqsCardBgColorKey"), "Must configure FAQ card background color");
    assert(configContent.includes("faqsCardBorderColorKey"), "Must configure FAQ card border color");
    assert(configContent.includes("faqsCardHoverBorderColorKey"), "Must configure FAQ card hover border color");
    assert(configContent.includes("faqsActiveQuestionTextColorKey"), "Must configure active question text color");
    assert(configContent.includes("faqsActiveIconBgColorKey"), "Must configure active icon bg color");
    assert(configContent.includes("faqsActiveIconTextColorKey"), "Must configure active icon text color");

    // Check Faqs component uses these colors
    assert(faqContent.includes("faqsCategoryBtnBgColorKey"), "Faqs component must read faqsCategoryBtnBgColorKey");
    assert(faqContent.includes("faqsQuestionTextColorKey"), "Faqs component must read faqsQuestionTextColorKey");
    assert(faqContent.includes("faqsAnswerTextColorKey"), "Faqs component must read faqsAnswerTextColorKey");
    assert(faqContent.includes("faqsCardBgColorKey"), "Faqs component must read faqsCardBgColorKey");
    assert(faqContent.includes("faqsCardHoverBorderColorKey"), "Faqs component must read faqsCardHoverBorderColorKey");
    assert(faqContent.includes("faqsActiveQuestionTextColorKey"), "Faqs component must read faqsActiveQuestionTextColorKey");
    assert(faqContent.includes("faqsActiveIconBgColorKey"), "Faqs component must read faqsActiveIconBgColorKey");
    assert(faqContent.includes("faqsActiveIconTextColorKey"), "Faqs component must read faqsActiveIconTextColorKey");

    // Check Faqs EditForm saves these colors
    assert(faqEditContent.includes("faqsCategoryBtnBgColorKey"), "Faqs EditForm must handle faqsCategoryBtnBgColorKey");
    assert(faqEditContent.includes("faqsQuestionTextColorKey"), "Faqs EditForm must handle faqsQuestionTextColorKey");
    assert(faqEditContent.includes("faqsAnswerTextColorKey"), "Faqs EditForm must handle faqsAnswerTextColorKey");
    assert(faqEditContent.includes("faqsCardHoverBorderColorKey"), "Faqs EditForm must handle faqsCardHoverBorderColorKey");
    assert(faqEditContent.includes("faqsActiveQuestionTextColorKey"), "Faqs EditForm must handle faqsActiveQuestionTextColorKey");
    assert(faqEditContent.includes("faqsActiveIconBgColorKey"), "Faqs EditForm must handle faqsActiveIconBgColorKey");
    assert(faqEditContent.includes("faqsActiveIconTextColorKey"), "Faqs EditForm must handle faqsActiveIconTextColorKey");
  });

  console.log("\n-------------------------------------------------");
  console.log(` Results: ${passed} passed, ${failed} failed `);
  console.log("-------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

