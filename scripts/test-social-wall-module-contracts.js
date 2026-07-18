const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("constants keep approved platform policy and cooldown", () => {
  const source = readFile("lib/socialWallModule/constants.js");
  assert.match(source, /platform:\s*"linkedin".*defaultMode:\s*"manual-only"/s);
  assert.match(source, /platform:\s*"pinterest".*defaultMode:\s*"manual-only"/s);
  assert.match(source, /platform:\s*"snapchat".*defaultMode:\s*"manual-only"/s);
  assert.match(source, /SOCIAL_WALL_FETCH_COOLDOWN_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/);
  assert.match(source, /SOCIAL_WALL_DEFAULT_FETCH_INTERVAL_MINUTES/);
});

test("settings and fetch log models use module-owned collection names", () => {
  const settingsSource = readFile("models/SocialWallSettings.js");
  const logsSource = readFile("models/SocialWallFetchLog.js");
  assert.match(settingsSource, /collection:\s*"social_wall_settings"/);
  assert.match(logsSource, /collection:\s*"social_fetch_logs"/);
});

test("platform config model stores scheduler + lease fields", () => {
  const source = readFile("models/SocialWallPlatformConfig.js");
  assert.match(source, /fetchIntervalMinutes/);
  assert.match(source, /syncLockUntil/);
  assert.match(source, /lastRunWindowKey/);
  assert.match(source, /collection:\s*"social_platform_configs"/);
});

test("post model stores moderation history for audit trail", () => {
  const source = readFile("models/SocialWallPost.js");
  assert.match(source, /moderationHistory/);
  assert.match(source, /action/);
  assert.match(source, /performedBy/);
  assert.match(source, /performedAt/);
  assert.match(source, /reason/);
  assert.match(source, /collection:\s*"social_posts"/);
});

test("sync service maps errors to standard categories and uses lease/idempotency", () => {
  const source = readFile("lib/socialWallModule/syncService.js");
  assert.match(source, /TOKEN_EXPIRED/);
  assert.match(source, /RATE_LIMITED/);
  assert.match(source, /QUOTA_EXCEEDED/);
  assert.match(source, /NETWORK_ERROR/);
  assert.match(source, /PLATFORM_API_ERROR/);
  assert.match(source, /buildRunWindowKey/);
  assert.match(source, /tryAcquireSocialWallSyncLease/);
  assert.match(source, /releaseSocialWallSyncLease/);
  assert.match(source, /Promise\.allSettled/);
  assert.match(source, /refreshSocialWallTokens/);
  assert.match(source, /PLATFORM_FETCH_TIMEOUT_MS/);
});

test("posts service implements keyset cursor and admin date range filters", () => {
  const source = readFile("lib/socialWallModule/postsService.js");
  assert.match(source, /dateFrom/);
  assert.match(source, /dateTo/);
  assert.match(source, /decodeCursor/);
  assert.match(source, /publishedAt:\s*\{\s*\$lt:\s*cursorDate\s*\}/);
  assert.match(source, /cursorObjectId/);
  assert.match(source, /_id:\s*\{\s*\$lt:\s*cursorObjectId\s*\}/);
  assert.match(source, /encodeCursor/);
  assert.match(source, /\$push:\s*\{\s*moderationHistory/s);
  assert.match(source, /isAllowedStatusTransition/);
  assert.match(source, /allowedPlatforms/);
  assert.match(source, /listSocialWallPublicAvailablePlatforms/);
});

test("public service resolves frontend platforms dynamically from active connected platforms with approved posts", () => {
  const source = readFile("lib/socialWallModule/publicService.js");
  assert.match(source, /isPlatformConnectedForPublicFeed/);
  assert.match(source, /listSocialWallPublicAvailablePlatforms/);
  assert.match(source, /resolvedPlatformRows/);
  assert.match(source, /platformConfigs:\s*resolvedPlatformRows\.map/);
});

test("admin API auth boundaries are enforced for social wall module", () => {
  const settingsRoute = readFile("app/api/admin/social-wall/settings/route.js");
  const platformsRoute = readFile("app/api/admin/social-wall/platforms/route.js");
  const syncRoute = readFile("app/api/admin/social-wall/sync/route.js");
  const statusRoute = readFile("app/api/admin/social-wall/posts/[id]/status/route.js");
  const featureRoute = readFile("app/api/admin/social-wall/posts/[id]/feature/route.js");
  const postsRoute = readFile("app/api/admin/social-wall/posts/route.js");
  const jobsRoute = readFile("app/api/admin/social-wall/jobs/route.js");
  const cronRoute = readFile("app/api/cron/social-wall/route.js");

  assert.match(settingsRoute, /requireAdminSession/);
  assert.match(platformsRoute, /requireAdminSession/);
  assert.match(syncRoute, /requireAdminSession/);
  assert.match(syncRoute, /status:\s*429/);
  assert.match(jobsRoute, /requireAdminSession/);
  assert.match(jobsRoute, /refresh-tokens/);
  assert.match(jobsRoute, /clear-logs/);
  assert.match(cronRoute, /SOCIAL_WALL_CRON_SECRET/);
  assert.match(cronRoute, /runSocialWallSync/);
  assert.match(cronRoute, /refreshSocialWallTokens/);
  assert.match(cronRoute, /cleanupSocialWallLogs/);

  assert.match(postsRoute, /requireEditorOrAdminSession/);
  assert.match(postsRoute, /dateFrom/);
  assert.match(postsRoute, /dateTo/);
  assert.match(statusRoute, /requireEditorOrAdminSession/);
  assert.match(featureRoute, /requireEditorOrAdminSession/);
});
