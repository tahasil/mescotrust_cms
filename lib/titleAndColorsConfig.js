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
      { key: "titleEnabled", type: "switch", name: "noticesTitleEnabled", label: "Show title", tooltip: "Show or hide the section title" },
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
    titleListHeader: "Settings",
    titleListItems: [],
    colorListItems: [
      { name: "photoGalleryAccentColorKey", label: "Accent color", tooltip: "Theme color for arrows and navigation buttons" },
      { name: "photoGalleryTabBgColorKey", label: "Active tab background", tooltip: "Theme color for active tab background" },
      { name: "photoGalleryTabTextColorKey", label: "Active tab text", tooltip: "Theme color for active tab text" },
      { name: "photoGalleryTabBorderColorKey", label: "Tab border", tooltip: "Theme color for tab border" },
      { name: "photoGalleryTabInactiveTextColorKey", label: "Inactive tab text", tooltip: "Theme color for inactive tab text" },
      { name: "photoGalleryTabHoverBorderColorKey", label: "Tab hover border", tooltip: "Theme color for tab border on hover" },
      { name: "photoGalleryTabHoverTextColorKey", label: "Tab hover text", tooltip: "Theme color for tab text on hover" },
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
