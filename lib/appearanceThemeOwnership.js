const APPEARANCE_MANAGED_COMPONENTS = new Set([
  "Header",
  "Footer",
  "Subscribe",
  "Menu",
]);

const APPEARANCE_OWNED_NON_PREFIX_KEYS = new Set([
  "menuName",
  "menuPosition",
  "navItems",
  "navColor",
  "navFontSize",
  "navFontWeight",
  "navHoverColor",
  "navItemBackground",
  "navItemHoverBackground",
  "navbarExpand",
  "navbarFixed",
  "navbarSticky",
  "collapseOnSelect",
  "navbarMobileMenu",
  "navbarOffcanvasPlacement",
  "logoTitle",
  "logoTagline",
  "logoUrl",
  "logoColor",
  "logoFontSize",
  "taglineFontSize",
  "sectionsOrder",
  "volunteerModalTitle",
  "volunteerModalBtnBg",
  "volunteerModalBtnText",
  "volunteerModalCancelColor",
  "_disableFadeAnimation",
  "_containerType",
  "_sectionBg",
  "_sectionPadding",
  "_sectionBorderSize",
  "_sectionBorderStyle",
  "_sectionBorderColor",
  "_sectionShadow",
]);

export function isAppearanceManagedComponent(baseComponent) {
  return APPEARANCE_MANAGED_COMPONENTS.has(String(baseComponent || "").trim());
}

export function isAppearanceOwnedThemeKey(key) {
  const k = String(key || "").trim();
  if (!k) return false;
  if (APPEARANCE_OWNED_NON_PREFIX_KEYS.has(k)) return true;
  return (
    k.startsWith("header") ||
    k.startsWith("footer") ||
    k.startsWith("subscribe")
  );
}

