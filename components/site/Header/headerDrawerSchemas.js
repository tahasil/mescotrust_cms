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
  { key: "logoUrl", type: "url", label: "Logo click URL" },
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

/** Custom button settings shown in Header drawer. */
export const CUSTOM_BUTTONS_SCHEMA = [
  { key: "headerSearchEnabled", type: "boolean", label: "Show Search Button" },
  { key: "headerSearchLabel", type: "text", label: "Search Button Label" },
  { key: "headerSearchPlaceholder", type: "text", label: "Search Input Placeholder" },
  { key: "headerVolunteerHref", type: "url", label: "Volunteer Button Link" },
  {
    key: "headerVolunteerHrefTarget",
    type: "select",
    label: "Volunteer Button Target",
    options: [
      { value: "_self", label: "Same Tab" },
      { value: "_blank", label: "New Tab" },
    ],
  },
  { key: "headerVolunteerIconUrl", type: "image", label: "Volunteer Icon" },
  { key: "headerDonateIconUrl", type: "image", label: "Donate Icon" },
];

export const ANNOUNCEMENT_BAR_SCHEMA = [
  { key: "headerAnnouncementEnabled", type: "boolean", label: "Enable announcement bar" },
  {
    key: "headerAnnouncementItems",
    type: "json",
    label: "Announcement items",
    itemLabel: "Announcement",
    addButtonVariant: "circle",
    addButtonTitle: "Add Announcement",
    itemSchema: [
      { key: "text", type: "text", label: "Announcement text" },
      { key: "url", type: "url", label: "Link URL" },
      {
        key: "target",
        type: "select",
        label: "Link target",
        default: "_self",
        options: [
          { value: "_self", label: "Same Tab" },
          { value: "_blank", label: "New Tab" },
        ],
      },
    ],
  },
  { key: "headerAnnouncementFontSize", type: "number", label: "Font size (px)" },
  {
    key: "headerAnnouncementFontWeight",
    type: "select",
    label: "Font weight",
    options: [
      { value: "400", label: "400 (Normal)" },
      { value: "500", label: "500 (Medium)" },
      { value: "600", label: "600 (Semi-bold)" },
      { value: "700", label: "700 (Bold)" },
      { value: "800", label: "800 (Extra bold)" },
    ],
  },
  { key: "headerAnnouncementTextColor", type: "color", label: "Text color" },
  { key: "headerAnnouncementBackgroundColor", type: "color", label: "Background color" },
  { key: "headerAnnouncementMarqueeSpeed", type: "number", label: "Marquee speed (seconds)" },
  {
    key: "headerAnnouncementDirection",
    type: "select",
    label: "Marquee direction",
    default: "rtl",
    options: [
      { value: "rtl", label: "Right to Left" },
      { value: "ltr", label: "Left to Right" },
    ],
  },
  { key: "headerAnnouncementPaddingX", type: "number", label: "Left/right padding (px)" },
];

export const HEADER_FIELD_GROUPS = [
  { label: "Logo and link", keys: ["logoType", "logoLightUrl", "logoMobileUrl", "logoDarkUrl", "logoTitle", "logoTagline", "logoUrl", "logoColor", "logoFontSize", "taglineFontSize", "sectionsOrder"] },
  { label: "Menu", keys: ["menuPosition", "navColor", "navFontSize", "navFontWeight", "navHoverColor", "navItemBackground", "navItemHoverBackground"] },
  {
    label: "Announcement bar",
    keys: [
      "headerAnnouncementEnabled",
      "headerAnnouncementItems",
      "headerAnnouncementFontSize",
      "headerAnnouncementFontWeight",
      "headerAnnouncementTextColor",
      "headerAnnouncementBackgroundColor",
      "headerAnnouncementMarqueeSpeed",
      "headerAnnouncementDirection",
      "headerAnnouncementPaddingX",
    ],
  },
  { label: "Navbar (Bootstrap)", keys: ["navbarExpand", "navbarFixed", "navbarSticky", "collapseOnSelect", "navbarMobileMenu", "navbarOffcanvasPlacement"] },
  { label: "Custom buttons", keys: ["headerSearchEnabled", "headerSearchLabel", "headerSearchPlaceholder", "headerVolunteerHref", "headerVolunteerHrefTarget", "headerVolunteerIconUrl", "headerDonateIconUrl"] },
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
