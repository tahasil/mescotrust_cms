/**
 * Per-component config for the shared "Title & Colors" accordion.
 * Same UI structure everywhere; fields are component-specific.
 * Used by TitleAndColorsSection and for default props when creating new components.
 */

const LIST_HEADER_STYLE = { fontSize: 13, fontWeight: 600, color: "rgba(0,0,0,0.65)" };

/** titleListItems: { type: "input"|"switch"|"select", name, label, tooltip, rules?, placeholder?, options?, defaultValue? }[] */
/** colorListItems: { name, label, tooltip }[] */
export const TITLE_AND_COLORS_CONFIG = {
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
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "subtitle", type: "input", name: "subscribeSubtitle", label: "Subtitle", tooltip: "Small text above title", placeholder: "e.g. Latest News" },
      { key: "title", type: "input", name: "subscribeTitle", label: "Title", tooltip: "Main heading", placeholder: "e.g. To get weekly updates" },
      { key: "accent", type: "input", name: "subscribeHeadingAccent", label: "Heading accent", tooltip: "Emphasized text after the main title", placeholder: "tomorrow." },
    ],
    colorListItems: [
      { name: "subscribeSubtitleColorKey", label: "Subtitle", tooltip: "Theme color for subtitle" },
      { name: "subscribeTitleColorKey", label: "Title", tooltip: "Theme color for title" },
      { name: "subscribeButtonBgColorKey", label: "Button background", tooltip: "Theme color for button" },
      { name: "subscribeButtonTextColorKey", label: "Button text", tooltip: "Theme color for button text" },
      { name: "subscribeAccentColorKey", label: "Heading accent", tooltip: "Theme color for the filled accent text" },
      { name: "subscribeOutlineColorKey", label: "Headline outline", tooltip: "Theme color for the unfilled headline outline" },
      { name: "subscribePrimaryButtonBgColorKey", label: "Primary CTA background", tooltip: "Theme color for the primary CTA" },
      { name: "subscribePrimaryButtonTextColorKey", label: "Primary CTA text", tooltip: "Theme color for the primary CTA text" },
      { name: "subscribeSecondaryButtonBgColorKey", label: "Secondary CTA background", tooltip: "Theme color for the secondary CTA" },
      { name: "subscribeSecondaryButtonTextColorKey", label: "Secondary CTA text", tooltip: "Theme color for the secondary CTA text" },
      { name: "subscribeInputBgColorKey", label: "Email input background", tooltip: "Theme color for the email input" },
      { name: "subscribeInputBorderColorKey", label: "Email input border", tooltip: "Theme color for the email input border" },
      { name: "subscribeInputTextColorKey", label: "Email input text", tooltip: "Theme color for the email input text" },
      { name: "subscribeFocusColorKey", label: "Email focus ring", tooltip: "Theme color for the focused email field" },
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
    titleListHeader: "Main Title",
    titleListItems: [
      {
        key: "mainTitle",
        type: "input",
        name: "mainTitle",
        label: "Title text",
        tooltip: "Heading shown above the lifecycle timeline",
        placeholder: "Internship lifecycle",
      },
    ],
    colorListItems: [
      {
        name: "internshiplifecycleCircleBgColorKey",
        label: "Circle background",
        tooltip: "Theme color used for the default circle background",
      },
      {
        name: "internshiplifecycleCircleHoverBgColorKey",
        label: "Circle hover background",
        tooltip: "Theme color used on hover and highlighted steps",
      },
      {
        name: "internshiplifecycleIconColorKey",
        label: "Icon color",
        tooltip: "Theme color used for the icon/image inside circles",
      },
      {
        name: "internshiplifecycleIconHoverColorKey",
        label: "Icon hover color",
        tooltip: "Theme color used for the icon/image on hover and highlighted steps",
      },
      {
        name: "titleColorKey",
        label: "Title color",
        tooltip: "Theme color for the section title",
      },
      {
        name: "internshiplifecycleDescriptionColorKey",
        label: "Description color",
        tooltip: "Theme color for step titles and descriptions",
      },
      {
        name: "internshiplifecycleConnectorColorKey",
        label: "Connector/line color",
        tooltip: "Theme color for the connector line between lifecycle circles",
      },
    ],
  },
  Volunteer: {
    titleListHeader: "Headings",
    titleListItems: [],
    colorListItems: [
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
      { name: "volunteerChecklistBgColorKey", label: "Right card background", tooltip: "Theme color for right card background" },
      { name: "volunteerChecklistCardBorderColorKey", label: "Right card border", tooltip: "Theme color for right card border" },
      { name: "volunteerChecklistTitleColorKey", label: "Right card title", tooltip: "Theme color for right card title" },
      { name: "volunteerChecklistTextColorKey", label: "Right card text", tooltip: "Theme color for right card description and bullets" },
      { name: "volunteerChecklistBulletColorKey", label: "Right card bullets", tooltip: "Theme color for right card bullet markers" },
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
      { key: "subtitle", type: "input", name: "eventsSliderSubTitle", label: "Subtitle", tooltip: "Small heading", placeholder: "e.g. Upcoming" },
      { key: "subtitleEnabled", type: "switch", name: "eventsSliderSubTitleEnabled", label: "Enable subtitle", tooltip: "Show or hide the subtitle" },
      { key: "mainTitle", type: "input", name: "eventsSliderMainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Events" },
      { key: "titleEnabled", type: "switch", name: "eventsSliderTitleEnabled", label: "Enable title", tooltip: "Show or hide the title" },
    ],
    colorListItems: [
      { name: "eventsSliderSubTitleColorKey", label: "Subtitle", tooltip: "Theme color for subtitle" },
      { name: "eventsSliderMainTitleColorKey", label: "Main title", tooltip: "Theme color for main title" },
      { name: "eventsSliderDateColorKey", label: "Slide date", tooltip: "Theme color for slide date" },
      { name: "eventsSliderDescColorKey", label: "Slide description", tooltip: "Theme color for slide description" },
      { name: "eventsSliderArrowColorKey", label: "Arrows", tooltip: "Theme color for prev/next arrows" },
      { name: "eventsSliderArrowBgColorKey", label: "Arrow background", tooltip: "Theme color for prev/next arrow button background" },
      { name: "eventsSliderDotActiveColorKey", label: "Active dot", tooltip: "Theme color for active dot" },
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
      { name: "noticesMetaColorKey", label: "Index and meta", tooltip: "Theme color for indexes and metadata" },
      { name: "noticesBorderColorKey", label: "Dividers", tooltip: "Theme color for row dividers" },
      { name: "noticesArrowColorKey", label: "Arrows", tooltip: "Theme color for row arrows" },
      { name: "noticesArrowHoverColorKey", label: "Arrow hover", tooltip: "Theme color for hovered arrows" },
      { name: "noticesLinkColorKey", label: "All notices link", tooltip: "Theme color for the footer link" },
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
    titleListHeader: "Buttons",
    titleListItems: [
      { key: "btn1Text", type: "input", name: "impactShowcaseButton1Text", label: "Button 1 text", tooltip: "Text for first button", placeholder: "e.g. Contact Us" },
      { key: "btn1Link", type: "input", name: "impactShowcaseButton1Link", label: "Button 1 link", tooltip: "URL for first button", placeholder: "e.g. /contact" },
      { key: "btn2Text", type: "input", name: "impactShowcaseButton2Text", label: "Button 2 text", tooltip: "Text for second button", placeholder: "e.g. Volunteer" },
      { key: "btn2Link", type: "input", name: "impactShowcaseButton2Link", label: "Button 2 link", tooltip: "URL for second button", placeholder: "e.g. /volunteer" },
    ],
    colorListItems: [
      { name: "impactShowcaseButton1BgColorKey", label: "Button 1 background", tooltip: "Theme color for first button background" },
      { name: "impactShowcaseButton1TextColorKey", label: "Button 1 text", tooltip: "Theme color for first button text" },
      { name: "impactShowcaseButton1HoverBgColorKey", label: "Button 1 hover background", tooltip: "Theme color for first button background on hover" },
      { name: "impactShowcaseButton1HoverTextColorKey", label: "Button 1 hover text", tooltip: "Theme color for first button text on hover" },
      { name: "impactShowcaseButton2BgColorKey", label: "Button 2 background", tooltip: "Theme color for second button background" },
      { name: "impactShowcaseButton2TextColorKey", label: "Button 2 text", tooltip: "Theme color for second button text" },
      { name: "impactShowcaseButton2HoverBgColorKey", label: "Button 2 hover background", tooltip: "Theme color for second button background on hover" },
      { name: "impactShowcaseButton2HoverTextColorKey", label: "Button 2 hover text", tooltip: "Theme color for second button text on hover" },
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
  AimsObjectives: {
    titleListHeader: "Title",
    titleListItems: [
      { key: "mainTitle", type: "input", name: "aimsObjectivesMainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Aims & Objectives" },
    ],
    colorListItems: [
      { name: "aimsObjectivesTitleColorKey", label: "Title color", tooltip: "Theme color for the title" },
      { name: "aimsObjectivesTextColorKey", label: "Items text color", tooltip: "Theme color for card text" },
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
    titleListHeader: "Title",
    titleListItems: [
      { key: "mainTitle", type: "input", name: "managingCommitteeMainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Managing Committee" },
    ],
    colorListItems: [
      { name: "managingCommitteeTitleColorKey", label: "Title color", tooltip: "Theme color for the title" },
      { name: "managingCommitteeTextColorKey", label: "Text color", tooltip: "Theme color for the paragraph text" },
    ],
  },
  Accordion: {
    titleListHeader: "Settings",
    titleListItems: [],
    colorListItems: [
      { name: "accordionHeaderColorKey", label: "Header text", tooltip: "Theme color for panel header text" },
      { name: "accordionContentColorKey", label: "Content text", tooltip: "Theme color for panel content text" },

      { name: "accordionBgColorKey", label: "Panel background", tooltip: "Theme color for panel background" },
    ],
  },
  PhotoGallery: {
    titleListHeader: "Gallery Heading",
    titleListItems: [
      { key: "subTitle", type: "input", name: "photoGallerySubTitle", label: "Sub Title", tooltip: "Small heading above the title", placeholder: "Image Gallery" },
      { key: "title", type: "input", name: "photoGalleryTitle", label: "Title", tooltip: "Main gallery heading", placeholder: "Moments from" },
      { key: "accent", type: "input", name: "photoGalleryHeadingAccent", label: "Heading accent", tooltip: "Emphasized heading text", placeholder: "the field." },
    ],
    colorListItems: [
      { name: "photoGalleryAccentColorKey", label: "Accent color", tooltip: "Theme color for arrows and navigation buttons" },
      { name: "photoGalleryNavButtonBgColorKey", label: "Navigation button background color", tooltip: "Theme color for hover navigation button background" },
      { name: "photoGalleryNavArrowColorKey", label: "Navigation arrow color", tooltip: "Theme color for hover navigation arrow/icon" },
      { name: "photoGalleryTabBgColorKey", label: "Active tab background", tooltip: "Theme color for active tab background" },
      { name: "photoGalleryTabTextColorKey", label: "Active tab text", tooltip: "Theme color for active tab text" },
      { name: "photoGalleryTabBorderColorKey", label: "Tab border", tooltip: "Theme color for tab border" },
      { name: "photoGalleryTabInactiveTextColorKey", label: "Inactive tab text", tooltip: "Theme color for inactive tab text" },
      { name: "photoGalleryTabHoverBorderColorKey", label: "Tab hover border", tooltip: "Theme color for tab border on hover" },
      { name: "photoGalleryTabHoverTextColorKey", label: "Tab hover text", tooltip: "Theme color for tab text on hover" },
      { name: "photoGallerySubTitleColorKey", label: "Sub Title", tooltip: "Theme color for the small heading" },
      { name: "photoGalleryTitleColorKey", label: "Title", tooltip: "Theme color for the main heading" },
      { name: "photoGalleryAccentTextColorKey", label: "Heading accent", tooltip: "Theme color for emphasized heading text" },
      { name: "photoGalleryLinkColorKey", label: "View gallery link", tooltip: "Theme color for the gallery link" },
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
      { name: "donateNowFormHeadingColorKey", label: "Form heading color", tooltip: "Theme color for Donate / Details headings" },
      { name: "donateNowPkgActiveColorKey", label: "Active package color", tooltip: "Theme color for selected donation package" },
      { name: "donateNowBtnBgColorKey", label: "Donate Now background", tooltip: "Theme color for Donate Now button background" },
      { name: "donateNowBtnTextColorKey", label: "Donate Now text", tooltip: "Theme color for Donate Now button text" },
      { name: "donateNowQrBtnBorderColorKey", label: "QR button border", tooltip: "Theme color for Donate Now with QR button border" },
      { name: "donateNowQrBtnTextColorKey", label: "QR button text", tooltip: "Theme color for Donate Now with QR button text" },
    ],
  },
  ContactUs: {
    titleListHeader: "Main Title",
    titleListItems: [
      { key: "titleEnabled", type: "switch", name: "contactUsTitleEnabled", label: "Show title", tooltip: "Show or hide the main title" },
      { key: "mainTitle", type: "input", name: "mainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Contact Us" },
      { key: "subTitleEnabled", type: "switch", name: "contactUsSubTitleEnabled", label: "Show subtitle", tooltip: "Show or hide the subtitle" },
      { key: "subTitle", type: "input", name: "subTitle", label: "Subtitle", tooltip: "Small heading above title", placeholder: "e.g. Get In Touch" },
    ],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the main title" },
      { name: "contactUsSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "contactUsFormHeadingColorKey", label: "Form heading color", tooltip: "Theme color for 'Send Us a Message' and 'Get in Touch' headings" },
      { name: "contactUsFormDescColorKey", label: "Form description color", tooltip: "Theme color for description text below headings" },
      { name: "contactUsIconColorKey", label: "Icon color", tooltip: "Theme color for contact info icons" },
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
      { name: "alertsIconColorKey", label: "Icon color", tooltip: "Theme color for the award/badge icon" },
      { name: "alertsHeadingColorKey", label: "Heading color", tooltip: "Theme color for alert card heading" },
      { name: "alertsTextColorKey", label: "Text color", tooltip: "Theme color for alert description text" },
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
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the main title" },
      { name: "reportsSubTitleColorKey", label: "Subtitle color", tooltip: "Theme color for the subtitle" },
      { name: "reportsNameColorKey", label: "Card title color", tooltip: "Theme color for report card title" },
    ],
  },
  InnerPageHero: {
    titleListHeader: "Colors",
    titleListItems: [],
    colorListItems: [
      { name: "titleColorKey", label: "Title color", tooltip: "Theme color for the banner title" },
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
    titleListHeader: "Settings",
    titleListItems: [],
    colorListItems: [
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
    titleListHeader: "Title",
    titleListItems: [
      { key: "mainTitle", type: "input", name: "committeeMembersMainTitle", label: "Main title", tooltip: "Section heading", placeholder: "e.g. Committee Members" },
    ],
    colorListItems: [
      { name: "committeeMembersTitleColorKey", label: "Title color", tooltip: "Theme color for the section title" },
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
  return TITLE_AND_COLORS_CONFIG[componentId] || getDefaultTitleAndColorsConfig();
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
