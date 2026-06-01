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
  { key: "headerSearchEnabled", type: "boolean", label: "Show search button" },
  { key: "headerSearchLabel", type: "text", label: "Search button label" },
  { key: "headerSearchOpenAriaLabel", type: "text", label: "Search button aria-label" },
  { key: "headerSearchPlaceholder", type: "text", label: "Search input placeholder" },
  { key: "headerSearchDialogLabel", type: "text", label: "Search dialog label" },
  { key: "headerSearchInputAriaLabel", type: "text", label: "Search input aria-label" },
  { key: "headerSearchCloseAriaLabel", type: "text", label: "Search close aria-label" },
  { key: "headerSearchMinCharsMessage", type: "text", label: "Search min-characters message" },
  { key: "headerSearchLoadingMessage", type: "text", label: "Search loading message" },
  { key: "headerSearchNoResultsMessage", type: "text", label: "Search no-results message (use {query})" },
  { key: "headerSearchErrorMessage", type: "text", label: "Search error message" },
  { key: "headerSearchResultTypePageLabel", type: "text", label: "Result label: Page" },
  { key: "headerSearchResultTypeBlogLabel", type: "text", label: "Result label: Blog" },
  { key: "headerSearchResultTypeEventLabel", type: "text", label: "Result label: Event" },
  { key: "headerSearchFallbackTitle", type: "text", label: "Fallback result title" },
  { key: "headerSearchFallbackMeta", type: "text", label: "Fallback result meta text" },
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
  { key: "volunteerModalSuccessTitle", type: "text", label: "Success notification title" },
  { key: "volunteerModalSuccessDescription", type: "text", label: "Success notification text" },
  { key: "volunteerModalErrorTitle", type: "text", label: "Error notification title" },
  { key: "volunteerModalNameLabel", type: "text", label: "Name field label" },
  { key: "volunteerModalEmailLabel", type: "text", label: "Email field label" },
  { key: "volunteerModalSubjectLabel", type: "text", label: "Subject field label" },
  { key: "volunteerModalMessageLabel", type: "text", label: "Message field label" },
  { key: "volunteerModalNamePlaceholder", type: "text", label: "Name placeholder" },
  { key: "volunteerModalEmailPlaceholder", type: "text", label: "Email placeholder" },
  { key: "volunteerModalSubjectPlaceholder", type: "text", label: "Subject placeholder" },
  { key: "volunteerModalMessagePlaceholder", type: "text", label: "Message placeholder" },
  { key: "volunteerModalCancelLabel", type: "text", label: "Cancel button label" },
  { key: "volunteerModalSendLabel", type: "text", label: "Send button label" },
  { key: "volunteerModalSendingLabel", type: "text", label: "Sending button label" },
  { key: "volunteerModalNameRequiredMessage", type: "text", label: "Name required message" },
  { key: "volunteerModalEmailRequiredMessage", type: "text", label: "Email required message" },
  { key: "volunteerModalEmailInvalidMessage", type: "text", label: "Email invalid message" },
  { key: "volunteerModalSubjectRequiredMessage", type: "text", label: "Subject required message" },
  { key: "volunteerModalSubjectMinMessage", type: "text", label: "Subject min-length message" },
  { key: "volunteerModalMessageRequiredMessage", type: "text", label: "Message required message" },
  { key: "volunteerModalMessageMinMessage", type: "text", label: "Message min-length message" },
  { key: "volunteerModalBtnBg", type: "themeColorOnly", label: "Send button background" },
  { key: "volunteerModalBtnText", type: "themeColorOnly", label: "Send button text color" },
  { key: "volunteerModalCancelColor", type: "themeColorOnly", label: "Cancel button color" },
];

export const HEADER_FIELD_GROUPS = [
  { label: "Logo and link", keys: ["logoType", "logoLightUrl", "logoMobileUrl", "logoDarkUrl", "logoTitle", "logoTagline", "logoUrl", "logoColor", "logoFontSize", "taglineFontSize", "sectionsOrder"] },
  { label: "Menu", keys: ["menuPosition", "navColor", "navFontSize", "navFontWeight", "navHoverColor", "navItemBackground", "navItemHoverBackground"] },
  { label: "Navbar (Bootstrap)", keys: ["navbarExpand", "navbarFixed", "navbarSticky", "collapseOnSelect", "navbarMobileMenu", "navbarOffcanvasPlacement"] },
  { label: "Custom buttons", keys: ["headerSearchEnabled", "headerSearchLabel", "headerSearchOpenAriaLabel", "headerSearchPlaceholder", "headerSearchDialogLabel", "headerSearchInputAriaLabel", "headerSearchCloseAriaLabel", "headerSearchMinCharsMessage", "headerSearchLoadingMessage", "headerSearchNoResultsMessage", "headerSearchErrorMessage", "headerSearchResultTypePageLabel", "headerSearchResultTypeBlogLabel", "headerSearchResultTypeEventLabel", "headerSearchFallbackTitle", "headerSearchFallbackMeta", "headerVolunteerLabel", "headerVolunteerHref", "headerVolunteerIconUrl", "headerVolunteerIconUrlMobile", "headerDonateLabel", "headerDonateHref", "headerDonateIconUrl", "headerDonateIconUrlMobile"] },
  { label: "Volunteer modal", keys: ["volunteerModalTitle", "volunteerModalSuccessTitle", "volunteerModalSuccessDescription", "volunteerModalErrorTitle", "volunteerModalNameLabel", "volunteerModalEmailLabel", "volunteerModalSubjectLabel", "volunteerModalMessageLabel", "volunteerModalNamePlaceholder", "volunteerModalEmailPlaceholder", "volunteerModalSubjectPlaceholder", "volunteerModalMessagePlaceholder", "volunteerModalCancelLabel", "volunteerModalSendLabel", "volunteerModalSendingLabel", "volunteerModalNameRequiredMessage", "volunteerModalEmailRequiredMessage", "volunteerModalEmailInvalidMessage", "volunteerModalSubjectRequiredMessage", "volunteerModalSubjectMinMessage", "volunteerModalMessageRequiredMessage", "volunteerModalMessageMinMessage", "volunteerModalBtnBg", "volunteerModalBtnText", "volunteerModalCancelColor"] },
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
