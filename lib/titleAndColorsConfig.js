/**
 * Per-component config for the shared "Title & Colors" accordion.
 * Same UI structure everywhere; fields are component-specific.
 * Used by TitleAndColorsSection and for default props when creating new components.
 */

const LIST_HEADER_STYLE = { fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" };

/** titleListItems: { type: "input"|"switch", name, label, tooltip, rules?, placeholder? }[] */
/** colorListItems: { name, label, tooltip }[] */
export const TITLE_AND_COLORS_CONFIG = {
  Testimonials: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "titleText", type: "input", name: "testimonialsTitle", label: "Title", tooltip: "Section heading text", rules: [{ required: true, message: "Main title is required" }], placeholder: "e.g. Testimonials" },
      { key: "titleEnabled", type: "switch", name: "testimonialsTitleEnabled", label: "Enable", tooltip: "Show or hide the section title" },
    ],
    colorListItems: [
      { name: "testimonialsTitleColorKey", label: "Main Title", tooltip: "Theme color for the section title" },
      { name: "testimonialsNameColorKey", label: "Name", tooltip: "Theme color for testimonial name" },
      { name: "testimonialsRoleColorKey", label: "Role / Title", tooltip: "Theme color for role or title under name" },
      { name: "testimonialsRatingColorKey", label: "Rating (stars)", tooltip: "Theme color for star rating" },
    ],
  },
  HomeHero: {
    titleListHeader: "Main Title",
    titleListItems: [],
    colorListItems: [
      { name: "homeHeroSliderTitleColorKey", label: "Slider title", tooltip: "Theme color for slide title" },
      { name: "homeHeroSliderDescColorKey", label: "Slider description", tooltip: "Theme color for slide description" },
      { name: "homeHeroSliderButtonBgColorKey", label: "Button background", tooltip: "Theme color for button background" },
      { name: "homeHeroSliderButtonTextColorKey", label: "Button text", tooltip: "Theme color for button text" },
    ],
  },
  Subscribe: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "subtitle", type: "input", name: "subscribeSubtitle", label: "Subtitle", tooltip: "Small text above title", placeholder: "e.g. Latest News" },
      { key: "title", type: "input", name: "subscribeTitle", label: "Title", tooltip: "Main heading", placeholder: "e.g. To get weekly updates" },
    ],
    colorListItems: [
      { name: "subscribeSubtitleColorKey", label: "Subtitle", tooltip: "Theme color for subtitle" },
      { name: "subscribeTitleColorKey", label: "Title", tooltip: "Theme color for title" },
      { name: "subscribeButtonBgColorKey", label: "Button background", tooltip: "Theme color for button" },
      { name: "subscribeButtonTextColorKey", label: "Button text", tooltip: "Theme color for button text" },
    ],
  },
  LatestEvents1: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "subtitle", type: "input", name: "latestEvents1SubTitle", label: "Subtitle", tooltip: "Small heading", placeholder: "e.g. Latest News" },
      { key: "mainTitle", type: "input", name: "latestEvents1MainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Stay Informed. Stay Ahead." },
    ],
    colorListItems: [
      { name: "latestEvents1SubTitleColorKey", label: "Subtitle", tooltip: "Theme color for subtitle" },
      { name: "latestEvents1MainTitleColorKey", label: "Main title", tooltip: "Theme color for main title" },
      { name: "latestEvents1ButtonColorKey", label: "Button", tooltip: "Theme color for Read Post button" },
    ],
  },
  Marquee: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "title", type: "input", name: "marqueeTitle", label: "Section title", tooltip: "Heading for marquee section", placeholder: "e.g. Our CSR Partners | Awards & Recognition" },
    ],
    colorListItems: [
      { name: "marqueeTitleColorKey", label: "Section title", tooltip: "Theme color for the section heading" },
    ],
  },
  Header: {
    titleListHeader: "Main Title",
    titleListItems: [],
    colorListItems: [
      { name: "headerCtaBgColorKey", label: "CTA background", tooltip: "Theme color for CTA button background" },
      { name: "headerCtaTextColorKey", label: "CTA text", tooltip: "Theme color for CTA button text" },
      { name: "headerDonateBgColorKey", label: "Donate background", tooltip: "Theme color for Donate button background" },
      { name: "headerDonateTextColorKey", label: "Donate text", tooltip: "Theme color for Donate button text" },
    ],
  },
  Footer: {
    titleListHeader: "Main Title",
    titleListItems: [],
    colorListItems: [
      { name: "footerBgColorKey", label: "Background", tooltip: "Theme color for footer background" },
      { name: "footerTextColorKey", label: "Text & links", tooltip: "Theme color for text and links" },
      { name: "footerCopyrightBarColorKey", label: "Copyright bar", tooltip: "Theme color for copyright bar" },
    ],
  },
  AwardsRecognition: {
    titleListHeader: "Content",
    titleListItems: [],
    colorListItems: [
      { name: "awardsRecognitionCardTitleColorKey", label: "Card title", tooltip: "Theme color for card title text (default when not set per card)" },
      { name: "awardsRecognitionCardBorderColorKey", label: "Card border", tooltip: "Theme color for card border" },
      { name: "awardsRecognitionButtonColorKey", label: "Button / link", tooltip: "Theme color for button text and icon" },
      { name: "awardsRecognitionHoverColorKey", label: "Card hover overlay", tooltip: "Theme color for hover overlay and border (shows over card background image)" },
    ],
  },
};

/** Default Title & Colors for new/dynamic components (mainTitle, subTitle, titleColorKey). */
function getDefaultTitleAndColorsConfig() {
  return {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "Section Title" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Subheading", placeholder: "Subtitle" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for section title" },
    ],
  };
}

export function getTitleAndColorsConfig(componentId) {
  return TITLE_AND_COLORS_CONFIG[componentId] || getDefaultTitleAndColorsConfig();
}

/** Default form/API props for title & color fields when creating a new component (so Title & Colors section is present). */
export function getDefaultTitleAndColorsProps(componentId) {
  const config = getTitleAndColorsConfig(componentId);
  const out = {};
  config.titleListItems.forEach((item) => {
    if (item.type === "input") out[item.name] = "";
    if (item.type === "switch") out[item.name] = true;
  });
  config.colorListItems.forEach((item) => {
    out[item.name] = "";
  });
  return out;
}

export { LIST_HEADER_STYLE };
