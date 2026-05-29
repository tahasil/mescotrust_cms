import mongoose from "mongoose";
import AppearanceColorConfig from "@/models/AppearanceColorConfig";

export const APPEARANCE_COLOR_QUERY = { colorKey: "default" };

// TSUV→MESCO port (Phase 4). §2B: tsuv brand-palette defaults are NOT ported.
// The real palette flows in via the `seed` (the live ThemeConfig.themePalette)
// passed by siteSettings.getSiteSettingsLean, so this base stays empty and no
// tsuv brand colors can leak into MESCO's persisted color doc.
export const DEFAULT_THEME_PALETTE = {};

export const DEFAULT_ADMIN_UI_COLORS = {
  adminTextColor: "#333333",
  adminBorderColor: "rgba(0,0,0,0.06)",
  adminCtaBgColor: "#1677ff",
  adminCtaTextColor: "#ffffff",
  adminCtaHoverBgColor: "",
  adminCtaHoverTextColor: "",
};

export const DEFAULT_ADMIN_SIDEBAR_UI_COLORS = {
  adminSidebarBg: "#ffffff",
  adminSidebarText: "rgba(0,0,0,0.65)",
  adminSidebarHoverBg: "rgba(0,0,0,0.04)",
  adminSidebarHoverText: "#1677ff",
  adminSidebarActiveBg: "#e6f4ff",
  adminSidebarActiveText: "#1677ff",
};

export const APPEARANCE_ADMIN_UI_FIELDS = Object.keys(
  DEFAULT_ADMIN_UI_COLORS,
);
export const APPEARANCE_ADMIN_SIDEBAR_FIELDS = Object.keys(
  DEFAULT_ADMIN_SIDEBAR_UI_COLORS,
);
export const APPEARANCE_COLOR_FIELDS = [
  ...APPEARANCE_ADMIN_UI_FIELDS,
  ...APPEARANCE_ADMIN_SIDEBAR_FIELDS,
];

function toPlainObject(doc) {
  if (!doc) return null;
  return doc?.toObject && typeof doc.toObject === "function"
    ? doc.toObject()
    : doc;
}

function stripMeta(doc) {
  if (!doc || typeof doc !== "object") return {};
  const out = { ...doc };
  delete out._id;
  delete out.__v;
  delete out.createdAt;
  delete out.updatedAt;
  return out;
}

function toNonEmptyPalette(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value).filter(([k]) => String(k || "").trim());
  if (entries.length === 0) return null;
  return Object.fromEntries(entries);
}

function toObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function sameObject(a, b) {
  const aObj = toObject(a);
  const bObj = toObject(b);
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (aObj[key] !== bObj[key]) return false;
  }
  return true;
}

function normalizeColorDocShape(input = {}, seedPalette = null) {
  const doc = toObject(input);

  const frontend = {
    ...DEFAULT_THEME_PALETTE,
    ...(toNonEmptyPalette(seedPalette) || {}),
    ...(toNonEmptyPalette(doc.themePalette) || {}),
    ...(toNonEmptyPalette(doc.frontendUiColors) || {}),
  };

  const adminUiSource = toObject(doc.adminUiColors);
  const adminUi = { ...adminUiSource };
  for (const f of APPEARANCE_ADMIN_UI_FIELDS) {
    if (doc[f] !== undefined) adminUi[f] = doc[f];
    else if (adminUiSource[f] === undefined) adminUi[f] = DEFAULT_ADMIN_UI_COLORS[f];
  }

  const adminSidebarSource = toObject(doc.adminSidebarUiColors);
  const adminSidebar = { ...adminSidebarSource };
  for (const f of APPEARANCE_ADMIN_SIDEBAR_FIELDS) {
    if (doc[f] !== undefined) adminSidebar[f] = doc[f];
    else if (adminSidebarSource[f] === undefined) {
      adminSidebar[f] = DEFAULT_ADMIN_SIDEBAR_UI_COLORS[f];
    }
  }

  return {
    ...doc,
    colorKey: "default",
    themePalette: frontend,
    frontendUiColors: frontend,
    adminUiColors: adminUi,
    adminSidebarUiColors: adminSidebar,
    ...adminUi,
    ...adminSidebar,
  };
}

function requiresDocSync(current = {}, normalized = {}) {
  if (!sameObject(current.themePalette, normalized.themePalette)) return true;
  if (!sameObject(current.frontendUiColors, normalized.frontendUiColors))
    return true;
  if (!sameObject(current.adminUiColors, normalized.adminUiColors)) return true;
  if (
    !sameObject(current.adminSidebarUiColors, normalized.adminSidebarUiColors)
  )
    return true;

  for (const f of APPEARANCE_COLOR_FIELDS) {
    if (current[f] !== normalized[f]) return true;
  }
  return false;
}

async function findLegacyAppearanceColorDoc() {
  const db = mongoose?.connection?.db;
  if (!db) return null;
  try {
    const collection = db.collection("appearancecolors");
    const byDefaultKey = await collection.findOne(APPEARANCE_COLOR_QUERY, {
      sort: { updatedAt: -1, _id: -1 },
    });
    if (byDefaultKey) return byDefaultKey;
    return await collection.findOne({}, { sort: { updatedAt: -1, _id: -1 } });
  } catch {
    return null;
  }
}

export async function getDefaultAppearanceColorDoc({ seed } = {}) {
  const seedPalette = toNonEmptyPalette(seed?.themePalette);

  let colorDoc = await AppearanceColorConfig.findOne(
    APPEARANCE_COLOR_QUERY,
  ).sort({
    updatedAt: -1,
    _id: -1,
  });

  if (colorDoc) {
    const plain = toPlainObject(colorDoc) || {};
    const normalized = normalizeColorDocShape(plain, seedPalette);
    if (requiresDocSync(plain, normalized)) {
      return AppearanceColorConfig.findOneAndUpdate(
        APPEARANCE_COLOR_QUERY,
        { $set: normalized },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          strict: false,
          sort: { updatedAt: -1, _id: -1 },
        },
      );
    }
    return colorDoc;
  }

  const legacy = await findLegacyAppearanceColorDoc();
  if (legacy) {
    const migrated = normalizeColorDocShape(stripMeta(legacy), seedPalette);
    return AppearanceColorConfig.findOneAndUpdate(
      APPEARANCE_COLOR_QUERY,
      { $set: migrated },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        strict: false,
        sort: { updatedAt: -1, _id: -1 },
      },
    );
  }

  const initial = normalizeColorDocShape(seed || {}, seedPalette);
  return AppearanceColorConfig.findOneAndUpdate(
    APPEARANCE_COLOR_QUERY,
    { $set: initial },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      strict: false,
      sort: { updatedAt: -1, _id: -1 },
    },
  );
}

export function applyAppearanceColorOverrides(target = {}, colorDoc = null) {
  if (!target || !colorDoc) return target;
  const docRaw = toPlainObject(colorDoc);
  if (!docRaw || typeof docRaw !== "object") return target;

  const doc = normalizeColorDocShape(docRaw);
  target.frontendUiColors = { ...doc.frontendUiColors };
  target.adminUiColors = { ...doc.adminUiColors };
  target.adminSidebarUiColors = { ...doc.adminSidebarUiColors };
  target.themePalette = { ...doc.frontendUiColors };

  for (const field of APPEARANCE_ADMIN_UI_FIELDS) {
    target[field] = doc.adminUiColors[field];
  }
  for (const field of APPEARANCE_ADMIN_SIDEBAR_FIELDS) {
    target[field] = doc.adminSidebarUiColors[field];
  }

  return target;
}

export function buildThemePaletteUpdateFromBody(body = {}) {
  if (Array.isArray(body.paletteColors)) {
    return Object.fromEntries(
      body.paletteColors
        .filter((p) => p && String(p.key || "").trim())
        .map((p) => [String(p.key).trim(), p.value]),
    );
  }

  if (body.themePalette && typeof body.themePalette === "object") {
    return Object.fromEntries(
      Object.entries(body.themePalette).filter(([k]) => String(k || "").trim()),
    );
  }

  return null;
}
