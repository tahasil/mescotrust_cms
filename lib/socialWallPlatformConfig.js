import { connectDB } from "@/lib/db";
import SocialMediaPlatformConfig from "@/models/SocialMediaPlatformConfig";
import { decryptSecretValue, encryptSecretValue } from "@/lib/secureConfigCrypto";

export const SUPPORTED_SOCIAL_MEDIA_PLATFORMS = Object.freeze([
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "Twitter/X" },
]);

const SUPPORTED_SET = new Set(
  SUPPORTED_SOCIAL_MEDIA_PLATFORMS.map((item) => item.value),
);

const ENV_FIELD_MAP = Object.freeze({
  instagram: {
    accessTokenEnv: "INSTAGRAM_ACCESS_TOKEN",
    accountIdEnv: "INSTAGRAM_USER_ID",
    apiKeyEnv: "",
  },
  facebook: {
    accessTokenEnv: "FACEBOOK_ACCESS_TOKEN",
    accountIdEnv: "FACEBOOK_PAGE_ID",
    apiKeyEnv: "",
  },
  youtube: {
    accessTokenEnv: "",
    accountIdEnv: "YOUTUBE_CHANNEL_ID",
    apiKeyEnv: "YOUTUBE_API_KEY",
  },
  twitter: {
    accessTokenEnv: "TWITTER_BEARER_TOKEN",
    accountIdEnv: "TWITTER_USER_ID",
    apiKeyEnv: "",
  },
});

function toSafeString(value) {
  return value == null ? "" : String(value).trim();
}

function toPositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.floor(num);
  return rounded > 0 ? rounded : fallback;
}

function normalizePlatform(value) {
  const platform = toSafeString(value).toLowerCase();
  if (!platform) return "";
  if (SUPPORTED_SET.has(platform)) return platform;
  if (/^[a-z0-9_-]+$/.test(platform)) return platform;
  return "";
}

function normalizeRuntimeRow(raw, index = 0) {
  const platform = normalizePlatform(raw?.platform);
  if (!platform) return null;
  return {
    platform,
    active: raw?.active !== false,
    displayOrder: toPositiveInt(raw?.displayOrder ?? raw?.order, index + 1),
    accessToken: toSafeString(raw?.accessToken),
    accountId: toSafeString(raw?.accountId),
    apiKey: toSafeString(raw?.apiKey),
  };
}

function dedupeAndSort(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    if (row?.platform) map.set(row.platform, row);
  });
  return Array.from(map.values()).sort((a, b) => a.displayOrder - b.displayOrder);
}

function readEnvValue(name) {
  if (!name) return "";
  return toSafeString(process.env[name]);
}

function getEnvDefaultRows() {
  return SUPPORTED_SOCIAL_MEDIA_PLATFORMS.map((item, index) => {
    const envMap = ENV_FIELD_MAP[item.value] || {};
    const accessToken = readEnvValue(envMap.accessTokenEnv);
    const accountId = readEnvValue(envMap.accountIdEnv);
    const apiKey = readEnvValue(envMap.apiKeyEnv);

    return {
      platform: item.value,
      active: Boolean((accessToken || apiKey) && accountId),
      displayOrder: index + 1,
      accessToken,
      accountId,
      apiKey,
    };
  });
}

function maskSecret(value) {
  const raw = toSafeString(value);
  if (!raw) return "";
  const suffixLength = Math.min(4, raw.length);
  const suffix = raw.slice(-suffixLength);
  return `${"*".repeat(8)}${suffix}`;
}

function mapDocToRuntimeRow(doc, index = 0) {
  return normalizeRuntimeRow(
    {
      platform: doc?.platform,
      active: doc?.active !== false,
      displayOrder: doc?.displayOrder,
      accessToken: decryptSecretValue(doc?.accessTokenEnc),
      accountId: decryptSecretValue(doc?.accountIdEnc),
      apiKey: decryptSecretValue(doc?.apiKeyEnc),
    },
    index,
  );
}

async function getDbRows() {
  await connectDB();
  const docs = await SocialMediaPlatformConfig.find()
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();
  return docs.map((doc, index) => mapDocToRuntimeRow(doc, index)).filter(Boolean);
}

export async function getEffectiveSocialWallPlatformRows() {
  const dbRows = await getDbRows();
  if (dbRows.length > 0) {
    return { source: "db", rows: dedupeAndSort(dbRows) };
  }
  return { source: "env", rows: dedupeAndSort(getEnvDefaultRows()) };
}

export async function getAdminSocialWallConfigPayload() {
  const { source, rows } = await getEffectiveSocialWallPlatformRows();
  return {
    source,
    supportedPlatforms: SUPPORTED_SOCIAL_MEDIA_PLATFORMS,
    items: rows.map((row) => ({
      platform: row.platform,
      active: row.active !== false,
      displayOrder: row.displayOrder,
      accessToken: "",
      accountId: "",
      apiKey: "",
      hasAccessToken: Boolean(row.accessToken),
      hasAccountId: Boolean(row.accountId),
      hasApiKey: Boolean(row.apiKey),
      accessTokenMasked: maskSecret(row.accessToken),
      accountIdMasked: maskSecret(row.accountId),
      apiKeyMasked: maskSecret(row.apiKey),
    })),
  };
}

export async function saveSocialWallPlatformRows(
  rawRows = [],
  { updatedBy = "" } = {},
) {
  const inputRows = Array.isArray(rawRows) ? rawRows : [];
  const normalizedInput = dedupeAndSort(
    inputRows
      .map((item, index) =>
        normalizeRuntimeRow(
          {
            platform: item?.platform,
            active: item?.active,
            displayOrder: item?.displayOrder ?? item?.order,
            accessToken: item?.accessToken,
            accountId: item?.accountId,
            apiKey: item?.apiKey,
          },
          index,
        ),
      )
      .filter(Boolean),
  );

  const { rows: existingRows } = await getEffectiveSocialWallPlatformRows();
  const existingMap = new Map(existingRows.map((row) => [row.platform, row]));
  const safeUpdatedBy = toSafeString(updatedBy);

  const rowsToPersist = normalizedInput.map((row, index) => {
    const existing = existingMap.get(row.platform);
    return {
      platform: row.platform,
      active: row.active !== false,
      displayOrder: toPositiveInt(row.displayOrder, index + 1),
      accessToken: row.accessToken || existing?.accessToken || "",
      accountId: row.accountId || existing?.accountId || "",
      apiKey: row.apiKey || existing?.apiKey || "",
    };
  });

  await connectDB();

  if (rowsToPersist.length === 0) {
    await SocialMediaPlatformConfig.deleteMany({});
    return { source: "db", rows: [] };
  }

  const platformKeys = rowsToPersist.map((row) => row.platform);
  await SocialMediaPlatformConfig.deleteMany({ platform: { $nin: platformKeys } });

  await SocialMediaPlatformConfig.bulkWrite(
    rowsToPersist.map((row) => ({
      updateOne: {
        filter: { platform: row.platform },
        update: {
          $set: {
            platform: row.platform,
            active: row.active !== false,
            displayOrder: row.displayOrder,
            accessTokenEnc: encryptSecretValue(row.accessToken),
            accountIdEnc: encryptSecretValue(row.accountId),
            apiKeyEnc: encryptSecretValue(row.apiKey),
            updatedBy: safeUpdatedBy,
          },
        },
        upsert: true,
      },
    })),
  );

  const persistedRows = await getDbRows();
  return { source: "db", rows: dedupeAndSort(persistedRows) };
}
