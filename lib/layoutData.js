import { connectDB } from "@/lib/db";
import ThemeConfig from "@/models/ThemeConfig";
import Menu from "@/models/Menu";
import Component from "@/models/Component";
import SiteComponentMeta from "@/models/SiteComponentMeta";
import { SITE_COMPONENT_IDS } from "@/lib/siteComponentRegistry";

const THEME_PALETTE_DEFAULTS = {};

const THEME_DEFAULTS = {
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
  themePalette: THEME_PALETTE_DEFAULTS,
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
  googleFonts: [],
  customFontUrl: "",
};

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

async function getTheme() {
  try {
    await connectDB();
    const themeDoc = await ThemeConfig.findOne().lean();
    const theme = themeDoc ? { ...THEME_DEFAULTS, ...themeDoc } : { ...THEME_DEFAULTS };
    if (theme.logoImageUrl && !theme.logoLightUrl) theme.logoLightUrl = theme.logoImageUrl;
    if (theme.fontFamily && !theme.bodyFont) theme.bodyFont = theme.fontFamily;
    if (theme.headingFontFamily && !theme.headingFont) theme.headingFont = theme.headingFontFamily;
    if (theme.fontSize != null && theme.baseFontSize == null) theme.baseFontSize = theme.fontSize;
    const storedPalette = theme.themePalette && typeof theme.themePalette === "object" ? theme.themePalette : {};
    theme.themePalette = Object.keys(storedPalette).length > 0 ? { ...storedPalette } : { ...THEME_PALETTE_DEFAULTS };
    return JSON.parse(JSON.stringify(theme));
  } catch {
    return { ...THEME_DEFAULTS };
  }
}

async function getLayoutData(pathname) {
  const isAdminRoute = pathname?.startsWith("/admin");
  try {
    await connectDB();
    const [themeDoc, footerMenu, headerComponents, footerComponents, globalMetas] = await Promise.all([
      ThemeConfig.findOne().lean(),
      isAdminRoute ? null : Menu.findOne({ name: "footer" }).lean(),
      isAdminRoute ? null : Component.find({ baseComponent: "Header" }).lean(),
      isAdminRoute ? null : Component.find({ baseComponent: "Footer" }).lean(),
      isAdminRoute ? [] : SiteComponentMeta.find({ componentId: { $in: SITE_COMPONENT_IDS }, global: true }).sort({ position: 1, order: 1 }).lean(),
    ]);
    const headerComponent = !headerComponents?.length
      ? null
      : headerComponents.sort((a, b) => {
          const aHas = Array.isArray(a.layout) && a.layout.length > 0;
          const bHas = Array.isArray(b.layout) && b.layout.length > 0;
          if (aHas && !bHas) return -1;
          if (!aHas && bHas) return 1;
          return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        })[0];
    const footerComponent = !footerComponents?.length
      ? null
      : footerComponents.sort((a, b) => {
          const aHas = Array.isArray(a.layout) && a.layout.length > 0;
          const bHas = Array.isArray(b.layout) && b.layout.length > 0;
          if (aHas && !bHas) return -1;
          if (!aHas && bHas) return 1;
          return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        })[0];
    const theme = themeDoc ? { ...THEME_DEFAULTS, ...themeDoc } : { ...THEME_DEFAULTS };
    if (theme.logoImageUrl && !theme.logoLightUrl) theme.logoLightUrl = theme.logoImageUrl;
    if (theme.fontFamily && !theme.bodyFont) theme.bodyFont = theme.fontFamily;
    if (theme.headingFontFamily && !theme.headingFont) theme.headingFont = theme.headingFontFamily;
    if (theme.fontSize != null && theme.baseFontSize == null) theme.baseFontSize = theme.fontSize;
    const storedPalette = theme.themePalette && typeof theme.themePalette === "object" ? theme.themePalette : {};
    theme.themePalette = Object.keys(storedPalette).length > 0 ? { ...storedPalette } : { ...THEME_PALETTE_DEFAULTS };
    const rawHeaderLayout =
      headerComponent?.layout && Array.isArray(headerComponent.layout) && headerComponent.layout.length > 0 ? headerComponent.layout : null;
    const headerBlock = rawHeaderLayout?.find((b) => b?.baseComponent === "Header");
    const headerMenuName = (headerBlock?.props?.menuName && String(headerBlock.props.menuName).trim()) || null;
    let headerMenuForBlock = null;
    if (!isAdminRoute) {
      const nameToFetch = headerMenuName || "Header Menu";
      headerMenuForBlock = await Menu.findOne({ name: nameToFetch }).lean();
      if (!headerMenuForBlock && nameToFetch !== "header") {
        headerMenuForBlock = await Menu.findOne({ name: "header" }).lean();
      }
      if (!headerMenuForBlock) {
        headerMenuForBlock = await Menu.findOne().sort({ updatedAt: -1 }).lean();
      }
    }
    const freshNavItems = headerMenuForBlock?.items?.length ? menuItemsToNavItems(headerMenuForBlock.items) : null;
    const headerLayout = rawHeaderLayout
      ? rawHeaderLayout.map((block) => {
          const base = block?.baseComponent || "Paragraph";
          const props = block?.props && typeof block.props === "object" ? { ...block.props } : {};
          if (base === "Header" && Array.isArray(freshNavItems)) props.navItems = freshNavItems;
          return {
            ...(typeof block === "object" && block !== null ? block : {}),
            baseComponent: base,
            props,
          };
        })
      : null;
    const headerItems = headerMenuForBlock?.items?.length ? menuItemsToNavItems(headerMenuForBlock.items) : [];
    const rawFooterLayout =
      footerComponent?.layout && Array.isArray(footerComponent.layout) && footerComponent.layout.length > 0 ? footerComponent.layout : null;
    const footerLayout = rawFooterLayout
      ? rawFooterLayout.map((block) => ({
          ...(typeof block === "object" && block !== null ? block : {}),
          baseComponent: block?.baseComponent || "Footer",
          props: block?.props && typeof block.props === "object" ? { ...block.props } : {},
        }))
      : null;
    const globalBefore = (globalMetas || []).filter((m) => m.position === "before").map((m) => m.componentId);
    const globalAfter = (globalMetas || []).filter((m) => m.position === "after").map((m) => m.componentId);

    return {
      theme: JSON.parse(JSON.stringify(theme)),
      headerItems,
      footerItems: footerMenu?.items ? JSON.parse(JSON.stringify(footerMenu.items)) : [],
      customHeaderLayout: headerLayout,
      customFooterLayout: footerLayout,
      globalBefore,
      globalAfter,
    };
  } catch {
    return {
      theme: THEME_DEFAULTS,
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
