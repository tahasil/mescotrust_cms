# 9. Reusable Page Builder Components — Reference

This is the master list of every reusable building block (component) you can drop into a page using the **Page Builder**. Use it as a lookup when you need to know:

- Which component to pick for a given purpose
- What fields each component lets you edit
- Where each one lives once it's on a page

## How to use this reference

Every component listed here is added the same way:

1. Open the page where you want it: **Pages → click the page → Edit**
2. In the Page Builder, click **+ Add Block** at the place you want it
3. Pick the component from the palette (filter by category if needed)
4. Click the new block to open the **edit panel** on the right
5. Fill in the fields, save, and the change appears on the public site immediately

> **Important**: most components store their content **per page**. If the same testimonial should appear on the Home page AND the Impact page, you must add a Testimonials block on each page and enter the items on each one. A few components (Header, Footer, Subscribe, Marquee) are global — edit them once and the change applies everywhere.

### Link directly to a section

In a component's **Manage Section** panel, enter a unique **Section ID** such as `our-works` (without `#`). Then use:

- `#our-works` in a button or link on the same page.
- `/another-page#our-works` in a button or link from another page.

Section IDs may contain letters, numbers, hyphens, and underscores. Keep every Section ID unique on its page.

---

## Quick lookup by purpose

| I want to… | Use this component |
|---|---|
| Add a hero banner with rotating slides | **HomeHero** |
| Add a circular ring of partner logos as a hero | **HomeHero2** |
| Add an inner-page banner (e.g. on About page) | **InnerPageHero** |
| Add a scrolling row of partner logos | **Marquee** |
| Show a welcome introduction with stats | **WelcometoMESCO** |
| Add the Mission section | **Mission** |
| Add the Vision section | **Vision** |
| Add a list of organisational aims | **AimsObjectives** |
| Show legal registrations / certifications | **Registered** |
| Add a flexible title + paragraph block | **TitleParagraph** |
| Show "what we do" 4-card grid | **OverviewOfOurWork** |
| Show a two-column "we help people" section | **Helpingpeople** |
| Show a featured event with image + CTA | **HelpingEvents** |
| Show the latest news list | **Latest News** |
| Show "donate now" + "volunteer" call-to-action images | **ImpactShowcase** |
| Show grid of trustees / committee / leadership | **CommitteeMembers** |
| Show a single managing-committee description with image | **ManagingCommittee** |
| Show donor / community testimonial carousel | **Testimonials** |
| Show vertical scrolling donor quotes | **DonorTestimonials** |
| Show success stories carousel | **StoriesSlider** |
| Show a categorised photo gallery with tabs | **PhotoGallery** |
| Show a categorised YouTube video gallery | **Videogallery** |
| Show a circular image carousel | **ImageSlider** / **CircularSlider** |
| Show grid of cards with hover overlay | **OverlayCards** |
| Show a single image with title | **Images** |
| Embed a single YouTube video | **VideoPlaying** |
| Show "in the news / press coverage" grid | **InMedia** |
| Show grid of newsletters with PDF download | **Newsletters** |
| Show grid of annual reports with PDF download | **Reports** |
| Show job listings with apply button | **Careers** |
| Show the donate form with preset packages | **DonateNow** |
| Show the newsletter signup CTA | **Subscribe** |
| Show the contact form + addresses + map | **ContactUs** |
| Show a list of important notices (PDFs) | **Notices** |
| Show alert / achievement cards | **Alerts** |
| Show an FAQ with collapsible panels | **Accordion** |
| Show paragraphs that change colour as you scroll | **AnimationsText** |

---

## Component reference (alphabetical-ish by purpose)

For each component below: **what it shows**, **what items you can add to its list** (if any), **what section-level settings** are available, and **whether it's per-page or global**.

> "Per-page" = the content lives on the specific page where the block is placed. Editing it on Home does not change Impact.
> "Global" = one shared instance, edited once, used everywhere.

---

### HEROES & BANNERS

#### HomeHero
**Shows:** Full-width carousel of hero slides with background image, headline, description, and call-to-action button.
**List items:** `bgImageUrl`, `title`, `description`, `buttonText`, `buttonLink`, `showButton`
**Section settings:** autoplay, show arrows, show dots, autoplay speed (ms), transition speed (ms), title/description/button colour keys, padding, margins.
**Storage:** global

#### HomeHero2
**Shows:** Circular rotating carousel of logos/images with a title overlay — used as an alternate hero.
**List items:** `src`, `alt`
**Section settings:** slide count (1–72), step degrees (1–45), auto interval (ms), duration (s), autoplay, draggable, mainTitle, mainTitleHighlight, subTitle, buttonText, buttonHref, heroIconUrl.
**Storage:** global

#### InnerPageHero
**Shows:** Banner shown at the top of inner pages (About, Contact, etc.) with title, description, background image, and breadcrumb trail.
**List items (breadcrumb):** `label`, `href`
**Section settings:** title, description, bgImage.
**Storage:** per-page or global

---

### INTRODUCTION & ABOUT

#### WelcometoMESCO
**Shows:** Two-column welcome section with title, highlight, description, CTA button on the left and a stats card grid on the right.
**List items (stats):** `number`, `label`, `iconImage`
**Section settings:** welcomeLabel, mainTitle, highlightText, description, secondaryText, buttonText, buttonLink, imageUrl, imageAlt, colour keys.
**Storage:** per-page or global

#### Mission
**Shows:** Single Mission card with subtitle, mission statement, and image.
**List items:** none — singleton
**Section settings:** missionSubTitle, missionTitle, missionImage, card radius (px), card padding (px), colour keys.
**Storage:** global

#### Vision
**Shows:** Single Vision card — same shape as Mission.
**List items:** none — singleton
**Section settings:** visionSubTitle, visionTitle, visionImage, card radius, card padding, colour keys.
**Storage:** global

#### AimsObjectives
**Shows:** Bulleted list of organisational aims and objectives.
**List items:** `text`
**Section settings:** mainTitle, title colour key, text colour key.
**Storage:** global

#### Registered
**Shows:** List of registration / legal certifications. Use `*asterisk*` markers in text for inline highlight.
**List items:** `text`
**Section settings:** mainTitle, title colour key.
**Storage:** global

#### TitleParagraph
**Shows:** Flexible title + subtitle + rich-text paragraph block. Good for any "page intro" section.
**List items:** none — singleton
**Section settings:** mainTitle, subTitle, title/subtitle enabled toggles, content (rich HTML), colour keys.
**Storage:** global

#### Helpingpeople
**Shows:** Two-column section with main title, rich-text paragraph, and image on the side.
**List items:** none — singleton
**Section settings:** mainTitle, paragraph (rich HTML), imageUrl, imageAlt, colour keys.
**Storage:** global

---

### PROGRAMS & WORK

#### OverviewOfOurWork
**Shows:** Horizontally panning work cards (Education, Medical, Clinics, Relief of Poverty etc.) with a pinned desktop scroll effect and touch-friendly mobile scroll.
**List items:** `title`, `description`, `linkText`, `link`, `bgImageUrl`, `icon`, `titleColorKey`
**Section settings:** sub title, heading/accent, hover overlay opacity (0–1), and colour keys.
**Storage:** per-page or global

> Note: this is the component that **replaced** the older "AwardsRecognition" component in a previous migration. To show "Awards & Recognition" content, configure this block with the appropriate cards.

#### HelpingEvents
**Shows:** Featured event section — subtitle, main title, single event title + description, image, and prominent CTA button.
**List items:** none — singleton
**Section settings:** subTitle, mainTitle, eventTitle, eventDescription, eventImage, eventImageAlt, buttonText, buttonLink, colour keys.
**Storage:** per-page or global

#### Latest News
**Shows:** Carousel of news/event cards (image, date, title, description, read-more link), 3 cards visible per slide on desktop.
**List items:** `imageUrl`, `date`, `title`, `description`, `buttonText`, `buttonLink`
**Section settings:** subTitle, mainTitle, colour keys.
**Storage:** global

> **Pairs with the upcoming Event Registrations module** — once that ships, the **buttonLink** for each event can point to a registration form page. See [Form Submissions → Event Registrations](07-form-submissions.md) once that section is added.

#### ImpactShowcase
**Shows:** Two side-by-side images with overlaid CTA buttons (typically Contact + Volunteer).
**List items:** none — singleton
**Section settings:** leftImage, rightImage, button1 text/link/icon, button2 text/link/icon, colour keys.
**Storage:** global

---

### TEAM & PEOPLE

#### CommitteeMembers
**Shows:** Grid of team-member cards (name, qualification, role, photo, bio). Add a separate block for each team category — Trustees, Committee, Leadership, Advisors.
**List items:** `name`, `qualification`, `title` (role), `image`, `bio`
**Section settings:** mainTitle, title colour key, title font size (px), title font weight (400–800).
**Storage:** global

> **Tip**: To split your team into Trustees / Committee / Leadership / Advisors, add **multiple CommitteeMembers blocks on the About → Team page** — one per category, with a different `mainTitle` for each.

#### ManagingCommittee
**Shows:** Two-column section with title + rich-text paragraph and a single image. Use for the Managing Committee write-up.
**List items:** none — singleton
**Section settings:** mainTitle, paragraph (rich HTML), imageUrl, imageAlt, colour keys.
**Storage:** global

---

### TESTIMONIALS & STORIES

#### Testimonials
**Shows:** Carousel of testimonial cards (quote, photo, name, role, star rating). Configurable autoplay, dots, arrows, drag, and per-breakpoint slide counts.
**List items:** `quote`, `imageUrl`, `name`, `title` (role), `rating` (1–5)
**Section settings:** autoplay, showArrows, showDots, draggable, infinite, autoplaySpeed, speed, slidesDesktop / Tablet / Mobile (1–5), colour keys.
**Storage:** per-page or global

#### DonorTestimonials
**Shows:** Vertical scrolling list of donor quotes (text-only, no photos). Lighter weight than Testimonials.
**List items:** `quote`, `name`, `role`
**Section settings:** mainTitle, subTitle, title enabled, sub-title enabled, colour keys.
**Storage:** global

#### StoriesSlider
**Shows:** Success-stories carousel with quote, name, role, and dual desktop/mobile images.
**List items:** `quote`, `name`, `role`, `image` (desktop, suggested 960×800), `mobileImage` (suggested 800×450)
**Section settings:** mainTitle, subTitle, autoplay, arrows, dots, infinite, speed, colour keys.
**Storage:** global

---

### MEDIA GALLERIES

#### PhotoGallery
**Shows:** Filterable photo gallery organised by category tabs. Each album has a cover image and a list of photos. Optional "View More" button to limit displayed items.
**List items (album):** `title`, `image` (cover), `images` (array of photo URLs), `categories` (multi-select from the Tabs list)
**Section settings:** tabs (the category list), limitEnabled, limitCount, viewMoreText, viewMoreLink, colour keys.
**Storage:** global

#### Videogallery
**Shows:** Filterable YouTube-video gallery with category tabs. Cards show thumbnail + title.
**List items:** `videoId` (YouTube ID only — not full URL), `title`, `categories` (multi-select)
**Section settings:** tabs, limitEnabled, limitCount, viewMoreText, viewMoreLink, colour keys.
**Storage:** global

> **Note for editors**: when adding a YouTube video, take only the ID portion of the URL. From `https://www.youtube.com/watch?v=dQw4w9WgXcQ`, the ID is `dQw4w9WgXcQ`.

#### ImageSlider
**Shows:** Circular auto-rotating image carousel. Good for partner logos / event highlights.
**List items:** `src`, `alt`
**Section settings:** autoplay, draggable, slideCount, autoInterval (ms), stepDeg, duration (s).
**Storage:** global

#### CircularSlider
**Shows:** Visually similar to HomeHero2 / ImageSlider — circular ring of images. (Configuration via the Page Builder; if unsure, prefer **ImageSlider**.)
**Storage:** global

#### OverlayCards
**Shows:** Grid of cards with title and description that reveal a background image on hover.
**List items:** `title`, `description`, `bgImage`
**Section settings:** mainTitle, subTitle, title enabled, sub-title enabled, hover colour key, colour keys.
**Storage:** global

#### Images
**Shows:** Simple section with title/subtitle and a single image.
**List items:** none — singleton
**Section settings:** mainTitle, subTitle, imageUrl, imageAlt, title/subtitle enabled, colour keys.
**Storage:** per-page or global

#### VideoPlaying
**Shows:** Single embedded YouTube video with a custom cover image shown before play.
**List items:** none — singleton
**Section settings:** youtubeVideoId (required), coverImage, coverAlt.
**Storage:** global

---

### MEDIA & PUBLICATIONS

#### InMedia
**Shows:** Grid of "In the News" / press-coverage cards. Each card shows article thumbnail, headline, date, source, and link.
**List items:** `name` (headline), `date`, `image` (thumbnail), `source` (publication name)
**Section settings:** mainTitle, subTitle, title enabled, sub-title enabled, colour keys.
**Storage:** global

#### Newsletters
**Shows:** Grid of newsletter cards with title, date, tag label, and PDF download link.
**List items:** `title`, `date`, `tag`, `pdfUrl`
**Section settings:** mainTitle, subTitle, title enabled, sub-title enabled, colour keys.
**Storage:** global

#### Reports
**Shows:** Grid of annual reports / documents with cover image, title, tag, and downloadable PDF link.
**List items:** `name` (title), `tag`, `image` (cover), `pdfUrl`
**Section settings:** mainTitle, subTitle, title enabled, sub-title enabled, colour keys.
**Storage:** global

> **Workflow for adding a new annual report**:
> 1. Open **Media** → upload the PDF (`annual-report-2024.pdf`) → Copy URL.
> 2. Upload the cover image (WebP) → Copy URL.
> 3. Open **Pages** → the page where the Reports block lives (typically Media → Annual Reports) → click the Reports block.
> 4. Add a new item with `name`, `tag` (e.g. "2024"), paste the cover image URL into `image`, paste the PDF URL into `pdfUrl`.
> 5. Save.

---

### GET INVOLVED

#### Careers
**Shows:** Job listings grid with title, department, location, employment type, and "Apply Now" button.
**List items:** `title`, `department`, `location`, `type`, `applyUrl`, `btnText`
**Section settings:** mainTitle, subTitle, title enabled, sub-title enabled, colour keys.
**Storage:** global

> The `applyUrl` typically points to an external careers page or a contact form. Until the **Job Application** module ships (Category B item B2 in the plan), there is no built-in resume upload — collect applications via email or a third-party form.

#### DonateNow
**Shows:** Donation form with preset package amounts, purpose dropdown, and an optional QR-code button. Submits via the live CCAvenue flow.
**List items (packages):** `amount`, `description`
**Section settings:** mainTitle, subTitle, title enabled, sub-title enabled, donateNowPurposeOptions (comma-separated causes), donateNowQrImageUrl, colour keys.
**Storage:** global

> **Workflow note**: the live donation gateway is wired in the backend ([app/api/payment/initiate](app/api/payment/initiate) → CCAvenue → [callback](app/api/payment/callback)). Editors only need to manage the visible packages and copy. The receipt email is sent automatically on success.

---

### CONTACT & ENGAGEMENT

#### ContactUs
**Shows:** Contact form (name, email, subject, message) with side panel showing offices, email, phone, and an embedded Google Map.
**List items:** none — singleton
**Section settings:** mainTitle, subTitle, registered office, admin office, email, phone, subjects (comma-separated dropdown options), Google Maps embed URL, colour keys.
**Storage:** global

#### Subscribe
**Shows:** Newsletter signup CTA with optional background image, email input, and subscribe button.
**List items:** none — singleton
**Section settings:** subscribeSubtitle, subscribeTitle, subscribePlaceholder, subscribeButtonText, subscribeBgUrl, colour keys.
**Storage:** per-page or global

#### Notices
**Shows:** Compact vertical list of important notices (PDF documents) — label + download link.
**List items:** `label`, `link`
**Section settings:** mainTitle, title enabled, title colour key.
**Storage:** global

#### Alerts
**Shows:** Grid of alert / achievement cards. Each card has an optional icon, heading, and description.
**List items:** `heading`, `text`, `iconUrl`
**Section settings:** mainTitle, subTitle, title enabled, sub-title enabled, colour keys.
**Storage:** global

#### Accordion
**Shows:** Collapsible FAQ panels with title and rich-text content. Custom expand icon supported.
**List items:** `label`, `content` (rich HTML)
**Section settings:** expand icon URL, colour keys.
**Storage:** global

---

### LAYOUT & VISUAL

#### Marquee
**Shows:** Horizontally scrolling row of partner / sponsor logos. Looped infinitely.
**List items:** `url` (logo image), `alt`
**Section settings:** marqueeTitle, colour keys, padding, margins.
**Storage:** global

#### AnimationsText
**Shows:** Paragraphs of large text that fade and shift colour as the user scrolls (light → dark or vice versa).
**List items:** `text`
**Section settings:** font size, line height, font weight, opacity, scroll start / end points, scrub smoothness, light/dark colour keys.
**Storage:** global

---

## Field types — quick guide

When you see these field types in an EditForm, here's what to do:

| Field type | What to do |
|---|---|
| **Text** | Type plain text. Required fields are marked with `*`. |
| **Rich text / HTML** | Use the inline editor (bold, italic, links, lists). Avoid pasting from Word — use the "clear formatting" button if styling looks weird. |
| **Image URL** | Open **Media** in another tab → find the image → click **Copy URL** → paste it here. |
| **Image upload** | Some forms have direct upload — drag a `.webp` file in. For most, use the Media library workflow above. |
| **Colour key** | Pick from the dropdown of theme colours. Custom colours added in **Theme → Colours** appear here automatically. |
| **Dropdown** | Pick one option. |
| **Switch / Toggle** | Click to enable/disable. |
| **Number** | Type a whole number. Some fields have min/max limits. |
| **Items list** | A list of repeating items (e.g. testimonials, events, photos). Use the **+ Add item** button at the bottom of the list. Drag the handle to reorder. Click the trash icon to delete. |

---

## Where each component is currently used

The website has many pages, and components can be added anywhere. Some common placements (subject to change as MESCO evolves the site):

| Component | Typical page |
|---|---|
| HomeHero, OverviewOfOurWork, ImpactShowcase, Testimonials, Latest News, Marquee | **Home** |
| InnerPageHero, WelcometoMESCO, Mission, Vision, AimsObjectives, ManagingCommittee, CommitteeMembers, Registered | **About** sub-pages |
| OverviewOfOurWork, HelpingEvents, Latest News | **Our Work** sub-pages |
| StoriesSlider, Testimonials, DonorTestimonials, OverviewOfOurWork (for Awards) | **Impact** sub-pages |
| DonateNow, Careers, ImpactShowcase | **Get Involved** sub-pages |
| InMedia, PhotoGallery, Videogallery, Newsletters, Reports, Notices | **Media** sub-pages |
| ContactUs | **Contact** |
| Subscribe, Marquee, Footer | Used globally on most pages |

> **To find which page uses a component**: open **Pages**, click into each page, look at the blocks listed in the Page Builder. There is no built-in "where is this used" search yet.

---

## When to add a new component vs reuse an existing one

**Reuse** the existing components in 99% of cases. They cover almost every section in the proposal.

**Ask a developer** to add a new component only when:
- None of the above shapes fits what you need
- You need a different layout that can't be configured (e.g. a 5-column grid where the existing component only supports 4)
- You need a brand-new feature like form-builder forms, push-notification opt-in, or a chatbot widget

> **Don't** ask for a duplicate of an existing component with a different name — use the existing one and configure it differently per page.
