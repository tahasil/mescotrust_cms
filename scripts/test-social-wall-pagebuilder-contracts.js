const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("site registry and editable forms include SocialWallFeed without removing SocialMediaWall", () => {
  const siteIndex = readFile("components/site/index.js");
  const registry = readFile("lib/siteComponentRegistry.js");

  assert.match(siteIndex, /SocialMediaWall/);
  assert.match(siteIndex, /SocialWallFeed/);
  assert.match(siteIndex, /SocialWallFeed:\s*SocialWallFeedEditForm/);
  assert.match(registry, /"SocialMediaWall"/);
  assert.match(registry, /"SocialWallFeed"/);
});

test("admin sidebar has dedicated Social Wall module entry", () => {
  const adminLayout = readFile("components/admin/AdminLayoutClient.js");
  assert.match(adminLayout, /key:\s*"\/admin\/social-wall"/);
  assert.match(adminLayout, /String\(pathname \|\| ""\)\.startsWith\("\/admin\/social-wall\/"\)/);
});

test("components API exposes friendly name for SocialWallFeed", () => {
  const source = readFile("app/api/admin/site-components/route.js");
  assert.match(source, /id === "SocialWallFeed"/);
  assert.match(source, /displayName = "Social Wall"/);
});

test("new SocialWallFeed component pulls module feed and supports filters + load more", () => {
  const feedComponent = readFile("components/site/SocialWallFeed/SocialWallFeed.js");
  assert.match(feedComponent, /\/api\/public\/social-wall\/feed/);
  assert.match(feedComponent, /FilterChip/);
  assert.match(feedComponent, /activePlatform/);
  assert.match(feedComponent, /showFilterTabs/);
  assert.match(feedComponent, /Load More/);
  assert.match(feedComponent, /layoutMode:\s*"grid"/);
  assert.match(feedComponent, /grid-template-columns:\s*repeat\(\d+,\s*minmax\(0,\s*1fr\)\)/);
});

test("SocialWallFeed edit form exposes page-builder configurable options", () => {
  const editForm = readFile("components/site/SocialWallFeed/EditForm.js");
  assert.match(editForm, /socialWallFeedPlatforms/);
  assert.match(editForm, /socialWallFeedLayoutMode/);
  assert.match(editForm, /socialWallFeedPostLimit/);
  assert.match(editForm, /socialWallFeedFiltersEnabled/);
  assert.match(editForm, /socialWallFeedCardStylePreset/);
  assert.match(editForm, /socialWallFeedSortBy/);
  assert.match(editForm, /socialWallFeedSortOrder/);
  assert.match(editForm, /socialWallFeedShowPlatformIcon/);
  assert.match(editForm, /socialWallFeedShowEngagement/);
  assert.match(editForm, /socialWallFeedShowDate/);
  assert.match(editForm, /socialWallFeedInfiniteScroll/);
});
