import { connectDB } from "@/lib/db";
import ThemeConfig from "@/models/ThemeConfig";
import Menu from "@/models/Menu";
import Component from "@/models/Component";
import SiteComponentMeta from "@/models/SiteComponentMeta";
import { getRegistryIdsFromDisk } from "@/lib/getRegistryIdsFromDisk";
import { normalizeThemeColorCollections } from "@/lib/themeColorFallbacks";
import { filterGlobalComponentIdsForPath } from "@/lib/routeComponentRules";

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
  pageLoaderBgColor: "#000000",
  pageLoaderBarColor: "#CF372F",
  pageLoaderMinDuration: 400,
  googleFonts: [],
  customFontUrl: "",
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
const FOOTER_COMPONENT_OVERRIDE_KEYS = new Set([
  "footerLogoUrl",
  "footerAddress",
  "footerEmail",
  "footerPhone",
  "footerCol1Links",
  "footerCol2Links",
  "footerSocialLinks",
  "footerCopyrightText",
  "footerBgColorKey",
  "footerBackgroundImageUrl",
  "footerTextColorKey",
  "footerCopyrightBarColorKey",
  "footerColumnsCount",
  "footerLayoutStyle",
  "footerSocialIcons",
]);

function pickPreferredComponentDocs(components, { preferLayout = false } = {}) {
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

    if (preferLayout) {
      const existingHasLayout =
        Array.isArray(existing?.layout) && existing.layout.length > 0;
      const currentHasLayout =
        Array.isArray(component?.layout) && component.layout.length > 0;
      if (currentHasLayout && !existingHasLayout) {
        byBase.set(baseComponent, component);
        continue;
      }
      if (!currentHasLayout && existingHasLayout) {
        continue;
      }
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

function shouldMergeComponentProp(baseComponent, key) {
  if (!THEME_CONFIG_OWNED_KEYS.has(key)) return true;
  if (baseComponent === "Header") {
    return HEADER_COMPONENT_OVERRIDE_KEYS.has(key);
  }
  if (baseComponent === "Footer") {
    return FOOTER_COMPONENT_OVERRIDE_KEYS.has(key);
  }
  return false;
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
    const [themeDoc, headerFooterDocs] = await Promise.all([
      ThemeConfig.findOne(THEME_QUERY).sort({ updatedAt: -1 }).lean(),
      Component.find({ baseComponent: { $in: ["Header", "Footer"] } }).lean(),
    ]);
    const preferredByBase = pickPreferredComponentDocs(headerFooterDocs);
    const headerComp = preferredByBase.get("Header");
    const footerComp = preferredByBase.get("Footer");
    const theme = normalizeThemeColorCollections(
      themeDoc ? { ...THEME_DEFAULTS, ...themeDoc } : { ...THEME_DEFAULTS },
    );
    if (
      headerComp?.defaultProps &&
      typeof headerComp.defaultProps === "object"
    ) {
      for (const [key, value] of Object.entries(headerComp.defaultProps)) {
        if (!shouldMergeComponentProp("Header", key)) continue;
        theme[key] = value;
      }
    }
    if (
      footerComp?.defaultProps &&
      typeof footerComp.defaultProps === "object"
    ) {
      for (const [key, value] of Object.entries(footerComp.defaultProps)) {
        if (!shouldMergeComponentProp("Footer", key)) continue;
        theme[key] = value;
      }
    }
    if (theme.logoImageUrl && !theme.logoLightUrl)
      theme.logoLightUrl = theme.logoImageUrl;
    if (theme.fontFamily && !theme.bodyFont) theme.bodyFont = theme.fontFamily;
    if (theme.headingFontFamily && !theme.headingFont)
      theme.headingFont = theme.headingFontFamily;
    if (theme.fontSize != null && theme.baseFontSize == null)
      theme.baseFontSize = theme.fontSize;
    return JSON.parse(JSON.stringify(theme));
  } catch {
    return normalizeThemeColorCollections({ ...THEME_DEFAULTS });
  }
}

async function getLayoutData(pathname) {
  const isAdminRoute = pathname?.startsWith("/admin");
  try {
    await connectDB();
    const [themeDoc, footerMenu, allSiteComponents, globalMetas] =
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
      ]);
    const pickBest = (list, base) => {
      if (!Array.isArray(list) || list.length === 0) return null;
      const filtered = list.filter((c) => c.baseComponent === base);
      if (filtered.length === 0) return null;
      return filtered.sort((a, b) => {
        const aHas = Array.isArray(a.layout) && a.layout.length > 0;
        const bHas = Array.isArray(b.layout) && b.layout.length > 0;
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      })[0];
    };
    const preferredSiteComponentsForProps = Array.from(
      pickPreferredComponentDocs(allSiteComponents).values(),
    );
    const preferredSiteComponentsForLayout = Array.from(
      pickPreferredComponentDocs(allSiteComponents, { preferLayout: true }).values(),
    );
    const headerComponent = pickBest(preferredSiteComponentsForLayout, "Header");
    const footerComponent = pickBest(preferredSiteComponentsForLayout, "Footer");
    const theme = themeDoc
      ? { ...THEME_DEFAULTS, ...themeDoc }
      : { ...THEME_DEFAULTS };
    if (Array.isArray(preferredSiteComponentsForProps)) {
      for (const c of preferredSiteComponentsForProps) {
        if (c.defaultProps && typeof c.defaultProps === "object") {
          for (const [key, value] of Object.entries(c.defaultProps)) {
            if (!shouldMergeComponentProp(c.baseComponent, key)) continue;
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
    if (theme.fontFamily && !theme.bodyFont) theme.bodyFont = theme.fontFamily;
    if (theme.headingFontFamily && !theme.headingFont)
      theme.headingFont = theme.headingFontFamily;
    if (theme.fontSize != null && theme.baseFontSize == null)
      theme.baseFontSize = theme.fontSize;
    const normalizedTheme = normalizeThemeColorCollections(theme);
    const rawHeaderLayout =
      headerComponent?.layout &&
      Array.isArray(headerComponent.layout) &&
      headerComponent.layout.length > 0
        ? headerComponent.layout
        : null;
    const headerBlock = rawHeaderLayout?.find(
      (b) => b?.baseComponent === "Header",
    );
    const headerMenuName =
      (headerBlock?.props?.menuName &&
        String(headerBlock.props.menuName).trim()) ||
      null;
    let headerMenuForBlock = null;
    if (!isAdminRoute) {
      const nameToFetch = headerMenuName || "Header Menu";
      headerMenuForBlock = await Menu.findOne({ name: nameToFetch }).lean();
      if (!headerMenuForBlock && nameToFetch !== "header") {
        headerMenuForBlock = await Menu.findOne({ name: "header" }).lean();
      }
      if (!headerMenuForBlock) {
        headerMenuForBlock = await Menu.findOne()
          .sort({ updatedAt: -1 })
          .lean();
      }
    }
    const freshNavItems = headerMenuForBlock?.items?.length
      ? menuItemsToNavItems(headerMenuForBlock.items)
      : null;
    const headerLayout = rawHeaderLayout
      ? rawHeaderLayout.map((block) => {
          const base = block?.baseComponent || "Paragraph";
          const props =
            block?.props && typeof block.props === "object"
              ? { ...block.props }
              : {};
          if (base === "Header" && Array.isArray(freshNavItems))
            props.navItems = freshNavItems;
          return {
            ...(typeof block === "object" && block !== null ? block : {}),
            baseComponent: base,
            props,
          };
        })
      : null;
    const headerItems = headerMenuForBlock?.items?.length
      ? menuItemsToNavItems(headerMenuForBlock.items)
      : [];
    const rawFooterLayout =
      footerComponent?.layout &&
      Array.isArray(footerComponent.layout) &&
      footerComponent.layout.length > 0
        ? footerComponent.layout
        : null;
    const footerLayout = rawFooterLayout
      ? rawFooterLayout.map((block) => ({
          ...(typeof block === "object" && block !== null ? block : {}),
          baseComponent: block?.baseComponent || "Footer",
          props:
            block?.props && typeof block.props === "object"
              ? { ...block.props }
              : {},
        }))
      : null;
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
      customHeaderLayout: headerLayout,
      customFooterLayout: footerLayout,
      globalBefore,
      globalAfter,
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
    };
  }
}

export { getTheme, getLayoutData, THEME_DEFAULTS, menuItemsToNavItems };
