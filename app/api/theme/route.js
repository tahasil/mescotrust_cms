import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getToken } from "next-auth/jwt";
import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/db";
import ThemeConfig from "@/models/ThemeConfig";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** Single theme doc: match by themeKey or legacy docs without themeKey */
const THEME_QUERY = { $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }] };

/** No built-in palette; only admin-defined palette + custom colors are stored and synced to Theme.js */
const THEME_PALETTE_DEFAULTS = {};

function slugToCamel(slug) {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function escapeJsString(value) {
  if (value == null) return "";
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Regex for a single-line color in Theme.js (key: "var(--theme-...) */
const THEME_COLOR_LINE_RE = /^\s{4}([a-zA-Z_][a-zA-Z0-9_]*):\s*"var\(--theme-/;
/** Multi-line key only (e.g. "    gradient:") */
const THEME_COLOR_KEY_ONLY_RE = /^\s{4}[a-zA-Z_][a-zA-Z0-9_]*:\s*$/;
/** Continuation line (e.g. 6 spaces + "var(--theme-...) */
const THEME_COLOR_CONTINUATION_RE = /^\s{6}"var\(--theme-/;

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
  const marker = "  },\n  fonts:";
  if (!content.includes(marker)) return;

  const lines = content.split("\n");
  const filtered = lines.filter((line) => {
    if (line.match(THEME_COLOR_LINE_RE)) return false;
    if (line.match(THEME_COLOR_KEY_ONLY_RE)) return false;
    if (line.match(THEME_COLOR_CONTINUATION_RE)) return false;
    return true;
  });
  content = filtered.join("\n");

  const linesToAdd = [];
  for (const [name, value] of byName) {
    const slug = String(name).toLowerCase().trim().replace(/\s+/g, "-");
    const slugClean = slug.replace(/[^a-z0-9-]/gi, "") || "custom";
    const camelKey = slugToCamel(slugClean);
    const cssVar = `--theme-${slugClean}`;
    const escaped = escapeJsString(value);
    linesToAdd.push(`    ${camelKey}: "var(${cssVar}, ${escaped})",`);
  }

  const insert = linesToAdd.length ? linesToAdd.join("\n") + "\n" + marker : marker;
  content = content.replace(marker, insert);
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
  marqueeTitle: "Our CSR Partners | Awards & Recognition",
  marqueeItems: [],
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
  mobileSectionSpacing: "",
  hideSectionOnMobile: false,
  blogLayout: "grid",
  blogSidebarPosition: "right",
  blogFeaturedImageRatio: "16/9",
  blogMetaStyle: "minimal",
  customCss: "",
  customJs: "",
  headScripts: "",
  footerScripts: "",
  googleAnalyticsId: "",
  layoutWidth: 1200,
  defaultLocale: "en",
  direction: "ltr",
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
  "marqueeTitle", "marqueeItems",
  "buttonBackground", "buttonTextColor", "buttonHoverBackground", "buttonHoverTextColor", "buttonPadding",
  "cardStyle", "alertStyle", "badgeStyle", "tableStyle", "formStyle", "inputStyle",
  "mobileFontSize", "mobileSectionSpacing", "hideSectionOnMobile",
  "blogLayout", "blogSidebarPosition", "blogFeaturedImageRatio", "blogMetaStyle",
  "customCss", "customJs", "headScripts", "footerScripts", "googleAnalyticsId",
  "layoutWidth", "defaultLocale", "direction",
];

function normalizeTheme(theme) {
  if (!theme) return { ...DEFAULTS, themePalette: { ...THEME_PALETTE_DEFAULTS } };
  const out = { ...DEFAULTS, ...theme };
  if (!out.bodyFont && out.fontFamily) out.bodyFont = out.fontFamily;
  if (!out.headingFont && out.headingFontFamily) out.headingFont = out.headingFontFamily;
  if (out.baseFontSize == null && out.fontSize != null) out.baseFontSize = out.fontSize;
  if (!out.logoLightUrl && out.logoImageUrl) out.logoLightUrl = out.logoImageUrl;
  if (!Array.isArray(out.colors)) out.colors = [];
  const storedPalette = out.themePalette && typeof out.themePalette === "object" ? out.themePalette : {};
  out.themePalette = Object.keys(storedPalette).length > 0 ? { ...storedPalette } : { ...THEME_PALETTE_DEFAULTS };
  return out;
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
];

const MARQUEE_KEYS = ["marqueeTitle", "marqueeItems"];

function normalizeMarqueeItem(item) {
  return {
    url: item?.url != null ? String(item.url).trim() : "",
    alt: item?.alt != null ? String(item.alt).trim() : "",
  };
}

/** Normalize one slide: no defaults — all values from DB. Trim strings, use "" when missing. */
function normalizeSlide(s) {
  return {
    bgImageUrl: s?.bgImageUrl != null ? String(s.bgImageUrl).trim() : "",
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
    const doc = await ThemeConfig.findOne(THEME_QUERY).sort({ updatedAt: -1 });
    if (!doc) {
      return NextResponse.json(normalizeTheme(null), { headers });
    }
    const plain = doc.toObject ? doc.toObject() : { ...doc };
    const normalized = normalizeTheme(plain);
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
      if (body.footerLogoUrl !== undefined) initialUpdates.footerLogoUrl = typeof body.footerLogoUrl === "string" ? body.footerLogoUrl : String(body.footerLogoUrl || "");
      if (body.footerBackgroundImageUrl !== undefined) initialUpdates.footerBackgroundImageUrl = typeof body.footerBackgroundImageUrl === "string" ? body.footerBackgroundImageUrl : String(body.footerBackgroundImageUrl || "");
      if (Object.keys(initialUpdates).length > 0 && theme._id) {
        initialUpdates.updatedAt = new Date();
        await ThemeConfig.updateOne({ _id: theme._id }, { $set: initialUpdates });
      }
    } else {
      if (theme.themeKey !== "default") {
        theme.themeKey = "default";
        theme.markModified("themeKey");
      }
      for (const f of THEME_FIELDS) {
        if (f === "marqueeTitle" || f === "marqueeItems") continue;
        if (body[f] !== undefined) theme[f] = body[f];
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
      savedFromMemory = theme.toObject ? theme.toObject() : { ...theme };
      // Ensure response has the slides we just saved (toObject() can omit Mixed in some Mongoose versions)
      if (body.homeHeroSlides !== undefined && Array.isArray(body.homeHeroSlides)) {
        savedFromMemory.homeHeroSlides = body.homeHeroSlides.map((s) => normalizeSlide(s));
      }
      if (body.marqueeTitle !== undefined) savedFromMemory.marqueeTitle = typeof body.marqueeTitle === "string" ? body.marqueeTitle.trim() : String(body.marqueeTitle || "");
      if (body.marqueeItems !== undefined && Array.isArray(body.marqueeItems)) {
        savedFromMemory.marqueeItems = body.marqueeItems.map((it) => normalizeMarqueeItem(it));
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
      if (body.homeHeroSlides !== undefined) {
        directUpdates.homeHeroSlides = Array.isArray(body.homeHeroSlides)
          ? body.homeHeroSlides.map((s) => normalizeSlide(s))
          : [];
      }
      if (Object.keys(directUpdates).length > 0 && theme._id) {
        directUpdates.updatedAt = new Date();
        await ThemeConfig.updateOne({ _id: theme._id }, { $set: directUpdates });
      }
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
    }

    revalidatePath("/", "layout");
    // Use the document we just saved when we had existing theme (avoids stale read); else re-query (e.g. after create)
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
    return NextResponse.json(normalizeTheme(saved));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
