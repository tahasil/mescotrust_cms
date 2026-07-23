import { connectDB } from "@/lib/db";
import SocialWallPlatformConfig from "@/models/SocialWallPlatformConfig";
import {
  SOCIAL_WALL_DEFAULT_FETCH_INTERVAL_MINUTES,
  SOCIAL_WALL_DEFAULT_POST_LIMIT,
  SOCIAL_WALL_PLATFORM_DEFINITIONS,
  SOCIAL_WALL_PLATFORM_SET,
} from "@/lib/socialWallModule/constants";
import {
  clampNumber,
  toPositiveInt,
  toSafeString,
} from "@/lib/socialWallModule/utils";
import { decryptSecretValue, encryptSecretValue } from "@/lib/secureConfigCrypto";
import { validateSocialWallPlatformConfig } from "@/lib/socialWallModule/platformAdapters";
import { logSocialWallConfigAudit } from "@/lib/socialWallModule/auditService";

const ENV_MAP = Object.freeze({
  instagram: {
    accessTokenEnv: "INSTAGRAM_ACCESS_TOKEN",
    accountIdEnv: "INSTAGRAM_USER_ID",
  },
  facebook: {
    accessTokenEnv: "FACEBOOK_ACCESS_TOKEN",
    accountIdEnv: "FACEBOOK_PAGE_ID",
  },
  youtube: {
    apiKeyEnv: "YOUTUBE_API_KEY",
    accountIdEnv: "YOUTUBE_CHANNEL_ID",
  },
  twitter: {
    accessTokenEnv: "TWITTER_BEARER_TOKEN",
    accountIdEnv: "TWITTER_USER_ID",
  },
});

function maskSecret(value) {
  const raw = toSafeString(value);
  if (!raw) return "";
  return `${"*".repeat(8)}${raw.slice(-4)}`;
}

function toMode(value, fallback = "manual-only") {
  const mode = toSafeString(value).toLowerCase();
  if (mode === "live" || mode === "manual-only") return mode;
  return fallback;
}

function toDefinition(platform) {
  return SOCIAL_WALL_PLATFORM_DEFINITIONS.find((item) => item.platform === platform) || null;
}

function getEnvDefaultForPlatform(platform) {
  const envMap = ENV_MAP[platform] || {};
  return {
    accessToken: envMap.accessTokenEnv ? toSafeString(process.env[envMap.accessTokenEnv]) : "",
    accountId: envMap.accountIdEnv ? toSafeString(process.env[envMap.accountIdEnv]) : "",
    apiKey: envMap.apiKeyEnv ? toSafeString(process.env[envMap.apiKeyEnv]) : "",
  };
}

function normalizeRuntimeRow(raw = {}, fallbackOrder = 1) {
  const platform = toSafeString(raw?.platform).toLowerCase();
  if (!SOCIAL_WALL_PLATFORM_SET.has(platform)) return null;
  const definition = toDefinition(platform);
  const fallbackMode = definition?.defaultMode || "manual-only";
  const mode = toMode(raw?.mode, fallbackMode);
  return {
    platform,
    label: toSafeString(raw?.label || definition?.label || platform),
    liveCapable: definition?.liveCapable === true,
    mode: definition?.liveCapable ? mode : "manual-only",
    active: raw?.active !== false,
    displayOrder: toPositiveInt(raw?.displayOrder, fallbackOrder),
    postLimit: clampNumber(
      toPositiveInt(raw?.postLimit, SOCIAL_WALL_DEFAULT_POST_LIMIT),
      1,
      60,
    ),
    fetchIntervalMinutes: clampNumber(
      toPositiveInt(raw?.fetchIntervalMinutes, SOCIAL_WALL_DEFAULT_FETCH_INTERVAL_MINUTES),
      5,
      1440,
    ),
    accessToken: toSafeString(raw?.accessToken),
    refreshToken: toSafeString(raw?.refreshToken),
    accountId: toSafeString(raw?.accountId),
    apiKey: toSafeString(raw?.apiKey),
    accessTokenStored: raw?.accessTokenStored === true || Boolean(raw?.accessToken),
    refreshTokenStored: raw?.refreshTokenStored === true || Boolean(raw?.refreshToken),
    accountIdStored: raw?.accountIdStored === true || Boolean(raw?.accountId),
    apiKeyStored: raw?.apiKeyStored === true || Boolean(raw?.apiKey),
    accessTokenUnreadable: raw?.accessTokenUnreadable === true,
    refreshTokenUnreadable: raw?.refreshTokenUnreadable === true,
    accountIdUnreadable: raw?.accountIdUnreadable === true,
    apiKeyUnreadable: raw?.apiKeyUnreadable === true,
    accessTokenExpiresAt: raw?.accessTokenExpiresAt || null,
    lastSyncAt: raw?.lastSyncAt || null,
    lastSyncStatus: toSafeString(raw?.lastSyncStatus || "idle") || "idle",
    lastSyncError: toSafeString(raw?.lastSyncError),
    syncCooldownUntil: raw?.syncCooldownUntil || null,
    syncLockUntil: raw?.syncLockUntil || null,
    lastRunWindowKey: toSafeString(raw?.lastRunWindowKey),
    updatedAt: raw?.updatedAt || null,
  };
}

async function getDbRows() {
  await connectDB();
  const docs = await SocialWallPlatformConfig.find().sort({ displayOrder: 1, createdAt: 1 }).lean();
  return docs.map((doc, index) => {
    const accessToken = decryptSecretValue(doc?.accessTokenEnc);
    const refreshToken = decryptSecretValue(doc?.refreshTokenEnc);
    const accountId = decryptSecretValue(doc?.accountIdEnc);
    const apiKey = decryptSecretValue(doc?.apiKeyEnc);
    return normalizeRuntimeRow(
      {
        ...doc,
        accessToken,
        refreshToken,
        accountId,
        apiKey,
        accessTokenStored: Boolean(doc?.accessTokenEnc),
        refreshTokenStored: Boolean(doc?.refreshTokenEnc),
        accountIdStored: Boolean(doc?.accountIdEnc),
        apiKeyStored: Boolean(doc?.apiKeyEnc),
        accessTokenUnreadable: Boolean(doc?.accessTokenEnc) && !accessToken,
        refreshTokenUnreadable: Boolean(doc?.refreshTokenEnc) && !refreshToken,
        accountIdUnreadable: Boolean(doc?.accountIdEnc) && !accountId,
        apiKeyUnreadable: Boolean(doc?.apiKeyEnc) && !apiKey,
      },
      index + 1,
    );
  });
}

function getMergedRows(dbRows = []) {
  const map = new Map((dbRows || []).filter(Boolean).map((row) => [row.platform, row]));
  return SOCIAL_WALL_PLATFORM_DEFINITIONS.map((definition, index) => {
    const dbRow = map.get(definition.platform);
    const envDefaults = getEnvDefaultForPlatform(definition.platform);
    return normalizeRuntimeRow(
      {
        platform: definition.platform,
        label: definition.label,
        mode: dbRow?.mode || definition.defaultMode,
        active: dbRow ? dbRow.active : definition.defaultMode === "live",
        displayOrder: dbRow?.displayOrder ?? index + 1,
        postLimit: dbRow?.postLimit ?? SOCIAL_WALL_DEFAULT_POST_LIMIT,
        fetchIntervalMinutes:
          dbRow?.fetchIntervalMinutes ?? SOCIAL_WALL_DEFAULT_FETCH_INTERVAL_MINUTES,
        accessToken: dbRow?.accessToken || envDefaults.accessToken,
        refreshToken: dbRow?.refreshToken || "",
        accountId: dbRow?.accountId || envDefaults.accountId,
        apiKey: dbRow?.apiKey || envDefaults.apiKey,
        accessTokenStored: dbRow?.accessTokenStored,
        refreshTokenStored: dbRow?.refreshTokenStored,
        accountIdStored: dbRow?.accountIdStored,
        apiKeyStored: dbRow?.apiKeyStored,
        accessTokenUnreadable: dbRow?.accessTokenUnreadable && !envDefaults.accessToken,
        refreshTokenUnreadable: dbRow?.refreshTokenUnreadable,
        accountIdUnreadable: dbRow?.accountIdUnreadable && !envDefaults.accountId,
        apiKeyUnreadable: dbRow?.apiKeyUnreadable && !envDefaults.apiKey,
        accessTokenExpiresAt: dbRow?.accessTokenExpiresAt || null,
        lastSyncAt: dbRow?.lastSyncAt || null,
        lastSyncStatus: dbRow?.lastSyncStatus || "idle",
        lastSyncError: dbRow?.lastSyncError || "",
        syncCooldownUntil: dbRow?.syncCooldownUntil || null,
        syncLockUntil: dbRow?.syncLockUntil || null,
        lastRunWindowKey: dbRow?.lastRunWindowKey || "",
        updatedAt: dbRow?.updatedAt || null,
      },
      index + 1,
    );
  });
}

function sortRows(rows = []) {
  return [...rows].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return a.platform.localeCompare(b.platform);
  });
}

export async function getSocialWallPlatformConfigs({ includeSecrets = false } = {}) {
  const mergedRows = sortRows(getMergedRows(await getDbRows()));
  return mergedRows.map((row) => ({
    platform: row.platform,
    label: row.label,
    liveCapable: row.liveCapable,
    mode: row.mode,
    active: row.active,
    displayOrder: row.displayOrder,
    postLimit: row.postLimit,
    fetchIntervalMinutes: row.fetchIntervalMinutes,
    accessToken: includeSecrets ? row.accessToken : "",
    refreshToken: includeSecrets ? row.refreshToken : "",
    accountId: includeSecrets ? row.accountId : "",
    apiKey: includeSecrets ? row.apiKey : "",
    hasAccessToken: Boolean(row.accessToken),
    hasRefreshToken: Boolean(row.refreshToken),
    hasAccountId: Boolean(row.accountId),
    hasApiKey: Boolean(row.apiKey),
    accessTokenUnreadable: row.accessTokenUnreadable === true,
    refreshTokenUnreadable: row.refreshTokenUnreadable === true,
    accountIdUnreadable: row.accountIdUnreadable === true,
    apiKeyUnreadable: row.apiKeyUnreadable === true,
    accessTokenMasked: maskSecret(row.accessToken),
    refreshTokenMasked: maskSecret(row.refreshToken),
    accountIdMasked: maskSecret(row.accountId),
    apiKeyMasked: maskSecret(row.apiKey),
    accessTokenExpiresAt: row.accessTokenExpiresAt || null,
    lastSyncAt: row.lastSyncAt || null,
    lastSyncStatus: row.lastSyncStatus || "idle",
    lastSyncError: row.lastSyncError || "",
    syncCooldownUntil: row.syncCooldownUntil || null,
    syncLockUntil: row.syncLockUntil || null,
    lastRunWindowKey: row.lastRunWindowKey || "",
    updatedAt: row.updatedAt || null,
  }));
}

export async function upsertSocialWallPlatformConfigs(rawItems = [], { updatedBy = "" } = {}) {
  const existingRows = await getSocialWallPlatformConfigs({ includeSecrets: true });
  const existingMap = new Map(existingRows.map((row) => [row.platform, row]));
  const inputMap = new Map();
  (Array.isArray(rawItems) ? rawItems : []).forEach((item) => {
    const platform = toSafeString(item?.platform).toLowerCase();
    if (!SOCIAL_WALL_PLATFORM_SET.has(platform)) return;
    inputMap.set(platform, item || {});
  });

  const rowsToPersist = SOCIAL_WALL_PLATFORM_DEFINITIONS.map((definition, index) => {
    const input = inputMap.get(definition.platform) || {};
    const current = existingMap.get(definition.platform) || {};
    const mode = toMode(input?.mode, current?.mode || definition.defaultMode);
    const normalizedMode = definition.liveCapable ? mode : "manual-only";
    return normalizeRuntimeRow(
      {
        platform: definition.platform,
        label: definition.label,
        mode: normalizedMode,
        active: input?.active !== undefined ? input.active !== false : current?.active !== false,
        displayOrder: toPositiveInt(input?.displayOrder, current?.displayOrder || index + 1),
        postLimit: clampNumber(
          toPositiveInt(input?.postLimit, current?.postLimit || SOCIAL_WALL_DEFAULT_POST_LIMIT),
          1,
          60,
        ),
        fetchIntervalMinutes: clampNumber(
          toPositiveInt(
            input?.fetchIntervalMinutes,
            current?.fetchIntervalMinutes || SOCIAL_WALL_DEFAULT_FETCH_INTERVAL_MINUTES,
          ),
          5,
          1440,
        ),
        accessToken: toSafeString(input?.accessToken) || toSafeString(current?.accessToken),
        refreshToken: toSafeString(input?.refreshToken) || toSafeString(current?.refreshToken),
        accountId: toSafeString(input?.accountId) || toSafeString(current?.accountId),
        apiKey: toSafeString(input?.apiKey) || toSafeString(current?.apiKey),
        accessTokenStored: current?.hasAccessToken || current?.accessTokenUnreadable,
        refreshTokenStored: current?.hasRefreshToken || current?.refreshTokenUnreadable,
        accountIdStored: current?.hasAccountId || current?.accountIdUnreadable,
        apiKeyStored: current?.hasApiKey || current?.apiKeyUnreadable,
        accessTokenUnreadable: current?.accessTokenUnreadable,
        refreshTokenUnreadable: current?.refreshTokenUnreadable,
        accountIdUnreadable: current?.accountIdUnreadable,
        apiKeyUnreadable: current?.apiKeyUnreadable,
        accessTokenExpiresAt:
          input?.accessTokenExpiresAt !== undefined
            ? input.accessTokenExpiresAt
            : current?.accessTokenExpiresAt,
        lastSyncAt: current?.lastSyncAt || null,
        lastSyncStatus: current?.lastSyncStatus || "idle",
        lastSyncError: current?.lastSyncError || "",
        syncCooldownUntil: current?.syncCooldownUntil || null,
        syncLockUntil: current?.syncLockUntil || null,
        lastRunWindowKey: current?.lastRunWindowKey || "",
      },
      index + 1,
    );
  }).filter(Boolean);

  for (const row of rowsToPersist) {
    const validation = await validateSocialWallPlatformConfig(row);
    if (validation?.valid === false) {
      const details = (validation?.errors || []).join(", ");
      throw new Error(
        `VALIDATION_ERROR_${row.platform.toUpperCase()}: ${details || "Invalid configuration"}`,
      );
    }
  }

  const previousPayload = existingRows.map((row) => ({
    platform: row.platform,
    mode: row.mode,
    active: row.active,
    displayOrder: row.displayOrder,
    postLimit: row.postLimit,
    fetchIntervalMinutes: row.fetchIntervalMinutes,
    hasAccessToken: row.hasAccessToken,
    hasRefreshToken: row.hasRefreshToken,
    hasAccountId: row.hasAccountId,
    hasApiKey: row.hasApiKey,
  }));

  await connectDB();
  await SocialWallPlatformConfig.bulkWrite(
    rowsToPersist.map((row) => {
      const secretUpdates = {};
      if (row.accessToken || !row.accessTokenStored) secretUpdates.accessTokenEnc = encryptSecretValue(row.accessToken);
      if (row.refreshToken || !row.refreshTokenStored) secretUpdates.refreshTokenEnc = encryptSecretValue(row.refreshToken);
      if (row.accountId || !row.accountIdStored) secretUpdates.accountIdEnc = encryptSecretValue(row.accountId);
      if (row.apiKey || !row.apiKeyStored) secretUpdates.apiKeyEnc = encryptSecretValue(row.apiKey);
      return ({
      updateOne: {
        filter: { platform: row.platform },
        update: {
          $set: {
            platform: row.platform,
            label: row.label,
            mode: row.mode,
            active: row.active,
            displayOrder: row.displayOrder,
            postLimit: row.postLimit,
            fetchIntervalMinutes: row.fetchIntervalMinutes,
            ...secretUpdates,
            accessTokenExpiresAt: row.accessTokenExpiresAt || null,
            syncLockUntil: row.syncLockUntil || null,
            lastRunWindowKey: row.lastRunWindowKey || "",
            updatedBy: toSafeString(updatedBy),
          },
          $setOnInsert: {
            lastSyncStatus: "idle",
          },
        },
        upsert: true,
      },
    });}),
  );

  const next = await getSocialWallPlatformConfigs({ includeSecrets: false });
  await logSocialWallConfigAudit({
    entityType: "platform-config",
    entityKey: "social-wall",
    action: "update",
    performedBy: toSafeString(updatedBy),
    payload: {
      previous: previousPayload,
      next: next.map((row) => ({
        platform: row.platform,
        mode: row.mode,
        active: row.active,
        displayOrder: row.displayOrder,
        postLimit: row.postLimit,
        fetchIntervalMinutes: row.fetchIntervalMinutes,
        hasAccessToken: row.hasAccessToken,
        hasRefreshToken: row.hasRefreshToken,
        hasAccountId: row.hasAccountId,
        hasApiKey: row.hasApiKey,
      })),
    },
  });
  return next;
}

export async function markSocialWallPlatformSyncState(platform, state = {}) {
  const safePlatform = toSafeString(platform).toLowerCase();
  if (!SOCIAL_WALL_PLATFORM_SET.has(safePlatform)) return;
  await connectDB();
  await SocialWallPlatformConfig.updateOne(
    { platform: safePlatform },
    {
      $set: {
        ...(state?.lastSyncAt ? { lastSyncAt: state.lastSyncAt } : {}),
        ...(state?.lastSyncStatus ? { lastSyncStatus: state.lastSyncStatus } : {}),
        ...(state?.lastSyncError !== undefined ? { lastSyncError: toSafeString(state.lastSyncError) } : {}),
        ...(state?.syncCooldownUntil !== undefined
          ? { syncCooldownUntil: state.syncCooldownUntil || null }
          : {}),
      },
    },
  );
}

export async function updateSocialWallPlatformTokens(
  platform,
  state = {},
  { updatedBy = "" } = {},
) {
  const safePlatform = toSafeString(platform).toLowerCase();
  if (!SOCIAL_WALL_PLATFORM_SET.has(safePlatform)) return;
  await connectDB();
  await SocialWallPlatformConfig.updateOne(
    { platform: safePlatform },
    {
      $set: {
        ...(state?.accessToken !== undefined
          ? { accessTokenEnc: encryptSecretValue(toSafeString(state.accessToken)) }
          : {}),
        ...(state?.refreshToken !== undefined
          ? { refreshTokenEnc: encryptSecretValue(toSafeString(state.refreshToken)) }
          : {}),
        ...(state?.accessTokenExpiresAt !== undefined
          ? { accessTokenExpiresAt: state.accessTokenExpiresAt || null }
          : {}),
        updatedBy: toSafeString(updatedBy),
      },
    },
  );
  await logSocialWallConfigAudit({
    entityType: "token-refresh",
    entityKey: safePlatform,
    action: "refresh",
    performedBy: toSafeString(updatedBy),
    payload: {
      platform: safePlatform,
      accessTokenUpdated: state?.accessToken !== undefined,
      refreshTokenUpdated: state?.refreshToken !== undefined,
      accessTokenExpiresAt: state?.accessTokenExpiresAt || null,
    },
  });
}

export async function tryAcquireSocialWallSyncLease(
  platform,
  { leaseMs = 2 * 60 * 1000, runWindowKey = "" } = {},
) {
  const safePlatform = toSafeString(platform).toLowerCase();
  if (!SOCIAL_WALL_PLATFORM_SET.has(safePlatform)) {
    return { acquired: false, reason: "invalid-platform" };
  }
  await connectDB();
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + Math.max(30_000, toPositiveInt(leaseMs, 120000)));
  const key = toSafeString(runWindowKey);
  const filter = {
    platform: safePlatform,
    $and: [
      {
        $or: [{ syncLockUntil: null }, { syncLockUntil: { $lte: now } }],
      },
      ...(key
        ? [
            {
              $or: [{ lastRunWindowKey: { $ne: key } }, { lastRunWindowKey: { $exists: false } }],
            },
          ]
        : []),
    ],
  };

  const doc = await SocialWallPlatformConfig.findOneAndUpdate(
    filter,
    {
      $set: {
        syncLockUntil: leaseUntil,
        ...(key ? { lastRunWindowKey: key } : {}),
      },
    },
    { new: true },
  ).lean();

  if (doc) return { acquired: true, reason: "" };

  const current = await SocialWallPlatformConfig.findOne({ platform: safePlatform })
    .select("syncLockUntil lastRunWindowKey")
    .lean();
  if (key && toSafeString(current?.lastRunWindowKey) === key) {
    return { acquired: false, reason: "duplicate-window" };
  }
  if (current?.syncLockUntil && new Date(current.syncLockUntil).getTime() > now.getTime()) {
    return { acquired: false, reason: "locked" };
  }
  return { acquired: false, reason: "unknown" };
}

export async function releaseSocialWallSyncLease(platform) {
  const safePlatform = toSafeString(platform).toLowerCase();
  if (!SOCIAL_WALL_PLATFORM_SET.has(safePlatform)) return;
  await connectDB();
  await SocialWallPlatformConfig.updateOne(
    { platform: safePlatform },
    { $set: { syncLockUntil: null } },
  );
}
