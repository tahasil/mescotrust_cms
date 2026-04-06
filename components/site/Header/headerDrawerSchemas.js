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

/** Logo image URLs and type – editable in Header drawer. */
export const LOGO_LINK_SCHEMA = [
  { key: "logoType", type: "select", label: "Logo type", options: [{ value: "text", label: "Text" }, { value: "image", label: "Image" }] },
  { key: "logoLightUrl", type: "image", label: "Logo image URL (desktop/light)" },
  { key: "logoMobileUrl", type: "image", label: "Logo image URL (mobile)" },
  { key: "logoDarkUrl", type: "image", label: "Logo image URL (dark mode)" },
];

export const MENU_SCHEMA = [
  { key: "menuPosition", type: "select", label: "Menu position (desktop)", options: [{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }] },
  { key: "navColor", type: "themeColorOnly", label: "Nav link color" },
  { key: "navFontSize", type: "number", label: "Nav font size (px)" },
  { key: "navFontWeight", type: "select", label: "Nav font weight", options: [{ value: "400", label: "400 (Normal)" }, { value: "500", label: "500 (Medium)" }, { value: "600", label: "600 (Semi-bold)" }, { value: "700", label: "700 (Bold)" }] },
  { key: "navHoverColor", type: "themeColorOnly", label: "Nav hover color" },
  { key: "navItemBackground", type: "themeColorOnly", label: "Nav item background" },
  { key: "navItemHoverBackground", type: "themeColorOnly", label: "Nav item hover background" },
];

/** Volunteer & Donate button labels, links, icons and styles – editable in Header drawer. */
export const CUSTOM_BUTTONS_SCHEMA = [
  { key: "headerVolunteerLabel", type: "text", label: "Volunteer button label" },
  { key: "headerVolunteerHref", type: "url", label: "Volunteer button link" },
  { key: "headerVolunteerIconUrl", type: "image", label: "Volunteer icon URL (desktop)" },
  { key: "headerVolunteerIconUrlMobile", type: "image", label: "Volunteer icon URL (mobile)" },
  { key: "headerDonateLabel", type: "text", label: "Donate button label" },
  { key: "headerDonateHref", type: "url", label: "Donate button link" },
  { key: "headerDonateIconUrl", type: "image", label: "Donate icon URL (desktop)" },
  { key: "headerDonateIconUrlMobile", type: "image", label: "Donate icon URL (mobile)" },
];

/** Volunteer modal – form that opens when clicking Volunteer button. */
export const VOLUNTEER_MODAL_SCHEMA = [
  { key: "volunteerModalTitle", type: "text", label: "Modal title" },
  { key: "volunteerModalBtnBg", type: "themeColorOnly", label: "Send button background" },
  { key: "volunteerModalBtnText", type: "themeColorOnly", label: "Send button text color" },
  { key: "volunteerModalCancelColor", type: "themeColorOnly", label: "Cancel button color" },
];

export const HEADER_FIELD_GROUPS = [
  { label: "Logo and link", keys: ["logoType", "logoLightUrl", "logoMobileUrl", "logoDarkUrl", "logoTitle", "logoTagline", "logoUrl", "logoColor", "logoFontSize", "taglineFontSize", "sectionsOrder"] },
  { label: "Menu", keys: ["menuPosition", "navColor", "navFontSize", "navFontWeight", "navHoverColor", "navItemBackground", "navItemHoverBackground"] },
  { label: "Navbar (Bootstrap)", keys: ["navbarExpand", "navbarFixed", "navbarSticky", "collapseOnSelect", "navbarMobileMenu", "navbarOffcanvasPlacement"] },
  { label: "Custom buttons", keys: ["headerVolunteerLabel", "headerVolunteerHref", "headerVolunteerIconUrl", "headerVolunteerIconUrlMobile", "headerDonateLabel", "headerDonateHref", "headerDonateIconUrl", "headerDonateIconUrlMobile"] },
  { label: "Volunteer modal", keys: ["volunteerModalTitle", "volunteerModalBtnBg", "volunteerModalBtnText", "volunteerModalCancelColor"] },
];

export const SECTION_SETTINGS_SCHEMA = [
  { key: "_containerType", type: "select", label: "Container", options: [{ value: "container", label: "Container (max-width)" }, { value: "container-fluid", label: "Container fluid (full width)" }] },
  { key: "_sectionBg", type: "themeColorOnly", label: "Background" },
  { key: "_sectionPadding", type: "text", label: "Padding (e.g. 2rem 1rem)" },
  { key: "_sectionBorderSize", type: "text", label: "Border size" },
  { key: "_sectionBorderStyle", type: "select", label: "Border type", options: [{ value: "solid", label: "Solid" }, { value: "dashed", label: "Dashed" }] },
  { key: "_sectionBorderColor", type: "themeColorOnly", label: "Border color" },
  { key: "_sectionShadow", type: "text", label: "Box shadow (CSS)" },
];
