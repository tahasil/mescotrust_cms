const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

/* ── Scenario 1: Model Schema Verification ── */
test("1. InternshipSubmission model defines all required fields and indexes", () => {
  const source = readFile("models/InternshipSubmission.js");

  assert.match(source, /fullName:\s*\{\s*type:\s*String,\s*required:\s*true/);
  assert.match(source, /email:\s*\{\s*type:\s*String,\s*required:\s*true/);
  assert.match(source, /phone:\s*\{\s*type:\s*String,\s*required:\s*true/);
  assert.match(source, /roleTitle:/);
  assert.match(source, /customRole:/);
  assert.match(source, /roleCategory:/);
  assert.match(source, /skills:/);
  assert.match(source, /workMode:/);
  assert.match(source, /duration:/);
  assert.match(source, /startDate:/);
  assert.match(source, /currentCity:/);
  assert.match(source, /statement:/);
  assert.match(source, /resume:\s*\{/);
  assert.match(source, /status:\s*\{/);
  assert.match(source, /isRead:\s*\{\s*type:\s*Boolean/);

  // Indexes
  assert.match(source, /index\(\{\s*createdAt:\s*-1\s*\}\)/);
  assert.match(source, /index\(\{\s*email:\s*1\s*\}\)/);
  assert.match(source, /index\(\{\s*phone:\s*1\s*\}\)/);
  assert.match(source, /index\(\{\s*roleTitle:\s*1\s*\}\)/);
  assert.match(source, /index\(\{\s*status:\s*1\s*\}\)/);
});

/* ── Scenario 2: Registry and Component Exports ── */
test("2. InternshipUpload component is registered in siteComponentRegistry and site exports", () => {
  const registrySource = readFile("lib/siteComponentRegistry.js");
  assert.match(registrySource, /"InternshipUpload"/);

  const siteIndexSource = readFile("components/site/index.js");
  assert.match(siteIndexSource, /export\s*\{\s*default\s*as\s*InternshipUpload,\s*InternshipUploadEditForm\s*\}\s*from\s*"\.\/InternshipUpload\/index";/);
  assert.match(siteIndexSource, /InternshipUpload:\s*InternshipUploadEditForm/);

  const publicCompSource = readFile("components/site/publicComponents.js");
  assert.match(publicCompSource, /export\s*\{\s*default\s*as\s*InternshipUpload\s*\}\s*from\s*"\.\/InternshipUpload\/InternshipUpload";/);
});

/* ── Scenario 3: Outer Wrapper Invariant ── */
test("3. InternshipUpload strictly preserves permanent site-component wrapper elements", () => {
  const source = readFile("components/site/InternshipUpload/InternshipUpload.js");

  assert.match(
    source,
    /<FullWidthBackground className=\{sectionBgClassName\} style=\{sectionBgStyle\}>[\s\S]*?<PageContainer style=\{pageContainerBgStyle\}>/,
    "InternshipUpload must preserve FullWidthBackground and PageContainer wrappers",
  );
});

/* ── Scenario 4: Form Fields matching Document Section 8 / Image 1 ── */
test("4. InternshipUpload component contains all 8 listing/application requirements from screen 1", () => {
  const source = readFile("components/site/InternshipUpload/InternshipUpload.js");

  // 1. Role title / department + Other
  assert.match(source, /name="roleTitle"/);
  assert.match(source, /name="customRole"/);
  assert.match(source, /isOtherSelected/);

  // 2. Eligibility & Skills
  assert.match(source, /name="skills"/);
  assert.match(source, /showSkills/);

  // 3. Location and Work Mode (Office / Hybrid / Remote)
  assert.match(source, /name="workMode"/);
  assert.match(source, /showWorkMode/);
  assert.match(source, /Office/);
  assert.match(source, /Hybrid/);
  assert.match(source, /Remote/);

  // 4. Duration and Stipend
  assert.match(source, /name="duration"/);
  assert.match(source, /showDuration/);

  // 5. Start date / Availability
  assert.match(source, /name="startDate"/);
  assert.match(source, /showStartDate/);

  // 6. Description & Responsibilities / Statement of Interest
  assert.match(source, /name="statement"/);
  assert.match(source, /showDescription/);

  // 7. Resume / CV Upload Dragger
  assert.match(source, /<Dragger/);
  assert.match(source, /beforeUpload=\{handleBeforeUpload\}/);

  // 8. Contact details
  assert.match(source, /name="fullName"/);
  assert.match(source, /name="email"/);
  assert.match(source, /name="phone"/);

  // Declaration
  assert.match(source, /name="consent"/);
});

/* ── Scenario 5: EditForm Structure ── */
test("5. InternshipUpload EditForm has Manage Section, Title & Colors, and Form Settings", () => {
  const source = readFile("components/site/InternshipUpload/EditForm.js");

  assert.match(source, /ManageSectionFields/);
  assert.match(source, /TitleAndColorsSection/);
  assert.match(source, /SettingsCardList/);
  assert.match(source, /internshipUploadRolesText/);
  assert.match(source, /internshipUploadShowSkills/);
  assert.match(source, /internshipUploadShowWorkMode/);
  assert.match(source, /internshipUploadShowDuration/);
  assert.match(source, /internshipUploadShowStartDate/);
  assert.match(source, /internshipUploadShowCity/);
  assert.match(source, /internshipUploadShowDescription/);
  assert.match(source, /internshipUploadMaxFileSizeMB/);
  assert.match(source, /internshipUploadSubmitBtnText/);
  assert.match(source, /useImperativeHandle\(ref,\s*\(\)\s*=>\s*\(\{\s*update:\s*handleUpdate\s*\}\)/);
});

/* ── Scenario 6: Title and Colors Configuration ── */
test("6. lib/titleAndColorsConfig.js configures InternshipUpload", () => {
  const source = readFile("lib/titleAndColorsConfig.js");

  assert.match(source, /InternshipUpload:\s*\{/);
  assert.match(source, /name:\s*"internshipUploadTitleEnabled"/);
  assert.match(source, /name:\s*"internshipUploadSubTitleEnabled"/);
  assert.match(source, /name:\s*"internshipUploadTitleAlign"/);
  assert.match(source, /name:\s*"internshipUploadCardBgColorKey"/);
  assert.match(source, /name:\s*"internshipUploadButtonBgColorKey"/);
});

/* ── Scenario 7: Public API Endpoint ── */
test("7. Public upload API handles multipart submission, honeypot, validation, and file persistence", () => {
  const source = readFile("app/api/public/internship-upload/route.js");

  assert.match(source, /checkRateLimit/);
  assert.match(source, /honeypot/);
  assert.match(source, /InternshipSubmission\.create/);
  assert.match(source, /uploads[\\\/]+internships/);
  assert.match(source, /MAX_FILE_SIZE_BYTES/);
  assert.match(source, /ALLOWED_EXTENSIONS/);
  assert.match(source, /INT-/);
});

/* ── Scenario 8: Admin API Endpoints ── */
test("8. Admin API routes implement authentication, filtering, pagination, and file deletion", () => {
  const listSource = readFile("app/api/admin/internship-submissions/route.js");
  assert.match(listSource, /requireAuth/);
  assert.match(listSource, /InternshipSubmission\.find/);
  assert.match(listSource, /InternshipSubmission\.countDocuments/);
  assert.match(listSource, /InternshipSubmission\.distinct\("roleTitle"\)/);

  const detailSource = readFile("app/api/admin/internship-submissions/[id]/route.js");
  assert.match(detailSource, /requireAuth/);
  assert.match(detailSource, /InternshipSubmission\.findById/);
  assert.match(detailSource, /InternshipSubmission\.findByIdAndUpdate/);
  assert.match(detailSource, /InternshipSubmission\.findByIdAndDelete/);
  assert.match(detailSource, /fs\.unlink/);
});

/* ── Scenario 9: Admin Management UI ── */
test("9. Admin Internship Submissions page provides table, filters, quick status update, and details modal", () => {
  const source = readFile("app/admin/(authenticated)/internship-submissions/page.js");

  assert.match(source, /ThemeAdminCard/);
  assert.match(source, /title="Internship Submissions"/);
  assert.match(source, /adminTableLoading/);
  assert.match(source, /adminTableLocale/);
  assert.match(source, /Input\.Search/);
  assert.match(source, /STATUS_OPTIONS/);
  assert.match(source, /roleFilter/);
  assert.match(source, /openViewModal/);
  assert.match(source, /handleStatusChange/);
  assert.match(source, /handleDelete/);
  assert.match(source, /<Descriptions/);
  assert.match(source, /Download Resume/);
});

/* ── Scenario 10: Admin Navigation & RBAC ── */
test("10. AdminLayout and RBAC catalog include Internship Submissions", () => {
  const layoutSource = readFile("components/admin/AdminLayoutClient.js");
  assert.match(layoutSource, /key:\s*\"\/admin\/internship-submissions\"/);
  assert.match(layoutSource, /href=\"\/admin\/internship-submissions\"/);
  assert.match(layoutSource, /Internship Submissions/);

  const catalogSource = readFile("lib/rbac/catalog.js");
  assert.match(catalogSource, /"internship-submissions":\s*"submissions"/);
  assert.match(catalogSource, /"\/admin\/internship-submissions":\s*"submissions\.view"/);
});

/* ── Scenario 11: Title Styling and Typography Exact Match ── */
test("11. InternshipUpload title typography matches CareersUpload exactly using fable-section-heading, fable-eyebrow, and fable-heading", () => {
  const source = readFile("components/site/InternshipUpload/InternshipUpload.js");

  // Uses the exact header and typography classes matching CareersUpload
  assert.match(source, /className="fable-section-heading"/);
  assert.match(source, /className="fable-eyebrow"/);
  assert.match(source, /className="fable-heading"/);
  assert.match(source, /renderHighlightedTitle\(mainTitle,\s*props\)/);
  assert.match(source, /id="internship-application-form"/);
});

/* ── Scenario 12: Apply Now Interaction & Role Preselection ── */
test("12. Careers Apply Now button scrolls to internship-application-form without leaving page and preselects role", () => {
  const careersSource = readFile("components/site/Careers/Careers.js");
  const internshipSource = readFile("components/site/InternshipUpload/InternshipUpload.js");

  // Careers.js searches for internship-application-form and dispatches role event
  assert.match(careersSource, /internship-application-form/);
  assert.match(careersSource, /window\.dispatchEvent\(\s*new CustomEvent\("internship-select-role"/);
  assert.match(careersSource, /window\.dispatchEvent\(\s*new CustomEvent\("careers-select-role"/);

  // InternshipUpload listens to role selection events and URL params
  assert.match(internshipSource, /window\.addEventListener\("internship-select-role"/);
  assert.match(internshipSource, /window\.addEventListener\("careers-select-role"/);
  assert.match(internshipSource, /form\.setFieldsValue\(\{\s*roleTitle:\s*matched\.value\s*\}\)/);
  assert.match(internshipSource, /params\.get\("role"\)/);
});

/* ── Scenario 13: Resume / CV Column Compact Width & Text Ellipsis ── */
test("13. Resume / CV column is compact with text ellipsis and full filename tooltip", () => {
  const internUi = readFile("app/admin/(authenticated)/internship-submissions/page.js");
  const careerUi = readFile("app/admin/(authenticated)/career-submissions/page.js");

  // Internship Submissions Resume Column
  assert.match(internUi, /key:\s*"resume"/);
  assert.match(internUi, /width:\s*170/);
  assert.match(internUi, /textOverflow:\s*"ellipsis"/);
  assert.match(internUi, /whiteSpace:\s*"nowrap"/);
  assert.match(internUi, /<Tooltip title=\{`Download \$\{fileName\}`\}/);

  // Career Submissions Resume Column
  assert.match(careerUi, /key:\s*"resume"/);
  assert.match(careerUi, /width:\s*170/);
  assert.match(careerUi, /textOverflow:\s*"ellipsis"/);
  assert.match(careerUi, /whiteSpace:\s*"nowrap"/);
  assert.match(careerUi, /<Tooltip title=\{`Download \$\{fileName\}`\}/);
});

/* ── Scenario 14: Export Integration and Title Rename ── */
test("14. Export endpoints exist, AdminExportDropdown integrated, and Career title renamed", () => {
  const internUi = readFile("app/admin/(authenticated)/internship-submissions/page.js");
  const careerUi = readFile("app/admin/(authenticated)/career-submissions/page.js");
  const internExportApi = readFile("app/api/admin/internship-submissions/export/route.js");
  const careerExportApi = readFile("app/api/admin/career-submissions/export/route.js");

  // AdminExportDropdown integration
  assert.match(internUi, /<AdminExportDropdown/);
  assert.match(internUi, /exportUrl="\/api\/admin\/internship-submissions\/export"/);
  assert.match(careerUi, /<AdminExportDropdown/);
  assert.match(careerUi, /exportUrl="\/api\/admin\/career-submissions\/export"/);

  // Career Submissions title renamed
  assert.match(careerUi, /title="Career Submissions"/);
  assert.doesNotMatch(careerUi, /title="Career & Resume Submissions"/);

  // Export APIs implement requireAuth, connectDB, and createExportResponse
  assert.match(internExportApi, /requireAuth/);
  assert.match(internExportApi, /createExportResponse/);
  assert.match(careerExportApi, /requireAuth/);
  assert.match(careerExportApi, /createExportResponse/);
});
