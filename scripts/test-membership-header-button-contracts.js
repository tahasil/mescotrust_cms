const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("1. lib/appearance.js defines canonical HEADER_DEFAULTS for Membership button", () => {
  const source = readFile("lib/appearance.js");
  assert.match(source, /headerMembershipEnabled:\s*true/);
  assert.match(source, /headerMembershipLabel:\s*"Membership"/);
  assert.match(source, /headerMembershipHref:\s*"\/membership"/);
  assert.match(source, /headerMembershipHrefTarget:\s*"_self"/);
  assert.match(source, /headerMembershipBgColorKey:\s*"#ffffff"/);
  assert.match(source, /headerMembershipTextColorKey:\s*"#A82D2D"/);
  assert.match(source, /headerMembershipHoverBgColorKey:\s*"#FDF1F1"/);
  assert.match(source, /headerMembershipHoverTextColorKey:\s*"#A82D2D"/);
  assert.match(source, /headerMembershipBorderColorKey:\s*"#A82D2D"/);
  assert.match(source, /ensureAppearanceDocuments/);
});

test("2. AppearanceHeaderEditForm integrates Membership Button settings and controls", () => {
  const source = readFile("components/appearance/AppearanceHeaderEditForm.js");
  // Fetches pages for internal CMS page selector
  assert.match(source, /\/api\/admin\/pages\?limit=200/);
  // Panel in collapse
  assert.match(source, /key:\s*"membership-button"/);
  assert.match(source, /label:\s*"Membership Button"/);
  // Controls
  assert.match(source, /name:\s*"headerMembershipEnabled"/);
  assert.match(source, /name="headerMembershipLabel"/);
  assert.match(source, /name="headerMembershipHref"/);
  assert.match(source, /name="headerMembershipHrefTarget"/);
  assert.match(source, /name="headerMembershipBgColorKey"/);
  assert.match(source, /name="headerMembershipTextColorKey"/);
  assert.match(source, /name="headerMembershipHoverBgColorKey"/);
  assert.match(source, /name="headerMembershipHoverTextColorKey"/);
  assert.match(source, /name="headerMembershipBorderColorKey"/);
  // Validation for URL
  assert.match(source, /startsWith\("\/"\)/);
  assert.match(source, /startsWith\("#"\)/);
  // Save payload persistence
  assert.match(source, /headerMembershipEnabled:\s*values\.headerMembershipEnabled !== false/);
  assert.match(source, /headerMembershipLabel:\s*String\(values\.headerMembershipLabel/);
  assert.match(source, /headerMembershipHref:\s*String\(values\.headerMembershipHref/);
});

test("3. AppearanceHeader dynamically renders Membership button and applies custom styles", () => {
  const source = readFile("components/appearance/AppearanceHeader.js");
  // Props
  assert.match(source, /headerMembershipEnabled\s*=\s*true/);
  assert.match(source, /headerMembershipLabel\s*=\s*"Membership"/);
  assert.match(source, /headerMembershipHref\s*=\s*"\/membership"/);
  // Visibility logic
  assert.match(source, /const isMembershipVisible =\s*headerMembershipEnabled !== false/);
  // CSS variables
  assert.match(source, /"--appearance-membership-bg":\s*membershipBg/);
  assert.match(source, /"--appearance-membership-text":\s*membershipText/);
  assert.match(source, /"--appearance-membership-hover-bg":\s*membershipHoverBg/);
  assert.match(source, /"--appearance-membership-hover-text":\s*membershipHoverText/);
  assert.match(source, /"--appearance-membership-border":\s*membershipBorder/);
  // Render
  assert.match(source, /isMembershipVisible \?\s*\(\s*<a\s+className="appearance-membership"/);
  // CSS styling
  assert.match(source, /\.appearance-header \.appearance-membership\s*\{/);
  assert.match(source, /\.appearance-header \.appearance-membership:hover\s*\{/);
});

test("4. ResponsiveHeader & ResponsiveHeaderStyle support Membership in mobile drawer", () => {
  const styleSource = readFile("components/appearance/ResponsiveHeaderStyle.js");
  assert.match(styleSource, /export const BtnMembership = styled\(Btn\)/);
  assert.match(styleSource, /export const MobileBtnMembership = styled\(MobileBtn\)/);

  const headerSource = readFile("components/appearance/ResponsiveHeader.js");
  assert.match(headerSource, /MobileBtnMembership/);
  assert.match(headerSource, /const hasMembershipAction =\s*headerMembershipEnabled !== false/);
  assert.match(headerSource, /<MobileBtnMembership/);
  assert.match(headerSource, /className="site-header-mobile-membership"/);
});

test("5. AppearanceEditor live preview updates reflect Membership button configuration", () => {
  const source = readFile("components/admin/AppearanceEditor.js");
  assert.match(source, /headerMembershipEnabled:\s*props\?\.headerMembershipEnabled !== false/);
  assert.match(source, /headerMembershipLabel:\s*props\?\.headerMembershipLabel \|\| "Membership"/);
  assert.match(source, /headerMembershipHref:\s*props\?\.headerMembershipHref \|\| "\/membership"/);
  assert.match(source, /headerMembershipBgValue:\s*resolveThemeColor/);
  assert.match(source, /headerMembershipTextValue:\s*resolveThemeColor/);
  assert.match(source, /headerMembershipHoverBgValue:\s*resolveThemeColor/);
  assert.match(source, /headerMembershipHoverTextValue:\s*resolveThemeColor/);
  assert.match(source, /headerMembershipBorderValue:\s*resolveThemeColor/);
});

test("6. app/(site)/layout.js maps headerMembership properties across all public pages", () => {
  const source = readFile("app/(site)/layout.js");
  assert.match(source, /headerMembershipEnabled:\s*appearanceHeaderProps\.headerMembershipEnabled !== false/);
  assert.match(source, /membershipLabel:\s*appearanceHeaderProps\.headerMembershipLabel \|\| "Membership"/);
  assert.match(source, /membershipHref:\s*appearanceHeaderProps\.headerMembershipHref \|\| "\/membership"/);
  assert.match(source, /headerMembershipBgValue:\s*resolveThemeColor/);
  assert.match(source, /headerMembershipTextValue:\s*resolveThemeColor/);
  assert.match(source, /headerMembershipHoverBgValue:\s*resolveThemeColor/);
  assert.match(source, /headerMembershipHoverTextValue:\s*resolveThemeColor/);
  assert.match(source, /headerMembershipBorderValue:\s*resolveThemeColor/);
});

test("7. Volunteer and Donate Now configurations remain intact and unaffected", () => {
  const appHeader = readFile("components/appearance/AppearanceHeader.js");
  assert.match(appHeader, /volunteerLabel = "Volunteer"/);
  assert.match(appHeader, /donateLabel = "Donate Now"/);
  assert.match(appHeader, /className="appearance-volunteer"/);
  assert.match(appHeader, /className="appearance-donate"/);

  const editForm = readFile("components/appearance/AppearanceHeaderEditForm.js");
  assert.match(editForm, /key:\s*"volunteer-button"/);
  assert.match(editForm, /key:\s*"donate-button"/);
});
