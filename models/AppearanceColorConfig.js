const mongoose = require("mongoose");

// TSUV→MESCO port (Phase 4). §2B: tsuv brand-palette defaults (#00516F/#FBB040/
// #FEEFD9 …) are intentionally NOT ported. MESCO's palette is CSS-variable-driven
// (see styles/Theme.js THEME_COLOR_ALIASES) with values stored in the DB, so the
// named-color palette defaults to empty here and is seeded from the existing
// ThemeConfig palette during the appearance migration. Admin UI defaults below are
// neutral Ant Design values (identical to MESCO's ThemeConfig admin defaults).
const DEFAULT_FRONTEND_UI_COLORS = {};

const DEFAULT_ADMIN_UI_COLORS = {
  adminTextColor: "#333333",
  adminBorderColor: "rgba(0,0,0,0.06)",
  adminCtaBgColor: "#1677ff",
  adminCtaTextColor: "#ffffff",
  adminCtaHoverBgColor: "",
  adminCtaHoverTextColor: "",
};

const DEFAULT_ADMIN_SIDEBAR_UI_COLORS = {
  adminSidebarBg: "#ffffff",
  adminSidebarText: "rgba(0,0,0,0.65)",
  adminSidebarHoverBg: "rgba(0,0,0,0.04)",
  adminSidebarHoverText: "#1677ff",
  adminSidebarActiveBg: "#e6f4ff",
  adminSidebarActiveText: "#1677ff",
};

const appearanceColorConfigSchema = new mongoose.Schema(
  {
    colorKey: { type: String, default: "default", unique: true, trim: true },
    themePalette: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    frontendUiColors: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ ...DEFAULT_FRONTEND_UI_COLORS }),
    },
    adminUiColors: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ ...DEFAULT_ADMIN_UI_COLORS }),
    },
    adminSidebarUiColors: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ ...DEFAULT_ADMIN_SIDEBAR_UI_COLORS }),
    },

    adminTextColor: { type: String, default: "#333333" },
    adminBorderColor: { type: String, default: "rgba(0,0,0,0.06)" },
    adminCtaBgColor: { type: String, default: "#1677ff" },
    adminCtaTextColor: { type: String, default: "#ffffff" },
    adminCtaHoverBgColor: { type: String, default: "" },
    adminCtaHoverTextColor: { type: String, default: "" },

    adminSidebarBg: { type: String, default: "#ffffff" },
    adminSidebarText: { type: String, default: "rgba(0,0,0,0.65)" },
    adminSidebarHoverBg: { type: String, default: "rgba(0,0,0,0.04)" },
    adminSidebarHoverText: { type: String, default: "#1677ff" },
    adminSidebarActiveBg: { type: String, default: "#e6f4ff" },
    adminSidebarActiveText: { type: String, default: "#1677ff" },
  },
  { timestamps: true, collection: "colors" },
);

module.exports =
  (mongoose.models && mongoose.models.AppearanceColorConfig) ||
  mongoose.model("AppearanceColorConfig", appearanceColorConfigSchema);
