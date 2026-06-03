import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getToken } from "next-auth/jwt";
import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/db";
import ThemeConfig from "@/models/ThemeConfig";
import Component from "@/models/Component";
import { isAdmin } from "@/lib/permissions";
import { getRegistryIdsFromDisk } from "@/lib/getRegistryIdsFromDisk";
import { normalizeThemeColorCollections } from "@/lib/themeColorFallbacks";
import AppearanceColorConfig from "@/models/AppearanceColorConfig";
import {
  APPEARANCE_COLOR_QUERY,
  APPEARANCE_ADMIN_UI_FIELDS,
  APPEARANCE_ADMIN_SIDEBAR_FIELDS,
} from "@/lib/appearanceColors";

export const dynamic = "force-dynamic";

/** Single theme doc: match by themeKey or legacy docs without themeKey */
const THEME_QUERY = { $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }] };

/** Legacy theme colors are recovered when missing; stored themePalette is preserved (except known bad generated keys). */

function slugToCamel(slug) {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function escapeJsString(value) {
  if (value == null) return "";
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Sync only admin palette + custom colors to styles/Theme.js. No built-in palette keys.
 */
function syncColorsToThemeJs(paletteColors, colors, themePath) {
  if (!themePath || !fs.existsSync(themePath)) return;

  const allEntries = [
    ...(Array.isArray(paletteColors) ? paletteColors.filter((p) => p && p.key) : []).map((p) => ({ name: p.key, value: p.value })),
    ...(Array.isArray(colors) ? colors.filter((c) => c && c.name) : []).map((c) => ({ name: c.name, value: c.value })),
  ];

  const byName = new Map();
  for (const c of allEntries) {
    if (c.value == null || c.value === "") continue;
    const name = String(c.name).trim();
    if (name) byName.set(name, c.value);
  }

  let content = fs.readFileSync(themePath, "utf8");
  const endMarker = "  },\n  fonts:";
  // Only ever rewrite the `colors: { ... }` object body. Earlier this filtered
  // color-shaped lines across the WHOLE file, which deleted unrelated 4-space
  // declarations elsewhere (e.g. a styled-component's `transition:` line). Scope
  // strictly to the block between `colors: {` and the `},\n  fonts:` marker.
  const startMatch = content.match(/\n[ \t]*colors:\s*\{\n/);
  if (!startMatch) return;
  const bodyStart = startMatch.index + startMatch[0].length;
  const endIdx = content.indexOf(endMarker, bodyStart);
  if (endIdx === -1) return;

  const linesToAdd = [];
  for (const [name, value] of byName) {
    const slug = String(name).toLowerCase().trim().replace(/\s+/g, "-");
    const slugClean = slug.replace(/[^a-z0-9-]/gi, "") || "custom";
    const camelKey = slugToCamel(slugClean);
    const cssVar = `--theme-${slugClean}`;
    const escaped = escapeJsString(value);
    linesToAdd.push(`    ${camelKey}: "var(${cssVar}, ${escaped})",`);
  }

  const newBody = linesToAdd.length ? linesToAdd.join("\n") + "\n" : "";
  content = content.slice(0, bodyStart) + newBody + content.slice(endIdx);
  fs.writeFileSync(themePath, content, "utf8");
}

const DEFAULTS = {
  siteTitle: "Mesco Trust",
  tagline: "",
  logoType: "text",
  logoLightUrl: "",
  logoMobileUrl: "",
  logoDarkUrl: "",
  logoImageUrl: "",
  faviconUrl: "",
  footerCopyrightText: "",
  primaryColor: "",
  secondaryColor: "",
  bodyBackground: "",
  sectionBackground: "",
  cardBackground: "",
  headerBackground: "",
  footerBackground: "",
  headingColor: "",
  paragraphColor: "",
  linkColor: "",
  hoverColor: "",
  mutedTextColor: "",
  borderColor: "",
  dividerColor: "",
  inputBorderColor: "",
  colors: [],
  headingFont: "",
  bodyFont: "system-ui, sans-serif",
  buttonFont: "",
  baseFontSize: 16,
  h1Size: 0,
  h2Size: 0,
  h3Size: 0,
  h4Size: 0,
  h5Size: 0,
  h6Size: 0,
  lineHeight: 1.6,
  letterSpacing: 0,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  googleFonts: [],
  customFontUrl: "",
  fontFamily: "",
  fontSize: 16,
  headingFontFamily: "",
  headingFontSize: 0,
  fontWeight: 400,
  headingFontWeight: 700,
  buttonRadius: 6,
  cardRadius: 8,
  inputRadius: 6,
  cardShadow: true,
  buttonShadow: false,
  headerLayout: "default",
  headerSticky: true,
  headerTransparent: false,
  headerVolunteerLabel: "Volunteer",
  headerVolunteerHref: "/volunteer",
  headerVolunteerIconUrl: "",
  headerVolunteerIconUrlMobile: "",
  headerDonateLabel: "Donate Now",
  headerDonateHref: "/donate",
  headerDonateIconUrl: "",
  headerDonateIconUrlMobile: "",
  headerBgColorKey: "headerBg",
  headerCtaBgColorKey: "headerCta",
  headerCtaTextColorKey: "primary",
  headerDonateBgColorKey: "gradient",
  headerDonateTextColorKey: "white",
  megaMenu: false,
  dropdownStyle: "default",
  mobileMenuStyle: "drawer",
  footerLogoUrl: "",
  footerAddress: "",
  footerEmail: "",
  footerPhone: "",
  footerCol1Links: [],
  footerCol2Links: [],
  footerBgColorKey: "",
  footerBackgroundImageUrl: "/uploads/1772449953147_footer-bg.svg",
  footerTextColorKey: "",
  footerCopyrightBarColorKey: "",
  footerColumnsCount: 4,
  footerLayoutStyle: "default",
  footerSocialIcons: true,
  heroBannerBackgroundUrl: "/images/hero_bg.png",
  heroBannerIconUrl: "/images/hero-icon.svg",
  heroBannerTitle: "Because Every Learner",
  heroBannerTitleHighlight: "Deserves Support",
  heroBannerDescription: "A community-powered initiative that brings donors, mentors, and resources together to help learners overcome barriers and continue their education—turning collective support into real opportunities.",
  heroBannerButtonText: "Contact Us",
  heroBannerButtonLink: "/contact",
  heroBannerTitleColorKey: "black",
  heroBannerTitleHighlightColorKey: "primary",
  heroBannerDescriptionColorKey: "black",
  homeHeroSlides: [],
  homeHeroSliderBgImageUrl: "",
  homeHeroSliderTitle: "",
  homeHeroSliderDesc: "",
  homeHeroSliderButtonText: "",
  homeHeroContactHref: "",
  homeHeroSliderTitleColorKey: "",
  homeHeroSliderDescColorKey: "",
  homeHeroSliderButtonBgColorKey: "",
  homeHeroSliderButtonTextColorKey: "",
  homeHeroBackgroundContainer: "full",
  homeHeroContentContainer: "pageContainer",
  marqueeTitle: "Our CSR Partners | Awards & Recognition",
  marqueeItems: [],
  subscribeSubtitle: "",
  subscribeTitle: "",
  subscribePlaceholder: "",
  subscribeButtonText: "",
  subscribeBgUrl: "",
  buttonBackground: "",
  buttonTextColor: "",
  buttonHoverBackground: "",
  buttonHoverTextColor: "",
  buttonPadding: "8px 20px",
  cardStyle: "elevated",
  alertStyle: "default",
  badgeStyle: "default",
  tableStyle: "default",
  formStyle: "default",
  inputStyle: "default",
  mobileFontSize: 0,
  blogCommentsEnabled: true,
  blogLayout: "grid",
  blogSidebarPosition: "right",
  blogFeaturedImageRatio: "16/9",
  blogMetaStyle: "minimal",
  pageLoaderEnabled: true,
  pageLoaderBgColor: "#000000",
  pageLoaderBarColor: "#CF372F",
  pageLoaderMinDuration: 400,
  customCss: "",
  customJs: "",
  headScripts: "",
  footerScripts: "",
  googleAnalyticsId: "",
  layoutWidth: 1200,
  defaultLocale: "en",
  direction: "ltr",
  smoothScrollEnabled: true,
  smoothScrollDuration: 1.4,
  smoothScrollWheelMultiplier: 1,
  smoothScrollTouchMultiplier: 1.2,
  fadeAnimationEnabled: true,
  fadeAnimationDuration: 1,
  fadeAnimationDistance: 20,
  fadeAnimationThreshold: 0.1,
  adminSiteName: "",
  adminLogoUrl: "",
  adminTextColor: "#333333",
  adminBorderColor: "rgba(0,0,0,0.06)",
  adminCtaBgColor: "#1677ff",
  adminCtaTextColor: "#ffffff",
  adminCtaHoverBgColor: "",
  adminCtaHoverTextColor: "",
  adminSidebarBg: "#ffffff",
  adminSidebarText: "rgba(0,0,0,0.65)",
  adminSidebarHoverBg: "rgba(0,0,0,0.04)",
  adminSidebarHoverText: "#1677ff",
  adminSidebarActiveBg: "#e6f4ff",
  adminSidebarActiveText: "#1677ff",
  adminLoaderColor: "#1677ff",
  adminLoaderBgColor: "rgba(255,255,255,0.5)",
};

const THEME_FIELDS = [
  "siteTitle", "tagline", "logoType", "logoLightUrl", "logoMobileUrl", "logoDarkUrl", "logoImageUrl", "faviconUrl", "footerCopyrightText",
  "primaryColor", "secondaryColor", "bodyBackground", "sectionBackground", "cardBackground", "headerBackground", "footerBackground",
  "headingColor", "paragraphColor", "linkColor", "hoverColor", "mutedTextColor", "borderColor", "dividerColor", "inputBorderColor", "colors",
  "headingFont", "bodyFont", "buttonFont", "baseFontSize", "h1Size", "h2Size", "h3Size", "h4Size", "h5Size", "h6Size",
  "lineHeight", "letterSpacing", "fontWeightNormal", "fontWeightMedium", "fontWeightBold",
  "googleFonts", "customFontUrl", "fontFamily", "fontSize", "headingFontFamily", "headingFontSize", "fontWeight", "headingFontWeight",
  "buttonRadius", "cardRadius", "inputRadius", "cardShadow", "buttonShadow",
  "headerLayout", "headerSticky", "headerTransparent",
  "headerVolunteerLabel", "headerVolunteerHref", "headerVolunteerIconUrl", "headerVolunteerIconUrlMobile",
  "headerDonateLabel", "headerDonateHref", "headerDonateIconUrl", "headerDonateIconUrlMobile",
  "headerBgColorKey", "headerCtaBgColorKey", "headerCtaTextColorKey", "headerDonateBgColorKey", "headerDonateTextColorKey",
  "megaMenu", "dropdownStyle", "mobileMenuStyle",
  "footerLogoUrl", "footerAddress", "footerEmail", "footerPhone", "footerCol1Links", "footerCol2Links",
  "footerBgColorKey", "footerBackgroundImageUrl", "footerTextColorKey", "footerCopyrightBarColorKey",
  "footerColumnsCount", "footerLayoutStyle", "footerSocialIcons",
  "heroBannerBackgroundUrl", "heroBannerIconUrl", "heroBannerTitle", "heroBannerTitleHighlight", "heroBannerDescription", "heroBannerButtonText", "heroBannerButtonLink",
  "heroBannerTitleColorKey", "heroBannerTitleHighlightColorKey", "heroBannerDescriptionColorKey",
  "homeHeroSlides", "homeHeroSliderBgImageUrl", "homeHeroSliderTitle", "homeHeroSliderDesc", "homeHeroSliderButtonText", "homeHeroContactHref",
  "homeHeroSliderTitleColorKey", "homeHeroSliderDescColorKey", "homeHeroSliderButtonBgColorKey", "homeHeroSliderButtonTextColorKey",
  "homeHeroBackgroundContainer", "homeHeroContentContainer",
  "marqueeTitle", "marqueeItems",
  "subscribeSubtitle", "subscribeTitle", "subscribePlaceholder", "subscribeButtonText", "subscribeBgUrl",
  "buttonBackground", "buttonTextColor", "buttonHoverBackground", "buttonHoverTextColor", "buttonPadding",
  "cardStyle", "alertStyle", "badgeStyle", "tableStyle", "formStyle", "inputStyle",
  "mobileFontSize",
  "blogCommentsEnabled", "blogLayout", "blogSidebarPosition", "blogFeaturedImageRatio", "blogMetaStyle",
  "pageLoaderEnabled", "pageLoaderBgColor", "pageLoaderBarColor", "pageLoaderMinDuration",
  "customCss", "customJs", "headScripts", "footerScripts", "googleAnalyticsId",
  "layoutWidth", "defaultLocale", "direction",
  "smoothScrollEnabled", "smoothScrollDuration", "smoothScrollWheelMultiplier", "smoothScrollTouchMultiplier",
  "fadeAnimationEnabled", "fadeAnimationDuration", "fadeAnimationDistance", "fadeAnimationThreshold",
  "adminSiteName", "adminLogoUrl", "adminTextColor", "adminBorderColor",
  "adminCtaBgColor", "adminCtaTextColor", "adminCtaHoverBgColor", "adminCtaHoverTextColor",
  "adminSidebarBg", "adminSidebarText", "adminSidebarHoverBg", "adminSidebarHoverText",
  "adminSidebarActiveBg", "adminSidebarActiveText", "adminLoaderColor", "adminLoaderBgColor",
];
const THEME_SCHEMA_KEYS = Object.keys(ThemeConfig?.schema?.paths || {}).filter(
  (key) =>
    key !== "_id" &&
    key !== "__v" &&
    key !== "createdAt" &&
    key !== "updatedAt",
);
const THEME_CONFIG_OWNED_KEYS = new Set([
  ...Object.keys(DEFAULTS),
  ...THEME_SCHEMA_KEYS,
]);
const HEADER_COMPONENT_OVERRIDE_KEYS = new Set([
  "menuName",
  "navItems",
  "logoType",
  "logoLightUrl",
  "logoMobileUrl",
  "logoDarkUrl",
  "logoImageUrl",
  "headerVolunteerLabel",
  "headerVolunteerHref",
  "headerVolunteerIconUrl",
  "headerVolunteerIconUrlMobile",
  "headerDonateLabel",
  "headerDonateHref",
  "headerDonateIconUrl",
  "headerDonateIconUrlMobile",
  "headerBgColorKey",
  "headerCtaBgColorKey",
  "headerCtaTextColorKey",
  "headerDonateBgColorKey",
  "headerDonateTextColorKey",
  "volunteerModalTitle",
  "volunteerModalBtnBg",
  "volunteerModalBtnText",
  "volunteerModalCancelColor",
  "_sectionBg",
  "_containerType",
  "_sectionPadding",
  "_sectionBorderSize",
  "_sectionBorderStyle",
  "_sectionBorderColor",
  "_sectionShadow",
  "headerSectionBgType",
  "headerSectionBgImage",
  "headerSectionBgColorKey",
  "headerSectionPaddingTop",
  "headerSectionPaddingRight",
  "headerSectionPaddingBottom",
  "headerSectionPaddingLeft",
  "headerSectionMarginTop",
  "headerSectionMarginBottom",
  "headerPageContainerBgType",
  "headerPageContainerBgImage",
  "headerPageContainerBgColorKey",
  "headerPageContainerPaddingTop",
  "headerPageContainerPaddingRight",
  "headerPageContainerPaddingBottom",
  "headerPageContainerPaddingLeft",
  "headerPageContainerMarginTop",
  "headerPageContainerMarginBottom",
  "_disableFadeAnimation",
]);

function shouldMergeComponentProp(baseComponent, key) {
  if (!THEME_CONFIG_OWNED_KEYS.has(key)) return true;
  if (baseComponent === "Header") {
    return HEADER_COMPONENT_OVERRIDE_KEYS.has(key);
  }
  return false;
}

function normalizeTheme(theme) {
  if (!theme) return normalizeThemeColorCollections({ ...DEFAULTS });
  const out = { ...DEFAULTS, ...theme };
  if (!out.bodyFont && out.fontFamily) out.bodyFont = out.fontFamily;
  if (!out.headingFont && out.headingFontFamily) out.headingFont = out.headingFontFamily;
  if (out.baseFontSize == null && out.fontSize != null) out.baseFontSize = out.fontSize;
  if (!out.logoLightUrl && out.logoImageUrl) out.logoLightUrl = out.logoImageUrl;
  return normalizeThemeColorCollections(out);
}

const HERO_BANNER_KEYS = [
  "heroBannerBackgroundUrl", "heroBannerIconUrl", "heroBannerTitle", "heroBannerTitleHighlight",
  "heroBannerDescription", "heroBannerButtonText", "heroBannerButtonLink",
  "heroBannerTitleColorKey", "heroBannerTitleHighlightColorKey", "heroBannerDescriptionColorKey",
];

const HOME_HERO_KEYS = [
  "homeHeroSlides", "homeHeroSliderBgImageUrl", "homeHeroSliderTitle", "homeHeroSliderDesc",
  "homeHeroSliderButtonText", "homeHeroContactHref",
  "homeHeroSliderTitleColorKey", "homeHeroSliderDescColorKey", "homeHeroSliderButtonBgColorKey", "homeHeroSliderButtonTextColorKey",
  "homeHeroBackgroundContainer", "homeHeroContentContainer",
];

const MARQUEE_KEYS = ["marqueeTitle", "marqueeItems"];
const SUBSCRIBE_KEYS = ["subscribeSubtitle", "subscribeTitle", "subscribePlaceholder", "subscribeButtonText", "subscribeBgUrl"];
function normalizeMarqueeItem(item) {
  return {
    url: item?.url != null ? String(item.url).trim() : "",
    alt: item?.alt != null ? String(item.alt).trim() : "",
  };
}

/** Normalize one slide: no defaults — all values from DB. Trim strings, use "" when missing. */
function normalizeSlide(s) {
  const bgImageUrlDesktop =
    s?.bgImageUrlDesktop != null
      ? String(s.bgImageUrlDesktop).trim()
      : s?.bgImageUrl != null
        ? String(s.bgImageUrl).trim()
        : "";
  const bgImageUrlMobile =
    s?.bgImageUrlMobile != null ? String(s.bgImageUrlMobile).trim() : "";

  return {
    bgImageUrl: bgImageUrlDesktop,
    bgImageUrlDesktop,
    bgImageUrlMobile,
    title: s?.title != null ? String(s.title).trim() : "",
    description: s?.description != null ? String(s.description).trim() : "",
    buttonText: s?.buttonText != null ? String(s.buttonText).trim() : "",
    buttonLink: s?.buttonLink != null ? String(s.buttonLink).trim() : "",
    showButton: s?.showButton !== false,
  };
}

export async function GET() {
  const headers = { "Cache-Control": "no-store, no-cache, must-revalidate" };
  try {
    await connectDB();
    const doc = await ThemeConfig.findOne(THEME_QUERY).sort({ updatedAt: -1 }).lean();
    if (!doc) {
      return NextResponse.json(normalizeTheme(null), { headers });
    }
    const plain = doc;
    const normalized = normalizeTheme(plain);
    if (
      (normalized.adminLoaderBgColor === undefined ||
        normalized.adminLoaderBgColor === "") &&
      ThemeConfig?.collection
    ) {
      const raw = await ThemeConfig.collection.findOne(THEME_QUERY);
      if (raw?.adminLoaderBgColor !== undefined) {
        normalized.adminLoaderBgColor = String(raw.adminLoaderBgColor);
      }
    }
    if (plain.footerBackgroundImageUrl != null) {
      normalized.footerBackgroundImageUrl = String(plain.footerBackgroundImageUrl).trim();
    }
    for (const k of HERO_BANNER_KEYS) {
      if (plain[k] !== undefined) {
        normalized[k] = typeof plain[k] === "string" ? String(plain[k]).trim() : plain[k];
      }
    }
    for (const k of HOME_HERO_KEYS) {
      if (k === "homeHeroSlides") {
        const raw = doc.get ? doc.get("homeHeroSlides") : doc.homeHeroSlides;
        const arr = Array.isArray(raw) ? raw : [];
        normalized.homeHeroSlides = arr.length > 0 ? arr.map((s) => normalizeSlide(s)) : [];
      } else if (plain[k] !== undefined) {
        normalized[k] = typeof plain[k] === "string" ? String(plain[k]).trim() : plain[k];
      }
    }
    if (!Array.isArray(normalized.homeHeroSlides)) normalized.homeHeroSlides = [];
    for (const k of MARQUEE_KEYS) {
      if (k === "marqueeItems") {
        const raw = doc.get ? doc.get("marqueeItems") : doc.marqueeItems;
        const arr = Array.isArray(raw) ? raw : [];
        normalized.marqueeItems = arr.map((it) => normalizeMarqueeItem(it));
      } else if (k === "marqueeTitle") {
        normalized.marqueeTitle = plain.marqueeTitle != null ? String(plain.marqueeTitle).trim() : (DEFAULTS.marqueeTitle || "Our CSR Partners | Awards & Recognition");
      }
    }
    if (!Array.isArray(normalized.marqueeItems)) normalized.marqueeItems = [];
    for (const k of SUBSCRIBE_KEYS) {
      normalized[k] = plain[k] != null ? String(plain[k]).trim() : "";
    }
    // Merge from components collection (all site components: Header, Footer, HomeHero, Subscribe + any new)
    const comps = await Component.find({ baseComponent: { $in: getRegistryIdsFromDisk() } }).lean();
    for (const c of comps || []) {
      const props = c.defaultProps;
      const baseComponent = c?.baseComponent;
      if (props && typeof props === "object") {
        for (const key of Object.keys(props)) {
          if (!shouldMergeComponentProp(baseComponent, key)) continue;
          if (props[key] !== undefined) normalized[key] = props[key];
        }
      }
    }
    return NextResponse.json(normalized, { headers });
  } catch (err) {
    console.error("[Theme GET] error:", err);
    return NextResponse.json(normalizeTheme(null), { status: 200, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
  }
}

export async function PUT(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(token)) return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    const subscribeInBody = SUBSCRIBE_KEYS.filter((k) => body[k] !== undefined).length;
    if (subscribeInBody > 0) {
      console.log("[Subscribe 3] API PUT: received body (Subscribe keys)", SUBSCRIBE_KEYS.map((k) => ({ [k]: body[k] })).reduce((a, b) => ({ ...a, ...b }), {}));
    }
    await connectDB();
    let theme = await ThemeConfig.findOne(THEME_QUERY).sort({ updatedAt: -1 });
    let savedFromMemory = null; // set after theme.save() so PUT response matches persisted data
    if (!theme) {
      theme = await ThemeConfig.create({ ...DEFAULTS, themeKey: "default", ...body });
      // Force-write hero (and footer) fields so new doc has them in DB
      const initialUpdates = {};
      for (const f of HERO_BANNER_KEYS) {
        if (body[f] !== undefined) initialUpdates[f] = typeof body[f] === "string" ? body[f].trim() : body[f];
      }
      for (const f of HOME_HERO_KEYS) {
        if (f === "homeHeroSlides") {
          if (body.homeHeroSlides !== undefined) {
            initialUpdates.homeHeroSlides = Array.isArray(body.homeHeroSlides)
              ? body.homeHeroSlides.map((s) => normalizeSlide(s))
              : [];
          }
        } else if (body[f] !== undefined) {
          initialUpdates[f] = typeof body[f] === "string" ? body[f].trim() : body[f];
        }
      }
      if (body.marqueeTitle !== undefined) initialUpdates.marqueeTitle = typeof body.marqueeTitle === "string" ? body.marqueeTitle.trim() : String(body.marqueeTitle || "");
      if (body.marqueeItems !== undefined) {
        initialUpdates.marqueeItems = Array.isArray(body.marqueeItems) ? body.marqueeItems.map((it) => normalizeMarqueeItem(it)) : [];
      }
      for (const k of SUBSCRIBE_KEYS) {
        if (body[k] !== undefined) initialUpdates[k] = typeof body[k] === "string" ? String(body[k]).trim() : body[k];
      }
      if (body.footerLogoUrl !== undefined) initialUpdates.footerLogoUrl = typeof body.footerLogoUrl === "string" ? body.footerLogoUrl : String(body.footerLogoUrl || "");
      if (body.footerBackgroundImageUrl !== undefined) initialUpdates.footerBackgroundImageUrl = typeof body.footerBackgroundImageUrl === "string" ? body.footerBackgroundImageUrl : String(body.footerBackgroundImageUrl || "");
      if (Object.keys(initialUpdates).length > 0 && theme._id) {
        initialUpdates.updatedAt = new Date();
        await ThemeConfig.updateOne(
          { _id: theme._id },
          { $set: initialUpdates },
          { strict: false },
        );
        if (subscribeInBody > 0) {
          console.log("[Subscribe 5a] API PUT: new theme doc → updateOne (initialUpdates) → Subscribe saved to DB (themeconfigs)");
        }
      }
      if (body.adminLoaderBgColor !== undefined && theme._id && ThemeConfig?.collection) {
        await ThemeConfig.collection.updateOne(
          { _id: theme._id },
          {
            $set: {
              adminLoaderBgColor: String(body.adminLoaderBgColor),
              updatedAt: new Date(),
            },
          },
        );
      }
    } else {
      // Force-write Subscribe fields using same query as GET so we always update the doc that GET returns
      const subscribeWrite = {};
      for (const k of SUBSCRIBE_KEYS) {
        if (body[k] !== undefined) {
          subscribeWrite[k] = typeof body[k] === "string" ? String(body[k]).trim() : body[k];
        }
      }
      if (Object.keys(subscribeWrite).length > 0) {
        subscribeWrite.updatedAt = new Date();
        const updateResult = await ThemeConfig.findOneAndUpdate(
          THEME_QUERY,
          { $set: subscribeWrite },
          { sort: { updatedAt: -1 }, new: true }
        );
        if (subscribeInBody > 0) {
          if (updateResult) {
            console.log("[Subscribe] findOneAndUpdate OK → DB written", {
              subscribeSubtitle: updateResult.subscribeSubtitle,
              subscribeTitle: updateResult.subscribeTitle,
            });
          } else {
            console.error("[Subscribe] No theme document matched THEME_QUERY — create a theme first (e.g. npm run seed)");
          }
        }
      }

      if (theme.themeKey !== "default") {
        theme.themeKey = "default";
        theme.markModified("themeKey");
      }
      for (const f of THEME_FIELDS) {
        if (f === "marqueeTitle" || f === "marqueeItems" || SUBSCRIBE_KEYS.includes(f)) continue;
        if (body[f] !== undefined) theme[f] = body[f];
      }
      if (body.adminLoaderBgColor !== undefined) {
        theme.set("adminLoaderBgColor", body.adminLoaderBgColor, { strict: false });
        theme.markModified("adminLoaderBgColor");
      }
      if (body.footerLogoUrl !== undefined) {
        theme.footerLogoUrl = typeof body.footerLogoUrl === "string" ? body.footerLogoUrl : String(body.footerLogoUrl || "");
        theme.markModified("footerLogoUrl");
      }
      if (body.footerBackgroundImageUrl !== undefined) {
        theme.footerBackgroundImageUrl = typeof body.footerBackgroundImageUrl === "string" ? body.footerBackgroundImageUrl : String(body.footerBackgroundImageUrl || "");
        theme.markModified("footerBackgroundImageUrl");
      }
      if (body.footerCol1Links !== undefined) {
        theme.footerCol1Links = Array.isArray(body.footerCol1Links) ? body.footerCol1Links : [];
        theme.markModified("footerCol1Links");
      }
      if (body.footerCol2Links !== undefined) {
        theme.footerCol2Links = Array.isArray(body.footerCol2Links) ? body.footerCol2Links : [];
        theme.markModified("footerCol2Links");
      }
      if (body.homeHeroSlides !== undefined) {
        const normalized = Array.isArray(body.homeHeroSlides)
          ? body.homeHeroSlides.map((s) => normalizeSlide(s))
          : [];
        theme.homeHeroSlides = normalized;
        theme.markModified("homeHeroSlides");
      }
      for (const f of HERO_BANNER_KEYS) {
        if (body[f] !== undefined) {
          theme[f] = typeof body[f] === "string" ? body[f].trim() : body[f];
          theme.markModified(f);
        }
      }
      for (const f of HOME_HERO_KEYS) {
        if (f === "homeHeroSlides") continue; // already set and normalized above
        if (body[f] !== undefined) {
          theme[f] = typeof body[f] === "string" ? body[f].trim() : body[f];
          theme.markModified(f);
        }
      }
      if (body.marqueeTitle !== undefined) {
        theme.marqueeTitle = typeof body.marqueeTitle === "string" ? body.marqueeTitle.trim() : String(body.marqueeTitle || "");
        theme.markModified("marqueeTitle");
      }
      if (body.marqueeItems !== undefined) {
        theme.marqueeItems = Array.isArray(body.marqueeItems) ? body.marqueeItems.map((it) => normalizeMarqueeItem(it)) : [];
        theme.markModified("marqueeItems");
      }
      for (const k of SUBSCRIBE_KEYS) {
        if (body[k] !== undefined) {
          theme[k] = typeof body[k] === "string" ? String(body[k]).trim() : body[k];
          theme.markModified(k);
        }
      }
      if (subscribeInBody > 0) {
        console.log("[Subscribe 4] API PUT: theme document updated in memory (before save)", { subscribeSubtitle: theme.subscribeSubtitle, subscribeTitle: theme.subscribeTitle });
      }
      if (Array.isArray(body.paletteColors)) {
        theme.themePalette = Object.fromEntries(
          body.paletteColors.filter((p) => p && String(p.key).trim()).map((p) => [String(p.key).trim(), p.value])
        );
        theme.markModified("themePalette");
      } else if (body.themePalette && typeof body.themePalette === "object") {
        const current = theme.themePalette?.toObject?.() || theme.themePalette || {}; 
        theme.themePalette = { ...current, ...body.themePalette };
        theme.markModified("themePalette");
      }
      await theme.save();
      if (subscribeInBody > 0) {
        console.log("[Subscribe 5] API PUT: theme.save() done → written to MongoDB (themeconfigs)");
      }
      savedFromMemory = theme.toObject ? theme.toObject() : { ...theme };
      // Ensure response has the slides we just saved (toObject() can omit Mixed in some Mongoose versions)
      if (body.homeHeroSlides !== undefined && Array.isArray(body.homeHeroSlides)) {
        savedFromMemory.homeHeroSlides = body.homeHeroSlides.map((s) => normalizeSlide(s));
      }
      if (body.marqueeTitle !== undefined) savedFromMemory.marqueeTitle = typeof body.marqueeTitle === "string" ? body.marqueeTitle.trim() : String(body.marqueeTitle || "");
      if (body.marqueeItems !== undefined && Array.isArray(body.marqueeItems)) {
        savedFromMemory.marqueeItems = body.marqueeItems.map((it) => normalizeMarqueeItem(it));
      }
      for (const k of SUBSCRIBE_KEYS) {
        if (body[k] !== undefined) savedFromMemory[k] = typeof body[k] === "string" ? String(body[k]).trim() : body[k];
      }

      // Force-persist footer and hero fields via direct update (ensures DB write on reload)
      const directUpdates = {};
      if (body.footerLogoUrl !== undefined) {
        directUpdates.footerLogoUrl = typeof body.footerLogoUrl === "string" ? body.footerLogoUrl : String(body.footerLogoUrl || "");
      }
      if (body.footerBackgroundImageUrl !== undefined) {
        directUpdates.footerBackgroundImageUrl = typeof body.footerBackgroundImageUrl === "string" ? body.footerBackgroundImageUrl : String(body.footerBackgroundImageUrl || "");
      }
      for (const f of HERO_BANNER_KEYS) {
        if (body[f] !== undefined) {
          directUpdates[f] = typeof body[f] === "string" ? body[f].trim() : body[f];
        }
      }
      for (const f of HOME_HERO_KEYS) {
        if (body[f] !== undefined && f !== "homeHeroSlides") {
          directUpdates[f] = typeof body[f] === "string" ? body[f].trim() : body[f];
        }
      }
      if (body.marqueeTitle !== undefined) directUpdates.marqueeTitle = typeof body.marqueeTitle === "string" ? body.marqueeTitle.trim() : String(body.marqueeTitle || "");
      if (body.marqueeItems !== undefined) {
        directUpdates.marqueeItems = Array.isArray(body.marqueeItems) ? body.marqueeItems.map((it) => normalizeMarqueeItem(it)) : [];
      }
      for (const k of SUBSCRIBE_KEYS) {
        if (body[k] !== undefined) directUpdates[k] = typeof body[k] === "string" ? String(body[k]).trim() : body[k];
      }
      if (body.homeHeroSlides !== undefined) {
        directUpdates.homeHeroSlides = Array.isArray(body.homeHeroSlides)
          ? body.homeHeroSlides.map((s) => normalizeSlide(s))
          : [];
      }
      if (Object.keys(directUpdates).length > 0 && theme._id) {
        directUpdates.updatedAt = new Date();
        await ThemeConfig.updateOne(
          { _id: theme._id },
          { $set: directUpdates },
          { strict: false },
        );
        if (subscribeInBody > 0 && SUBSCRIBE_KEYS.some((k) => directUpdates[k] !== undefined)) {
          console.log("[Subscribe 6] API PUT: updateOne (direct) done → Subscribe fields confirmed in DB", Object.keys(directUpdates).filter((k) => SUBSCRIBE_KEYS.includes(k)));
        }
      }
    }

    if (body.adminLoaderBgColor !== undefined && theme?._id && ThemeConfig?.collection) {
      await ThemeConfig.collection.updateOne(
        { _id: theme._id },
        {
          $set: {
            adminLoaderBgColor: String(body.adminLoaderBgColor),
            updatedAt: new Date(),
          },
        },
      );
    }

    // Sync Theme.js from saved theme state so delete/rename persists
    if (body.paletteColors !== undefined || body.colors !== undefined) {
      const themePath = path.join(process.cwd(), "styles", "Theme.js");
      const paletteForSync = theme.themePalette && typeof theme.themePalette === "object"
        ? Object.entries(theme.themePalette).map(([key, value]) => ({ key, value }))
        : [];
      const colorsForSync = Array.isArray(body.colors) ? body.colors : (Array.isArray(theme.colors) ? theme.colors : []);
      try {
        syncColorsToThemeJs(paletteForSync, colorsForSync, themePath);
      } catch (syncErr) {
        console.error("Theme.js sync colors:", syncErr);
      }

      // Keep AppearanceColorConfig (the frontend-authoritative color store that
      // getSiteSettingsLean applies) in sync with the just-saved palette, so colors
      // added / edited / removed in the admin apply on the public site immediately.
      // Previously this only happened lazily on the next frontend read, which lagged
      // and could leave the site showing a stale palette (the "colors not applied"
      // symptom). This is the deterministic, authoritative write.
      try {
        const fullPalette =
          theme.themePalette && typeof theme.themePalette === "object"
            ? theme.themePalette.toObject?.() || theme.themePalette
            : {};
        const adminUiColors = {};
        for (const f of APPEARANCE_ADMIN_UI_FIELDS) adminUiColors[f] = theme[f];
        const adminSidebarUiColors = {};
        for (const f of APPEARANCE_ADMIN_SIDEBAR_FIELDS) adminSidebarUiColors[f] = theme[f];
        await AppearanceColorConfig.findOneAndUpdate(
          APPEARANCE_COLOR_QUERY,
          {
            $set: {
              frontendUiColors: { ...fullPalette },
              themePalette: { ...fullPalette },
              adminUiColors,
              adminSidebarUiColors,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true, strict: false },
        );
      } catch (colorCfgErr) {
        console.error("AppearanceColorConfig palette sync:", colorCfgErr);
      }
    }

    revalidatePath("/", "layout");
    // Same as footer: use in-memory saved doc (savedFromMemory) so response matches what we just saved
    const saved = savedFromMemory || await ThemeConfig.findOne(THEME_QUERY).sort({ updatedAt: -1 }).lean();
    if (saved && body.footerBackgroundImageUrl !== undefined) {
      saved.footerBackgroundImageUrl = typeof body.footerBackgroundImageUrl === "string" ? body.footerBackgroundImageUrl : String(body.footerBackgroundImageUrl || "");
    }
    if (saved && body.footerLogoUrl !== undefined) {
      saved.footerLogoUrl = typeof body.footerLogoUrl === "string" ? body.footerLogoUrl : String(body.footerLogoUrl || "");
    }
    for (const f of HERO_BANNER_KEYS) {
      if (body[f] !== undefined && saved) {
        saved[f] = typeof body[f] === "string" ? body[f].trim() : body[f];
      }
    }
    for (const f of HOME_HERO_KEYS) {
      if (f === "homeHeroSlides" && body.homeHeroSlides !== undefined && saved) {
        saved.homeHeroSlides = Array.isArray(body.homeHeroSlides)
          ? body.homeHeroSlides.map((s) => normalizeSlide(s))
          : [];
      } else if (body[f] !== undefined && saved) {
        saved[f] = typeof body[f] === "string" ? body[f].trim() : body[f];
      }
    }
    for (const f of MARQUEE_KEYS) {
      if (f === "marqueeItems" && body.marqueeItems !== undefined && saved) {
        saved.marqueeItems = Array.isArray(body.marqueeItems) ? body.marqueeItems.map((it) => normalizeMarqueeItem(it)) : [];
      } else if (body[f] !== undefined && saved) {
        saved[f] = typeof body[f] === "string" ? body[f].trim() : body[f];
      }
    }
    for (const k of SUBSCRIBE_KEYS) {
      if (body[k] !== undefined && saved) saved[k] = typeof body[k] === "string" ? String(body[k]).trim() : body[k];
    }
    if (body.adminLoaderBgColor !== undefined && saved) {
      saved.adminLoaderBgColor = String(body.adminLoaderBgColor);
    }
    const responseBody = normalizeTheme(saved);
    const headers = { "Cache-Control": "no-store, no-cache, must-revalidate" };
    return NextResponse.json(responseBody, { headers });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
