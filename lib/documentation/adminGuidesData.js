/**
 * MESCO Trust CMS — Comprehensive Admin Documentation Catalog
 * 
 * Formatted directly after official MESCO Trust Admin Panel Guides (PDF standards).
 * Provides authentic, numbered, step-by-step operating workflows for every CMS module.
 */

export const DOCUMENTATION_CATEGORIES = [
  { key: "all", label: "All Modules" },
  { key: "content", label: "Core & Content" },
  { key: "appearance", label: "Design & Appearance" },
  { key: "engagement", label: "Interactive & Engagement" },
  { key: "media", label: "Media & Assets" },
  { key: "admin", label: "Data, Settings & Security" },
];

export const ADMIN_MODULE_GUIDES = [
  // =========================================================================
  // 1. DASHBOARD
  // =========================================================================
  {
    id: "dashboard",
    aliases: ["overview"],
    title: "Dashboard Overview",
    documentTitle: "Dashboard Overview",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 1 · September 2026",
    category: "content",
    categoryLabel: "Core & Content",
    badge: "Mission Control",
    adminRoute: "/admin",
    icon: "DashboardOutlined",
    summary: "Real-time command center providing high-level operational statistics, recent content updates, and quick navigation across the CMS.",
    whoCanAccess: "Super Admin, Admin, Content Editor",
    frontendImpact: "Administrative overview monitoring live content across the website.",
    whereManaged: "The top-level landing screen in the admin sidebar at `/admin`.",
    tables: [
      {
        title: "Metrics Tracked on the Dashboard",
        headers: ["Metric Card", "What it tracks"],
        rows: [
          ["Pages", "Total CMS pages, showing the count of published vs draft pages."],
          ["Blog Posts", "Total news articles, field stories, and active published posts."],
          ["Blog Comments", "Reader comments awaiting approval or moderation."],
          ["Events", "Upcoming events, health camps, and active attendee registrations."],
          ["Users", "Active administrator and staff editor accounts."],
          ["Forms", "Active dynamic forms accepting citizen applications and inquiries."],
        ],
      },
    ],
    sections: [
      {
        title: "Monitoring site activity",
        steps: [
          "Click Dashboard at the very top of the left menu.",
          "Review the summary metric cards and trend curves at the top of the screen.",
          "Check the Recent Updates feed to see which pages or posts were recently modified and by whom.",
          "Check the notification bell in the top-right corner for pending inquiries or registrations.",
        ],
      },
    ],
    callouts: [
      {
        type: "note",
        text: "The Dashboard provides an instant operational pulse. Changes made by teammates are logged in Recent Updates before they go live on the public site.",
      },
    ],
    keepInMind: [
      "Counts on the dashboard update automatically when new records are saved.",
      "Clicking any metric card takes you straight to that module's management screen.",
      "If counts ever seem delayed, refresh your browser to fetch fresh server metrics.",
    ],
  },

  // =========================================================================
  // 2. PAGES (PAGE BUILDER & PUBLISHING)
  // =========================================================================
  {
    id: "pages",
    aliases: ["page-publishing", "page-builder"],
    title: "Page Publishing (Page Builder)",
    documentTitle: "Page Publishing",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 21 · September 2026",
    category: "content",
    categoryLabel: "Core & Content",
    badge: "Visual Block Engine",
    adminRoute: "/admin/pages",
    icon: "FileTextOutlined",
    summary: "Create and publish website pages, configure modular site components, and manage page URLs.",
    whoCanAccess: "Super Admin, Admin, Content Editor",
    frontendImpact: "Directly controls all public website pages (Home, About Us, Careers, FAQs, Programs, etc.).",
    whereManaged: "Pages in the left menu, leading to the Page Builder canvas for individual pages.",
    tables: [
      {
        title: "Draft and Published",
        subtitle: "Every page sits in one of two states, set from the Status dropdown in the page settings:",
        headers: ["Status", "What it means"],
        rows: [
          ["Draft", "The page is stored in the system but is not shown on the website. Visitors get a not-found page if they type its address."],
          ["Published", "The page is live and anybody can reach it. Saving the page while the status is set to Published is what puts it online."],
        ],
      },
    ],
    sections: [
      {
        title: "Creating a new page",
        steps: [
          "Go to Pages in the left menu, then New Page.",
          "Type the title as it should appear on the site, for example Annual Report 2025.",
          "Type the slug. This is the address of the page. For a page inside a folder, use a slash, for example media/annual-report-2025.",
          "Leave the status as Draft for now.",
          "Press Save. The page is created and you land in the page builder.",
          "Build the page with Add block, then press Save again when you are done.",
        ],
      },
      {
        title: "Editing a page that already exists",
        steps: [
          "Go to Pages and click the title of the page.",
          "Make the changes you need.",
          "Press Save.",
        ],
      },
      {
        title: "Publishing a page",
        paragraph: "The page goes online the moment you save. There is nothing else to press.",
        steps: [
          "Open the page from Pages.",
          "Open the settings panel using the gear icon at the top of the screen.",
          "Change Status from Draft to Published.",
          "Press Update, or close the panel and press Save.",
        ],
      },
      {
        title: "Taking a page offline again",
        paragraph: "The page disappears from the website but nothing is lost. Put it back at any time by setting the status to Published again.",
        steps: [
          "Open the page from Pages.",
          "In the settings panel, change Status back to Draft.",
          "Press Update or Save.",
        ],
      },
      {
        title: "Deleting a page",
        steps: [
          "From the Pages list, click the bin icon beside the page.",
          "Confirm the deletion.",
        ],
      },
    ],
    callouts: [
      {
        type: "warning",
        text: "A deleted page cannot be brought back from the admin panel. If you only want a page out of the way for a while, switch it to Draft instead of deleting it.",
      },
    ],
    keepInMind: [
      "Publishing a page does not put it in the navigation bar. That is done separately under Menus.",
      "Nothing shows on the website until Save is pressed.",
      "If a page is missing from the site, check the status first. A draft is saved but stays hidden.",
      "If the Save button is not showing, the account cannot edit pages. Please ask an administrator.",
    ],
  },

  // =========================================================================
  // 3. COMPONENTS
  // =========================================================================
  {
    id: "components",
    aliases: ["site-components"],
    title: "Components Platform",
    documentTitle: "Components Platform",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 11 · September 2026",
    category: "appearance",
    categoryLabel: "Design & Appearance",
    badge: "Component Platform",
    adminRoute: "/admin/components",
    icon: "AppstoreOutlined",
    summary: "Browse modular site components, inspect live previews, and customize global default props.",
    whoCanAccess: "Super Admin, Admin",
    frontendImpact: "Powers every modular block rendered on pages across the website.",
    whereManaged: "Components in the left menu.",
    tables: [
      {
        title: "Primary Site Component Groups",
        headers: ["Group", "Component IDs", "Purpose"],
        rows: [
          ["Hero Sections", "HomeHero, HomeHero2, InnerPageHero", "Eye-catching page headers with call-to-action buttons."],
          ["Impact & Statistics", "OverviewOfOurWork, OurImpact, ImpactShowcase", "Key metric counters, milestone grids, and mission summaries."],
          ["Content Blocks", "Accordion, Faqs, TitleParagraph, Cards", "Information layout blocks with collapsible panels."],
          ["Forms & Shortcodes", "FormEmbed, TeamEmbed, ShortCode", "Dynamic embed points for forms, sliders, and leadership rosters."],
        ],
      },
    ],
    sections: [
      {
        title: "Browsing and customizing component defaults",
        steps: [
          "Open Components in the left menu.",
          "Browse the cards or use the search bar to locate the component you need.",
          "Click Edit Defaults to open the properties drawer.",
          "Change the fallback headings, button labels, or theme color accents.",
          "Press Save Defaults to apply baseline settings for future pages.",
        ],
      },
    ],
    callouts: [
      {
        type: "note",
        text: "Editing a component's global defaults sets the baseline for new pages. Pages that have already customized their own block props will retain their custom content.",
      },
    ],
    keepInMind: [
      "Components are modular: you can stack as many as you need on any page in the Page Builder.",
      "Check the live scale preview in the Components screen before adding a block to a live page.",
    ],
  },

  // =========================================================================
  // 4. APPEARANCE: HEADER
  // =========================================================================
  {
    id: "appearance-header",
    aliases: ["header"],
    title: "Appearance: Header",
    documentTitle: "Header Settings",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 4 · September 2026",
    category: "appearance",
    categoryLabel: "Design & Appearance",
    badge: "Global Header",
    adminRoute: "/admin/appearance/header",
    icon: "InsertRowAboveOutlined",
    summary: "Manage the global website header: brand logo, sticky navbar behavior, emergency banner, and membership button.",
    whoCanAccess: "Super Admin, Admin",
    frontendImpact: "Visible at the very top of every public page on the website.",
    whereManaged: "Appearance → Header in the left menu.",
    tables: [
      {
        title: "Header Configuration Options",
        headers: ["Option", "What to enter"],
        rows: [
          ["Light Logo", "Logo with light/white lettering used over dark or transparent hero banners."],
          ["Dark Logo", "Logo with dark lettering used when the header sticks on white background."],
          ["Sticky Header", "Toggle switch to make the header float at the top while users scroll."],
          ["Membership CTA", "Enable or disable the prominent Membership button, set its text and link."],
        ],
      },
    ],
    sections: [
      {
        title: "Updating the website header",
        steps: [
          "Open Appearance → Header in the left menu.",
          "Upload or pick your Light and Dark logo files from the Media Library.",
          "Set the Logo Max Height slider (recommended 50px to 65px).",
          "Turn on Sticky Header if you want the menu to stay visible as visitors scroll down.",
          "Under Action Buttons, customize the Membership button text (e.g. Membership or Join Us) and link URL.",
          "Press Save Header Settings at the bottom of the screen.",
        ],
      },
    ],
    callouts: [
      {
        type: "tip",
        text: "Always upload logos in transparent PNG, WebP, or SVG format to prevent ugly white box backgrounds on transparent headers.",
      },
    ],
    keepInMind: [
      "Header changes update the top of every page immediately upon pressing Save.",
      "Keep navigation labels short to avoid crowding the header on smaller laptop screens.",
    ],
  },

  // =========================================================================
  // 5. APPEARANCE: HEADER RIBBON
  // =========================================================================
  {
    id: "appearance-header-ribbon",
    aliases: ["header-ribbon", "ribbon"],
    title: "Appearance: Header Ribbon",
    documentTitle: "Header Ribbon (Announcement Bar)",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 5 · September 2026",
    category: "appearance",
    categoryLabel: "Design & Appearance",
    badge: "Announcement Bar",
    adminRoute: "/admin/appearance/header-ribbon",
    icon: "NotificationOutlined",
    summary: "Manage the top announcement bar above the main header for breaking news, urgent campaigns, and event notices.",
    whoCanAccess: "Super Admin, Admin",
    frontendImpact: "Pins a thin notice strip at the absolute top of the public website.",
    whereManaged: "Appearance → Header Ribbon in the left menu.",
    tables: [
      {
        title: "Ribbon Field Controls",
        headers: ["Field", "What to enter"],
        rows: [
          ["Enable Switch", "Master on/off switch to display or hide the ribbon site-wide."],
          ["Message Text", "The announcement sentence shown to all visitors."],
          ["Link URL & Label", "Optional button (e.g. Donate Now) pointing to a target page."],
          ["Colors", "Background tint (e.g. Gold, Red, Blue) and contrasting text color."],
        ],
      },
    ],
    sections: [
      {
        title: "Activating the announcement ribbon",
        steps: [
          "Open Appearance → Header Ribbon in the left menu.",
          "Set the master switch to ON.",
          "Type your announcement in the Message field (e.g. Winter Relief Appeal 2026 is now live).",
          "Enter a Button Label (e.g. Support Today) and link URL (e.g. /donate).",
          "Pick your background and text color.",
          "Press Save Ribbon Settings.",
        ],
      },
    ],
    callouts: [
      {
        type: "note",
        text: "When a campaign ends, turn the master switch to OFF. The ribbon will disappear instantly without deleting your configured message.",
      },
    ],
    keepInMind: [
      "Keep announcement text under 80 characters so it fits on mobile phone screens.",
      "The ribbon sits directly above the header and does not obscure the logo.",
    ],
  },

  // =========================================================================
  // 6. APPEARANCE: FOOTER
  // =========================================================================
  {
    id: "appearance-footer",
    aliases: ["footer"],
    title: "Appearance: Footer",
    documentTitle: "Footer Settings",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 6 · September 2026",
    category: "appearance",
    categoryLabel: "Design & Appearance",
    badge: "Global Footer",
    adminRoute: "/admin/appearance/footer",
    icon: "InsertRowBelowOutlined",
    summary: "Configure the multi-column global footer: organizational mission, quick links, social media handles, address, and 80G tax notice.",
    whoCanAccess: "Super Admin, Admin",
    frontendImpact: "Rendered at the bottom of every public page.",
    whereManaged: "Appearance → Footer in the left menu.",
    tables: [
      {
        title: "Footer Sections",
        headers: ["Column", "Contents"],
        rows: [
          ["Column 1 (About)", "Brief organizational summary and footer logo."],
          ["Column 2 (Quick Links)", "Selected navigation menu linking to core informational pages."],
          ["Column 3 (Programs)", "Selected navigation menu linking to medical, educational, and relief initiatives."],
          ["Column 4 (Contact)", "Official headquarters address, phone numbers, and support email."],
          ["Statutory & Legal", "80G registration number, copyright notice, and social media handles."],
        ],
      },
    ],
    sections: [
      {
        title: "Updating footer content",
        steps: [
          "Open Appearance → Footer in the left menu.",
          "Update the address, support phone, and email in the Contact section.",
          "Verify that social media profile links (Facebook, Instagram, YouTube, X, LinkedIn) are accurate.",
          "Check the 80G tax exemption disclosure notice.",
          "Press Save Footer Settings.",
        ],
      },
    ],
    callouts: [
      {
        type: "note",
        text: "Social media icons will only render in the footer if a non-empty URL is provided in the social handles section.",
      },
    ],
    keepInMind: [
      "The footer menus are maintained under Appearance → Menu.",
      "Always verify that external links begin with https://.",
    ],
  },

  // =========================================================================
  // 7. APPEARANCE: NAVIGATION MENU
  // =========================================================================
  {
    id: "menus",
    aliases: ["appearance-menu", "navigation-menu"],
    title: "Navigation Menu",
    documentTitle: "Navigation Menu",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 9 · September 2026",
    category: "appearance",
    categoryLabel: "Design & Appearance",
    badge: "Navigation Architecture",
    adminRoute: "/admin/menus",
    icon: "MenuOutlined",
    summary: "Manage the multi-level navigation tree. Create menus, nest dropdown sub-items, and arrange navbar links.",
    whoCanAccess: "Super Admin, Admin",
    frontendImpact: "Controls the main desktop navigation bar, mobile drawer menu, and footer links.",
    whereManaged: "Appearance → Menu in the left menu.",
    tables: [
      {
        title: "Field Controls for Menu Items",
        headers: ["Field", "What to enter"],
        rows: [
          ["Navigation Label", "The text visitors will see, for example About Us."],
          ["Type", "Page, Custom Link or Modal. See the notes below."],
          ["Page", "Shown when the type is Page. Pick the page from the list and the address fills in by itself."],
          ["URL", "Shown when the type is Custom Link. Type the full web address."],
          ["PDF Link / Document", "Shown when the type is Modal. Pick a PDF from the media library; it opens in a popup rather than leaving the page."],
          ["Target", "Whether the link opens in the same tab or a new one."],
        ],
      },
    ],
    sections: [
      {
        title: "Where the navigation is managed",
        paragraph: "The header and footer navigation are maintained under Menus. The screen has two levels. The first lists every menu, such as Primary Menu and Footer Menu, together with how many items each one holds. Opening a menu takes you to its structure, where items are added and arranged.",
        steps: [
          "Open Menus and click the menu you want to change.",
          "Press Add Menu, the dashed button near the bottom of the list.",
          "An item called New item is added. Click the small arrow on its left to expand it.",
          "Fill in the fields listed in the table above.",
          "Press Save menu.",
        ],
      },
      {
        title: "Changing the order",
        steps: [
          "Drag an item up or down to move it.",
          "Dragging an item below another one turns it into a sub-item, so it shows as a dropdown when the menu is opened.",
          "The right arrow moves an item into the dropdown to its left. The left arrow brings it back out.",
          "Press Save menu once the order is right. Until you do, the new order is not applied.",
        ],
      },
      {
        title: "Removing an item",
        steps: [
          "Expand the item, press the bin icon, then press Save menu.",
          "To remove several at once, tick the boxes on the left and choose Remove selected.",
        ],
      },
      {
        title: "Working with whole menus",
        paragraph: "Back on the first screen a menu can be copied, which is the quickest way to build a similar set of links, or deleted completely.",
      },
    ],
    callouts: [
      {
        type: "warning",
        text: "Publishing a page does not automatically put it in the navigation bar. That must be done here under Menus.",
      },
    ],
    keepInMind: [
      "Use the type Page for anything on this website. The link then keeps working even if the page address is changed later.",
      "Use Custom Link only for outside addresses such as WhatsApp or another domain.",
      "If an item has been added but is not showing, the usual reason is that Save menu was not pressed.",
      "The header and the footer are separate menus, so an item added to one does not appear in the other.",
    ],
  },

  // =========================================================================
  // 8. APPEARANCE: CHATBOT
  // =========================================================================
  {
    id: "chatbot",
    aliases: ["appearance-chatbot"],
    title: "Appearance: Chatbot",
    documentTitle: "Chatbot (Virtual Assistant)",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 8 · September 2026",
    category: "engagement",
    categoryLabel: "Interactive & Engagement",
    badge: "Virtual Assistant",
    adminRoute: "/admin/chatbot",
    icon: "RobotOutlined",
    summary: "Configure the floating AI/FAQ conversational chatbot widget: decision-tree questions, responses, and support routing.",
    whoCanAccess: "Super Admin, Admin",
    frontendImpact: "Floating interactive chat widget at the bottom corner of the public website.",
    whereManaged: "Appearance → Chatbot in the left menu.",
    tables: [
      {
        title: "Chatbot Decision Tree Elements",
        headers: ["Element", "What it does"],
        rows: [
          ["Root Question", "High-level prompt displayed in the greeting menu (e.g. How can I donate?)."],
          ["Child / Sub-Question", "Follow-up question branching out when a user selects a parent node."],
          ["Bot Response", "Formatted rich text answer with bullet points and page hyperlinks."],
          ["Contact Routing", "Buttons allowing visitors to call, email, or WhatsApp representatives directly."],
        ],
      },
    ],
    sections: [
      {
        title: "Adding a question to the chatbot",
        steps: [
          "Open Appearance → Chatbot in the left menu.",
          "Click the + Add Question button.",
          "Type the visitor inquiry in the Question field.",
          "Type the answer in the Response editor with links to relevant website pages.",
          "Select a Parent Question if this is a follow-up, or leave blank for the top-level menu.",
          "Set Status to Active and press Save Question.",
        ],
      },
    ],
    callouts: [
      {
        type: "tip",
        text: "Keep chatbot answers under 3 short sentences with direct links to the relevant website section.",
      },
    ],
    keepInMind: [
      "The chatbot only displays questions marked Active.",
      "Ensure official WhatsApp and support phone numbers are configured in General Settings.",
    ],
  },

  // =========================================================================
  // 9. APPEARANCE: SOCIAL WALL
  // =========================================================================
  {
    id: "social-wall",
    aliases: ["appearance-social-wall"],
    title: "Appearance: Social Wall",
    documentTitle: "Social Media Wall",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 11 · September 2026",
    category: "engagement",
    categoryLabel: "Interactive & Engagement",
    badge: "Social Wall",
    adminRoute: "/admin/social-wall",
    icon: "ShareAltOutlined",
    summary: "Aggregate, moderate, and showcase social media posts from Instagram, Facebook, YouTube, and X in an interactive grid or carousel.",
    whoCanAccess: "Super Admin, Admin",
    frontendImpact: "Displayed on any page using the SocialMediaWall or SocialWallFeed component.",
    whereManaged: "Appearance → Social Wall in the left menu.",
    tables: [
      {
        title: "Supported Platforms",
        headers: ["Platform", "Connection Type"],
        rows: [
          ["Instagram", "Instagram Graph API User Token."],
          ["Facebook", "Facebook Page Access Token."],
          ["YouTube", "YouTube Data API v3 Channel ID."],
          ["X (Twitter)", "X API Bearer Token."],
        ],
      },
    ],
    sections: [
      {
        title: "Connecting accounts and moderating posts",
        steps: [
          "Open Appearance → Social Wall in the left menu.",
          "Under Platform Accounts, paste your official API token or key.",
          "Click Fetch Latest Posts to pull recent posts into the moderation queue.",
          "Switch to the Moderation tab: click Approve on posts you want displayed publicly.",
          "To display the wall, add the SocialMediaWall component to any page in the Page Builder.",
        ],
      },
    ],
    callouts: [
      {
        type: "note",
        text: "Only posts marked 'Approved' appear on the public website. Pending or Rejected posts remain safely hidden.",
      },
    ],
    keepInMind: [
      "Tokens expire periodically; update credentials whenever feeds pause updating.",
      "Social posts are cached locally to keep website page loading fast.",
    ],
  },

  // =========================================================================
  // 10. FORM BUILDER
  // =========================================================================
  {
    id: "form-builder",
    aliases: ["forms"],
    title: "Form Builder",
    documentTitle: "Form Builder",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 10 · September 2026",
    category: "engagement",
    categoryLabel: "Interactive & Engagement",
    badge: "Dynamic Form Creator",
    adminRoute: "/admin/form-builder",
    icon: "FormOutlined",
    summary: "Create custom dynamic forms with drag-and-drop fields, validation rules, shortcode embedding, and submission tracking.",
    whoCanAccess: "Super Admin, Admin, Content Editor",
    frontendImpact: "Embeddable on any page via the FormEmbed component or shortcode.",
    whereManaged: "Form Builder in the left menu.",
    tables: [
      {
        title: "Supported Form Fields",
        headers: ["Field Type", "Usage"],
        rows: [
          ["Text / Name", "Single-line input for applicant names or short answers."],
          ["Email & Phone", "Validated inputs for contact communication."],
          ["Dropdown / Radio", "Single-choice selection from predefined options."],
          ["Checkboxes", "Multi-choice options (e.g. areas of interest)."],
          ["File Upload", "Document attachments (marksheet PDF, identity proofs)."],
          ["Text Area", "Multi-line input for statements of purpose or detailed inquiries."],
        ],
      },
    ],
    sections: [
      {
        title: "Creating a form and embedding it",
        steps: [
          "Open Form Builder in the left menu and click + Create Form.",
          "Enter a Form Name (e.g. Scholarship Application 2026).",
          "Click + Add Field to add input fields and toggle Required for mandatory fields.",
          "Under Form Actions, customize the Submit Button text and success thank-you message.",
          "Set the status to Published and click Save Form.",
          "Copy the shortcode (e.g. [shortcode=\"form-123\"]) or add the FormEmbed component in Pages.",
        ],
      },
      {
        title: "Viewing and exporting form responses",
        steps: [
          "In the Form Builder list, click the Submissions button beside your form.",
          "Review applicant submissions in the table.",
          "Click Export to Excel / CSV to download the complete spreadsheet.",
        ],
      },
    ],
    callouts: [
      {
        type: "warning",
        text: "Only forms with status Published will accept submissions on the live website. Draft forms will display an administrative preview notice.",
      },
    ],
    keepInMind: [
      "Always include an Email field marked as Required so you can reply to applicants.",
      "Limit file upload sizes in field settings to keep file storage manageable.",
    ],
  },

  // =========================================================================
  // 11. SLIDERS
  // =========================================================================
  {
    id: "sliders",
    aliases: ["home-slider", "homepage-slider"],
    title: "Homepage Slider",
    documentTitle: "Homepage Slider",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 7 · September 2026",
    category: "appearance",
    categoryLabel: "Design & Appearance",
    badge: "Hero Carousels",
    adminRoute: "/admin/sliders",
    icon: "SlidersOutlined",
    summary: "Manage full-width visual carousels: Home Slider, Circular Slider, Stories Slider, and Events Slider.",
    whoCanAccess: "Super Admin, Admin",
    frontendImpact: "Controls the main revolving banner on the Homepage and inner program pages.",
    whereManaged: "Sliders in the left menu.",
    tables: [
      {
        title: "The sliders available in the panel",
        subtitle: "Four sliders are managed from one screen, Sliders:",
        headers: ["Slider", "Component ID"],
        rows: [
          ["Home Slider", "HomeSlider"],
          ["Circular Slider", "ImageSlider"],
          ["Stories Slider", "StoriesSlider"],
          ["Events Slider", "EventsSlider"],
        ],
      },
    ],
    sections: [
      {
        title: "Changing the slides",
        steps: [
          "Open Sliders in the left menu.",
          "Find the row for the slider you want and press Edit.",
          "Change the images, captions or links.",
          "Press Save. The change is on the website straight away.",
        ],
      },
      {
        title: "Hiding a slider",
        paragraph: "Each row has a switch under Status. Turn it off and the slider is removed from the page without deleting anything. Turn it back on to restore it.",
      },
      {
        title: "When a shortcode is used instead",
        paragraph: "A shortcode is a short piece of text, for example [shortcode=\"HomeSlider\"], placed inside a ShortCode block on a page. The block then shows whatever content that shortcode points at.",
      },
      {
        title: "A shortcode only points at something",
        paragraph: "A shortcode does not hold any content of its own. It simply says which module to show. The content stays where it was created, and that is the only place it can be edited from. You cannot edit a slide inside a shortcode block on a page, and if you try, the change will not save.",
      },
      {
        title: "Why a component can seem to disappear",
        paragraph: "When a normal block is swapped for a shortcode, the page no longer holds the original block, so the component is not listed there any more. Nothing has been deleted. It can still be found on its own screen, which in this case is Sliders, or in the Components list.",
      },
      {
        title: "When a shortcode is the right choice",
        paragraph: "Use one only when the same content needs to appear on more than one page. If it is needed on a single page, add the component to that page directly. Putting a shortcode and a normal block for the same content on one page will show it twice.",
      },
    ],
    callouts: [
      {
        type: "warning",
        text: "Change slider content from the Sliders screen, never from inside a page block. Shortcodes have to be unique; two galleries or sliders cannot share one.",
      },
    ],
    keepInMind: [
      "Change slider content from the Sliders screen, never from a page.",
      "Galleries, teams and forms each have a shortcode too. The same rule applies to all of them.",
      "If a slide you changed earlier is not showing, check that the slider is still switched on.",
      "Shortcodes have to be unique. Two galleries cannot share one.",
    ],
  },

  // =========================================================================
  // 12. POPUPS
  // =========================================================================
  {
    id: "popups",
    title: "Popups",
    documentTitle: "Popups & Modals",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 12 · September 2026",
    category: "engagement",
    categoryLabel: "Interactive & Engagement",
    badge: "Smart Popups",
    adminRoute: "/admin/popups",
    icon: "BorderOutlined",
    summary: "Create and schedule modal popups for emergency relief appeals, seasonal donation drives, and vital alerts.",
    whoCanAccess: "Super Admin, Admin",
    frontendImpact: "Appears as an overlay popup dialog when visitors browse the website.",
    whereManaged: "Popups in the left menu.",
    tables: [
      {
        title: "Popup Trigger Settings",
        headers: ["Trigger Type", "Behavior"],
        rows: [
          ["Time Delay", "Appears after visitor has browsed for X seconds (recommended 3 to 5 seconds)."],
          ["Scroll Percentage", "Triggers after scrolling 50% down the page."],
          ["Exit Intent", "Triggers when visitor moves mouse towards closing the browser tab."],
          ["Frequency Capping", "Show once per session, once per day, or every page view."],
        ],
      },
    ],
    sections: [
      {
        title: "Creating a popup appeal",
        steps: [
          "Open Popups in the left menu and click + Add Popup.",
          "Enter an internal title (e.g. Ramadan Relief Appeal 2026).",
          "Upload a compelling banner photo and write the announcement headline.",
          "Add a primary button (e.g. Donate Now) with target link /donate.",
          "Set Trigger to Time Delay (3 seconds) and Frequency to Once per session.",
          "Set Status to Published and press Save Popup.",
        ],
      },
    ],
    callouts: [
      {
        type: "tip",
        text: "Always test popups on a smartphone screen to verify that the Close (X) button is clearly visible and easy to tap.",
      },
    ],
    keepInMind: [
      "Set start and end dates for seasonal appeals so popups turn off automatically.",
      "Draft popups never trigger on the live website.",
    ],
  },

  // =========================================================================
  // 13. PUSH NOTIFICATIONS
  // =========================================================================
  {
    id: "push-notifications",
    title: "Push Notifications",
    documentTitle: "Push Notifications",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 13 · September 2026",
    category: "engagement",
    categoryLabel: "Interactive & Engagement",
    badge: "Browser Broadcasts",
    adminRoute: "/admin/push-notifications",
    icon: "BellOutlined",
    summary: "Broadcast web push notifications to subscribed desktop and mobile visitors using VAPID signing.",
    whoCanAccess: "Super Admin, Admin",
    frontendImpact: "Delivers native notification alerts to users who opted in on the website.",
    whereManaged: "Push Notifications in the left menu.",
    tables: [
      {
        title: "Notification Campaign Fields",
        headers: ["Field", "What to enter"],
        rows: [
          ["Notification Title", "Crisp headline under 45 characters."],
          ["Message Body", "Concise message describing the update or appeal."],
          ["Icon Image", "Square brand icon (192x192 PNG)."],
          ["Destination URL", "Full web address visitors open when clicking the alert."],
        ],
      },
    ],
    sections: [
      {
        title: "Broadcasting a notification",
        steps: [
          "Open Push Notifications in the left menu.",
          "Check the Active Subscribers count to see your reach.",
          "Click + Create Notification.",
          "Fill in the title, body, square icon, and landing URL.",
          "Review the preview on the right.",
          "Click Send Broadcast Now and confirm in the alert dialog.",
        ],
      },
    ],
    callouts: [
      {
        type: "note",
        text: "Visitors subscribe through the notification bell on the public website without needing to enter an email address.",
      },
    ],
    keepInMind: [
      "Broadcast notifications are transmitted immediately to active subscribers.",
      "Avoid sending too frequently; 1 to 2 important notifications per week works best.",
    ],
  },

  // =========================================================================
  // 14. TEAM
  // =========================================================================
  {
    id: "team",
    title: "Team & Leadership",
    documentTitle: "Team Management",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 14 · September 2026",
    category: "media",
    categoryLabel: "Media & Assets",
    badge: "Governance & Leadership",
    adminRoute: "/admin/team",
    icon: "TeamOutlined",
    summary: "Manage profiles for the Board of Trustees, Advisory Committee, and Executive Leadership.",
    whoCanAccess: "Super Admin, Admin, Content Editor",
    frontendImpact: "Displayed on the About Us and Governance pages via the CommitteeMembers component.",
    whereManaged: "Team in the left menu.",
    tables: [
      {
        title: "Member Profile Fields",
        headers: ["Field", "What to enter"],
        rows: [
          ["Full Name", "Member's full name with professional qualifications (e.g. Dr. Farooq Patel, MBBS)."],
          ["Category", "Group: Board of Trustees, Managing Committee, Advisory, or Staff."],
          ["Designation", "Official leadership title (e.g. President & Trustee)."],
          ["Display Order", "Numeric sort order: lower numbers appear first."],
          ["Photo", "Square portrait headshot photo with clean neutral background."],
        ],
      },
    ],
    sections: [
      {
        title: "Adding a leadership profile",
        steps: [
          "Open Team in the left menu and click + Add Member.",
          "Enter the member's full name, role, and bio.",
          "Select their governance category (e.g. Board of Trustees).",
          "Upload their portrait photo.",
          "Set the display order (e.g. 1 for the President).",
          "Set status to Published and click Save Member.",
        ],
      },
    ],
    callouts: [
      {
        type: "tip",
        text: "Crop all member photos to a square 1:1 aspect ratio so portraits align uniformly across leadership cards.",
      },
    ],
    keepInMind: [
      "The order members appear is controlled strictly by the Display Order number.",
      "Only members marked Published are shown on public pages.",
    ],
  },

  // =========================================================================
  // 15. TESTIMONIALS
  // =========================================================================
  {
    id: "testimonials",
    title: "Testimonials",
    documentTitle: "Testimonials Management",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 15 · September 2026",
    category: "media",
    categoryLabel: "Media & Assets",
    badge: "Beneficiary Stories",
    adminRoute: "/admin/testimonials",
    icon: "CommentOutlined",
    summary: "Curate beneficiary success stories, student scholarship feedback, and donor quotes.",
    whoCanAccess: "Super Admin, Admin, Content Editor",
    frontendImpact: "Displayed in card grids and carousel sliders across the website.",
    whereManaged: "Testimonials in the left menu.",
    tables: [
      {
        title: "Testimonial Display Options",
        headers: ["View Style", "Best for"],
        rows: [
          ["Card View", "Static 3-column grid showing reviews side by side."],
          ["Slider View", "Animated revolving carousel displaying quotes one at a time."],
        ],
      },
    ],
    sections: [
      {
        title: "Adding a testimonial quote",
        steps: [
          "Open Testimonials in the left menu.",
          "Open the Manage Testimonials tab and click Add Testimonial.",
          "Type the quote, then enter the person's name and role or title.",
          "Turn on Show in Slider if the quote should also appear in Slider View.",
          "Click Add. The testimonial is saved straight away.",
        ],
      },
      {
        title: "Editing and ordering testimonials",
        steps: [
          "Open the Manage Testimonials tab.",
          "Click Edit on a row to change its quote, name or role.",
          "Use the Show in Slider switch in the table to add or remove a quote from Slider View.",
          "Drag a row by its handle to change the order shown on the website.",
          "Click the delete icon on a row to remove a quote from every section that shows testimonials.",
        ],
      },
    ],
    callouts: [
      {
        type: "note",
        text: "Keep quotes between 25 and 45 words so they fit comfortably on mobile phone displays.",
      },
    ],
    keepInMind: [
      "All groups share the same testimonials. Card View shows every quote, and Slider View shows only the quotes with Show in Slider turned on.",
      "Always verify consent before publishing quotes and photographs.",
    ],
  },

  // =========================================================================
  // 16. GALLERY
  // =========================================================================
  {
    id: "gallery",
    title: "Gallery",
    documentTitle: "Photo & Video Gallery",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 16 · September 2026",
    category: "media",
    categoryLabel: "Media & Assets",
    badge: "Photo & Video Albums",
    adminRoute: "/admin/gallery",
    icon: "PictureOutlined",
    summary: "Visual archive of photo albums and video galleries documenting healthcare camps and educational ceremonies.",
    whoCanAccess: "Super Admin, Admin, Content Editor",
    frontendImpact: "Powers public Photo Gallery and Video Gallery pages.",
    whereManaged: "Gallery in the left menu.",
    tables: [
      {
        title: "Album Organization",
        headers: ["Field", "What to enter"],
        rows: [
          ["Album Title", "Name of the initiative or camp."],
          ["Category", "Domain: Education, Healthcare, Relief, or Annual Function."],
          ["Cover Image", "Primary thumbnail image representing the album."],
          ["Album Images", "Batch upload of high-resolution initiative photos."],
        ],
      },
    ],
    sections: [
      {
        title: "Creating a photo album",
        steps: [
          "Open Gallery in the left menu and click + Create Album.",
          "Type the Album Title and select the category.",
          "Select a high-quality Cover Image.",
          "Drag and drop multiple photos into the upload area.",
          "Set status to Published and press Save Album.",
        ],
      },
    ],
    callouts: [
      {
        type: "tip",
        text: "Upload 8 to 20 photos per album for the optimal balance between visual storytelling and fast page loading.",
      },
    ],
    keepInMind: [
      "The Cover Image is what visitors see on the gallery overview grid.",
      "Videos can be embedded using YouTube or Vimeo URLs.",
    ],
  },

  // =========================================================================
  // 17. FAQS
  // =========================================================================
  {
    id: "faqs",
    title: "FAQs",
    documentTitle: "FAQs Management",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 17 · September 2026",
    category: "content",
    categoryLabel: "Core & Content",
    badge: "Knowledge Base",
    adminRoute: "/admin/faqs",
    icon: "QuestionCircleOutlined",
    summary: "Manage Frequently Asked Questions across 8 core categories with rich text answers, shortcode embedding, and Google rich snippet SEO.",
    whoCanAccess: "Super Admin, Admin, Content Editor",
    frontendImpact: "Powers the /faq page and category accordions on program pages.",
    whereManaged: "FAQs in the left menu.",
    tables: [
      {
        title: "The 8 Canonical FAQ Categories",
        headers: ["Category", "Covers"],
        rows: [
          ["About MESCO", "Mission, history, governance, and organizational credibility."],
          ["Donations", "Payment methods, 80G tax receipts, Zakat vs General funds."],
          ["Scholarships", "Eligibility, required documents, application deadlines."],
          ["Medical Assistance", "Diagnostic centers, hospital concessions, surgical aid."],
          ["Relief of Poverty", "Ration kits, emergency aid, seasonal relief."],
          ["Volunteering", "How to get involved, volunteer roles, feedback."],
          ["Partnerships", "Corporate CSR, donor associations, institutions."],
          ["Other", "General inquiries and office operational details."],
        ],
      },
    ],
    sections: [
      {
        title: "Adding a question and answer",
        steps: [
          "Open FAQs in the left menu and click + Add FAQ.",
          "Select the category from the dropdown (e.g. Donations).",
          "Type the visitor's question.",
          "Format the answer in the rich text editor with links or bullet points.",
          "Set the Display Order number.",
          "Make sure the Active switch is ON.",
          "Press Save FAQ.",
        ],
      },
      {
        title: "Embedding a specific FAQ category on a page",
        steps: [
          "In the FAQs admin screen, click Copy Shortcode next to any category.",
          "Open the target page in Pages and paste [faq category=\"Donations\"].",
          "Save the page to display an interactive accordion for that exact topic.",
        ],
      },
    ],
    callouts: [
      {
        type: "note",
        text: "FAQs automatically generate Google FAQPage Schema.org structured data so your questions appear directly inside Google search result accordions.",
      },
    ],
    keepInMind: [
      "Only FAQs with the Active switch enabled appear on the public website.",
      "Use first-person phrasing ('How do I get an 80G receipt?') for best SEO search matching.",
    ],
  },

  // =========================================================================
  // 18. BLOGS & NEWS
  // =========================================================================
  {
    id: "blogs",
    aliases: ["news", "blog-posts"],
    title: "Blogs & News",
    documentTitle: "Blogs & News",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 18 · September 2026",
    category: "content",
    categoryLabel: "Core & Content",
    badge: "Editorial Engine",
    adminRoute: "/admin/blogs",
    icon: "BookOutlined",
    summary: "Write and publish articles, field stories, press releases, categories, and moderate reader comments.",
    whoCanAccess: "Super Admin, Admin, Content Editor",
    frontendImpact: "Controls the /blogs archive, post detail pages, and Latest News sections.",
    whereManaged: "Blogs in the left menu (View All Posts, Add Post, Categories, Comments).",
    tables: [
      {
        title: "Article Editorial Lifecycle",
        headers: ["Workflow Status", "What it means"],
        rows: [
          ["Draft", "Saved privately for writing; hidden from visitors."],
          ["In Review", "Submitted by an author for administrative approval."],
          ["Approved", "Reviewed and cleared for publication."],
          ["Published", "Live on the website and visible in search engines."],
        ],
      },
    ],
    sections: [
      {
        title: "Writing and publishing an article",
        steps: [
          "Go to Blogs → Add Post in the left menu.",
          "Type the Post Title and verify the generated URL slug.",
          "Select the primary Category (e.g. Education) and add tags.",
          "Upload a landscape Featured Image (1200x630px recommended).",
          "Type a 2-sentence Excerpt for social media cards.",
          "Compose the full article using the rich text editor.",
          "Set status to Published and click Save Post.",
        ],
      },
      {
        title: "Moderating comments",
        steps: [
          "Open Blogs → Comments in the left menu.",
          "Review comments in the Pending tab.",
          "Click Approve to show the comment or Spam/Delete to discard it.",
        ],
      },
    ],
    callouts: [
      {
        type: "tip",
        text: "Always include a Featured Image. Articles shared on WhatsApp, Facebook, or Twitter without an image get far fewer clicks.",
      },
    ],
    keepInMind: [
      "Draft posts remain completely hidden from the public.",
      "Published posts automatically update the blog feed and XML sitemap.",
    ],
  },

  // =========================================================================
  // 19. EVENTS
  // =========================================================================
  {
    id: "events",
    title: "Events",
    documentTitle: "Events Management",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 19 · September 2026",
    category: "content",
    categoryLabel: "Core & Content",
    badge: "Event Calendar",
    adminRoute: "/admin/events",
    icon: "CalendarOutlined",
    summary: "Publish workshops, health checkup camps, and conferences with attendee registration forms.",
    whoCanAccess: "Super Admin, Admin, Content Editor",
    frontendImpact: "Powers /events, event landing pages, and event carousels.",
    whereManaged: "Events in the left menu (View All Events, Add Event).",
    tables: [
      {
        title: "Event Details",
        headers: ["Field", "What to enter"],
        rows: [
          ["Event Title", "Name of the event or camp."],
          ["Date & Time", "Event date, start time, and conclusion time."],
          ["Venue", "Physical hall address or virtual meeting link."],
          ["Registration Form", "Toggle to enable the public attendee RSVP form with capacity limits."],
        ],
      },
    ],
    sections: [
      {
        title: "Publishing an event",
        steps: [
          "Go to Events → Add Event in the left menu.",
          "Enter the Event Title, Date, Time, and Venue.",
          "Upload an Event Banner Image.",
          "Write the description and event agenda.",
          "Turn on Enable Registration Form and enter Maximum Capacity if required.",
          "Set status to Published and press Save Event.",
        ],
      },
    ],
    callouts: [
      {
        type: "note",
        text: "When an event date has passed, it automatically moves into the 'Past Events' archive on the public calendar.",
      },
    ],
    keepInMind: [
      "Registrations are tracked under Submissions → Event Register.",
      "Export attendee rosters before the event for on-site check-in desks.",
    ],
  },

  // =========================================================================
  // 20. MEDIA LIBRARY
  // =========================================================================
  {
    id: "media",
    title: "Media Library",
    documentTitle: "Media Library",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 20 · September 2026",
    category: "media",
    categoryLabel: "Media & Assets",
    badge: "Asset Management",
    adminRoute: "/admin/media",
    icon: "FolderOpenOutlined",
    summary: "Central digital asset repository for photos, report PDFs, and logos. Features WebP conversion and bulk optimization.",
    whoCanAccess: "Super Admin, Admin, Content Editor",
    frontendImpact: "Serves all image and document assets across pages, blogs, and components.",
    whereManaged: "Media in the left menu (Library, Bulk Optimize, Settings).",
    tables: [
      {
        title: "Media Tools",
        headers: ["Tool", "Purpose"],
        rows: [
          ["Library", "Browse, upload, crop, search, and copy URLs of uploaded files."],
          ["Bulk Optimize", "Compress older images to reduce server disk space."],
          ["Settings", "Configure maximum file upload limits (default 50MB) and allowed formats."],
        ],
      },
    ],
    sections: [
      {
        title: "Uploading and cropping photos",
        steps: [
          "Open Media → Library in the left menu.",
          "Drag files into the upload box or click Browse Files.",
          "If prompted, confirm the crop aspect ratio (Landscape, Square, or Portrait).",
          "Click on any uploaded file to copy its direct URL or download it.",
        ],
      },
    ],
    callouts: [
      {
        type: "tip",
        text: "Upload files in WebP format whenever possible. The built-in uploader compresses files automatically to preserve fast page loading.",
      },
    ],
    keepInMind: [
      "Name files descriptively (e.g. medical-camp-2026.webp) before uploading for better SEO.",
      "The maximum upload limit is 50MB per file.",
    ],
  },

  // =========================================================================
  // 21. SUBMISSIONS HUB
  // =========================================================================
  {
    id: "submissions",
    title: "Submissions Hub",
    documentTitle: "Submissions Hub",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 21 · September 2026",
    category: "admin",
    categoryLabel: "Data, Settings & Security",
    badge: "Citizen & Donor Data",
    adminRoute: "/admin/donations",
    icon: "InboxOutlined",
    summary: "Unified management center for online donations, 80G tax receipts, newsletter subscribers, contacts, volunteer forms, and job applications.",
    whoCanAccess: "Super Admin, Admin",
    frontendImpact: "Collects and processes all inbound public submissions.",
    whereManaged: "Submissions in the left menu.",
    tables: [
      {
        title: "Inbound Submission Queues",
        headers: ["Queue", "What is stored"],
        rows: [
          ["Donate", "Donations, PAN numbers for 80G tax exemption, Zakat/General fund, and receipt resending."],
          ["Subscribers", "Email subscriber list with CSV export for newsletters."],
          ["Event Register", "Attendee signups and ticket rosters."],
          ["Contact Us", "General citizen inquiries and support messages."],
          ["Career & Internship", "Job and internship applications with downloadable CVs/resumes."],
        ],
      },
    ],
    sections: [
      {
        title: "Managing donations and 80G receipts",
        steps: [
          "Open Submissions → Donate in the left menu.",
          "Search by donor name, email, or PAN number. Donors must give a PAN for donations of ₹50,000 or more, so it can be blank on smaller ones.",
          "Click Resend Receipt to re-email an official 80G tax exemption PDF.",
          "Click Export to CSV / Excel for audited financial records.",
        ],
      },
      {
        title: "Reviewing job and internship CVs",
        steps: [
          "Open Submissions → Career Submissions or Internship Submissions.",
          "Click on an applicant to view their cover letter.",
          "Click Download CV to review their resume PDF.",
          "Update their status tag to Shortlisted, Reviewed, or Rejected.",
        ],
      },
    ],
    callouts: [
      {
        type: "note",
        text: "Donation records and 80G receipts are logged in real-time as donors complete checkout.",
      },
    ],
    keepInMind: [
      "Always back up donation records periodically for accounting compliance.",
      "Respond to Contact Us inquiries within 24 to 48 hours.",
    ],
  },

  // =========================================================================
  // 22. SETTINGS
  // =========================================================================
  {
    id: "settings",
    title: "Settings",
    documentTitle: "System Settings",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 22 · September 2026",
    category: "admin",
    categoryLabel: "Data, Settings & Security",
    badge: "System Configuration",
    adminRoute: "/admin/settings/admin-theme",
    icon: "SettingOutlined",
    summary: "Global configurations: Admin theme and loader animation colors, Frontend brand colors and typography, XML Sitemap, and Robots.txt.",
    whoCanAccess: "Super Admin, Admin",
    frontendImpact: "Controls brand typography, site styling, and search engine indexing.",
    whereManaged: "Settings in the left menu (Admin Setting, Frontend Setting, Sitemap, Robots).",
    tables: [
      {
        title: "Settings Areas",
        headers: ["Setting Screen", "What it controls"],
        rows: [
          ["Admin Setting", "Admin panel branding, logo, and the loader animation color."],
          ["Frontend Setting", "Global brand colors (Red, Navy, Teal, Gold), Google Fonts, and layout widths."],
          ["Sitemap", "XML sitemap generator for Google Search Console indexing."],
          ["Robots", "Robots.txt instructions protecting /admin from public search crawlers."],
        ],
      },
    ],
    sections: [
      {
        title: "Adjusting brand colors and fonts",
        steps: [
          "Open Settings → Frontend Setting in the left menu.",
          "Adjust primary and secondary brand colors.",
          "Select brand fonts from Google Fonts.",
          "Press Save Theme Settings to apply site-wide.",
        ],
      },
    ],
    callouts: [
      {
        type: "warning",
        text: "Never remove the 'Disallow: /admin' directive in robots.txt as it prevents search engines from indexing private administrative interfaces.",
      },
    ],
    keepInMind: [
      "Brand theme changes update the public site immediately.",
      "Draft pages are automatically excluded from the XML sitemap.",
    ],
  },

  // =========================================================================
  // 23. USERS
  // =========================================================================
  {
    id: "users",
    title: "Users",
    documentTitle: "Users Management",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 23 · September 2026",
    category: "admin",
    categoryLabel: "Data, Settings & Security",
    badge: "User Access",
    adminRoute: "/admin/users",
    icon: "UserOutlined",
    summary: "Provision and manage administrative staff accounts, assign roles, reset passwords, and toggle active status.",
    whoCanAccess: "Super Admin, Admin",
    frontendImpact: "Administrative security access control.",
    whereManaged: "Users in the left menu.",
    tables: [
      {
        title: "User Account States",
        headers: ["Status", "Meaning"],
        rows: [
          ["Active", "The user can log into the admin dashboard."],
          ["Inactive", "Access is suspended immediately without deleting their revision history."],
        ],
      },
    ],
    sections: [
      {
        title: "Adding a new administrative user",
        steps: [
          "Open Users in the left menu and click + Add User.",
          "Enter the person's name and official email address.",
          "Enter a secure temporary password.",
          "Select their role (e.g. Content Editor).",
          "Press Create User.",
        ],
      },
      {
        title: "Deactivating an account or resetting password",
        steps: [
          "Locate the user in the Users list.",
          "Toggle the switch to Inactive to suspend login access immediately.",
          "Click Reset Password to issue a new password.",
        ],
      },
    ],
    callouts: [
      {
        type: "note",
        text: "Never share administrative login credentials. Issue dedicated user accounts so all page edits maintain a clear audit trail.",
      },
    ],
    keepInMind: [
      "Assign the lowest required role (e.g. Content Editor for writing blogs and pages).",
      "Only Super Admins can manage role permissions.",
    ],
  },

  // =========================================================================
  // 24. ROLES & PERMISSIONS
  // =========================================================================
  {
    id: "rbac",
    aliases: ["roles"],
    title: "Roles & Permissions",
    documentTitle: "Roles & Permissions (RBAC)",
    documentSubtitle: "Admin panel guide · MESCO Trust",
    auditReference: "QA audit item 24 · September 2026",
    category: "admin",
    categoryLabel: "Data, Settings & Security",
    badge: "RBAC Security",
    adminRoute: "/admin/rbac/roles",
    icon: "SafetyCertificateOutlined",
    summary: "Enterprise Role-Based Access Control: create custom organizational roles and configure discrete module permissions.",
    whoCanAccess: "Super Admin only",
    frontendImpact: "Controls administrative buttons, screens, and API endpoints visible to staff.",
    whereManaged: "Roles & Permissions in the left menu.",
    tables: [
      {
        title: "Granular Permission Actions",
        headers: ["Action", "Permission Granted"],
        rows: [
          ["View", "Ability to see the module screen and read records."],
          ["Create", "Ability to add new records, drafts, or pages."],
          ["Edit", "Ability to modify existing content and settings."],
          ["Delete", "Ability to permanently remove items."],
          ["Publish", "Ability to make draft content live on the website."],
          ["Export Data", "Ability to download spreadsheets of submissions."],
        ],
      },
    ],
    sections: [
      {
        title: "Creating a custom role",
        steps: [
          "Open Roles & Permissions in the left menu and click + Add Role.",
          "Type a Role Name (e.g. Donations Auditor or Event Coordinator).",
          "In the permissions matrix, check only the actions this role needs.",
          "Press Save Role Permissions.",
          "Open Users, edit the employee, and assign them your new role.",
        ],
      },
    ],
    callouts: [
      {
        type: "warning",
        text: "Only grant Publish permissions to authorized communication staff to ensure quality control over the live website.",
      },
    ],
    keepInMind: [
      "Super Admin has complete system access and cannot be restricted.",
      "Permission modifications take effect immediately on the user's next action.",
    ],
  },
];

/**
 * Resolver helper finding a guide by exact ID or alias
 */
export function getGuideById(identifier) {
  if (!identifier) return null;
  const target = String(identifier).trim().toLowerCase();
  return (
    ADMIN_MODULE_GUIDES.find(
      (m) =>
        m.id.toLowerCase() === target ||
        (Array.isArray(m.aliases) && m.aliases.some((a) => a.toLowerCase() === target)),
    ) || null
  );
}
