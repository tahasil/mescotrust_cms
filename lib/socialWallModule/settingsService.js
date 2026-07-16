import { connectDB } from "@/lib/db";
import SocialWallSettings from "@/models/SocialWallSettings";
import {
  SOCIAL_WALL_DEFAULT_SETTINGS,
  SOCIAL_WALL_MODULE_NAME,
} from "@/lib/socialWallModule/constants";
import {
  clampNumber,
  normalizeLayout,
  normalizeSortBy,
  normalizeSortOrder,
  toPositiveInt,
  toSafeString,
} from "@/lib/socialWallModule/utils";
import { logSocialWallConfigAudit } from "@/lib/socialWallModule/auditService";

function normalizeSettingsPayload(input = {}) {
  return {
    moduleEnabled: input?.moduleEnabled !== false,
    defaultLayout: normalizeLayout(input?.defaultLayout),
    defaultPostLimit: clampNumber(toPositiveInt(input?.defaultPostLimit, 12), 1, 60),
    defaultSortBy: normalizeSortBy(input?.defaultSortBy),
    defaultSortOrder: normalizeSortOrder(input?.defaultSortOrder),
    filtersEnabled: input?.filtersEnabled !== false,
    moderationMode:
      toSafeString(input?.moderationMode).toLowerCase() === "auto" ? "auto" : "manual",
    cardStylePreset: ["clean", "outlined", "elevated"].includes(
      toSafeString(input?.cardStylePreset).toLowerCase(),
    )
      ? toSafeString(input?.cardStylePreset).toLowerCase()
      : "clean",
  };
}

export async function getSocialWallSettings() {
  await connectDB();
  let doc = await SocialWallSettings.findOne({ moduleName: SOCIAL_WALL_MODULE_NAME }).lean();
  if (!doc) {
    doc = await SocialWallSettings.create({
      moduleName: SOCIAL_WALL_MODULE_NAME,
      ...SOCIAL_WALL_DEFAULT_SETTINGS,
    });
    doc = doc.toObject();
  }
  return {
    moduleName: SOCIAL_WALL_MODULE_NAME,
    ...SOCIAL_WALL_DEFAULT_SETTINGS,
    ...normalizeSettingsPayload(doc),
    updatedAt: doc?.updatedAt || null,
    updatedBy: toSafeString(doc?.updatedBy),
  };
}

export async function updateSocialWallSettings(input = {}, { updatedBy = "" } = {}) {
  await connectDB();
  const normalized = normalizeSettingsPayload(input);
  const previous = await SocialWallSettings.findOne({ moduleName: SOCIAL_WALL_MODULE_NAME }).lean();
  await SocialWallSettings.updateOne(
    { moduleName: SOCIAL_WALL_MODULE_NAME },
    {
      $set: {
        ...normalized,
        updatedBy: toSafeString(updatedBy),
      },
      $setOnInsert: { moduleName: SOCIAL_WALL_MODULE_NAME },
    },
    { upsert: true },
  );
  await logSocialWallConfigAudit({
    entityType: "settings",
    entityKey: SOCIAL_WALL_MODULE_NAME,
    action: "update",
    performedBy: toSafeString(updatedBy),
    payload: {
      previous: previous
        ? normalizeSettingsPayload(previous)
        : { ...SOCIAL_WALL_DEFAULT_SETTINGS },
      next: normalized,
    },
  });
  return getSocialWallSettings();
}
