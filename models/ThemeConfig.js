const mongoose = require("mongoose");

const googleFontSchema = new mongoose.Schema(
  { family: { type: String, required: true }, weights: [{ type: String }] },
  { _id: false },
);

const themeColorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const homeHeroSlideSchema = new mongoose.Schema(
  {
    bgImageUrl: { type: String, default: "" },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    buttonText: { type: String, default: "" },
    buttonLink: { type: String, default: "" },
    showButton: { type: Boolean, default: true },
  },
  { _id: false },
);

const marqueeItemSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    alt: { type: String, default: "" },
  },
  { _id: false },
);

const themeConfigSchema = new mongoose.Schema(
  {
    // Single theme doc: always query by this so save/load use same document
    themeKey: { type: String, default: "default" },
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
    headerLayout: {
      type: String,
      enum: ["default", "center", "split"],
      default: "default",
    },
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
    dropdownStyle: {
      type: String,
      enum: ["default", "minimal", "card"],
      default: "default",
    },
    mobileMenuStyle: {
      type: String,
      enum: ["drawer", "fullscreen", "dropdown"],
      default: "drawer",
    },

    // ─── 6. Footer ──────────────────────────────────────────────
    footerLogoUrl: { type: String, default: "" },
    footerAddress: { type: String, default: "" },
    footerEmail: { type: String, default: "" },
    footerPhone: { type: String, default: "" },
    footerCol1Links: { type: mongoose.Schema.Types.Mixed, default: () => [] },
    footerCol2Links: { type: mongoose.Schema.Types.Mixed, default: () => [] },
    footerBgColorKey: { type: String, default: "" },
    footerBackgroundImageUrl: {
      type: String,
      default: "/uploads/1772449953147_footer-bg.svg",
    },
    footerTextColorKey: { type: String, default: "" },
    footerCopyrightBarColorKey: { type: String, default: "" },
    footerColumnsCount: { type: Number, default: 4 },
    footerLayoutStyle: {
      type: String,
      enum: ["default", "centered", "minimal"],
      default: "default",
    },
    footerSocialIcons: { type: Boolean, default: true },

    // ─── Hero Banner (site component) ─────────────────────────
    heroBannerBackgroundUrl: { type: String, default: "/images/hero_bg.png" },
    heroBannerIconUrl: { type: String, default: "/images/hero-icon.svg" },
    heroBannerTitle: { type: String, default: "Because Every Learner" },
    heroBannerTitleHighlight: { type: String, default: "Deserves Support" },
    heroBannerDescription: { type: String, default: "" },
    heroBannerButtonText: { type: String, default: "Contact Us" },
    heroBannerButtonLink: { type: String, default: "/contact" },
    heroBannerTitleColorKey: { type: String, default: "black" },
    heroBannerTitleHighlightColorKey: { type: String, default: "primary" },
    heroBannerDescriptionColorKey: { type: String, default: "black" },

    // ─── Home Hero / Slider (site component) ───────────────────
    /** Multiple slides: proper layout saved and read from DB. */
    homeHeroSlides: { type: [homeHeroSlideSchema], default: [] },
    homeHeroSliderBgImageUrl: { type: String, default: "/images/slider-1.png" },
    homeHeroSliderTitle: {
      type: String,
      default: "Because Every Learner Deserves Support",
    },
    homeHeroSliderDesc: {
      type: String,
      default:
        "A community-powered initiative that brings donors, mentors, and resources together to help learners overcome barriers and continue their education—turning collective support into real opportunities.",
    },
    homeHeroSliderButtonText: { type: String, default: "Contact Us" },
    homeHeroContactHref: { type: String, default: "/contact" },
    homeHeroSliderTitleColorKey: { type: String, default: "" },
    homeHeroSliderDescColorKey: { type: String, default: "" },
    homeHeroSliderButtonBgColorKey: { type: String, default: "primary" },
    homeHeroSliderButtonTextColorKey: { type: String, default: "white" },
    /** "full" = background full viewport width; "contained" = background within page width */
    homeHeroBackgroundContainer: {
      type: String,
      enum: ["full", "contained"],
      default: "full",
    },
    /** "pageContainer" = content inside PageContainer; "full" = content full width */
    homeHeroContentContainer: {
      type: String,
      enum: ["pageContainer", "full"],
      default: "pageContainer",
    },

    // ─── Marquee (site component) ───────────────────────────────
    marqueeTitle: {
      type: String,
      default: "Our CSR Partners | Awards & Recognition",
    },
    marqueeItems: { type: [marqueeItemSchema], default: [] },

    // ─── Subscribe (site component) ───────────────────────────────
    subscribeSubtitle: { type: String, default: "" },
    subscribeTitle: { type: String, default: "" },
    subscribePlaceholder: { type: String, default: "" },
    subscribeButtonText: { type: String, default: "" },
    subscribeBgUrl: { type: String, default: "" },

    // ─── 7. Button Style ──────────────────────────────────────
    buttonBackground: { type: String, default: "" },
    buttonTextColor: { type: String, default: "" },
    buttonHoverBackground: { type: String, default: "" },
    buttonHoverTextColor: { type: String, default: "" },
    buttonPadding: { type: String, default: "8px 20px" },

    // ─── 8. Component Style Override ───────────────────────────
    cardStyle: {
      type: String,
      enum: ["flat", "elevated"],
      default: "elevated",
    },
    alertStyle: {
      type: String,
      enum: ["default", "minimal", "bordered"],
      default: "default",
    },
    badgeStyle: {
      type: String,
      enum: ["default", "solid", "outline"],
      default: "default",
    },
    tableStyle: {
      type: String,
      enum: ["default", "bordered", "striped"],
      default: "default",
    },
    formStyle: {
      type: String,
      enum: ["default", "compact", "outlined"],
      default: "default",
    },
    inputStyle: {
      type: String,
      enum: ["default", "filled", "outlined"],
      default: "default",
    },

    // ─── 9. Responsive ─────────────────────────────────────────
    mobileFontSize: { type: Number, default: 0 }, // 0 = no override
    mobileSectionSpacing: { type: String, default: "" },
    hideSectionOnMobile: { type: Boolean, default: false },

    // ─── 10. Blog Theme ────────────────────────────────────────
    blogCommentsEnabled: { type: Boolean, default: true },
    blogLayout: { type: String, enum: ["grid", "list"], default: "grid" },
    blogSidebarPosition: {
      type: String,
      enum: ["left", "right", "none"],
      default: "right",
    },
    blogFeaturedImageRatio: { type: String, default: "16/9" },
    blogMetaStyle: {
      type: String,
      enum: ["minimal", "full"],
      default: "minimal",
    },

    // ─── 11. Page Loader ────────────────────────────────────────
    pageLoaderEnabled: { type: Boolean, default: true },
    pageLoaderBgColor: { type: String, default: "#000000" },
    pageLoaderBarColor: { type: String, default: "#CF372F" },
    pageLoaderMinDuration: { type: Number, default: 400 },

    // ─── 12. Advanced ───────────────────────────────────────────
    customCss: { type: String, default: "" },
    customJs: { type: String, default: "" },
    headScripts: { type: String, default: "" },
    footerScripts: { type: String, default: "" },
    googleAnalyticsId: { type: String, default: "" },

    // ─── Layout & locale ───────────────────────────────────────
    layoutWidth: { type: Number, default: 1200 },
    defaultLocale: { type: String, default: "en" },
    direction: { type: String, enum: ["ltr", "rtl"], default: "ltr" },
    smoothScrollEnabled: { type: Boolean, default: true },
    smoothScrollDuration: { type: Number, default: 1.4 },
    smoothScrollWheelMultiplier: { type: Number, default: 1 },
    smoothScrollTouchMultiplier: { type: Number, default: 1.2 },
    fadeAnimationEnabled: { type: Boolean, default: true },
    fadeAnimationDuration: { type: Number, default: 1 },
    fadeAnimationDistance: { type: Number, default: 20 },
    fadeAnimationThreshold: { type: Number, default: 0.1 },

    // ─── 13. Admin Panel Theme ─────────────────────────────────
    adminSiteName: { type: String, default: "" },
    adminLogoUrl: { type: String, default: "" },
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
    adminLoaderColor: { type: String, default: "#1677ff" },
    adminLoaderBgColor: { type: String, default: "rgba(255,255,255,0.5)" },
  },
  { timestamps: true },
);

module.exports =
  (mongoose.models && mongoose.models.ThemeConfig) ||
  mongoose.model("ThemeConfig", themeConfigSchema);
