import { cache } from "react";
import ThemeConfig from "@/models/ThemeConfig";
import { normalizeThemeColors, normalizeThemePalette } from "@/lib/themeColors";
import { applyAppearanceColorOverrides, getDefaultAppearanceColorDoc } from "@/lib/appearanceColors";

export const SITE_SETTINGS_QUERY = {
  $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }],
};

const INTERNAL_KEYS = new Set([
  "_id",
  "__v",
  "createdAt",
  "updatedAt",
]);

function toWritableLegacyPayload(legacy) {
  if (!legacy || typeof legacy !== "object") return null;
  const out = { ...legacy };
  delete out._id;
  delete out.__v;
  delete out.createdAt;
  delete out.updatedAt;
  if (!out.themeKey) out.themeKey = "default";
  return out;
}

async function migrateFromLegacyThemeConfigs() {
  // Only needed after moving ThemeConfig storage to "sitesettings".
  if (ThemeConfig?.collection?.name === "themeconfigs") return null;
  if (!ThemeConfig?.db) return null;
  try {
    const legacy = await ThemeConfig.db
      .collection("themeconfigs")
      .findOne(SITE_SETTINGS_QUERY);
    const payload = toWritableLegacyPayload(legacy);
    if (!payload) return null;
    await ThemeConfig.create(payload);
    return true;
  } catch {
    return null;
  }
}

function hasThemePalette(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0
  );
}

function hasCustomColors(value) {
  return Array.isArray(value) && value.length > 0;
}

async function backfillMissingFieldsFromOlderDocs(targetDoc) {
  if (!targetDoc?._id) return targetDoc;

  const current = targetDoc.toObject ? targetDoc.toObject() : targetDoc;
  const currentPalette = normalizeThemePalette(current);
  const currentColors = normalizeThemeColors(current);
  // Only backfill when the field is truly missing (undefined).
  // If a field exists but is intentionally empty (e.g. colors: []), do not repopulate from older docs.
  const needPalette = current?.themePalette === undefined;
  const needColors = current?.colors === undefined;

  const docs = await ThemeConfig.find(SITE_SETTINGS_QUERY)
    .sort({ updatedAt: -1, _id: -1 })
    .limit(25)
    .lean();
  if (!Array.isArray(docs) || docs.length <= 1) return targetDoc;

  const targetId = String(targetDoc._id);
  const updates = {};
  if (needPalette && !hasThemePalette(current?.themePalette) && hasThemePalette(currentPalette)) {
    updates.themePalette = currentPalette;
  }
  if (needColors && !hasCustomColors(current?.colors) && hasCustomColors(currentColors)) {
    updates.colors = currentColors;
  }

  for (const candidate of docs) {
    if (!candidate || String(candidate._id) === targetId) continue;

    if (needPalette && updates.themePalette === undefined) {
      const candidatePalette = normalizeThemePalette(candidate);
      if (hasThemePalette(candidatePalette)) {
        updates.themePalette = candidatePalette;
      }
    }

    if (needColors && updates.colors === undefined) {
      const candidateColors = normalizeThemeColors(candidate);
      if (hasCustomColors(candidateColors)) {
        updates.colors = candidateColors;
      }
    }

    if (updates.themePalette !== undefined && updates.colors !== undefined) {
      break;
    }
  }

  // Also backfill undefined keys from older docs so accordion fields remain stable across restarts.
  for (const candidate of docs) {
    if (!candidate || String(candidate._id) === targetId) continue;
    for (const [k, v] of Object.entries(candidate)) {
      if (INTERNAL_KEYS.has(k)) continue;
      if (updates[k] !== undefined) continue;
      if (current[k] !== undefined) continue;
      if (v === undefined) continue;
      updates[k] = v;
    }
  }

  const updateKeys = Object.keys(updates);
  if (updateKeys.length === 0) return targetDoc;

  for (const k of updateKeys) {
    targetDoc.set(k, updates[k], { strict: false });
  }
  await targetDoc.save();
  return targetDoc;
}

// Backfill scans up to 25 older docs and writes back to the active doc. It's
// the dominant TTFB contributor when run per request, so we run it at most
// once per process and serialize concurrent first-boot requests so we don't
// kick off N parallel scans + writes.
let _backfillPromise = null;
let _backfillRan = false;

async function maybeBackfill(doc, force) {
  if (!force && _backfillRan) return doc;
  if (!_backfillPromise) {
    _backfillPromise = backfillMissingFieldsFromOlderDocs(doc).then(
      (result) => {
        _backfillRan = true;
        // Release the cached doc reference now that the flag is set; future
        // calls return their own fresh `doc` immediately.
        _backfillPromise = null;
        return result;
      },
      (err) => {
        // Reset so a future call can retry; don't poison subsequent reads.
        _backfillPromise = null;
        throw err;
      },
    );
  }
  return _backfillPromise;
}

/**
 * Reads the active site settings doc. Backfill is skipped on subsequent reads
 * within a single process; pass `{ backfill: true }` from admin writers to
 * force a fresh sweep.
 */
export async function getSiteSettingsDoc({ backfill } = {}) {
  let doc = await ThemeConfig.findOne(SITE_SETTINGS_QUERY).sort({
    updatedAt: -1,
    _id: -1,
  });
  if (doc) {
    return maybeBackfill(doc, backfill === true);
  }

  const migrated = await migrateFromLegacyThemeConfigs();
  if (!migrated) return null;

  doc = await ThemeConfig.findOne(SITE_SETTINGS_QUERY).sort({
    updatedAt: -1,
    _id: -1,
  });
  if (!doc) return null;
  return maybeBackfill(doc, backfill === true);
}

async function _getSiteSettingsLean() {
  const doc = await getSiteSettingsDoc();
  if (!doc) return null;
  const out = doc.toObject ? doc.toObject() : doc;
  const seed = {};
  const palette = normalizeThemePalette(out);
  if (palette && Object.keys(palette).length > 0) seed.themePalette = palette;
  const colorDoc = await getDefaultAppearanceColorDoc({ seed });
  applyAppearanceColorOverrides(out, colorDoc);
  // Color dropdown options across component edit forms should come only from Appearance palette keys.
  out.colors = [];
  return out;
}

// Dedup site-settings reads within a single request — root layout, site layout
// and page metadata all need it, but they only need to hit Mongo once.
export const getSiteSettingsLean = cache(_getSiteSettingsLean);
