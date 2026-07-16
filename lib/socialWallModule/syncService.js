import { randomUUID } from "crypto";
import { connectDB } from "@/lib/db";
import SocialWallFetchLog from "@/models/SocialWallFetchLog";
import SocialWallPost from "@/models/SocialWallPost";
import {
  SOCIAL_WALL_DEFAULT_FETCH_INTERVAL_MINUTES,
  SOCIAL_WALL_FETCH_COOLDOWN_MS,
  SOCIAL_WALL_MAX_SYNC_POST_LIMIT,
} from "@/lib/socialWallModule/constants";
import {
  fetchSocialWallPostsByPlatform,
  getSocialWallSupportedPlatforms,
  refreshSocialWallPlatformAccessToken,
} from "@/lib/socialWallModule/platformAdapters";
import {
  getSocialWallPlatformConfigs,
  markSocialWallPlatformSyncState,
  releaseSocialWallSyncLease,
  tryAcquireSocialWallSyncLease,
  updateSocialWallPlatformTokens,
} from "@/lib/socialWallModule/platformService";
import { getSocialWallSettings } from "@/lib/socialWallModule/settingsService";
import { upsertSocialWallPosts } from "@/lib/socialWallModule/postsService";
import { listSocialWallConfigAudits } from "@/lib/socialWallModule/auditService";
import { toPositiveInt, toSafeString } from "@/lib/socialWallModule/utils";

const PLATFORM_FETCH_TIMEOUT_MS = 20 * 1000;
const TRANSIENT_RETRY_DELAY_MS = 1200;
const RATE_LIMIT_BACKOFF_MS = 5 * 60 * 1000;
const TOKEN_REFRESH_LOOKAHEAD_MS = 24 * 60 * 60 * 1000;

function toErrorCode(message = "") {
  const upper = toSafeString(message).toUpperCase();
  if (!upper) return "PLATFORM_API_ERROR";
  if (
    upper.includes("TOKEN") ||
    upper.includes("UNAUTHORIZED") ||
    upper.includes("INVALID_GRANT") ||
    upper.includes("_401")
  ) {
    return "TOKEN_EXPIRED";
  }
  if (
    upper.includes("RATE_LIMIT") ||
    upper.includes("_429") ||
    upper.includes("TOO_MANY_REQUEST")
  ) {
    return "RATE_LIMITED";
  }
  if (upper.includes("QUOTA")) {
    return "QUOTA_EXCEEDED";
  }
  if (
    upper.includes("NETWORK") ||
    upper.includes("TIMEOUT") ||
    upper.includes("ETIMEDOUT") ||
    upper.includes("ECONNRESET") ||
    upper.includes("ENOTFOUND") ||
    upper.includes("EAI_AGAIN")
  ) {
    return "NETWORK_ERROR";
  }
  if (upper.includes("VALIDATION") || upper.includes("INVALID_")) {
    return "VALIDATION_ERROR";
  }
  return "PLATFORM_API_ERROR";
}

function isTransientFailure(errorCode, errorMessage = "") {
  if (errorCode === "NETWORK_ERROR" || errorCode === "RATE_LIMITED") return true;
  if (errorCode !== "PLATFORM_API_ERROR") return false;
  return /_(5\d\d)\b/.test(toSafeString(errorMessage).toUpperCase());
}

function parseRetryAfterSeconds(errorMessage = "") {
  const raw = toSafeString(errorMessage);
  if (!raw) return 0;
  const fromNamed = raw.match(/RETRY[_\s-]?AFTER[:=\s]+(\d{1,5})/i);
  if (fromNamed?.[1]) {
    return Math.max(0, toPositiveInt(fromNamed[1], 0));
  }
  return 0;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

async function withTimeout(promise, timeoutMs, label = "operation") {
  const timeout = Math.max(1000, toPositiveInt(timeoutMs, PLATFORM_FETCH_TIMEOUT_MS));
  let timer = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${toSafeString(label).toUpperCase()}_TIMEOUT`));
        }, timeout);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function getScheduleRetryAfterSeconds(row, now) {
  const interval = Math.max(
    5,
    toPositiveInt(row?.fetchIntervalMinutes, SOCIAL_WALL_DEFAULT_FETCH_INTERVAL_MINUTES),
  );
  const lastSyncAt = row?.lastSyncAt ? new Date(row.lastSyncAt) : null;
  if (!lastSyncAt || Number.isNaN(lastSyncAt.getTime())) return 0;
  const dueAtMs = lastSyncAt.getTime() + interval * 60 * 1000;
  if (dueAtMs <= now.getTime()) return 0;
  return Math.max(1, Math.ceil((dueAtMs - now.getTime()) / 1000));
}

function buildRunWindowKey(trigger, row, now) {
  const interval =
    trigger === "scheduled"
      ? Math.max(
          5,
          toPositiveInt(row?.fetchIntervalMinutes, SOCIAL_WALL_DEFAULT_FETCH_INTERVAL_MINUTES),
        )
      : 5;
  const slot = Math.floor(now.getTime() / (interval * 60 * 1000));
  return `${toSafeString(trigger || "manual")}:${toSafeString(row?.platform)}:${slot}`;
}

async function createLogEntry({ platform, trigger, requestedBy }) {
  await connectDB();
  const now = new Date();
  const doc = await SocialWallFetchLog.create({
    platform,
    runId: randomUUID(),
    trigger: trigger === "scheduled" ? "scheduled" : "manual",
    startedAt: now,
    requestedBy: toSafeString(requestedBy),
  });
  return doc.toObject();
}

async function closeLogEntry(logId, payload = {}) {
  await connectDB();
  const now = new Date();
  const startedAt = payload?.startedAt ? new Date(payload.startedAt) : now;
  const durationMs = Math.max(0, now.getTime() - startedAt.getTime());
  await SocialWallFetchLog.updateOne(
    { _id: logId },
    {
      $set: {
        endedAt: now,
        durationMs,
        fetchedCount: toPositiveInt(payload?.fetchedCount, 0),
        newCount: toPositiveInt(payload?.newCount, 0),
        updatedCount: toPositiveInt(payload?.updatedCount, 0),
        failedCount: toPositiveInt(payload?.failedCount, 0),
        status: toSafeString(payload?.status || "success") || "success",
        errorCode: toSafeString(payload?.errorCode),
        errorMessage: toSafeString(payload?.errorMessage),
      },
    },
  );
}

function toPlatformResult(raw = {}) {
  return {
    platform: toSafeString(raw?.platform).toLowerCase(),
    jobName: toSafeString(raw?.jobName),
    status: toSafeString(raw?.status || "success"),
    fetchedCount: Number(raw?.fetchedCount || 0),
    newCount: Number(raw?.newCount || 0),
    updatedCount: Number(raw?.updatedCount || 0),
    failedCount: Number(raw?.failedCount || 0),
    skipped: raw?.skipped === true,
    retryAfterSeconds: Number(raw?.retryAfterSeconds || 0),
    errorCode: toSafeString(raw?.errorCode),
    errorMessage: toSafeString(raw?.errorMessage),
  };
}

async function fetchWithRetries(row, attempts = 2) {
  let lastError = null;
  const maxAttempts = Math.max(1, toPositiveInt(attempts, 2));
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const posts = await withTimeout(
        fetchSocialWallPostsByPlatform({
          ...row,
          postLimit: Math.min(toPositiveInt(row?.postLimit, 12), SOCIAL_WALL_MAX_SYNC_POST_LIMIT),
        }),
        PLATFORM_FETCH_TIMEOUT_MS,
        `${row?.platform || "platform"}_fetch`,
      );
      return Array.isArray(posts) ? posts : [];
    } catch (error) {
      lastError = error;
      const errorMessage = toSafeString(error?.message || error);
      const errorCode = toErrorCode(errorMessage);
      const canRetry = attempt < maxAttempts && isTransientFailure(errorCode, errorMessage);
      if (!canRetry) break;
      const retryAfterSeconds = parseRetryAfterSeconds(errorMessage);
      const retryDelayMs =
        retryAfterSeconds > 0
          ? retryAfterSeconds * 1000
          : errorCode === "RATE_LIMITED"
            ? RATE_LIMIT_BACKOFF_MS
            : TRANSIENT_RETRY_DELAY_MS * attempt;
      await wait(retryDelayMs);
    }
  }
  throw lastError || new Error("PLATFORM_API_ERROR");
}

async function runSinglePlatformSync(row, { trigger, requestedBy, moderationMode }) {
  const now = new Date();

  if (trigger === "scheduled") {
    const retryAfterSeconds = getScheduleRetryAfterSeconds(row, now);
    if (retryAfterSeconds > 0) {
      return toPlatformResult({
        platform: row.platform,
        jobName: `social.fetch.platform.${row.platform}`,
        status: "skipped",
        skipped: true,
        retryAfterSeconds,
        errorCode: "SCHEDULE_INTERVAL_PENDING",
        errorMessage: "Scheduled fetch interval not reached",
      });
    }
  }

  if (
    trigger !== "scheduled" &&
    row?.syncCooldownUntil &&
    new Date(row.syncCooldownUntil).getTime() > now.getTime()
  ) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((new Date(row.syncCooldownUntil).getTime() - now.getTime()) / 1000),
    );
    return toPlatformResult({
      platform: row.platform,
      jobName: `social.fetch.platform.${row.platform}`,
      status: "skipped",
      skipped: true,
      retryAfterSeconds,
      errorCode: "SYNC_COOLDOWN",
      errorMessage: "Manual sync cooldown active",
    });
  }

  const runWindowKey = buildRunWindowKey(trigger, row, now);
  const lease = await tryAcquireSocialWallSyncLease(row.platform, {
    leaseMs: 2 * 60 * 1000,
    runWindowKey,
  });
  if (!lease?.acquired) {
    const reason = toSafeString(lease?.reason);
    return toPlatformResult({
      platform: row.platform,
      jobName: `social.fetch.platform.${row.platform}`,
      status: "skipped",
      skipped: true,
      errorCode:
        reason === "duplicate-window"
          ? "IDEMPOTENT_SKIP"
          : reason === "locked"
            ? "SYNC_LOCKED"
            : "SYNC_SKIPPED",
      errorMessage:
        reason === "duplicate-window"
          ? "This run window has already been processed"
          : reason === "locked"
            ? "Another sync is currently running for this platform"
            : "Sync skipped due to lease constraints",
    });
  }

  let log = null;
  try {
    log = await createLogEntry({
      platform: row.platform,
      trigger,
      requestedBy,
    });

    const fetchedPosts = await fetchWithRetries(row, 2);
    const upsertResult = await upsertSocialWallPosts({
      platform: row.platform,
      posts: fetchedPosts,
      moderationMode,
    });

    const cooldownUntil =
      trigger === "scheduled" ? null : new Date(Date.now() + SOCIAL_WALL_FETCH_COOLDOWN_MS);
    await markSocialWallPlatformSyncState(row.platform, {
      lastSyncAt: new Date(),
      lastSyncStatus: "success",
      lastSyncError: "",
      syncCooldownUntil: cooldownUntil,
    });

    if (log?._id) {
      await closeLogEntry(log._id, {
        startedAt: log.startedAt,
        fetchedCount: upsertResult.fetchedCount,
        newCount: upsertResult.newCount,
        updatedCount: upsertResult.updatedCount,
        failedCount: 0,
        status: "success",
      });
    }

    return toPlatformResult({
      platform: row.platform,
      jobName: `social.fetch.platform.${row.platform}`,
      status: "success",
      fetchedCount: upsertResult.fetchedCount,
      newCount: upsertResult.newCount,
      updatedCount: upsertResult.updatedCount,
      failedCount: 0,
    });
  } catch (error) {
    const errorMessage = toSafeString(error?.message || error);
    const errorCode = toErrorCode(errorMessage);
    const retryAfterSeconds = parseRetryAfterSeconds(errorMessage);
    const backoffUntil =
      errorCode === "RATE_LIMITED"
        ? new Date(Date.now() + Math.max(retryAfterSeconds * 1000, RATE_LIMIT_BACKOFF_MS))
        : undefined;
    await markSocialWallPlatformSyncState(row.platform, {
      lastSyncAt: new Date(),
      lastSyncStatus: "failed",
      lastSyncError: errorMessage,
      ...(backoffUntil ? { syncCooldownUntil: backoffUntil } : {}),
    });
    if (log?._id) {
      await closeLogEntry(log._id, {
        startedAt: log.startedAt,
        fetchedCount: 0,
        newCount: 0,
        updatedCount: 0,
        failedCount: 1,
        status: "failed",
        errorCode,
        errorMessage,
      });
    }
    return toPlatformResult({
      platform: row.platform,
      jobName: `social.fetch.platform.${row.platform}`,
      status: "failed",
      failedCount: 1,
      retryAfterSeconds,
      errorCode,
      errorMessage,
    });
  } finally {
    await releaseSocialWallSyncLease(row.platform);
  }
}

export async function runSocialWallSync({
  requestedPlatforms = [],
  trigger = "manual",
  requestedBy = "",
} = {}) {
  const settings = await getSocialWallSettings();
  const moderationMode = settings?.moderationMode === "auto" ? "auto" : "manual";
  const platformRows = await getSocialWallPlatformConfigs({ includeSecrets: true });
  const requestedSet = new Set(
    (Array.isArray(requestedPlatforms) ? requestedPlatforms : [])
      .map((item) => toSafeString(item).toLowerCase())
      .filter(Boolean),
  );

  const targets = platformRows.filter((row) => {
    if (row?.active !== true) return false;
    if (toSafeString(row?.mode).toLowerCase() !== "live") return false;
    if (requestedSet.size > 0 && !requestedSet.has(row.platform)) return false;
    return true;
  });

  if (targets.length === 0) {
    return {
      status: "ok",
      trigger,
      settings,
      summary: { fetchedCount: 0, newCount: 0, updatedCount: 0, failedCount: 0 },
      platforms: [],
      message: "No live social wall platform is currently active",
    };
  }

  const settled = await Promise.allSettled(
    targets.map((row) =>
      runSinglePlatformSync(row, {
        trigger: trigger === "scheduled" ? "scheduled" : "manual",
        requestedBy,
        moderationMode,
      }),
    ),
  );

  const results = settled.map((entry, index) => {
    if (entry.status === "fulfilled") return toPlatformResult(entry.value);
    return toPlatformResult({
      platform: targets[index]?.platform || "",
      status: "failed",
      failedCount: 1,
      errorCode: toErrorCode(entry?.reason?.message || entry?.reason),
      errorMessage: toSafeString(entry?.reason?.message || entry?.reason),
    });
  });

  const summary = results.reduce(
    (acc, item) => ({
      fetchedCount: acc.fetchedCount + Number(item.fetchedCount || 0),
      newCount: acc.newCount + Number(item.newCount || 0),
      updatedCount: acc.updatedCount + Number(item.updatedCount || 0),
      failedCount: acc.failedCount + Number(item.failedCount || 0),
    }),
    { fetchedCount: 0, newCount: 0, updatedCount: 0, failedCount: 0 },
  );

  return {
    status: "ok",
    trigger: trigger === "scheduled" ? "scheduled" : "manual",
    settings,
    summary,
    platforms: results,
  };
}

export async function refreshSocialWallTokens({
  requestedPlatforms = [],
  force = false,
  requestedBy = "",
} = {}) {
  const platformRows = await getSocialWallPlatformConfigs({ includeSecrets: true });
  const requestedSet = new Set(
    (Array.isArray(requestedPlatforms) ? requestedPlatforms : [])
      .map((item) => toSafeString(item).toLowerCase())
      .filter(Boolean),
  );
  const now = Date.now();
  const dueBeforeMs = now + TOKEN_REFRESH_LOOKAHEAD_MS;

  const targets = platformRows.filter((row) => {
    if (row?.active !== true) return false;
    if (toSafeString(row?.mode).toLowerCase() !== "live") return false;
    if (requestedSet.size > 0 && !requestedSet.has(row.platform)) return false;
    return true;
  });

  if (targets.length === 0) {
    return {
      status: "ok",
      summary: { refreshedCount: 0, failedCount: 0, skippedCount: 0 },
      platforms: [],
      message: "No live platform available for token refresh",
    };
  }

  const settled = await Promise.allSettled(
    targets.map(async (row) => {
      const expiresAt =
        row?.accessTokenExpiresAt && !Number.isNaN(new Date(row.accessTokenExpiresAt).getTime())
          ? new Date(row.accessTokenExpiresAt).getTime()
          : 0;

      if (!force && (!expiresAt || expiresAt > dueBeforeMs)) {
        const retryAfterSeconds =
          expiresAt > 0 ? Math.max(1, Math.ceil((expiresAt - dueBeforeMs) / 1000)) : 0;
        return toPlatformResult({
          platform: row.platform,
          jobName: `social.token.refresh.${row.platform}`,
          status: "skipped",
          skipped: true,
          retryAfterSeconds,
          errorCode: "TOKEN_REFRESH_NOT_DUE",
          errorMessage: expiresAt ? "Token refresh window not reached" : "Token expiry not known",
        });
      }

      const refreshResult = await withTimeout(
        refreshSocialWallPlatformAccessToken(row),
        PLATFORM_FETCH_TIMEOUT_MS,
        `${row?.platform || "platform"}_token_refresh`,
      );

      if (!refreshResult || refreshResult.ok !== true) {
        return toPlatformResult({
          platform: row.platform,
          jobName: `social.token.refresh.${row.platform}`,
          status: "skipped",
          skipped: true,
          errorCode: "TOKEN_REFRESH_UNSUPPORTED",
          errorMessage: toSafeString(refreshResult?.reason || "Token refresh not supported"),
        });
      }

      await updateSocialWallPlatformTokens(
        row.platform,
        {
          ...(refreshResult?.accessToken ? { accessToken: refreshResult.accessToken } : {}),
          ...(refreshResult?.refreshToken ? { refreshToken: refreshResult.refreshToken } : {}),
          ...(refreshResult?.accessTokenExpiresAt
            ? { accessTokenExpiresAt: refreshResult.accessTokenExpiresAt }
            : {}),
        },
        { updatedBy: requestedBy },
      );

      return toPlatformResult({
        platform: row.platform,
        jobName: `social.token.refresh.${row.platform}`,
        status: "success",
        fetchedCount: 0,
        newCount: 0,
        updatedCount: 0,
        failedCount: 0,
      });
    }),
  );

  const platforms = settled.map((entry, index) => {
    if (entry.status === "fulfilled") return toPlatformResult(entry.value);
    const errorMessage = toSafeString(entry?.reason?.message || entry?.reason);
    return toPlatformResult({
      platform: targets[index]?.platform || "",
      status: "failed",
      failedCount: 1,
      errorCode: toErrorCode(errorMessage),
      errorMessage,
    });
  });

  const summary = platforms.reduce(
    (acc, item) => ({
      refreshedCount: acc.refreshedCount + (item.status === "success" ? 1 : 0),
      failedCount: acc.failedCount + (item.status === "failed" ? 1 : 0),
      skippedCount: acc.skippedCount + (item.status === "skipped" ? 1 : 0),
    }),
    { refreshedCount: 0, failedCount: 0, skippedCount: 0 },
  );

  return {
    status: "ok",
    summary,
    platforms,
  };
}

export async function getSocialWallDashboardData() {
  await connectDB();
  const [settings, platformRows, totalPosts, approvedPosts, pendingPosts, rejectedPosts, featuredPosts] =
    await Promise.all([
      getSocialWallSettings(),
      getSocialWallPlatformConfigs({ includeSecrets: false }),
      SocialWallPost.countDocuments({}),
      SocialWallPost.countDocuments({ status: "approved" }),
      SocialWallPost.countDocuments({ status: "pending" }),
      SocialWallPost.countDocuments({ status: "rejected" }),
      SocialWallPost.countDocuments({ featured: true, status: "approved" }),
    ]);

  const now = Date.now();
  const cooldownPlatforms = platformRows
    .filter((row) => row?.syncCooldownUntil && new Date(row.syncCooldownUntil).getTime() > now)
    .map((row) => ({
      platform: row.platform,
      retryAfterSeconds: Math.ceil((new Date(row.syncCooldownUntil).getTime() - now) / 1000),
    }));

  return {
    settings,
    supportedPlatforms: getSocialWallSupportedPlatforms(),
    stats: {
      totalPosts,
      approvedPosts,
      pendingPosts,
      rejectedPosts,
      featuredPosts,
      activePlatforms: platformRows.filter((row) => row.active === true).length,
      livePlatforms: platformRows.filter(
        (row) => row.active === true && row.mode === "live" && row.liveCapable,
      ).length,
    },
    cooldownPlatforms,
  };
}

export async function listSocialWallLogs({ page = 1, limit = 20, kind = "sync" } = {}) {
  if (toSafeString(kind).toLowerCase() === "config") {
    return listSocialWallConfigAudits({ page, limit });
  }

  await connectDB();
  const safePage = Math.max(1, toPositiveInt(page, 1));
  const safeLimit = Math.min(100, Math.max(1, toPositiveInt(limit, 20)));
  const total = await SocialWallFetchLog.countDocuments({});
  const items = await SocialWallFetchLog.find({})
    .sort({ startedAt: -1, _id: -1 })
    .skip((safePage - 1) * safeLimit)
    .limit(safeLimit)
    .lean();
  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    items: items.map((item) => ({
      id: String(item?._id || ""),
      platform: toSafeString(item?.platform),
      runId: toSafeString(item?.runId),
      trigger: toSafeString(item?.trigger || "manual"),
      startedAt: item?.startedAt || null,
      endedAt: item?.endedAt || null,
      durationMs: Number(item?.durationMs || 0),
      fetchedCount: Number(item?.fetchedCount || 0),
      newCount: Number(item?.newCount || 0),
      updatedCount: Number(item?.updatedCount || 0),
      failedCount: Number(item?.failedCount || 0),
      status: toSafeString(item?.status || "success"),
      errorCode: toSafeString(item?.errorCode),
      errorMessage: toSafeString(item?.errorMessage),
      requestedBy: toSafeString(item?.requestedBy),
      createdAt: item?.createdAt || null,
    })),
  };
}

export async function cleanupSocialWallLogs({ olderThanDays = 45 } = {}) {
  await connectDB();
  const days = Math.max(1, toPositiveInt(olderThanDays, 45));
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await SocialWallFetchLog.deleteMany({ startedAt: { $lt: cutoff } });
  return {
    deletedCount: Number(result?.deletedCount || 0),
    cutoff,
  };
}
