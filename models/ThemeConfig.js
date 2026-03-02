const mongoose = require("mongoose");

const googleFontSchema = new mongoose.Schema(
  { family: { type: String, required: true }, weights: [{ type: String }] },
  { _id: false }
);

const themeColorSchema = new mongoose.Schema(
  { name: { type: String, required: true }, value: { type: String, required: true } },
  { _id: false }
);

const themeConfigSchema = new mongoose.Schema(
  {
    // ─── 1. Brand Identity ─────────────────────────────────────
    siteTitle: { type: String, default: "Mesco Trust" },
    tagline: { type: String, default: "" },
    logoType: { type: String, enum: ["text", "image"], default: "text" },
    logoLightUrl: { type: String, default: "" },
    logoMobileUrl: { type: String, default: "" },
    logoDarkUrl: { type: String, default: "" },
    logoImageUrl: { type: String, default: "" }, // legacy
    faviconUrl: { type: String, default: "" },
    footerCopyrightText: { type: String, default: "" },

    // ─── 2. Color Management ────────────────────────────────────
    // Primary
    primaryColor: { type: String, default: "" },
    secondaryColor: { type: String, default: "" },
    // Background
    bodyBackground: { type: String, default: "" },
    sectionBackground: { type: String, default: "" },
    cardBackground: { type: String, default: "" },
    headerBackground: { type: String, default: "" },
    footerBackground: { type: String, default: "" },
    // Text
    headingColor: { type: String, default: "" },
    paragraphColor: { type: String, default: "" },
    linkColor: { type: String, default: "" },
    hoverColor: { type: String, default: "" },
    mutedTextColor: { type: String, default: "" },
    // Border & UI
    borderColor: { type: String, default: "" },
    dividerColor: { type: String, default: "" },
    inputBorderColor: { type: String, default: "" },
    // Extra custom colors (name + value)
    colors: { type: [themeColorSchema], default: [] },
    // Theme.js palette (used by Header, Footer, styled components). Mixed so names can be renamed.
    themePalette: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },

    // ─── 3. Typography ──────────────────────────────────────────
    headingFont: { type: String, default: "" },
    bodyFont: { type: String, default: "system-ui, sans-serif" },
    buttonFont: { type: String, default: "" },
    baseFontSize: { type: Number, default: 16 },
    h1Size: { type: Number, default: 0 },
    h2Size: { type: Number, default: 0 },
    h3Size: { type: Number, default: 0 },
    h4Size: { type: Number, default: 0 },
    h5Size: { type: Number, default: 0 },
    h6Size: { type: Number, default: 0 },
    lineHeight: { type: Number, default: 1.6 },
    letterSpacing: { type: Number, default: 0 },
    fontWeightNormal: { type: Number, default: 400 },
    fontWeightMedium: { type: Number, default: 500 },
    fontWeightBold: { type: Number, default: 700 },
    googleFonts: { type: [googleFontSchema], default: [] },
    customFontUrl: { type: String, default: "" },
    // Legacy typography (map to new names when reading)
    fontFamily: { type: String, default: "" },
    fontSize: { type: Number, default: 16 },
    headingFontFamily: { type: String, default: "" },
    headingFontSize: { type: Number, default: 0 },
    fontWeight: { type: Number, default: 400 },
    headingFontWeight: { type: Number, default: 700 },

    // ─── 4. Border Radius & Shadow ─────────────────────────────
    buttonRadius: { type: Number, default: 6 },
    cardRadius: { type: Number, default: 8 },
    inputRadius: { type: Number, default: 6 },
    cardShadow: { type: Boolean, default: true },
    buttonShadow: { type: Boolean, default: false },

    // ─── 5. Header ──────────────────────────────────────────────
    headerLayout: { type: String, enum: ["default", "center", "split"], default: "default" },
    headerSticky: { type: Boolean, default: true },
    headerTransparent: { type: Boolean, default: false },
    headerVolunteerLabel: { type: String, default: "Volunteer" },
    headerVolunteerHref: { type: String, default: "/volunteer" },
    headerVolunteerIconUrl: { type: String, default: "" },
    headerVolunteerIconUrlMobile: { type: String, default: "" },
    headerDonateLabel: { type: String, default: "Donate Now" },
    headerDonateHref: { type: String, default: "/donate" },
    headerDonateIconUrl: { type: String, default: "" },
    headerDonateIconUrlMobile: { type: String, default: "" },
    headerBgColorKey: { type: String, default: "headerBg" },
    headerCtaBgColorKey: { type: String, default: "headerCta" },
    headerCtaTextColorKey: { type: String, default: "primary" },
    headerDonateBgColorKey: { type: String, default: "gradient" },
    headerDonateTextColorKey: { type: String, default: "white" },
    megaMenu: { type: Boolean, default: false },
    dropdownStyle: { type: String, enum: ["default", "minimal", "card"], default: "default" },
    mobileMenuStyle: { type: String, enum: ["drawer", "fullscreen", "dropdown"], default: "drawer" },

    // ─── 6. Footer ──────────────────────────────────────────────
    footerColumnsCount: { type: Number, default: 4 },
    footerLayoutStyle: { type: String, enum: ["default", "centered", "minimal"], default: "default" },
    footerSocialIcons: { type: Boolean, default: true },

    // ─── 7. Button Style ──────────────────────────────────────
    buttonBackground: { type: String, default: "" },
    buttonTextColor: { type: String, default: "" },
    buttonHoverBackground: { type: String, default: "" },
    buttonHoverTextColor: { type: String, default: "" },
    buttonPadding: { type: String, default: "8px 20px" },

    // ─── 8. Component Style Override ───────────────────────────
    cardStyle: { type: String, enum: ["flat", "elevated"], default: "elevated" },
    alertStyle: { type: String, enum: ["default", "minimal", "bordered"], default: "default" },
    badgeStyle: { type: String, enum: ["default", "solid", "outline"], default: "default" },
    tableStyle: { type: String, enum: ["default", "bordered", "striped"], default: "default" },
    formStyle: { type: String, enum: ["default", "compact", "outlined"], default: "default" },
    inputStyle: { type: String, enum: ["default", "filled", "outlined"], default: "default" },

    // ─── 9. Responsive ─────────────────────────────────────────
    mobileFontSize: { type: Number, default: 0 }, // 0 = no override
    mobileSectionSpacing: { type: String, default: "" },
    hideSectionOnMobile: { type: Boolean, default: false },

    // ─── 10. Blog Theme ────────────────────────────────────────
    blogLayout: { type: String, enum: ["grid", "list"], default: "grid" },
    blogSidebarPosition: { type: String, enum: ["left", "right", "none"], default: "right" },
    blogFeaturedImageRatio: { type: String, default: "16/9" },
    blogMetaStyle: { type: String, enum: ["minimal", "full"], default: "minimal" },

    // ─── 11. Advanced ───────────────────────────────────────────
    customCss: { type: String, default: "" },
    customJs: { type: String, default: "" },
    headScripts: { type: String, default: "" },
    footerScripts: { type: String, default: "" },
    googleAnalyticsId: { type: String, default: "" },

    // ─── Layout & locale ───────────────────────────────────────
    layoutWidth: { type: Number, default: 1200 },
    defaultLocale: { type: String, default: "en" },
    direction: { type: String, enum: ["ltr", "rtl"], default: "ltr" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.ThemeConfig || mongoose.model("ThemeConfig", themeConfigSchema);
