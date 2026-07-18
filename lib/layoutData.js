import { connectDB } from "@/lib/db";
import ThemeConfig from "@/models/ThemeConfig";
import Menu from "@/models/Menu";
import Component from "@/models/Component";
import SiteComponentMeta from "@/models/SiteComponentMeta";
import { ensureAppearanceDocuments, serializeAppearanceDocument } from "@/lib/appearance";
import { getRegistryIdsFromDisk } from "@/lib/getRegistryIdsFromDisk";
import { normalizeThemeColorCollections } from "@/lib/themeColorFallbacks";
import { filterGlobalComponentIdsForPath } from "@/lib/routeComponentRules";
import { resolveYearPlaceholder } from "@/lib/yearPlaceholder";

const THEME_DEFAULTS = {
  siteTitle: "",
  tagline: "",
  logoType: "text",
  logoUrl: "",
  logoLightUrl: "",
  logoMobileUrl: "",
  logoDarkUrl: "",
  logoImageUrl: "",
  faviconUrl: "",
  footerCopyrightText: "",
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
  themePalette: {},
  bodyFont: "system-ui, sans-serif",
  headingFont: "",
  buttonFont: "",
  baseFontSize: 16,
  lineHeight: 1.6,
  letterSpacing: 0,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  buttonRadius: 6,
  cardRadius: 8,
  inputRadius: 6,
  cardShadow: true,
  buttonShadow: false,
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
  pageLoaderEnabled: true,
  pageLoaderBgColor: "#211E30",
  pageLoaderBarColor: "#E03C33",
  pageLoaderMinDuration: 400,
  googleFonts: [],
  customFontUrl: "",
  defaultMetaTitle: "",
  defaultMetaDescription: "",
  defaultMetaKeywords: "",
  defaultMetaImage: "",
};
const THEME_SCHEMA_KEYS = Object.keys(ThemeConfig?.schema?.paths || {}).filter(
  (key) =>
    key !== "_id" &&
    key !== "__v" &&
    key !== "createdAt" &&
    key !== "updatedAt",
);
const THEME_CONFIG_OWNED_KEYS = new Set([
  ...Object.keys(THEME_DEFAULTS),
  ...THEME_SCHEMA_KEYS,
]);
const RESERVED_MENU_NAMES = new Set(["header", "footer"]);

function isReservedMenuName(name) {
  return RESERVED_MENU_NAMES.has(String(name || "").trim().toLowerCase());
}
function pickPreferredComponentDocs(components) {
  const byBase = new Map();
  if (!Array.isArray(components)) return byBase;

  for (const component of components) {
    const baseComponent = String(component?.baseComponent || "").trim();
    if (!baseComponent) continue;

    const existing = byBase.get(baseComponent);
    if (!existing) {
      byBase.set(baseComponent, component);
      continue;
    }

    const existingUpdated = new Date(existing?.updatedAt || 0).getTime();
    const currentUpdated = new Date(component?.updatedAt || 0).getTime();
    if (currentUpdated > existingUpdated) {
      byBase.set(baseComponent, component);
      continue;
    }
    if (currentUpdated < existingUpdated) continue;

    const existingId = String(existing?._id || "");
    const currentId = String(component?._id || "");
    if (currentId > existingId) {
      byBase.set(baseComponent, component);
    }
  }

  return byBase;
}

function shouldMergeComponentProp(key) {
  return !THEME_CONFIG_OWNED_KEYS.has(key);
}

function menuItemsToNavItems(menuItems) {
  if (!Array.isArray(menuItems)) return [];
  return menuItems.map((it) => {
    const item = it && typeof it === "object" ? it : {};
    const url =
      typeof item.url === "string" && item.url
        ? item.url
        : item.type === "page" && item.pageSlug
          ? `/${String(item.pageSlug)}`
          : "#";
    const childList = Array.isArray(item.children) ? item.children : [];
    const children = menuItemsToNavItems(childList);
    const result = {
      label: String(item.label ?? ""),
      url,
      hasDropdown: children.length > 0,
      openInNewTab: !!item.openInNewTab,
    };
    if (children.length > 0) result.children = children;
    return result;
  });
}

const THEME_QUERY = {
  $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }],
};

async function getTheme() {
  try {
    await connectDB();
    const themeDoc = await ThemeConfig.findOne(THEME_QUERY)
      .sort({ updatedAt: -1 })
      .lean();
    const theme = normalizeThemeColorCollections(
      themeDoc ? { ...THEME_DEFAULTS, ...themeDoc } : { ...THEME_DEFAULTS },
    );
    if (theme.logoImageUrl && !theme.logoLightUrl)
      theme.logoLightUrl = theme.logoImageUrl;
    if (!theme.headerDonateIconUrl && theme.headerDonateIconUrlMobile) {
      theme.headerDonateIconUrl = theme.headerDonateIconUrlMobile;
    }
    delete theme.headerDonateIconUrlMobile;
    if (theme.fontFamily && !theme.bodyFont) theme.bodyFont = theme.fontFamily;
    if (theme.headingFontFamily && !theme.headingFont)
      theme.headingFont = theme.headingFontFamily;
    if (theme.fontSize != null && theme.baseFontSize == null)
      theme.baseFontSize = theme.fontSize;
    theme.footerCopyrightText = resolveYearPlaceholder(
      theme.footerCopyrightText,
    );
    return JSON.parse(JSON.stringify(theme));
  } catch {
    return normalizeThemeColorCollections({ ...THEME_DEFAULTS });
  }
}

async function getLayoutData(pathname) {
  const isAdminRoute = pathname?.startsWith("/admin");
  try {
    await connectDB();
    const [themeDoc, footerMenu, allSiteComponents, globalMetas, appearanceDocs] =
      await Promise.all([
        ThemeConfig.findOne(THEME_QUERY).sort({ updatedAt: -1 }).lean(),
        isAdminRoute ? null : Menu.findOne({ name: "footer" }).lean(),
        isAdminRoute
          ? null
          : Component.find({
              baseComponent: { $in: getRegistryIdsFromDisk() },
            }).lean(),
        isAdminRoute
          ? []
          : SiteComponentMeta.find({
              componentId: { $in: getRegistryIdsFromDisk() },
              global: true,
            })
              .sort({ position: 1, order: 1 })
              .lean(),
        isAdminRoute ? [] : ensureAppearanceDocuments(),
      ]);
    const appearanceByKey = new Map(
      (appearanceDocs || []).map((doc) => [doc?.moduleKey, doc]),
    );
    const appearanceHeader = appearanceByKey.get("header");
    const appearanceFooter = appearanceByKey.get("footer");
    const preferredSiteComponentsForProps = Array.from(
      pickPreferredComponentDocs(allSiteComponents).values(),
    );
    const theme = themeDoc
      ? { ...THEME_DEFAULTS, ...themeDoc }
      : { ...THEME_DEFAULTS };
    if (Array.isArray(preferredSiteComponentsForProps)) {
      for (const c of preferredSiteComponentsForProps) {
        if (c.defaultProps && typeof c.defaultProps === "object") {
          for (const [key, value] of Object.entries(c.defaultProps)) {
            if (!shouldMergeComponentProp(key)) continue;
            theme[key] = value;
          }
        }
      }
    }
    theme.footerLogoUrl =
      theme.footerLogoUrl != null ? String(theme.footerLogoUrl).trim() : "";
    theme.footerBackgroundImageUrl =
      theme.footerBackgroundImageUrl != null
        ? String(theme.footerBackgroundImageUrl).trim()
        : "";
    if (theme.logoImageUrl && !theme.logoLightUrl)
      theme.logoLightUrl = theme.logoImageUrl;
    if (!theme.headerDonateIconUrl && theme.headerDonateIconUrlMobile) {
      theme.headerDonateIconUrl = theme.headerDonateIconUrlMobile;
    }
    delete theme.headerDonateIconUrlMobile;
    if (theme.fontFamily && !theme.bodyFont) theme.bodyFont = theme.fontFamily;
    if (theme.headingFontFamily && !theme.headingFont)
      theme.headingFont = theme.headingFontFamily;
    if (theme.fontSize != null && theme.baseFontSize == null)
      theme.baseFontSize = theme.fontSize;
    theme.footerCopyrightText = resolveYearPlaceholder(
      theme.footerCopyrightText,
    );
    const normalizedTheme = normalizeThemeColorCollections(theme);
    const requestedHeaderMenuName = appearanceHeader
      ? String(appearanceHeader?.defaultProps?.menuName || "").trim() || null
      : null;
    const headerMenuName =
      requestedHeaderMenuName && !isReservedMenuName(requestedHeaderMenuName)
        ? requestedHeaderMenuName
        : null;
    let headerMenuForBlock = null;
    if (!isAdminRoute) {
      const nameToFetch = headerMenuName || "Primary Menu";
      headerMenuForBlock = await Menu.findOne({ name: nameToFetch }).lean();
      if (!headerMenuForBlock && nameToFetch !== "Header Menu") {
        headerMenuForBlock = await Menu.findOne({ name: "Header Menu" }).lean();
      }
      if (!headerMenuForBlock) {
        headerMenuForBlock = await Menu.findOne({
          name: { $nin: Array.from(RESERVED_MENU_NAMES) },
        })
          .sort({ updatedAt: -1 })
          .lean();
      }
      if (!headerMenuForBlock) {
        headerMenuForBlock = await Menu.findOne()
          .sort({ updatedAt: -1 })
          .lean();
      }
    }
    const headerItems = headerMenuForBlock?.items?.length
      ? menuItemsToNavItems(headerMenuForBlock.items)
      : [];
    const globalBeforeRaw = (globalMetas || [])
      .filter((m) => m.position === "before")
      .map((m) => m.componentId);
    const globalAfterRaw = (globalMetas || [])
      .filter((m) => m.position === "after")
      .map((m) => m.componentId);
    const globalBefore = filterGlobalComponentIdsForPath(
      globalBeforeRaw,
      pathname,
    );
    const globalAfter = filterGlobalComponentIdsForPath(globalAfterRaw, pathname);

    return {
      theme: JSON.parse(JSON.stringify(normalizedTheme)),
      headerItems,
      footerItems: footerMenu?.items
        ? JSON.parse(JSON.stringify(footerMenu.items))
        : [],
      customHeaderLayout: null,
      customFooterLayout: null,
      globalBefore,
      globalAfter,
      appearance: {
        header: serializeAppearanceDocument(appearanceHeader),
        footer: serializeAppearanceDocument(appearanceFooter),
      },
    };
  } catch {
    return {
      theme: normalizeThemeColorCollections(THEME_DEFAULTS),
      headerItems: [],
      footerItems: [],
      customHeaderLayout: null,
      customFooterLayout: null,
      globalBefore: [],
      globalAfter: [],
      appearance: { header: null, footer: null },
    };
  }
}

export { getTheme, getLayoutData, THEME_DEFAULTS, menuItemsToNavItems };
