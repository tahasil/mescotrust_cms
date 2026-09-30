/**
 * Per-component config for the shared "Title & Colors" accordion.
 * Same UI structure everywhere; fields are component-specific.
 * Used by TitleAndColorsSection and for default props when creating new components.
 */

const LIST_HEADER_STYLE = { fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" };

const LEGACY_TITLE_HIGHLIGHT_COLOR_NAMES = new Set([
  "subscribeAccentColorKey",
  "noticesAccentColorKey",
  "accordionTitleAccentColorKey",
  "photoGalleryAccentTextColorKey",
  "storiesSliderHeadingAccentColorKey",
  "ourImpactHeadingAccentColorKey",
]);

export function isTitleHighlightColorItem(item) {
  const name = String(item?.name || "");
  return (
    name === "titleHighlightColorKey" ||
    name === "innerPageHeroAccentColorKey" ||
    LEGACY_TITLE_HIGHLIGHT_COLOR_NAMES.has(name)
  );
}

export function normalizeTitleHighlightColorItems(items = []) {
  const colorItems = Array.isArray(items) ? items : [];
  const existing = colorItems.find(isTitleHighlightColorItem);
  if (existing) {
    return colorItems.map((item) =>
      item === existing
        ? {
            ...item,
            label: "Highlighted/Accent Text",
            tooltip:
              "Theme color for title text wrapped in asterisks; when no asterisks are used, the final word is highlighted",
          }
        : item,
    );
  }
  const highlightItem = {
    name: "titleHighlightColorKey",
    label: "Highlighted/Accent Text",
    tooltip:
      "Theme color for title text wrapped in asterisks; when no asterisks are used, the final word is highlighted",
  };
  const mainTitleIndex = colorItems.findIndex((item) => {
    const name = String(item?.name || "").toLowerCase();
    const label = String(item?.label || "").toLowerCase();
    return (
      name === "titlecolorkey" ||
      label === "title" ||
      label === "title color" ||
      label.includes("main title") ||
      label.includes("section heading") ||
      label.includes("slider title") ||
      label.includes("heading fill")
    );
  });
  if (mainTitleIndex < 0) return [...colorItems, highlightItem];
  return [
    ...colorItems.slice(0, mainTitleIndex + 1),
    highlightItem,
    ...colorItems.slice(mainTitleIndex + 1),
  ];
}

/** titleListItems: { type: "input"|"switch"|"select", name, label, tooltip, rules?, placeholder?, options?, defaultValue? }[] */
/** colorListItems: { name, label, tooltip }[] */
export const TITLE_AND_COLORS_CONFIG = {
  CareersUpload: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Build a Meaningful Career With Us" },
      { key: "titleEnabled", type: "switch", name: "careersUploadTitleEnabled", label: "Show Main Title", tooltip: "Show or hide the main title", defaultValue: true },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Section subtitle", placeholder: "e.g. WHO WE ARE" },
      { key: "subTitleEnabled", type: "switch", name: "careersUploadSubTitleEnabled", label: "Show Subtitle", tooltip: "Show or hide the subtitle", defaultValue: true },
      {
        key: "titleAlign",
        type: "select",
        name: "careersUploadTitleAlign",
        label: "Title Alignment",
        tooltip: "Horizontal alignment for the main title and subtitle",
        defaultValue: "left",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
      },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Main Title", tooltip: "Theme color for the main section title" },
      { name: "careersUploadSubTitleColorKey", label: "Subtitle", tooltip: "Theme color for the subtitle" },
      { name: "careersUploadCardBgColorKey", label: "Card Background", tooltip: "Theme color for the form card background" },
      { name: "careersUploadLabelColorKey", label: "Field Labels", tooltip: "Theme color for input labels" },
      { name: "careersUploadButtonBgColorKey", label: "Submit Button Background", tooltip: "Theme color for the submit application button" },
      { name: "careersUploadButtonTextColorKey", label: "Submit Button Text", tooltip: "Theme color for the submit button text" },
    ],
  },
  Testimonials: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "titleText", type: "input", name: "testimonialsTitle", label: "Sub Title", tooltip: "Small section label", rules: [{ required: true, message: "Sub Title is required" }], placeholder: "e.g. Donor Testimonials" },
      { key: "titleEnabled", type: "switch", name: "testimonialsTitleEnabled", label: "Enable", tooltip: "Show or hide the section title" },
      {
        key: "titleAlign",
        type: "select",
        name: "testimonialsTitleAlign",
        label: "Align",
        tooltip: "Horizontal alignment for the main title",
        defaultValue: "center",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
      },
    ],
    colorListItems: [
      { name: "testimonialsTitleColorKey", label: "Main Title", tooltip: "Theme color for the section title" },
      { name: "testimonialsNameColorKey", label: "Name", tooltip: "Theme color for testimonial name" },
      { name: "testimonialsRoleColorKey", label: "Role / Title", tooltip: "Theme color for role or title under name" },
      { name: "testimonialsRatingColorKey", label: "Rating (stars)", tooltip: "Theme color for star rating" },
      { name: "testimonialsAvatarBgColorKey", label: "Avatar Background Color", tooltip: "Theme color for avatar background" },
      { name: "testimonialsAvatarTextColorKey", label: "Avatar Text Color", tooltip: "Theme color for avatar initials text" },
      { name: "testimonialsQuoteMarkColorKey", label: "Quote mark", tooltip: "Theme color for the large quote mark" },
      { name: "testimonialsQuoteColorKey", label: "Quote text", tooltip: "Theme color for testimonial text" },
      { name: "testimonialsDotColorKey", label: "Inactive dots", tooltip: "Theme color for inactive navigation dots" },
      { name: "testimonialsDotActiveColorKey", label: "Active dot", tooltip: "Theme color for the active navigation dot" },
      { name: "testimonialsLinkColorKey", label: "View all link", tooltip: "Theme color for the footer link" },
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
    titleListHeader: "Finale Content",
    titleListItems: [
      { key: "title", type: "input", name: "subscribeTitle", label: "Heading", tooltip: "First part of the large finale heading", placeholder: "Be someone's" },
      { key: "accent", type: "input", name: "subscribeHeadingAccent", label: "Heading accent", tooltip: "Red emphasized text after the heading", placeholder: "tomorrow." },
      { key: "subtitle", type: "input", name: "subscribeSubtitle", label: "Newsletter label", tooltip: "Text displayed above the email input", placeholder: "Subscribe to our newsletter for weekly and monthly news" },
    ],
    colorListItems: [
      { name: "subscribeTitleColorKey", label: "Heading fill", tooltip: "Theme color for the filled heading" },
      { name: "subscribeAccentColorKey", label: "Heading accent", tooltip: "Theme color for the filled accent text" },
      { name: "subscribeOutlineColorKey", label: "Headline outline", tooltip: "Theme color for the unfilled headline outline" },
      { name: "subscribePrimaryButtonBgColorKey", label: "Primary CTA background", tooltip: "Theme color for the primary CTA" },
      { name: "subscribePrimaryButtonTextColorKey", label: "Primary CTA text", tooltip: "Theme color for the primary CTA text" },
      { name: "subscribeSecondaryButtonBgColorKey", label: "Secondary CTA background", tooltip: "Theme color for the secondary CTA" },
      { name: "subscribeSecondaryButtonTextColorKey", label: "Secondary CTA text", tooltip: "Theme color for the secondary CTA text" },
      { name: "subscribeSubtitleColorKey", label: "Newsletter label", tooltip: "Theme color for the newsletter label" },
      { name: "subscribeInputBgColorKey", label: "Email input background", tooltip: "Theme color for the email input" },
      { name: "subscribeInputBorderColorKey", label: "Email input border", tooltip: "Theme color for the email input border" },
      { name: "subscribeInputTextColorKey", label: "Email input text", tooltip: "Theme color for the email input text" },
      { name: "subscribeFocusColorKey", label: "Email focus ring", tooltip: "Theme color for the focused email field" },
      { name: "subscribeButtonBgColorKey", label: "Subscribe button background", tooltip: "Theme color for the subscribe button" },
      { name: "subscribeButtonTextColorKey", label: "Subscribe button text", tooltip: "Theme color for the subscribe button text" },
      { name: "subscribeErrorColorKey", label: "Validation error", tooltip: "Theme color for validation messages" },
    ],
  },
  SectionIntro: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "Section Title" },
      {
        key: "mainTitleEnabled",
        type: "switch",
        name: "sectionIntroTitleEnabled",
        label: "Show main title",
        tooltip: "Show or hide the main title on frontend",
        checkedChildren: "Enable",
        unCheckedChildren: "Disable",
      },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above title", placeholder: "Subtitle" },
      {
        key: "subTitleEnabled",
        type: "switch",
        name: "sectionIntroSubTitleEnabled",
        label: "Show subtitle",
        tooltip: "Show or hide the subtitle on frontend",
        checkedChildren: "Enable",
        unCheckedChildren: "Disable",
      },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Main title color", tooltip: "Theme color for the main title" },
      { name: "sectionIntroSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "sectionIntroParagraphColorKey", label: "Paragraph color", tooltip: "Theme color for the paragraph/description" },
    ],
  },
  Internshiplifecycle: {
    supportsTitleHighlight: false,
    titleListHeader: "Main Title",
    titleListItems: [
      {
        key: "mainTitle",
        type: "input",
        name: "mainTitle",
        label: "Title text",
        tooltip: "Heading shown above the lifecycle timeline",
        placeholder: "From application to certificate",
      },
    ],
    colorListItems: [
      {
        name: "internshiplifecycleAccentColorKey",
        label: "Title & step numbers",
        tooltip: "Theme color for the small title and numbered labels",
      },
      {
        name: "internshiplifecycleDescriptionColorKey",
        label: "Step text",
        tooltip: "Theme color for lifecycle step text",
      },
      {
        name: "internshiplifecycleConnectorColorKey",
        label: "Divider / border",
        tooltip: "Theme color for the horizontal row dividers",
      },
    ],
  },
  Volunteer: {
    supportsTitleHighlight: false,
    titleListHeader: "Headings",
    titleListItems: [],
    colorListItems: [
      { name: "volunteerFormTitleColorKey", label: "Form title", tooltip: "Theme color for the Volunteer application form title" },
      { name: "volunteerFormCardBgColorKey", label: "Form card background", tooltip: "Theme color for form card background" },
      { name: "volunteerFormCardBorderColorKey", label: "Form card border", tooltip: "Theme color for form card border" },
      { name: "volunteerLabelColorKey", label: "Field labels", tooltip: "Theme color for form labels" },
      { name: "volunteerInputBgColorKey", label: "Input background", tooltip: "Theme color for inputs background" },
      { name: "volunteerInputBorderColorKey", label: "Input border", tooltip: "Theme color for inputs border" },
      { name: "volunteerInputFocusBorderColorKey", label: "Input focus border", tooltip: "Theme color for input border on focus" },
      { name: "volunteerInputTextColorKey", label: "Input text", tooltip: "Theme color for input text" },
      { name: "volunteerPlaceholderColorKey", label: "Input placeholder", tooltip: "Theme color for input placeholders" },
      { name: "volunteerCheckboxColorKey", label: "Checkbox tick", tooltip: "Theme color for checkbox check and border" },
      { name: "volunteerAreasTextColorKey", label: "Interest labels", tooltip: "Theme color for checkbox labels" },
      { name: "volunteerRequiredStarColorKey", label: "Required marker", tooltip: "Theme color for required asterisk marker" },
      { name: "volunteerErrorTextColorKey", label: "Validation errors", tooltip: "Theme color for form validation error text" },
      { name: "volunteerButtonBgColorKey", label: "Submit button background", tooltip: "Theme color for submit button background" },
      { name: "volunteerButtonTextColorKey", label: "Submit button text", tooltip: "Theme color for submit button text" },
      { name: "volunteerEligibilityTitleColorKey", label: "Eligibility title", tooltip: "Theme color for the eligibility heading" },
      { name: "volunteerEligibilityChipBgColorKey", label: "Eligibility chip background", tooltip: "Theme color for eligibility chip backgrounds" },
      { name: "volunteerEligibilityChipBorderColorKey", label: "Eligibility chip border", tooltip: "Theme color for eligibility chip borders" },
      { name: "volunteerEligibilityChipTextColorKey", label: "Eligibility chip text", tooltip: "Theme color for eligibility chip text" },
    ],
  },
  LatestNews: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "subtitle", type: "input", name: "latestEvents1SubTitle", label: "Subtitle", tooltip: "Small heading", placeholder: "e.g. Latest News" },
      { key: "mainTitle", type: "input", name: "latestEvents1MainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Stay Informed. Stay Ahead." },
    ],
    colorListItems: [
      { name: "latestEvents1SubTitleColorKey", label: "Subtitle", tooltip: "Theme color for subtitle" },
      { name: "latestEvents1MainTitleColorKey", label: "Main title", tooltip: "Theme color for main title" },
      { name: "latestEvents1TagColorKey", label: "Date", tooltip: "Theme color for dates" },
      { name: "latestEvents1TagBorderColorKey", label: "Date border", tooltip: "Theme color for date borders" },
      { name: "latestEvents1ItemTitleColorKey", label: "News titles", tooltip: "Theme color for news titles" },
      { name: "latestEvents1BorderColorKey", label: "Row borders", tooltip: "Theme color for row dividers" },
      { name: "latestEvents1ArrowColorKey", label: "Arrow", tooltip: "Theme color for row arrows" },
      { name: "latestEvents1ArrowHoverColorKey", label: "Arrow hover", tooltip: "Theme color for row arrows on hover" },
    ],
  },
  EventsSlider: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "subtitle", type: "input", name: "eventsSliderSubTitle", label: "Subtitle", tooltip: "Small heading", placeholder: "e.g. Events" },
      { key: "subtitleEnabled", type: "switch", name: "eventsSliderSubTitleEnabled", label: "Enable subtitle", tooltip: "Show or hide the subtitle" },
      { key: "mainTitle", type: "input", name: "eventsSliderMainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Save the date." },
      { key: "titleEnabled", type: "switch", name: "eventsSliderTitleEnabled", label: "Enable title", tooltip: "Show or hide the title" },
    ],
    colorListItems: [
      { name: "eventsSliderSubTitleColorKey", label: "Subtitle", tooltip: "Theme color for subtitle" },
      { name: "eventsSliderMainTitleColorKey", label: "Main title", tooltip: "Theme color for main title" },
      { name: "eventsSliderDateColorKey", label: "Slide date", tooltip: "Theme color for slide date" },
      { name: "eventsSliderDescColorKey", label: "Slide description", tooltip: "Theme color for slide description" },
      { name: "eventsSliderArrowColorKey", label: "Arrows", tooltip: "Theme color for prev/next arrows" },
      { name: "eventsSliderArrowBgColorKey", label: "Arrow background", tooltip: "Theme color for prev/next arrow button background" },
      { name: "eventsSliderDotActiveColorKey", label: "Slide count", tooltip: "Theme color for the slide count" },
      { name: "eventsSliderButtonBgColorKey", label: "Button background", tooltip: "Theme color for View Details button background" },
      { name: "eventsSliderButtonTextColorKey", label: "Button text", tooltip: "Theme color for View Details button text" },
    ],
  },
  Cards: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "subtitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above main title", placeholder: "e.g. Recognitions" },
      { key: "subtitleEnabled", type: "switch", name: "cardsSubTitleEnabled", label: "Enable subtitle", tooltip: "Show or hide the subtitle" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Certifications" },
      { key: "titleEnabled", type: "switch", name: "cardsTitleEnabled", label: "Enable title", tooltip: "Show or hide the main title" },
    ],
    colorListItems: [
      { name: "cardsSubTitleColorKey", label: "Subtitle", tooltip: "Theme color for subtitle" },
      { name: "cardsMainTitleColorKey", label: "Main title", tooltip: "Theme color for main title" },
      { name: "cardsCardBgColorKey", label: "Card background", tooltip: "Theme color for card background" },
      { name: "cardsCardTitleColorKey", label: "Card text", tooltip: "Theme color for card title text" },
      { name: "cardsCardBorderColorKey", label: "Card border", tooltip: "Theme color for card border" },
    ],
  },
  Cards1: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "subtitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above main title", placeholder: "e.g. Our Focus Areas" },
      { key: "subtitleEnabled", type: "switch", name: "cards1SubTitleEnabled", label: "Enable subtitle", tooltip: "Show or hide the subtitle" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Cards Section" },
      { key: "titleEnabled", type: "switch", name: "cards1TitleEnabled", label: "Enable title", tooltip: "Show or hide the main title" },
    ],
    colorListItems: [
      { name: "cards1SubTitleColorKey", label: "Subtitle", tooltip: "Theme color for subtitle" },
      { name: "cards1MainTitleColorKey", label: "Main title", tooltip: "Theme color for main title" },
      { name: "cards1CardBgColorKey", label: "Card background", tooltip: "Theme color for default card background" },
      { name: "cards1CardBorderColorKey", label: "Card border", tooltip: "Theme color for default card border" },
      { name: "cards1CardTitleColorKey", label: "Card title", tooltip: "Theme color for default card title" },
      { name: "cards1CardDescriptionColorKey", label: "Card description", tooltip: "Theme color for default card description" },
      { name: "cards1CardHoverBgColorKey", label: "Card hover background", tooltip: "Theme color for hover card background" },
      { name: "cards1CardHoverTitleColorKey", label: "Card hover title", tooltip: "Theme color for card title on hover" },
      { name: "cards1CardHoverDescriptionColorKey", label: "Card hover description", tooltip: "Theme color for card description on hover" },
      { name: "cards1CardIconBgColorKey", label: "Icon circle background", tooltip: "Theme color for icon circle background" },
      { name: "cards1CardButtonBgColorKey", label: "Button background", tooltip: "Theme color for default button background" },
      { name: "cards1CardButtonTextColorKey", label: "Button text", tooltip: "Theme color for default button text" },
      { name: "cards1CardHoverButtonBgColorKey", label: "Hover button background", tooltip: "Theme color for button background on hover" },
      { name: "cards1CardHoverButtonTextColorKey", label: "Hover button text", tooltip: "Theme color for button text on hover" },
    ],
  },
  ShortCode: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "subtitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above main title", placeholder: "e.g. Subtitle" },
      { key: "subtitleEnabled", type: "switch", name: "shortCodeSubTitleEnabled", label: "Enable subtitle", tooltip: "Show or hide the subtitle" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Section Title" },
      { key: "titleEnabled", type: "switch", name: "shortCodeTitleEnabled", label: "Enable title", tooltip: "Show or hide the main title" },
    ],
    colorListItems: [
      { name: "shortCodeSubTitleColorKey", label: "Subtitle", tooltip: "Theme color for subtitle" },
      { name: "shortCodeMainTitleColorKey", label: "Main title", tooltip: "Theme color for main title" },
      { name: "shortCodeCardBgColorKey", label: "Card background", tooltip: "Theme color for shortcode content background" },
      { name: "shortCodeCardTextColorKey", label: "Card text", tooltip: "Theme color for shortcode content text" },
      { name: "shortCodeCardBorderColorKey", label: "Card border", tooltip: "Theme color for shortcode content border" },
    ],
  },
  Marquee: {
    titleListHeader: "Headings",
    titleListItems: [
      { key: "partnersTitle", type: "input", name: "marqueePartnersTitle", label: "Our CSR Partners", tooltip: "Heading displayed on the left of the partners section", placeholder: "Our CSR Partners" },
      { key: "awardsTitle", type: "input", name: "marqueeAwardsTitle", label: "Awards & Recognition", tooltip: "Heading displayed on the right of the partners section", placeholder: "Awards & Recognition" },
    ],
    colorListItems: [
      { name: "marqueePartnersTitleColorKey", label: "Our CSR Partners", tooltip: "Theme color for the Our CSR Partners heading" },
      { name: "marqueeAwardsTitleColorKey", label: "Awards & Recognition", tooltip: "Theme color for the Awards & Recognition heading" },
    ],
  },
  Header: {
    supportsTitleHighlight: false,
    titleListHeader: "Main Title",
    titleListItems: [],
    colorListItems: [
      { name: "headerSearchBgColorKey", label: "Search background", tooltip: "Theme color for Search button background" },
      { name: "headerSearchTextColorKey", label: "Search text/icon", tooltip: "Theme color for Search button text and icon" },
      { name: "headerSearchHoverBgColorKey", label: "Search hover background", tooltip: "Theme color for Search button background on hover" },
      { name: "headerSearchHoverTextColorKey", label: "Search hover text/icon", tooltip: "Theme color for Search button text and icon on hover" },
      { name: "headerCtaBgColorKey", label: "Volunteer background", tooltip: "Theme color for Volunteer button background" },
      { name: "headerCtaTextColorKey", label: "Volunteer text/icon", tooltip: "Theme color for Volunteer button text" },
      { name: "headerCtaHoverBgColorKey", label: "Volunteer hover background", tooltip: "Theme color for Volunteer button background on hover" },
      { name: "headerCtaHoverTextColorKey", label: "Volunteer hover text/icon", tooltip: "Theme color for Volunteer button text on hover" },
      { name: "headerDonateBgColorKey", label: "Donate background", tooltip: "Theme color for Donate button background" },
      { name: "headerDonateTextColorKey", label: "Donate text/icon", tooltip: "Theme color for Donate button text" },
      { name: "headerDonateHoverBgColorKey", label: "Donate hover background", tooltip: "Theme color for Donate button background on hover" },
      { name: "headerDonateHoverTextColorKey", label: "Donate hover text/icon", tooltip: "Theme color for Donate button text on hover" },
    ],
  },
  Footer: {
    supportsTitleHighlight: false,
    titleListHeader: "Main Title",
    titleListItems: [],
    colorListItems: [
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
    titleListHeader: "Noticeboard Heading",
    titleListItems: [
      { key: "enabled", type: "switch", name: "noticesTitleEnabled", label: "Show heading", tooltip: "Show the subtitle, main heading, and description above the notice rows" },
      { key: "subTitle", type: "input", name: "noticesSubTitle", label: "Sub Title", tooltip: "Small section label", placeholder: "Important Notices" },
      { key: "heading", type: "input", name: "noticesHeading", label: "Heading", tooltip: "Main section heading", placeholder: "From the" },
      { key: "accent", type: "input", name: "noticesHeadingAccent", label: "Heading accent", tooltip: "Emphasized heading text", placeholder: "noticeboard." },
      { key: "description", type: "input", name: "noticesDescription", label: "Description", tooltip: "Short introduction", placeholder: "Official announcements..." },
    ],
    colorListItems: [
      { name: "noticesSubTitleColorKey", label: "Sub Title", tooltip: "Theme color for the sub title" },
      { name: "noticesHeadingColorKey", label: "Heading", tooltip: "Theme color for the heading" },
      { name: "noticesAccentColorKey", label: "Heading accent", tooltip: "Theme color for emphasized heading text" },
      { name: "noticesDescriptionColorKey", label: "Description", tooltip: "Theme color for the introduction" },
      { name: "noticesItemTitleColorKey", label: "Notice titles", tooltip: "Theme color for notice titles" },
      { name: "noticesIndexColorKey", label: "Notice indexes", tooltip: "Theme color for the numeric notice indexes" },
      { name: "noticesMetaColorKey", label: "Notice metadata", tooltip: "Theme color for notice descriptions and metadata" },
      { name: "noticesBorderColorKey", label: "Dividers", tooltip: "Theme color for row dividers" },
      { name: "noticesArrowColorKey", label: "Arrows", tooltip: "Theme color for row arrows" },
      { name: "noticesArrowHoverColorKey", label: "Arrow hover", tooltip: "Theme color for hovered arrows" },
      { name: "noticesRowHoverColorKey", label: "Row hover background", tooltip: "Optional theme color shown behind a hovered notice row" },
      { name: "noticesLinkColorKey", label: "All notices link", tooltip: "Theme color for the footer link" },
      { name: "noticesLinkHoverColorKey", label: "All notices link hover", tooltip: "Theme color for the footer link on hover" },
    ],
  },
  WelcometoMESCO: {
    titleListHeader: "Kinetic Statement",
    titleListItems: [
      { key: "subTitle", type: "input", name: "welcometoMESCOSubTitle", label: "Sub Title", tooltip: "Small label above the statement", placeholder: "Welcome to MESCO" },
      { key: "statement", type: "input", name: "welcometoMESCOStatementText", label: "Statement", tooltip: "Main kinetic statement text", placeholder: "A selfless effort for serving mankind..." },
    ],
    colorListItems: [
      { name: "welcometoMESCOSubTitleColorKey", label: "Sub Title", tooltip: "Theme color for the sub title" },
      { name: "welcometoMESCOStatementColorKey", label: "Statement", tooltip: "Theme color for statement words" },
      { name: "welcometoMESCOPrimaryButtonBgColorKey", label: "Primary button background", tooltip: "Theme color for the primary button" },
      { name: "welcometoMESCOPrimaryButtonTextColorKey", label: "Primary button text", tooltip: "Theme color for primary button text" },
      { name: "welcometoMESCOSecondaryLinkColorKey", label: "Secondary link", tooltip: "Theme color for the secondary link" },
      { name: "welcometoMESCOEstablishmentLabelColorKey", label: "Establishment label", tooltip: "Theme color for the establishment label" },
      { name: "welcometoMESCOEstablishmentTextColorKey", label: "Establishment description", tooltip: "Theme color for the establishment description" },
    ],
  },
  ImpactShowcase: {
    titleListHeader: "Heading",
    titleListItems: [
      { key: "subTitle", type: "input", name: "impactShowcaseSubTitle", label: "Subtitle", tooltip: "Small uppercase label", placeholder: "Who We Are" },
      { key: "mainTitle", type: "input", name: "impactShowcaseMainTitle", label: "Main title", tooltip: "Wrap accent text in *asterisks*", placeholder: "Education first, *then everything else.*" },
    ],
    colorListItems: [
      { name: "impactShowcaseSubTitleColorKey", label: "Subtitle", tooltip: "Theme color for the subtitle" },
      { name: "impactShowcaseTitleColorKey", label: "Title", tooltip: "Theme color for the title" },
      { name: "impactShowcaseBodyColorKey", label: "Body", tooltip: "Theme color for paragraphs" },
      { name: "impactShowcaseStatValueColorKey", label: "Statistic value", tooltip: "Theme color for statistic value" },
      { name: "impactShowcaseStatLabelColorKey", label: "Statistic label", tooltip: "Theme color for statistic label" },
    ],
  },
  AnimationsText: {
    supportsTitleHighlight: false,
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
  AimsObjectives: {
    titleListHeader: "Heading",
    titleListItems: [
      { key: "subTitle", type: "input", name: "aimsObjectivesSubTitle", label: "Subtitle", tooltip: "Small uppercase label", placeholder: "Aims & Objectives" },
      { key: "mainTitle", type: "input", name: "aimsObjectivesHeading", label: "Main title", tooltip: "Wrap accent text in *asterisks*", placeholder: "What we *work toward.*" },
    ],
    colorListItems: [
      { name: "aimsObjectivesSubTitleColorKey", label: "Subtitle", tooltip: "Theme color for the subtitle" },
      { name: "aimsObjectivesHeadingColorKey", label: "Title", tooltip: "Theme color for the title" },
      { name: "aimsObjectivesTextColorKey", label: "Items", tooltip: "Theme color for objective text" },
      { name: "aimsObjectivesNumberColorKey", label: "Numbers", tooltip: "Theme color for roman numerals" },
      { name: "aimsObjectivesBorderColorKey", label: "Dividers", tooltip: "Theme color for dividers" },
    ],
  },
  Registered: {
    titleListHeader: "Heading",
    titleListItems: [
      { key: "subTitle", type: "input", name: "registeredSubTitle", label: "Subtitle", tooltip: "Small uppercase label", placeholder: "Registered Under" },
      { key: "mainTitle", type: "input", name: "registeredHeading", label: "Main title", tooltip: "Wrap accent text in *asterisks*", placeholder: "Accountable, *by design.*" },
    ],
    colorListItems: [
      { name: "registeredSubTitleColorKey", label: "Subtitle", tooltip: "Theme color for the subtitle" },
      { name: "registeredHeadingColorKey", label: "Title", tooltip: "Theme color for the title" },
      { name: "registeredCardBgColorKey", label: "Card background", tooltip: "Theme color for card backgrounds" },
      { name: "registeredCardTextColorKey", label: "Card text", tooltip: "Theme color for card text" },
      { name: "registeredIconColorKey", label: "Icons", tooltip: "Theme color for card icons" },
    ],
  },
  Helpingpeople: {
    titleListHeader: "Heading",
    titleListItems: [
      { key: "subTitle", type: "input", name: "helpingpeopleSubTitle", label: "Subtitle", tooltip: "Small uppercase label", placeholder: "The People" },
      { key: "mainTitle", type: "input", name: "helpingpeopleMainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Helping people live better tomorrow" },
    ],
    colorListItems: [
      { name: "helpingpeopleSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "helpingpeopleTitleColorKey", label: "Title color", tooltip: "Theme color for the title" },
      { name: "helpingpeopleTextColorKey", label: "Text color", tooltip: "Theme color for the paragraph text" },
    ],
  },
  Vision: {
    titleListHeader: "Content",
    titleListItems: [],
    colorListItems: [
      { name: "visionSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for Vision subtitle" },
      { name: "visionMainTitleColorKey", label: "Main title color", tooltip: "Theme color for Vision main title" },
    ],
  },
  Mission: {
    titleListHeader: "Content",
    titleListItems: [],
    colorListItems: [
      { name: "missionSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for Mission subtitle" },
      { name: "missionMainTitleColorKey", label: "Main title color", tooltip: "Theme color for Mission main title" },
    ],
  },
  ManagingCommittee: {
    titleListHeader: "Heading",
    titleListItems: [
      { key: "subTitle", type: "input", name: "managingCommitteeSubTitle", label: "Subtitle", tooltip: "Small uppercase label", placeholder: "e.g. Program" },
      { key: "mainTitle", type: "input", name: "managingCommitteeMainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Managing Committee" },
    ],
    colorListItems: [
      { name: "managingCommitteeSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "managingCommitteeTitleColorKey", label: "Title color", tooltip: "Theme color for the title" },
      { name: "managingCommitteeTextColorKey", label: "Text color", tooltip: "Theme color for the paragraph text" },
    ],
  },
  TimelineTrack: {
    titleListHeader: "Heading",
    titleListItems: [
      { key: "subTitle", type: "input", name: "timelineTrackSubTitle", label: "Subtitle", tooltip: "Small uppercase label above the section title", placeholder: "Our Journey" },
      { key: "heading", type: "input", name: "timelineTrackHeading", label: "Main title", tooltip: "Wrap accent text in *asterisks*", placeholder: "Milestones that *shaped* us." },
      { key: "intro", type: "input", name: "timelineTrackIntro", label: "Intro", tooltip: "Optional short paragraph under the section title", placeholder: "e.g. A short line about this journey" },
      {
        key: "titleAlign",
        type: "select",
        name: "timelineTrackTitleAlign",
        label: "Title alignment",
        tooltip: "Horizontal alignment for the section heading",
        defaultValue: "center",
        options: [
          { label: "Center", value: "center" },
          { label: "Left", value: "left" },
        ],
      },
    ],
    colorListItems: [
      { name: "timelineTrackSubTitleColorKey", label: "Subtitle", tooltip: "Theme color for the section subtitle" },
      { name: "timelineTrackHeadingColorKey", label: "Title", tooltip: "Theme color for the section title" },
      { name: "timelineTrackIntroColorKey", label: "Intro", tooltip: "Theme color for the intro paragraph" },
      { name: "timelineTrackDateColorKey", label: "Date pill", tooltip: "Theme color for the date/year pill on each entry" },
      { name: "timelineTrackBadgeColorKey", label: "Badge", tooltip: "Theme color for the badge/location next to an entry title" },
      { name: "timelineTrackItemTitleColorKey", label: "Entry title", tooltip: "Theme color for each timeline entry title" },
      { name: "timelineTrackTextColorKey", label: "Entry description", tooltip: "Theme color for entry descriptions" },
      { name: "timelineTrackLinkColorKey", label: "Entry link", tooltip: "Theme color for the entry call-to-action link" },
    ],
  },
  Accordion: {
    titleListHeader: "Heading",
    titleListItems: [
      { key: "subTitle", type: "input", name: "accordionSubTitle", label: "Subtitle", tooltip: "Small uppercase label above the section title", placeholder: "e.g. How We Are Governed" },
      { key: "mainTitle", type: "input", name: "accordionMainTitle", label: "Main title", tooltip: "Section heading. Wrap highlighted words in *asterisks*.", placeholder: "e.g. Seven layers of *oversight.*" },
    ],
    colorListItems: [
      { name: "accordionSubTitleColorKey", label: "Subtitle", tooltip: "Theme color for the section subtitle" },
      { name: "accordionTitleColorKey", label: "Section title", tooltip: "Theme color for the section title" },
      { name: "accordionTitleAccentColorKey", label: "Title accent", tooltip: "Theme color for title text wrapped in asterisks" },
      { name: "accordionHeaderColorKey", label: "Header text", tooltip: "Theme color for panel header text" },
      { name: "accordionContentColorKey", label: "Content text", tooltip: "Theme color for panel content text" },
      { name: "accordionContentStrongColorKey", label: "Content emphasis", tooltip: "Theme color for bold text inside panel content" },
      { name: "accordionLinkColorKey", label: "Content links", tooltip: "Theme color for links inside panel content" },
      { name: "accordionLinkHoverColorKey", label: "Content link hover", tooltip: "Theme color for hovered links inside panel content" },
      { name: "accordionBgColorKey", label: "Panel background", tooltip: "Theme color for panel background" },
      { name: "accordionBorderColorKey", label: "Panel border", tooltip: "Theme color for divider lines between panels" },
      { name: "accordionIconColorKey", label: "Expand icon", tooltip: "Theme color for the closed expand icon" },
      { name: "accordionOpenIconColorKey", label: "Open icon", tooltip: "Theme color for the expanded panel icon" },
      { name: "accordionFocusColorKey", label: "Focus outline", tooltip: "Theme color for keyboard focus outlines" },
      { name: "accordionImageBgColorKey", label: "Image background", tooltip: "Theme color behind panel images" },
      { name: "accordionImageBorderColorKey", label: "Image border", tooltip: "Theme color for panel image borders" },
    ],
  },
  VolunteerMesco: {
    titleListHeader: "Heading",
    titleListItems: [
      { key: "subTitle", type: "input", name: "volunteerMescoSubTitle", label: "Subtitle", tooltip: "Small uppercase label above the title", placeholder: "Why Volunteer with MESCO" },
      { key: "mainTitle", type: "input", name: "volunteerMescoTitle", label: "Title", tooltip: "Wrap highlighted text in *asterisks*", placeholder: "Work that *works on you.*" },
    ],
    colorListItems: [
      { name: "volunteerMescoSubTitleColorKey", label: "Subtitle", tooltip: "Theme color for the subtitle" },
      { name: "volunteerMescoTitleColorKey", label: "Title", tooltip: "Theme color for the title" },
      { name: "volunteerMescoDescriptionColorKey", label: "Description", tooltip: "Theme color for the description" },
      { name: "volunteerMescoChipTextColorKey", label: "Chip text", tooltip: "Theme color for chip text" },
      { name: "volunteerMescoChipBgColorKey", label: "Chip background", tooltip: "Theme color for chip backgrounds" },
      { name: "volunteerMescoChipBorderColorKey", label: "Chip border", tooltip: "Theme color for chip borders" },
      { name: "volunteerMescoPrimaryButtonBgColorKey", label: "Primary button background", tooltip: "Theme color for the primary button" },
      { name: "volunteerMescoPrimaryButtonTextColorKey", label: "Primary button text", tooltip: "Theme color for primary button text" },
      { name: "volunteerMescoPrimaryButtonHoverBgColorKey", label: "Primary button hover", tooltip: "Theme color for the primary button on hover" },
      { name: "volunteerMescoSecondaryButtonTextColorKey", label: "Secondary button text", tooltip: "Theme color for secondary button text" },
      { name: "volunteerMescoSecondaryButtonBorderColorKey", label: "Secondary button border", tooltip: "Theme color for the secondary button border" },
      { name: "volunteerMescoSecondaryButtonHoverBorderColorKey", label: "Secondary button hover border", tooltip: "Theme color for the secondary button border on hover" },
      { name: "volunteerMescoImageBgColorKey", label: "Image background", tooltip: "Theme color shown behind the image" },
    ],
  },
  PhotoGallery: {
    titleListHeader: "Gallery Heading",
    titleListItems: [
      { key: "titleVisible", type: "switch", name: "photoGalleryTitleVisible", label: "Show title", tooltip: "Show or hide the gallery title" },
      { key: "subTitle", type: "input", name: "photoGallerySubTitle", label: "Sub Title", tooltip: "Small heading above the title", placeholder: "Image Gallery" },
      { key: "subTitleVisible", type: "switch", name: "photoGallerySubTitleVisible", label: "Show sub title", tooltip: "Show or hide the gallery sub title" },
      { key: "title", type: "input", name: "photoGalleryTitle", label: "Title", tooltip: "Main gallery heading", placeholder: "Moments from" },
      { key: "accent", type: "input", name: "photoGalleryHeadingAccent", label: "Heading accent", tooltip: "Emphasized heading text", placeholder: "the field." },
    ],
    colorListItems: [
      { name: "photoGalleryCardBgColorKey", label: "Card Background", tooltip: "Theme color behind gallery card images" },
      { name: "photoGalleryCardBorderColorKey", label: "Card Border", tooltip: "Theme color for gallery card borders" },
      { name: "photoGalleryCardShadowColorKey", label: "Card Shadow", tooltip: "Theme color used by the selected card shadow" },
      { name: "photoGalleryCardTitleColorKey", label: "Album Title", tooltip: "Theme color for album titles" },
      { name: "photoGalleryButtonBgColorKey", label: "View Album Button Background", tooltip: "Theme color for the View Album button background" },
      { name: "photoGalleryButtonTextColorKey", label: "View Album Button Text", tooltip: "Theme color for the View Album button text and icon" },
      { name: "photoGalleryButtonBorderColorKey", label: "View Album Button Border", tooltip: "Theme color for the View Album button border" },
      { name: "photoGalleryButtonHoverBgColorKey", label: "Button Hover Background", tooltip: "Theme color for the View Album button background on hover" },
      { name: "photoGalleryButtonHoverTextColorKey", label: "Button Hover Text", tooltip: "Theme color for the View Album button text and icon on hover" },
      { name: "photoGalleryButtonHoverBorderColorKey", label: "Button Hover Border", tooltip: "Theme color for the View Album button border on hover" },
      { name: "photoGalleryOverlayColorKey", label: "Card Overlay", tooltip: "Theme color for the gradient overlay on gallery cards" },
      { name: "photoGalleryOverlayTextColorKey", label: "Card Overlay Text", tooltip: "Theme color used by text displayed over the card image" },
      { name: "photoGallerySectionBgColorKey", label: "Section Background", tooltip: "Theme color for the full gallery section background" },
      { name: "photoGalleryTitleColorKey", label: "Section Title", tooltip: "Theme color for the main gallery heading" },
      { name: "photoGallerySubTitleColorKey", label: "Section Sub Title", tooltip: "Theme color for the small gallery heading" },
      { name: "photoGalleryAccentColorKey", label: "Accent color", tooltip: "Theme color for arrows and navigation buttons" },
      { name: "photoGalleryNavButtonBgColorKey", label: "Navigation button background color", tooltip: "Theme color for hover navigation button background" },
      { name: "photoGalleryNavArrowColorKey", label: "Navigation arrow color", tooltip: "Theme color for hover navigation arrow/icon" },
      { name: "photoGalleryTabBgColorKey", label: "Active tab background", tooltip: "Theme color for active tab background" },
      { name: "photoGalleryTabTextColorKey", label: "Active tab text", tooltip: "Theme color for active tab text" },
      { name: "photoGalleryTabBorderColorKey", label: "Tab border", tooltip: "Theme color for tab border" },
      { name: "photoGalleryTabInactiveTextColorKey", label: "Inactive tab text", tooltip: "Theme color for inactive tab text" },
      { name: "photoGalleryTabHoverBorderColorKey", label: "Tab hover border", tooltip: "Theme color for tab border on hover" },
      { name: "photoGalleryTabHoverTextColorKey", label: "Tab hover text", tooltip: "Theme color for tab text on hover" },
      { name: "photoGalleryAccentTextColorKey", label: "Heading accent", tooltip: "Theme color for emphasized heading text" },
      { name: "photoGalleryLinkColorKey", label: "View gallery link", tooltip: "Theme color for the gallery link" },
      { name: "photoGalleryModalTitleColorKey", label: "Modal title", tooltip: "Theme color for the selected album title in the lightbox" },
      { name: "photoGalleryCountBgColorKey", label: "Photo count background", tooltip: "Theme color for the photo count badge background" },
      { name: "photoGalleryCountTextColorKey", label: "Photo count text", tooltip: "Theme color for the photo count badge text" },
    ],
  },
  OverlayCards: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "titleEnabled", type: "switch", name: "overlayCardsTitleEnabled", label: "Show title", tooltip: "Show or hide the main title" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Our Units" },
      { key: "subTitleEnabled", type: "switch", name: "overlayCardsSubTitleEnabled", label: "Show subtitle", tooltip: "Show or hide the subtitle" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above title", placeholder: "e.g. Old Newspaper Collection" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the main title" },
      { name: "overlayCardsSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "overlayCardsHoverColorKey", label: "Hover overlay color", tooltip: "Theme color for card hover overlay tint" },
    ],
  },
  DonateNow: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "titleEnabled", type: "switch", name: "donateNowTitleEnabled", label: "Show title", tooltip: "Show or hide the main title" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Donate" },
      { key: "subTitleEnabled", type: "switch", name: "donateNowSubTitleEnabled", label: "Show subtitle", tooltip: "Show or hide the subtitle" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above title", placeholder: "e.g. Support Our Cause" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the main title" },
      { name: "donateNowSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "donateNowCardBgColorKey", label: "Card background", tooltip: "Theme color for package card background" },
      { name: "donateNowCardBorderColorKey", label: "Card border", tooltip: "Theme color for package card border" },
      { name: "donateNowCardTitleColorKey", label: "Card title", tooltip: "Theme color for package card title text" },
      { name: "donateNowCardAmountColorKey", label: "Card amount", tooltip: "Theme color for package card amount text" },
      { name: "donateNowCardDescriptionColorKey", label: "Card description", tooltip: "Theme color for package card description text" },
      { name: "donateNowCardHoverBgColorKey", label: "Card hover background", tooltip: "Theme color for package card background on hover" },
      { name: "donateNowCardHoverBorderColorKey", label: "Card hover border", tooltip: "Theme color for package card border on hover" },
      { name: "donateNowCardHoverTextColorKey", label: "Card hover text", tooltip: "Theme color for package card title and description on hover" },
      { name: "donateNowCardHoverAmountColorKey", label: "Card hover amount", tooltip: "Theme color for package card amount on hover" },
      { name: "donateNowCardActiveBgColorKey", label: "Card active background", tooltip: "Theme color for selected package card background" },
      { name: "donateNowCardActiveBorderColorKey", label: "Card active border", tooltip: "Theme color for selected package card border" },
      { name: "donateNowCardActiveTextColorKey", label: "Card active text", tooltip: "Theme color for selected package card title and description" },
      { name: "donateNowCardActiveAmountColorKey", label: "Card active amount", tooltip: "Theme color for selected package card amount" },
      { name: "donateNowPkgActiveColorKey", label: "Active package color", tooltip: "Theme color for selected donation package" },
      { name: "donateNowFormHeadingColorKey", label: "Form heading color", tooltip: "Theme color for Donate / Details headings" },
      { name: "donateNowBtnBgColorKey", label: "Donate Now background", tooltip: "Theme color for Donate Now button background" },
      { name: "donateNowBtnTextColorKey", label: "Donate Now text", tooltip: "Theme color for Donate Now button text" },
      { name: "donateNowQrBtnBorderColorKey", label: "QR button border", tooltip: "Theme color for Donate Now with QR button border" },
      { name: "donateNowQrBtnTextColorKey", label: "QR button text", tooltip: "Theme color for Donate Now with QR button text" },
    ],
  },
  ContactUs: {
    supportsTitleHighlight: false,
    titleListHeader: "Contact Us",
    titleListItems: [],
    colorListItems: [
      { name: "contactUsInfoLabelColorKey", label: "Information labels", tooltip: "Theme color for Registered Office, Admin Office, Email and Phone labels" },
      { name: "contactUsInfoTextColorKey", label: "Information text", tooltip: "Theme color for addresses, email and phone details" },
      { name: "contactUsInfoCardBgColorKey", label: "Information card background", tooltip: "Theme color for contact information card backgrounds" },
      { name: "contactUsInfoCardBorderColorKey", label: "Information card border", tooltip: "Theme color for contact information card borders" },
      { name: "contactUsFormHeadingColorKey", label: "Form heading", tooltip: "Theme color for the Send us a message heading" },
      { name: "contactUsFormCardBgColorKey", label: "Form card background", tooltip: "Theme color for the form card background" },
      { name: "contactUsFormCardBorderColorKey", label: "Form card border", tooltip: "Theme color for the form card border" },
      { name: "contactUsFieldLabelColorKey", label: "Field labels", tooltip: "Theme color for form field labels" },
      { name: "contactUsInputBgColorKey", label: "Input background", tooltip: "Theme color for form input backgrounds" },
      { name: "contactUsInputBorderColorKey", label: "Input border", tooltip: "Theme color for form input borders" },
      { name: "contactUsInputFocusColorKey", label: "Input focus", tooltip: "Theme color for focused form input borders" },
      { name: "contactUsInputTextColorKey", label: "Input text", tooltip: "Theme color for entered form text" },
      { name: "contactUsBtnBgColorKey", label: "Button background", tooltip: "Theme color for Send Message button" },
      { name: "contactUsBtnTextColorKey", label: "Button text", tooltip: "Theme color for Send Message button text" },
    ],
  },
  Careers: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "titleEnabled", type: "switch", name: "careersTitleEnabled", label: "Show title", tooltip: "Show or hide the main title" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Open Positions" },
      { key: "subTitleEnabled", type: "switch", name: "careersSubTitleEnabled", label: "Show subtitle", tooltip: "Show or hide the subtitle" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above title", placeholder: "e.g. Careers" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the main title" },
      { name: "careersSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "careersJobTitleColorKey", label: "Job title color", tooltip: "Theme color for job title text" },
      { name: "careersMetaIconColorKey", label: "Meta icon color", tooltip: "Theme color for department/location/type icons" },
      { name: "careersMetaTextColorKey", label: "Meta text color", tooltip: "Theme color for department/location/type text" },
      { name: "careersBtnBgColorKey", label: "Button background", tooltip: "Theme color for Apply Now button background" },
      { name: "careersBtnTextColorKey", label: "Button text", tooltip: "Theme color for Apply Now button text" },
    ],
  },
  Alerts: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "titleEnabled", type: "switch", name: "alertsTitleEnabled", label: "Show title", tooltip: "Show or hide the main title" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Recognitions" },
      { key: "subTitleEnabled", type: "switch", name: "alertsSubTitleEnabled", label: "Show subtitle", tooltip: "Show or hide the subtitle" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above title", placeholder: "e.g. Awards" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the main title" },
      { name: "alertsSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "alertsIconColorKey", label: "Year color", tooltip: "Theme color for recognition years" },
      { name: "alertsHeadingColorKey", label: "Award title color", tooltip: "Theme color for recognition titles" },
      { name: "alertsTextColorKey", label: "Description color", tooltip: "Theme color for recognition descriptions" },
    ],
  },
  Newsletters: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "titleEnabled", type: "switch", name: "newslettersTitleEnabled", label: "Show title", tooltip: "Show or hide the main title" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Newsletters" },
      { key: "subTitleEnabled", type: "switch", name: "newslettersSubTitleEnabled", label: "Show subtitle", tooltip: "Show or hide the subtitle" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above title", placeholder: "e.g. Latest Updates" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the main title" },
      { name: "newslettersSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "newslettersCardBgColorKey", label: "Row background", tooltip: "Theme color for newsletter row border" },
      { name: "newslettersIconColorKey", label: "PDF icon color", tooltip: "Theme color for the PDF icon" },
      { name: "newslettersIconBgColorKey", label: "Icon background", tooltip: "Theme color for the PDF icon background" },
      { name: "newslettersTitleItemColorKey", label: "Item title color", tooltip: "Theme color for newsletter item titles" },
      { name: "newslettersDateColorKey", label: "Date & tag color", tooltip: "Theme color for date and tag text" },
      { name: "newslettersViewColorKey", label: "View text color", tooltip: "Theme color for the View button text" },
      { name: "newslettersViewBgColorKey", label: "View background", tooltip: "Theme color for the View button background" },
    ],
  },
  StoriesSlider: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "titleEnabled", type: "switch", name: "storiesSliderTitleEnabled", label: "Show title", tooltip: "Show or hide the main title" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Success Stories" },
      { key: "headingAccent", type: "input", name: "storiesSliderHeadingAccent", label: "Heading accent", tooltip: "Emphasized text after the main title", placeholder: "e.g. board." },
      { key: "subTitleEnabled", type: "switch", name: "storiesSliderSubTitleEnabled", label: "Show subtitle", tooltip: "Show or hide the subtitle" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above title", placeholder: "e.g. Our Impact" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the main title" },
      { name: "storiesSliderSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "storiesSliderNameColorKey", label: "Name color", tooltip: "Theme color for person name" },
      { name: "storiesSliderRoleColorKey", label: "Role text color", tooltip: "Theme color for role/title text" },
      { name: "storiesSliderQuoteColorKey", label: "Quote text color", tooltip: "Theme color for quote/story text" },
      { name: "storiesSliderArrowColorKey", label: "Arrow color", tooltip: "Theme color for prev/next arrows" },
      { name: "storiesSliderDotActiveColorKey", label: "Active dot color", tooltip: "Theme color for active dot indicator" },
      { name: "storiesSliderHeadingAccentColorKey", label: "Heading accent", tooltip: "Theme color for emphasized heading text" },
      { name: "storiesSliderLinkColorKey", label: "View all link", tooltip: "Theme color for the view all link" },
      { name: "storiesSliderCardBgColorKey", label: "Card background", tooltip: "Theme color for standard cards" },
      { name: "storiesSliderTintCardBgColorKey", label: "Tint card background", tooltip: "Theme color for tinted cards" },
      { name: "storiesSliderInkCardBgColorKey", label: "Dark card background", tooltip: "Theme color for dark cards" },
      { name: "storiesSliderInkCardTextColorKey", label: "Dark card text", tooltip: "Theme color for text on dark cards" },
      { name: "storiesSliderIndexColorKey", label: "Story index", tooltip: "Theme color for story index/category" },
      { name: "storiesSliderBorderColorKey", label: "Card borders", tooltip: "Theme color for card and navigation borders" },
      { name: "storiesSliderInkIndexColorKey", label: "Dark card index", tooltip: "Theme color for indexes on dark cards" },
      { name: "storiesSliderInkRoleColorKey", label: "Dark card role", tooltip: "Theme color for role text on dark cards" },
      { name: "storiesSliderButtonBgColorKey", label: "Arrow button background", tooltip: "Theme color for arrow button backgrounds" },
      { name: "storiesSliderButtonHoverBgColorKey", label: "Arrow hover background", tooltip: "Theme color for hovered arrow buttons" },
      { name: "storiesSliderButtonHoverIconColorKey", label: "Arrow hover icon", tooltip: "Theme color for hovered arrow icons" },
    ],
  },
  DonorTestimonials: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "titleEnabled", type: "switch", name: "donorTestimonialsTitleEnabled", label: "Show title", tooltip: "Show or hide the main title" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Donor Testimonials" },
      { key: "subTitleEnabled", type: "switch", name: "donorTestimonialsSubTitleEnabled", label: "Show subtitle", tooltip: "Show or hide the subtitle" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above title", placeholder: "e.g. What Our Donors Say" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the main title" },
      { name: "donorTestimonialsSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "donorTestimonialsQuoteIconColorKey", label: "Quote icon color", tooltip: "Theme color for the quote icon (default: red)" },
      { name: "donorTestimonialsQuoteTextColorKey", label: "Quote text color", tooltip: "Theme color for testimonial text" },
      { name: "donorTestimonialsNameColorKey", label: "Name color", tooltip: "Theme color for person name" },
      { name: "donorTestimonialsRoleColorKey", label: "Role color", tooltip: "Theme color for role/title text" },
    ],
  },
  Reports: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "titleEnabled", type: "switch", name: "reportsTitleEnabled", label: "Show title", tooltip: "Show or hide the main title" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Annual Reports" },
      { key: "subTitleEnabled", type: "switch", name: "reportsSubTitleEnabled", label: "Show subtitle", tooltip: "Show or hide the subtitle" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above title", placeholder: "e.g. Reports" },
    ],
    colorListItems: [
      { name: "reportsCardBgColorKey", label: "Card Background", tooltip: "Theme color for report card backgrounds" },
      { name: "reportsCardBorderColorKey", label: "Card Border", tooltip: "Theme color for report card borders" },
      { name: "reportsCardShadowColorKey", label: "Card Shadow", tooltip: "Theme color for report card shadows" },
      { name: "reportsNameColorKey", label: "Album Title", tooltip: "Theme color for report or album titles" },
      { name: "reportsDescriptionColorKey", label: "Album Description", tooltip: "Theme color for optional report or album descriptions" },
      { name: "reportsDateColorKey", label: "Date", tooltip: "Theme color for report or album dates" },
      { name: "reportsButtonBgColorKey", label: "View Album Button Background", tooltip: "Theme color for the card action button background" },
      { name: "reportsButtonTextColorKey", label: "View Album Button Text", tooltip: "Theme color for the card action button text" },
      { name: "reportsButtonBorderColorKey", label: "View Album Button Border", tooltip: "Theme color for the card action button border" },
      { name: "reportsButtonHoverBgColorKey", label: "Button Hover Background", tooltip: "Theme color for the card action button background on hover" },
      { name: "reportsButtonHoverTextColorKey", label: "Button Hover Text", tooltip: "Theme color for the card action button text on hover" },
      { name: "reportsButtonHoverBorderColorKey", label: "Button Hover Border", tooltip: "Theme color for the card action button border on hover" },
      { name: "reportsOverlayColorKey", label: "Card Overlay", tooltip: "Theme color for the card hover overlay" },
      { name: "reportsOverlayTextColorKey", label: "Card Overlay Text", tooltip: "Default theme color for text displayed over the card overlay" },
      { name: "reportsSectionBgColorKey", label: "Section Background", tooltip: "Theme color for the full reports section background" },
      { name: "titleColorKey", label: "Section Title", tooltip: "Theme color for the main section title" },
      { name: "reportsSubTitleColorKey", label: "Section Sub Title", tooltip: "Theme color for the section sub title" },
    ],
  },
  MissionVision: {
    titleListHeader: "Heading",
    titleListItems: [
      { key: "subtitle", type: "input", name: "subTitle", label: "Sub Title", tooltip: "Small heading shown above the section title", placeholder: "e.g. Our purpose" },
      { key: "main-title", type: "input", name: "mainTitle", label: "Title", tooltip: "Main section heading", placeholder: "e.g. Mission & Vision" },
      { key: "subtitle-enabled", type: "switch", name: "missionVisionSubTitleEnabled", label: "Show sub title", tooltip: "Show or hide the section sub title" },
      { key: "title-enabled", type: "switch", name: "missionVisionTitleEnabled", label: "Show title", tooltip: "Show or hide the section title" },
    ],
    colorListItems: [
      { name: "missionVisionSubTitleColorKey", label: "Sub title", tooltip: "Theme color for the section sub title" },
      { name: "missionVisionMainTitleColorKey", label: "Section title", tooltip: "Theme color for the section title" },
      { name: "missionVisionCardBgColorKey", label: "Card background", tooltip: "Theme color for both cards" },
      { name: "missionVisionCardHoverBgColorKey", label: "Card hover background", tooltip: "Theme color for cards on hover" },
      { name: "missionVisionCardBorderColorKey", label: "Card border", tooltip: "Theme color for card borders" },
      { name: "missionVisionCardHoverBorderColorKey", label: "Card hover border", tooltip: "Theme color for card borders on hover" },
      { name: "missionVisionIconColorKey", label: "Icon", tooltip: "Theme color for the icons" },
      { name: "missionVisionIconBgColorKey", label: "Icon background", tooltip: "Theme color behind the icons" },
      { name: "missionVisionIconHoverColorKey", label: "Icon hover", tooltip: "Theme color for icons on card hover" },
      { name: "missionVisionIconHoverBgColorKey", label: "Icon hover background", tooltip: "Theme background color behind icons on card hover" },
      { name: "missionVisionTitleColorKey", label: "Card titles", tooltip: "Theme color for Vision and Mission titles" },
      { name: "missionVisionTextColorKey", label: "Descriptions", tooltip: "Theme color for card descriptions" },
      { name: "missionVisionMobileColorKey", label: "Mobile number", tooltip: "Theme color for optional card mobile numbers" },
    ],
  },
  InnerPageHero: {
    titleListHeader: "Colors",
    titleListItems: [],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the banner title" },
      { name: "innerPageHeroAccentColorKey", label: "Highlighted/Accent Text", tooltip: "Theme color for text wrapped in asterisks in the banner title" },
      { name: "innerPageHeroGlowColorKey", label: "Background Glow Color", tooltip: "Theme color for the top-right background glow" },
      { name: "innerPageHeroDescriptionColorKey", label: "Description color", tooltip: "Theme color for the right-side description text" },
      { name: "innerPageHeroBreadcrumbColor1Key", label: "Breadcrumb Color 1", tooltip: "Theme color for Home icon/text and breadcrumb separator" },
      { name: "innerPageHeroBreadcrumbColor2Key", label: "Breadcrumb Color 2", tooltip: "Theme color for current-page breadcrumb text" },
    ],
  },
  InMedia: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "titleEnabled", type: "switch", name: "inMediaTitleEnabled", label: "Show title", tooltip: "Show or hide the main title" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. In Media" },
      { key: "subTitleEnabled", type: "switch", name: "inMediaSubTitleEnabled", label: "Show subtitle", tooltip: "Show or hide the subtitle" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above title", placeholder: "e.g. Media Coverage" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the main title" },
      { name: "inMediaSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "inMediaNameColorKey", label: "Card title color", tooltip: "Theme color for media card headline" },
      { name: "inMediaDateColorKey", label: "Date color", tooltip: "Theme color for card date text" },
    ],
  },
  Images: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "titleEnabled", type: "switch", name: "imagesTitleEnabled", label: "Show title", tooltip: "Show or hide the main title" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Section Title" },
      { key: "subTitleEnabled", type: "switch", name: "imagesSubTitleEnabled", label: "Show subtitle", tooltip: "Show or hide the subtitle" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above title", placeholder: "e.g. Subtitle" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the main title" },
      { name: "imagesSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
    ],
  },
  TitleParagraph: {
    titleListHeader: "Title Settings",
    titleListItems: [
      { key: "titleEnabled", type: "switch", name: "titleParagraphTitleEnabled", label: "Show title", tooltip: "Show or hide the main title" },
      { key: "mainTitle", type: "input", name: "titleParagraphMainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Life Saving Medical Aid (LSMA)" },
      { key: "subTitleEnabled", type: "switch", name: "titleParagraphSubTitleEnabled", label: "Show subtitle", tooltip: "Show or hide the subtitle" },
      { key: "subTitle", type: "input", name: "titleParagraphSubTitle", label: "Subtitle", tooltip: "Small heading above title", placeholder: "e.g. Our Programs" },
    ],
    colorListItems: [
      { name: "titleParagraphTitleColorKey", label: "Title color", tooltip: "Theme color for the main title" },
      { name: "titleParagraphSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "titleParagraphTextColorKey", label: "Text color", tooltip: "Theme color for paragraph text (also sets default editor text color)" },
    ],
  },
  Videogallery: {
    titleListHeader: "Heading",
    titleListItems: [
      { key: "subTitle", type: "input", name: "videogallerySubTitle", label: "Subtitle", tooltip: "Small uppercase label", placeholder: "Video Gallery" },
      { key: "mainTitle", type: "input", name: "videogalleryMainTitle", label: "Main title", tooltip: "Wrap accent text in *asterisks*", placeholder: "Watch, *then act.*" },
    ],
    colorListItems: [
      { name: "videogallerySubTitleColorKey", label: "Subtitle", tooltip: "Theme color for the subtitle" },
      { name: "videogalleryTitleColorKey", label: "Title", tooltip: "Theme color for the title" },
      { name: "videogalleryAccentColorKey", label: "Accent color", tooltip: "Theme color for arrows and navigation buttons" },
      { name: "videogalleryTabBgColorKey", label: "Active tab background", tooltip: "Theme color for active tab background" },
      { name: "videogalleryTabTextColorKey", label: "Active tab text", tooltip: "Theme color for active tab text" },
      { name: "videogalleryTabBorderColorKey", label: "Tab border", tooltip: "Theme color for tab border" },
      { name: "videogalleryTabInactiveTextColorKey", label: "Inactive tab text", tooltip: "Theme color for inactive tab text" },
      { name: "videogalleryTabHoverBorderColorKey", label: "Tab hover border", tooltip: "Theme color for tab border on hover" },
      { name: "videogalleryTabHoverTextColorKey", label: "Tab hover text", tooltip: "Theme color for tab text on hover" },
    ],
  },
  CommitteeMembers: {
    titleListHeader: "Heading",
    titleListItems: [
      { key: "subTitle", type: "input", name: "committeeMembersSubTitle", label: "Subtitle", tooltip: "Small uppercase label", placeholder: "e.g. The People" },
      { key: "mainTitle", type: "input", name: "committeeMembersMainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Committee Members" },
    ],
    colorListItems: [
      { name: "committeeMembersSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "committeeMembersTitleColorKey", label: "Title color", tooltip: "Theme color for the section title" },
      { name: "committeeMembersCardTitleColorKey", label: "Card title", tooltip: "Theme color for member names" },
      { name: "committeeMembersCardDescriptionColorKey", label: "Card description", tooltip: "Theme color for member roles and qualifications" },
      { name: "committeeMembersButtonBgColorKey", label: "Button background", tooltip: "Theme color for the View Profile button background" },
      { name: "committeeMembersButtonTextColorKey", label: "Button text", tooltip: "Theme color for the View Profile button text" },
      { name: "committeeMembersButtonBorderColorKey", label: "Button border", tooltip: "Theme color for the View Profile button border" },
      { name: "committeeMembersButtonHoverBgColorKey", label: "Button hover background", tooltip: "Theme color for the button background on hover" },
      { name: "committeeMembersButtonHoverTextColorKey", label: "Button hover text", tooltip: "Theme color for the button text on hover" },
      { name: "committeeMembersButtonHoverBorderColorKey", label: "Button hover border", tooltip: "Theme color for the button border on hover" },
      { name: "committeeMembersModalBgColorKey", label: "Modal background", tooltip: "Theme color for the profile modal background" },
      { name: "committeeMembersModalNameColorKey", label: "Modal name", tooltip: "Theme color for the member name in the modal" },
      { name: "committeeMembersModalQualificationColorKey", label: "Modal qualification", tooltip: "Theme color for the qualification in the modal" },
      { name: "committeeMembersModalRoleColorKey", label: "Modal role", tooltip: "Theme color for the member role in the modal" },
      { name: "committeeMembersModalBioColorKey", label: "Modal bio", tooltip: "Theme color for the profile description in the modal" },
      { name: "committeeMembersModalDividerColorKey", label: "Modal divider", tooltip: "Theme color for the divider above the profile description" },
      { name: "committeeMembersModalImageBorderColorKey", label: "Modal image border", tooltip: "Theme color for the profile image border" },
    ],
  },
  Team: {
    titleListHeader: "Heading",
    titleListItems: [
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small uppercase label", placeholder: "e.g. The People" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Team Members" },
    ],
    colorListItems: [
      { name: "subTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the section title" },
      { name: "cardTitleColorKey", label: "Card title", tooltip: "Theme color for member names" },
      { name: "cardDescriptionColorKey", label: "Card description", tooltip: "Theme color for member roles and qualifications" },
      { name: "buttonBgColorKey", label: "Button background", tooltip: "Theme color for the View Profile button background" },
      { name: "buttonTextColorKey", label: "Button text", tooltip: "Theme color for the View Profile button text" },
      { name: "buttonBorderColorKey", label: "Button border", tooltip: "Theme color for the View Profile button border" },
      { name: "buttonHoverBgColorKey", label: "Button hover background", tooltip: "Theme color for the button background on hover" },
      { name: "buttonHoverTextColorKey", label: "Button hover text", tooltip: "Theme color for the button text on hover" },
      { name: "buttonHoverBorderColorKey", label: "Button hover border", tooltip: "Theme color for the button border on hover" },
      { name: "modalBgColorKey", label: "Modal background", tooltip: "Theme color for the profile modal background" },
      { name: "modalNameColorKey", label: "Modal name", tooltip: "Theme color for the member name in the modal" },
      { name: "modalQualificationColorKey", label: "Modal qualification", tooltip: "Theme color for the qualification in the modal" },
      { name: "modalRoleColorKey", label: "Modal role", tooltip: "Theme color for the member role in the modal" },
      { name: "modalBioColorKey", label: "Modal bio", tooltip: "Theme color for the profile description in the modal" },
      { name: "modalDividerColorKey", label: "Modal divider", tooltip: "Theme color for the divider above the profile description" },
      { name: "modalImageBorderColorKey", label: "Modal image border", tooltip: "Theme color for the profile image border" },
    ],
  },
  TeamEmbed: {
    titleListHeader: "Heading",
    titleListItems: [
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small uppercase label", placeholder: "e.g. The People" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Team Members" },
    ],
    colorListItems: [
      { name: "subTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the section title" },
      { name: "cardTitleColorKey", label: "Card title", tooltip: "Theme color for member names" },
      { name: "cardDescriptionColorKey", label: "Card description", tooltip: "Theme color for member roles and qualifications" },
      { name: "buttonBgColorKey", label: "Button background", tooltip: "Theme color for the View Profile button background" },
      { name: "buttonTextColorKey", label: "Button text", tooltip: "Theme color for the View Profile button text" },
      { name: "buttonBorderColorKey", label: "Button border", tooltip: "Theme color for the View Profile button border" },
      { name: "buttonHoverBgColorKey", label: "Button hover background", tooltip: "Theme color for the button background on hover" },
      { name: "buttonHoverTextColorKey", label: "Button hover text", tooltip: "Theme color for the button text on hover" },
      { name: "buttonHoverBorderColorKey", label: "Button hover border", tooltip: "Theme color for the button border on hover" },
      { name: "modalBgColorKey", label: "Modal background", tooltip: "Theme color for the profile modal background" },
      { name: "modalNameColorKey", label: "Modal name", tooltip: "Theme color for the member name in the modal" },
      { name: "modalQualificationColorKey", label: "Modal qualification", tooltip: "Theme color for the qualification in the modal" },
      { name: "modalRoleColorKey", label: "Modal role", tooltip: "Theme color for the member role in the modal" },
      { name: "modalBioColorKey", label: "Modal bio", tooltip: "Theme color for the profile description in the modal" },
      { name: "modalDividerColorKey", label: "Modal divider", tooltip: "Theme color for the divider above the profile description" },
      { name: "modalImageBorderColorKey", label: "Modal image border", tooltip: "Theme color for the profile image border" },
    ],
  },
  SocialMediaWall: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "titleEnabled", type: "switch", name: "socialMediaWallTitleEnabled", label: "Show title", tooltip: "Show or hide the main title" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Social Media Wall" },
      { key: "subTitleEnabled", type: "switch", name: "socialMediaWallSubTitleEnabled", label: "Show subtitle", tooltip: "Show or hide the subtitle" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above title", placeholder: "e.g. Follow Us on Social Media" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the main title" },
      { name: "socialMediaWallSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
    ],
  },
  SocialWallFeed: {
    titleListHeader: "Section heading",
    titleListItems: [
      { key: "titleEnabled", type: "switch", name: "socialWallFeedTitleEnabled", label: "Show title", tooltip: "Show or hide the section title" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Section title", tooltip: "Main Social Wall heading", placeholder: "Media Social Wall" },
      { key: "subTitleEnabled", type: "switch", name: "socialWallFeedSubTitleEnabled", label: "Show sub title", tooltip: "Show or hide the small heading above the title" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Section sub title", tooltip: "Small heading above the section title", placeholder: "In the media" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Section title", tooltip: "Theme color for the section title" },
      { name: "socialWallFeedSubTitleColorKey", label: "Section sub title", tooltip: "Theme color for the section sub title" },
      { name: "socialWallFeedCardBgColorKey", label: "Card background", tooltip: "Theme color for card backgrounds" },
      { name: "socialWallFeedCardBorderColorKey", label: "Card border", tooltip: "Theme color for card borders" },
      { name: "socialWallFeedUserNameColorKey", label: "User name", tooltip: "Theme color for author names" },
      { name: "socialWallFeedHandleColorKey", label: "Username / handle", tooltip: "Theme color for account handles" },
      { name: "socialWallFeedPostTextColorKey", label: "Post text", tooltip: "Theme color for post captions" },
      { name: "socialWallFeedDateColorKey", label: "Date", tooltip: "Theme color for post dates" },
      { name: "socialWallFeedPlatformIconColorKey", label: "Platform icon", tooltip: "Theme color for social platform icons" },
      { name: "socialWallFeedButtonBgColorKey", label: "Button background", tooltip: "Theme color for card buttons" },
      { name: "socialWallFeedButtonTextColorKey", label: "Button text", tooltip: "Theme color for card button text" },
      { name: "socialWallFeedButtonHoverBgColorKey", label: "Button hover background", tooltip: "Theme color for card buttons on hover" },
      { name: "socialWallFeedButtonHoverTextColorKey", label: "Button hover text", tooltip: "Theme color for card button text on hover" },
    ],
  },
  OverviewOfOurWork: {
    titleListHeader: "Content",
    titleListItems: [
      { key: "subTitle", type: "input", name: "overviewOfOurWorkSubTitle", label: "Sub Title", tooltip: "Small uppercase label above the section heading", placeholder: "Our Works" },
      { key: "heading", type: "input", name: "overviewOfOurWorkHeading", label: "Heading", tooltip: "Main section heading", placeholder: "Four ways" },
      { key: "headingAccent", type: "input", name: "overviewOfOurWorkHeadingAccent", label: "Heading accent", tooltip: "Optional final phrase displayed after the heading", placeholder: "we serve." },
    ],
    colorListItems: [
      { name: "overviewOfOurWorkSubTitleColorKey", label: "Sub Title", tooltip: "Theme color for the section sub title" },
      { name: "overviewOfOurWorkHeadingColorKey", label: "Section heading", tooltip: "Theme color for the section heading" },
      { name: "overviewOfOurWorkCardTitleColorKey", label: "Card title", tooltip: "Theme color for card title text (default when not set per card)" },
      { name: "overviewOfOurWorkDescriptionColorKey", label: "Card description", tooltip: "Theme color for card description text" },
      { name: "overviewOfOurWorkCardBorderColorKey", label: "Card border", tooltip: "Theme color for card border" },
      { name: "overviewOfOurWorkButtonColorKey", label: "Button / link", tooltip: "Theme color for button text and icon" },
      { name: "overviewOfOurWorkIconHoverColorKey", label: "Icon hover color", tooltip: "Theme color applied to the icon when a card is hovered" },
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
  const config = TITLE_AND_COLORS_CONFIG[componentId] || getDefaultTitleAndColorsConfig();
  if (config.supportsTitleHighlight === false) return config;
  return {
    ...config,
    colorListItems: normalizeTitleHighlightColorItems(config.colorListItems),
  };
}

/** Default form/API props for title & color fields when creating a new component (so Title & Colors section is present). */
export function getDefaultTitleAndColorsProps(componentId) {
  const config = getTitleAndColorsConfig(componentId);
  const out = {};
  config.titleListItems.forEach((item) => {
    if (item.type === "input") out[item.name] = "";
    if (item.type === "switch") out[item.name] = true;
    if (item.type === "select") {
      if (item.defaultValue != null) out[item.name] = item.defaultValue;
      else if (Array.isArray(item.options) && item.options.length > 0) {
        out[item.name] =
          item.options[0]?.value != null ? item.options[0].value : "";
      } else out[item.name] = "";
    }
  });
  config.colorListItems.forEach((item) => {
    out[item.name] = "";
  });
  return out;
}

export { LIST_HEADER_STYLE };
