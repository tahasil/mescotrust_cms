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
  HomeHero2: {
    titleListHeader: "Hero Title",
    titleListItems: [
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title (first line)", tooltip: "e.g. Because Every Learner", placeholder: "Because Every Learner" },
      { key: "mainTitleHighlight", type: "input", name: "mainTitleHighlight", label: "Highlight (second line, gradient)", tooltip: "e.g. Deserves Support", placeholder: "Deserves Support" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle / paragraph", tooltip: "Description below title", placeholder: "A community-powered initiative..." },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for title text" },
      { name: "homeHero2ButtonBgColorKey", label: "Button background", tooltip: "Theme color for CTA button background" },
      { name: "homeHero2ButtonTextColorKey", label: "Button text", tooltip: "Theme color for CTA button text" },
    ],
  },
  HelpingEvents: {
    titleListHeader: "Section Titles",
    titleListItems: [
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above main title", placeholder: "e.g. Events" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section main heading", placeholder: "e.g. Helping people live a better tomorrow!" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the main title" },
      { name: "helpingEventsButtonBgColorKey", label: "Button background", tooltip: "Theme color for button background" },
      { name: "helpingEventsButtonTextColorKey", label: "Button text", tooltip: "Theme color for button text" },
    ],
  },
  Notices: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Title", tooltip: "Section heading text", rules: [{ required: true, message: "Title is required" }], placeholder: "e.g. Important Notices" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the section title" },
    ],
  },
  WelcometoMESCO: {
    titleListHeader: "Content Titles",
    titleListItems: [
      { key: "welcomeLabel", type: "input", name: "welcomeLabel", label: "Welcome label", tooltip: "Small heading above main title", placeholder: "e.g. Welcome to MESCO" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section main heading", placeholder: "e.g. Helping people live better tomorrow" },
      { key: "highlightText", type: "input", name: "highlightText", label: "Highlight text", tooltip: "Colored subtitle below main title", placeholder: "e.g. We are the largest crowdfunding" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Main title", tooltip: "Theme color for the main title" },
      { name: "welcometoMESCOHighlightColorKey", label: "Highlight text", tooltip: "Theme color for the highlight subtitle" },
      { name: "welcometoMESCOButtonBgColorKey", label: "Button background", tooltip: "Theme color for button background" },
      { name: "welcometoMESCOButtonTextColorKey", label: "Button text", tooltip: "Theme color for button text" },
    ],
  },
  ImpactShowcase: {
    titleListHeader: "Buttons",
    titleListItems: [
      { key: "btn1Text", type: "input", name: "impactShowcaseButton1Text", label: "Button 1 text", tooltip: "Text for first button", placeholder: "e.g. Contact Us" },
      { key: "btn1Link", type: "input", name: "impactShowcaseButton1Link", label: "Button 1 link", tooltip: "URL for first button", placeholder: "e.g. /contact" },
      { key: "btn1Icon", type: "input", name: "impactShowcaseButton1IconUrl", label: "Button 1 icon URL", tooltip: "Optional icon image URL", placeholder: "/images/icon.svg" },
      { key: "btn2Text", type: "input", name: "impactShowcaseButton2Text", label: "Button 2 text", tooltip: "Text for second button", placeholder: "e.g. Volunteer" },
      { key: "btn2Link", type: "input", name: "impactShowcaseButton2Link", label: "Button 2 link", tooltip: "URL for second button", placeholder: "e.g. /volunteer" },
      { key: "btn2Icon", type: "input", name: "impactShowcaseButton2IconUrl", label: "Button 2 icon URL", tooltip: "Optional icon image URL", placeholder: "/images/volunteer-icon.svg" },
    ],
    colorListItems: [
      { name: "impactShowcaseButton1BgColorKey", label: "Button 1 background", tooltip: "Theme color for first button background" },
      { name: "impactShowcaseButton1TextColorKey", label: "Button 1 text", tooltip: "Theme color for first button text" },
      { name: "impactShowcaseButton2BgColorKey", label: "Button 2 background", tooltip: "Theme color for second button background" },
      { name: "impactShowcaseButton2TextColorKey", label: "Button 2 text", tooltip: "Theme color for second button text" },
    ],
  },
  AnimationsText: {
    titleListHeader: "Font Settings",
    titleListItems: [
      { key: "fontSize", type: "input", name: "animationsTextFontSize", label: "Font size (px)", tooltip: "Font size for the text", placeholder: "20" },
      { key: "lineHeight", type: "input", name: "animationsTextLineHeight", label: "Line height (px)", tooltip: "Line height for the text", placeholder: "34" },
      { key: "fontWeight", type: "input", name: "animationsTextFontWeight", label: "Font weight", tooltip: "Font weight (100–900)", placeholder: "500" },
      { key: "opacity", type: "input", name: "animationsTextOpacity", label: "Opacity", tooltip: "Text opacity (0–1)", placeholder: "1" },
    ],
    colorListItems: [
      { name: "animationsTextLightColorKey", label: "Light color (before)", tooltip: "Theme color for words before scroll reveal" },
      { name: "animationsTextDarkColorKey", label: "Dark color (after)", tooltip: "Theme color for words after scroll reveal" },
    ],
  },
  Registered: {
    titleListHeader: "Title",
    titleListItems: [
      { key: "mainTitle", type: "input", name: "registeredMainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Registered Under" },
    ],
    colorListItems: [
      { name: "registeredTitleColorKey", label: "Title color", tooltip: "Theme color for the title" },
    ],
  },
  Helpingpeople: {
    titleListHeader: "Title",
    titleListItems: [
      { key: "mainTitle", type: "input", name: "helpingpeopleMainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Helping people live better tomorrow" },
    ],
    colorListItems: [
      { name: "helpingpeopleTitleColorKey", label: "Title color", tooltip: "Theme color for the title" },
      { name: "helpingpeopleTextColorKey", label: "Text color", tooltip: "Theme color for the paragraph text" },
    ],
  },
  OverviewOfOurWork: {
    titleListHeader: "Content",
    titleListItems: [],
    colorListItems: [
      { name: "overviewOfOurWorkCardTitleColorKey", label: "Card title", tooltip: "Theme color for card title text (default when not set per card)" },
      { name: "overviewOfOurWorkCardBorderColorKey", label: "Card border", tooltip: "Theme color for card border" },
      { name: "overviewOfOurWorkButtonColorKey", label: "Button / link", tooltip: "Theme color for button text and icon" },
      { name: "overviewOfOurWorkHoverColorKey", label: "Card hover overlay", tooltip: "Theme color for hover overlay and border (shows over card background image)" },
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
