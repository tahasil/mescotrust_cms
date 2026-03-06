/**
 * Header edit drawer schemas – used by Header/EditForm.js (component + PageBuilder).
 * Keeps drawer content in the component so PageBuilder does not need manual Header drawer code.
 */

export const NAVBAR_SCHEMA = [
  { key: "navbarExpand", type: "select", label: "Expand (responsive breakpoint)", options: [{ value: "lg", label: "lg (collapse below 992px)" }, { value: "md", label: "md (collapse below 768px)" }, { value: "sm", label: "sm (collapse below 576px)" }, { value: "xl", label: "xl (collapse below 1200px)" }, { value: "xxl", label: "xxl (collapse below 1400px)" }, { value: "false", label: "Never expand" }] },
  { key: "navbarFixed", type: "select", label: "Fixed position", options: [{ value: "", label: "None" }, { value: "top", label: "Fixed to top" }, { value: "bottom", label: "Fixed to bottom" }] },
  { key: "navbarSticky", type: "select", label: "Sticky position", options: [{ value: "", label: "None" }, { value: "top", label: "Sticky top" }, { value: "bottom", label: "Sticky bottom" }] },
  { key: "collapseOnSelect", type: "boolean", label: "Collapse when link selected", default: false },
  { key: "navbarMobileMenu", type: "select", label: "Mobile menu style", options: [{ value: "collapse", label: "Collapse (dropdown below)" }, { value: "offcanvas", label: "Offcanvas (overlay drawer)" }] },
  { key: "navbarOffcanvasPlacement", type: "select", label: "Offcanvas slide from", options: [{ value: "end", label: "Right (end)" }, { value: "start", label: "Left (start)" }] },
];

export const LOGO_RESPONSIVE_SCHEMA = [
  { key: "logoImageWidthDesktop", type: "number", label: "Logo width – desktop (px)" },
  { key: "logoImageHeightDesktop", type: "number", label: "Logo height – desktop (px)" },
  { key: "logoImageWidthTablet", type: "number", label: "Logo width – tablet (px)" },
  { key: "logoImageHeightTablet", type: "number", label: "Logo height – tablet (px)" },
  { key: "logoImageWidthMobile", type: "number", label: "Logo width – mobile (px)" },
  { key: "logoImageHeightMobile", type: "number", label: "Logo height – mobile (px)" },
];

export const MENU_SCHEMA = [
  { key: "menuPosition", type: "select", label: "Menu position (desktop)", options: [{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }] },
  { key: "navColor", type: "color", label: "Nav link color" },
  { key: "navFontSize", type: "number", label: "Nav font size (px)" },
  { key: "navFontWeight", type: "select", label: "Nav font weight", options: [{ value: "400", label: "400 (Normal)" }, { value: "500", label: "500 (Medium)" }, { value: "600", label: "600 (Semi-bold)" }, { value: "700", label: "700 (Bold)" }] },
  { key: "navHoverColor", type: "color", label: "Nav hover color" },
  { key: "navItemBackground", type: "color", label: "Nav item background" },
  { key: "navItemHoverBackground", type: "color", label: "Nav item hover background" },
];

export const HEADER_FIELD_GROUPS = [
  { label: "Logo and link", keys: ["logoImage", "logoImageWidth", "logoImageHeight", "logoImageWidthDesktop", "logoImageHeightDesktop", "logoImageWidthTablet", "logoImageHeightTablet", "logoImageWidthMobile", "logoImageHeightMobile", "logoTitle", "logoTagline", "logoUrl", "logoColor", "logoFontSize", "taglineFontSize", "sectionsOrder"] },
  { label: "Menu", keys: ["menuPosition", "navColor", "navFontSize", "navFontWeight", "navHoverColor", "navItemBackground", "navItemHoverBackground"] },
  { label: "Navbar (Bootstrap)", keys: ["navbarExpand", "navbarFixed", "navbarSticky", "collapseOnSelect", "navbarMobileMenu", "navbarOffcanvasPlacement"] },
  { label: "Custom buttons", keys: ["actionButtons"] },
];

export const SECTION_SETTINGS_SCHEMA = [
  { key: "_containerType", type: "select", label: "Container", options: [{ value: "container", label: "Container (max-width)" }, { value: "container-fluid", label: "Container fluid (full width)" }] },
  { key: "_sectionBg", type: "color", label: "Background" },
  { key: "_sectionPadding", type: "text", label: "Padding (e.g. 2rem 1rem)" },
  { key: "_sectionBorderSize", type: "text", label: "Border size" },
  { key: "_sectionBorderStyle", type: "select", label: "Border type", options: [{ value: "solid", label: "Solid" }, { value: "dashed", label: "Dashed" }] },
  { key: "_sectionBorderColor", type: "color", label: "Border color" },
  { key: "_sectionShadow", type: "text", label: "Box shadow (CSS)" },
];
