import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getToken } from "next-auth/jwt";
import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/db";
import ThemeConfig from "@/models/ThemeConfig";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

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
  footerTextColorKey: "",
  footerCopyrightBarColorKey: "",
  footerColumnsCount: 4,
  footerLayoutStyle: "default",
  footerSocialIcons: true,
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
  "footerBgColorKey", "footerTextColorKey", "footerCopyrightBarColorKey",
  "footerColumnsCount", "footerLayoutStyle", "footerSocialIcons",
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

export async function GET() {
  try {
    await connectDB();
    let theme = await ThemeConfig.findOne().lean();
    return NextResponse.json(normalizeTheme(theme));
  } catch {
    return NextResponse.json(DEFAULTS, { status: 200 });
  }
}

export async function PUT(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(token)) return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    await connectDB();
    let theme = await ThemeConfig.findOne();
    if (!theme) {
      theme = await ThemeConfig.create({ ...DEFAULTS, ...body });
    } else {
      for (const f of THEME_FIELDS) {
        if (body[f] !== undefined) theme[f] = body[f];
      }
      if (body.footerLogoUrl !== undefined) {
        theme.footerLogoUrl = typeof body.footerLogoUrl === "string" ? body.footerLogoUrl : String(body.footerLogoUrl || "");
        theme.markModified("footerLogoUrl");
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

      // Force-persist footerLogoUrl via direct update (ensures DB write)
      if (body.footerLogoUrl !== undefined) {
        await ThemeConfig.updateOne(
          {},
          { $set: { footerLogoUrl: typeof body.footerLogoUrl === "string" ? body.footerLogoUrl : String(body.footerLogoUrl || "") } }
        );
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
    const saved = await ThemeConfig.findOne().lean();
    return NextResponse.json(normalizeTheme(saved));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
