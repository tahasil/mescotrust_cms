# MESCO Trust CMS — Gap Analysis & Implementation Plan

> Source document: **MESCO Website Requirement Proposal v5.0** (15 May 2025)
> Codebase reviewed: `d:\tahasil-projects\mescotrust_cms` on branch `mesco_cms`
> Last updated: corrected after a deeper review of `components/site/*` revealed that most "display-only" components are in fact fully editable Page Builder blocks.

---

## ⚠️ Important correction (please read first)

An earlier version of this document treated `components/site/Testimonials`, `CommitteeMembers`, `ManagingCommittee`, `Reports`, `Newsletters`, `InMedia`, `Careers`, `LatestEvents1`, `StoriesSlider`, `PhotoGallery`, `Videogallery`, `OverviewOfOurWork`, etc. as **static display-only** components and proposed building parallel database models for them. **That conclusion was wrong.**

These are **fully editable reusable blocks** added to pages via the **Page Builder**. Their content lives in `Page.layout[].props` (per-page instance) — or for true singletons like Header/Footer/Subscribe/Marquee, in `Component.defaultProps` accessed via `/api/theme/{ComponentName}`. Editing happens visually inside the Page Builder, not in a separate admin section.

This means **most of the proposal's content sections are already manageable today**. The corrected analysis below replaces the old Phase 2 module list with a much smaller list of items that genuinely require new infrastructure.

A short-lived "Phase 2A" attempt (Testimonial / Award / TeamMember CRUD modules in the sidebar) was built and then **deleted** once this realisation was confirmed. The cleanup is documented in §11.

---

## Table of Contents

1. [Executive Summary (revised)](#1-executive-summary-revised)
2. [Current Codebase Inventory (Verified)](#2-current-codebase-inventory-verified)
3. [Existing Architectural Patterns to Follow](#3-existing-architectural-patterns-to-follow)
4. [What's already covered by existing components (NEW)](#4-whats-already-covered-by-existing-components-new)
5. [Corrected Gap Analysis](#5-corrected-gap-analysis)
6. [Revised Implementation Plan — Phased](#6-revised-implementation-plan--phased)
7. [File-Level Task Breakdown for new modules](#7-file-level-task-breakdown-for-new-modules)
8. [Suggested Implementation Order](#8-suggested-implementation-order)
9. [Risk Register](#9-risk-register)
10. [Sessions completed so far](#10-sessions-completed-so-far)
11. [Appendix — what was deleted in the Phase 2A rollback](#11-appendix--what-was-deleted-in-the-phase-2a-rollback)

---

## 1. Executive Summary (revised)

The current Mesco Trust CMS is a **content-focused Next.js 14 / MongoDB CMS** built around a **block-based Page Builder** with ~42 reusable site components, a fully working blog module, dynamic header/footer, donation flow via CCAvenue, contact form, newsletter signup, and a 130+ field theme system.

After the corrected review, alignment with the v5.0 proposal is approximately **65–70%**, not 40–45%. Most "Our Work / Impact / Get Involved / Media" sections are already manageable today by editing the relevant block on the relevant page in the Page Builder.

The remaining gaps fall into three buckets:

- **Submission inboxes** — visitors can browse events / jobs / volunteer opportunities (because they're listed by existing display blocks) but **cannot submit** registrations / applications / signups. Each kind of submission needs a model, public form, admin inbox, and acknowledgement email.
- **Compliance & donation hardening** — receipt PDF, purpose taxonomy, privacy / refund / T&C / 80G policies, cookie consent (cookie consent + GA gating + receipt email already shipped in Session 1).
- **Engagement & advanced features** — push notifications, AI chatbot, social media wall, alumni / donor portals, form builder, audit log, additional roles.
- **Only Admin / Editor roles** exist; the proposal requires `Author` as a third role.
- **Search** works but only covers Pages and Blogs (regex), so it misses every entity that doesn't exist yet.

The good news: the codebase has **clean, repeatable patterns** for adding new modules (Blog → BlogCategory → BlogComment trio is the canonical example). Most missing features can be built by replicating existing conventions rather than re-architecting.

---

## 2. Current Codebase Inventory (Verified)

### 2.1 Models — `models/` (13 total)

| File | Purpose |
|---|---|
| [User.js](models/User.js) | Auth users. Roles enum: **`Admin`**, **`Editor`** only. Status: active/inactive. |
| [Page.js](models/Page.js) | Generic CMS pages with `layout[]` of blocks, slug, meta, locale, draft/published. |
| [Blog.js](models/Blog.js) | Blog posts with category ref, tags, featuredImage(+mobile), meta, locale. |
| [BlogCategory.js](models/BlogCategory.js) | Blog taxonomy. |
| [BlogComment.js](models/BlogComment.js) | Reader comments. |
| [Component.js](models/Component.js) | Reusable PageBuilder components (system + custom). |
| [SiteComponentMeta.js](models/SiteComponentMeta.js) | Metadata for global "before / after page" site components. |
| [Media.js](models/Media.js) | Uploaded media on disk (`public/uploads/`). Allowed: `.webp`, `.pdf` (max 50 MB, max 8192px). |
| [Menu.js](models/Menu.js) | Recursive navigation menus (header / footer / custom). |
| [ThemeConfig.js](models/ThemeConfig.js) | Singleton site theme — colors, fonts, GA ID, header/footer config, etc. |
| [Donation.js](models/Donation.js) | CCAvenue donations with embedded `donor` and `payment` subdocs. Status: pending/success/failed/aborted. |
| [ContactSubmission.js](models/ContactSubmission.js) | Contact form inbox with `payload`, `isRead`, `source`, `page`. |
| [Subscriber.js](models/Subscriber.js) | Newsletter subscribers (active/unsubscribed). |

### 2.2 Admin sections — `app/admin/(authenticated)/`

`pages`, `blogs`, `blog-categories`, `blog-comments`, `components`, `media`, `menus`, `theme`, `users`, `contacts`, `donations`, `subscribers`, `templates`

Sidebar is hardcoded in [components/admin/AdminLayoutClient.js](components/admin/AdminLayoutClient.js) `menuItems` array.

### 2.3 Public routes — `app/(site)/`

| Route | Description |
|---|---|
| `/` | CMS-driven from Page where `slug=home`. |
| `/blog` | Hardcoded listing with sidebar; queries Blog model. |
| `/blog/[slug]` | Hardcoded blog detail with optional comments + JSON-LD article schema. |
| `/contact` | Hardcoded contact page with form + map. |
| `/donation`, `/donation/success`, `/donation/failed` | CCAvenue flow. |
| `/search` | Client-side search UI calling `/api/public/search`. |
| `/preview/[id]` | Admin-only preview (Page or Blog). |
| `[...slug]` | Catch-all that resolves any slug to a Page and renders blocks. Reserved: `admin`, `blog`, `contact`, `search`, `api`, `preview`. |

### 2.4 API routes

**Admin** (`app/api/admin/`): blogs, blog-categories, blog-comments, pages, components (+seed/usage/ensure), media, menus, users, contacts, donations, subscribers, site-components, fonts.
**Public** (`app/api/public/`): blogs, blog-categories, blog-comments, pages, search, menus, site-components.
**Theme** (`app/api/theme/`): theme, header, footer, home-hero, marquee, subscribe, [componentId].
**Payment** (`app/api/payment/`): initiate, callback, donor-lookup.
**Other**: `/api/auth/[...nextauth]`, `/api/contact`, `/api/subscribe`, `/api/health`.

### 2.5 CMS Blocks — `components/cms/blocks/` (~43)

Layout: Section, Columns, Container, Divider, Spacer.
Text: Paragraph, Heading, Quote, List, CodeSnippet.
Media: Image, Gallery, Video, Embed, FileDownload, Hero, Cover.
Interactive: Buttons, Card, CardGrid, Accordion, Tabs, Modal, Slider, Breadcrumbs.
Advanced: FeatureGrid, IconBox, CallToAction, Pricing, Team, Testimonial, Timeline, Table, Stats.
UI: Alert, Header, Footer, SocialLinks.
AntD variants: AntAlert, AntButton, AntCard, AntDivider, AntInput, AntSpace, AntTypography.

### 2.6 Site Components — `components/site/` (44)

Hard-coded Mesco-specific sections, each with display + EditForm. Examples: HomeHero, HomeHero2, OverviewOfOurWork, HelpingEvents, HelpingPeople, ImpactShowcase, Reports, StoriesSlider, CommitteeMembers, ManagingCommittee, Vision, Mission, AimsObjectives, PhotoGallery, Videogallery, ImageSlider, DonateNow, DonorTestimonials, Testimonials, Subscribe, Newsletters, Notices, Alerts, Careers, InMedia, LatestEvents1, CircularSlider, Marquee, Accordion, ContactUs, AnimationsText, WelcometoMESCO, VideoPlaying, Images, OverlayCards, TitleParagraph, Registered, Header, Footer.

These are **display-only** — content is hardcoded into the EditForm props, not pulled from a data model. Editing the "Reports" or "Newsletters" section means editing block props, not creating database records. **This is the heart of the gap.**

### 2.7 Lib utilities — `lib/`

| File | Purpose |
|---|---|
| [auth.js](lib/auth.js) | NextAuth Credentials provider, JWT strategy, 30-day session. |
| [apiAuth.js](lib/apiAuth.js) | `requireAuth(req)` — used at top of every admin route. |
| [permissions.js](lib/permissions.js) | `isAdmin()`, `isEditor()`. **Not actually enforced anywhere yet.** |
| [db.js](lib/db.js) | Mongoose connection. |
| [ccavenue.js](lib/ccavenue.js) | AES-128-CBC encrypt/decrypt + parseResponse. |
| [email.js](lib/email.js) | Resend API wrapper — `sendContactNotification`, `sendContactAutoReply` only. |
| [slug.js](lib/slug.js) | `normalizeSlug()` with reserved-path blocking. |
| [seo.js](lib/seo.js) | `getPageSeoMetadata()` — basic title/description/og. |
| [layoutData.js](lib/layoutData.js) | `getTheme()`, `getLayoutData()` for public layout. |
| [systemComponents.js](lib/systemComponents.js) | Block registry (propsSchema, defaultProps). |
| [siteComponentRegistry.js](lib/siteComponentRegistry.js) | Maps site components to blocks. |
| [rateLimit.js](lib/rateLimit.js) | In-memory rate limiting. |
| [validateLayout.js](lib/validateLayout.js) | Page layout JSON validation. |
| [localeOptions.js](lib/localeOptions.js) | i18n locale list. |
| [titleAndColorsConfig.js](lib/titleAndColorsConfig.js) | Theme color defaults. |

### 2.8 Dependencies of note — [package.json](package.json)

next 14.2.18, react 18.3.1, mongoose 8.8.0, next-auth 4.24.10, bcryptjs 2.4.3, antd 5.22.0, bootstrap 5.3.3, react-bootstrap 2.10.2, styled-components 6.1.8, @dnd-kit/*, react-quill-new 3.8.3, slugify 1.6.6, isomorphic-dompurify, lightgallery 2.9.0, gsap, lenis, react-fast-marquee.

**Not installed (but needed for the proposal):** `sharp`, `pdfkit` / `@react-pdf/renderer`, `web-push`, `openai` / `@anthropic-ai/sdk`, any social-wall SDK.

---

## 3. Existing Architectural Patterns to Follow

These patterns must be reused so new modules feel native to the codebase.

### 3.1 Module pattern (canonical: Blog)

For every new content type, the existing pattern is:

1. **Mongoose model** in `models/{Name}.js`
   - Common fields: `title`, `slug`, `status` (`draft`/`published`), `publishedAt`, `createdBy`, `updatedBy`, `locale`, `meta.{metaTitle,metaDescription}`, `timestamps: true`.
   - Domain fields after that.
   - Indexes on `status`, `publishedAt`, `slug`.
2. **Admin list/create API** at `app/api/admin/{name}/route.js`
   - `GET`: `requireAuth(req)`, parse `page`/`limit` (default 50, max 100), `Model.find().sort({updatedAt:-1}).skip().limit().lean()`, return `{ items, total, page, totalPages }`.
   - `POST`: `requireAuth`, validate, `normalizeSlug()`, uniqueness check, set `createdBy = session.email`, auto-set `publishedAt` when publishing.
3. **Admin detail API** at `app/api/admin/{name}/[id]/route.js`
   - `GET`/`PUT`/`DELETE`. Validate `mongoose.Types.ObjectId.isValid(id)`. Re-validate slug uniqueness on update (excluding self). Track `updatedBy`.
4. **Admin list page** at `app/admin/(authenticated)/{name}/page.js`
   - Ant Design `Table` with columns Title / Slug / Status / Updated / Actions.
   - Client-side search/filter. Modal-based create or link to `/admin/{name}/[id]`.
5. **Admin edit page** at `app/admin/(authenticated)/{name}/[id]/page.js`
   - Ant Design `Form` with auto-slug from title, RichTextEditor for content, Media picker, status select, meta fields.
6. **Sidebar entry** in [components/admin/AdminLayoutClient.js](components/admin/AdminLayoutClient.js) `menuItems[]`.
7. **Public list API** at `app/api/public/{name}/route.js` (pagination + locale + filters).
8. **Public detail API** at `app/api/public/{name}/[slug]/route.js`.
9. **Public list page** at `app/(site)/{name}/page.js` and detail at `app/(site)/{name}/[slug]/page.js`, plus add `{name}` to the `RESERVED` array in [app/(site)/[...slug]/page.js](app/(site)/[...slug]/page.js).
10. **Site component card/grid** in `components/site/{Name}List/` for embedding into the homepage / CMS pages.
11. **SEO** via `getPageSeoMetadata()` extended for the entity.
12. **Search** integration: extend `/api/public/search/route.js` to query the new model.
13. **Sitemap**: extend `app/sitemap.js` to include new entity URLs.
14. **Notification badge**: extend `fetchNotifications()` in `AdminLayoutClient.js` if it has a submission inbox.

### 3.2 Inbox pattern (canonical: ContactSubmission)

For every form-receiving feature (event registration, job application, volunteer signup, custom form submission), follow the **ContactSubmission** convention:

- Single doc per submission with nested `payload` object.
- Top-level `isRead` flag (boolean).
- `source` string identifying which form.
- `page` string identifying which URL.
- Admin list page with Table + view-detail Modal showing `Descriptions`.
- `PATCH` toggles `isRead`. `DELETE` removes.
- Notification bell in admin sidebar polls every 5 s and shows unread count.

### 3.3 Block / Site Component pattern

For PageBuilder integration:

- Display component in `components/site/{Name}/index.js` (and a `.js` file for the actual JSX).
- Companion `EditForm.js` in the same folder.
- Register in `components/site/index.js` (`EDITABLE_SITE_EDIT_FORMS`).
- Block dispatcher [components/cms/ComponentRenderer.js](components/cms/ComponentRenderer.js) auto-finds the component by `baseComponent` name.
- For data-driven blocks (e.g. "Latest Events" widget that lists 3 newest events), the block fetches from public API at render time.

### 3.4 Email pattern

[lib/email.js](lib/email.js) uses the Resend API. New transactional emails should be added as named exports here:

- `sendDonationReceipt(donation)`
- `sendVolunteerAcknowledgement(application)`
- `sendEventRegistrationConfirmation(registration)`
- `sendJobApplicationAcknowledgement(application)`

All require an HTML template helper plus the donor/applicant metadata.

### 3.5 Payment callback pattern

[app/api/payment/callback/route.js](app/api/payment/callback/route.js) is currently the donation success/failure side-effect site. Extending this is where receipt PDF + confirmation email **must** be hooked in. The pattern for any new gateway integration should mirror its decrypt → update DB → side-effect → redirect flow.

---

## 4. What's already covered by existing components (NEW)

After re-reading every reusable site component in `components/site/*` and tracing how each one stores its data, the following table maps each proposal section to the existing block that already manages it. **No new database model is needed** for any row in this table — content is edited inside the Page Builder by opening the relevant page and editing the relevant block.

### 4.1 Two-mode storage architecture

| Mode | Where content lives | When it's used |
|---|---|---|
| **Page-block** | `Page.layout[].props` — per-page-instance | Most blocks: Testimonials, CommitteeMembers, LatestEvents1, Reports, Newsletters, etc. |
| **Global / singleton** | `Component.defaultProps`, accessed via `/api/theme/{ComponentName}` | Header, Footer, Subscribe, Marquee |

The discriminator pattern: see [components/site/Subscribe/Subscribe.js:27-39](components/site/Subscribe/Subscribe.js#L27) — *"if the block was placed on a page (props are present), use them; otherwise fetch the global version"*.

### 4.2 Coverage map — proposal section → existing block

| Proposal section | Existing component | Item shape stored in `props` |
|---|---|---|
| Home → Slider | **HomeHero**, **HomeHero2** | `{image, title, subtitle, ctaUrl, ctaText}` |
| Home → Marquee / partner logos | **Marquee** *(global)* | `{url, alt}` |
| Home → Testimonials | **Testimonials**, **DonorTestimonials** | `{quote, imageUrl, name, title, rating}` |
| Home → Latest Events (display) | **LatestEvents1**, **HelpingEvents** | `{title, date, image, excerpt, link}` |
| Home / Impact → Success Stories | **StoriesSlider** | `{title, content, image, author}` |
| Home / Impact → Awards & Recognition | **OverviewOfOurWork** *(formerly `AwardsRecognition`, migrated)* | configurable cards |
| Home → Impact metrics | **ImpactShowcase** | `{count, label, icon}` |
| Home / Media → Photo Gallery | **PhotoGallery** | `{image, caption}` |
| Home → Pop-up notice | **Notices**, **Alerts** | `{title, content, date}` / `{message, type, link}` |
| Home → Subscribe | **Subscribe** *(global)* | static |
| About → Mission / Vision / Aims | **Mission**, **Vision**, **AimsObjectives** | text + items |
| About → Welcome / Founding Story | **WelcometoMESCO**, **TitleParagraph**, **Registered** | text |
| About → Managing Committee | **ManagingCommittee** | `{mainTitle, paragraph, imageUrl}` |
| About → Our Team / Trustees / Committees | **CommitteeMembers** *(one block per category, e.g. one for Trustees, one for Leadership)* | `{name, qualification, title, image, bio}` |
| About → Awards & Accolades | **OverviewOfOurWork** | (see above) |
| About → Testimonials | **Testimonials**, **DonorTestimonials** | (see above) |
| Our Work → Programs (Education, Medical, etc.) | **OverviewOfOurWork**, **Helpingpeople** | cards |
| Our Work → Events listing | **LatestEvents1**, **HelpingEvents** | (see above) |
| Get Involved → Donate | **DonateNow** + CCAvenue | full form |
| Get Involved → Career listings | **Careers** | `{jobTitle, department, type, location}` |
| Media → Annual Reports | **Reports** | `{title, pdfUrl, year}` |
| Media → Newsletters | **Newsletters** | `{title, description, link, date}` |
| Media → In Media / In the News | **InMedia** | `{publication, url, date, title}` |
| Media → Video Gallery | **Videogallery** | `{videoUrl, title}` |
| Contact → Form + addresses | **ContactUs** | static form |
| Footer | **Footer** *(global)* | links + address + columns |
| Header + nav | **Header** *(global)* + Menu model | dynamic |
| FAQ | **Accordion** | `{title, content}` |

That's **26 of the ~30** content sections in the proposal — already manageable via the Page Builder today.

> **The remaining gaps in §5 are not "missing display blocks" — they are missing submission inboxes, missing compliance items, and missing engagement features.**

---

## 5. Corrected Gap Analysis

The proposal sections fall into 3 categories now.

### 5.1 Category A — Already covered ✅

See §4.2 above. No new work needed.

### 5.2 Category B — Genuinely missing infrastructure

These are **not** "more page blocks" — they need submission storage, status workflow, or cross-page logic that the existing display-block architecture cannot provide.

| # | What | Why a new model is genuinely needed | Pairs with existing block |
|---|---|---|---|
| **B1** | **EventRegistration** model + public form + admin inbox + email ack | The existing **LatestEvents1** *displays* events from page block props. There is no way for visitors to register/apply. Each event needs collected attendee records. | LatestEvents1, HelpingEvents |
| **B2** | **JobApplication** model + public form (with resume upload) + admin inbox | The existing **Careers** block lists jobs but does not collect applications. Resume upload + applicant tracking is genuinely new. | Careers |
| **B3** | **Volunteer / Internship pipeline**: VolunteerOpportunity + VolunteerApplication + lifecycle (applied → screening → interview → oriented → active → completed → certified) + feedback form | Proposal §4c is a multi-stage workflow with email transitions and certificate generation. Doesn't exist in any form. | (none yet — possibly a new VolunteerOpportunities display block) |
| **B4** | **ScholarshipApplication** model + form + admin inbox | Same submission pattern. | (none yet — possibly a new Scholarships display block) |
| **B5** | **CSRPartnership** inquiry model + form | Same submission pattern. | (none yet) |
| **B6** | **Form Builder** (`Form` + `FormSubmission` models + admin UI + public renderer + new PageBuilder block) | Proposal explicitly asks for ad-hoc forms beyond contact. None exists. | (new dynamic block) |
| **B7** | **Donation receipt PDF** | Email sends now (Session 1) but no PDF receipt. Needs Phase 0.2 PDF library decision. | DonateNow |
| **B8** | **Donation purpose taxonomy** | `purpose` is still free-text in [Donation.js:35](models/Donation.js#L35). Needs MESCO's canonical purpose list. | DonateNow |
| **B9** | **Privacy / Refund / T&C / Donation policy pages** | Plain CMS pages — needs MESCO to provide legal copy. | (CMS pages, no new block) |
| **B10** | **80G PAN logic** | Threshold and validation rules from MESCO. | DonateNow |
| **B11** | **Author role + permissions enforcement** | Only Admin/Editor enums in [User.js:8](models/User.js#L8). [lib/permissions.js](lib/permissions.js) defines helpers but they aren't enforced in routes. | n/a |
| **B12** | **Push notifications** | VAPID + service worker + opt-in UI + admin composer. | (new opt-in block) |
| **B13** | **AI chatbot** | Provider + corpus + widget + conversation log. | (new global widget) |
| **B14** | **Social media wall** | Instagram Graph API + Facebook Page feed integration + cache layer + new "Wall" block. | (new display block) |
| **B15** | **Donor portal** *(Phase 7 — optional in proposal)* | Donor login + history + receipts. | n/a |
| **B16** | **Alumni module** *(Phase 8 — optional in proposal)* | Alumnus model + auth + directory + posts + meetups. | n/a |
| **B17** | **Sitemap & search extension** | Once submission entities have public detail pages, extend [app/sitemap.js](app/sitemap.js) and [app/api/public/search/route.js](app/api/public/search/route.js). | n/a |
| **B18** | **WebP image pipeline** | Auto-convert + responsive variants on upload via `sharp`. Currently [media/route.js](app/api/admin/media/route.js) only accepts already-WebP files. | n/a |
| **B19** | **Storage migration off `public/uploads/`** | Disk-based, breaks on Vercel rebuilds. Needs hosting decision (S3 / R2 / persistent volume). | n/a |
| **B20** | **JSON-LD FAQ / Breadcrumb / Event schemas** | Only Organization (root) + Article (blog) currently emit structured data. | n/a |
| **B21** | **Cookie consent banner + GA gating** | ✅ **Done in Session 1** — Google Consent Mode v2 default-deny, banner in [components/site/CookieConsent](components/site/CookieConsent), GA only fires after accept. | n/a |
| **B22** | **Donation receipt email** | ✅ **Done in Session 1** — `sendDonationReceipt()` in [lib/email.js](lib/email.js) hooked into [callback route](app/api/payment/callback/route.js). | n/a |
| **B23** | **Operational items** | Staging CI/CD, automated backups, OWASP audit, deploy runbook, admin training, source-code handover. | n/a |

### 5.3 Category C — Architectural improvements (optional, not in proposal)

| # | What | Why optional |
|---|---|---|
| **C1** | **Shared content library**: convert frequently-duplicated items (e.g. testimonials repeated on Home + Impact) into global Components fetched via `/api/theme/{Name}` | Currently editors enter the same testimonial twice if it's on two pages. A shared library would solve that — but the existing per-page approach is also valid and gives more flexibility per page. |
| **C2** | **Promote some entities to permalink-mode**: e.g. each Story / Award could optionally have its own `/stories/{slug}` URL for direct linking and SEO. | Currently they're embedded inside pages with no individual URLs. Needs detail page templates. |
| **C3** | **Bulk import** for large CommitteeMembers / Testimonials lists from CSV | Useful if MESCO has many existing records to migrate. |
| **C4** | **Stable IDs on each item inside a block** (e.g. `eventId` on each LatestEvents1 event) so submission records can reference a specific event by stable key rather than by title string. | Without this, renaming an event title breaks the link from registrations to the event. |

---

## 5. Implementation Plan — Phased

Each phase below identifies the modules to build and the priority. **No code is being written** — these are the items the team will implement after sign-off.

### Phase 0 — Foundations (P0, must precede everything)

| # | Task | Effort | Notes |
|---|---|---|---|
| 0.1 | Add `sharp` to project for image processing | S | Will be reused in 5.x and Media upgrade |
| 0.2 | Add a PDF generation library (`@react-pdf/renderer` recommended for React-friendly templates, fallback `pdfkit`) | S | Used by donation receipts and certificates |
| 0.3 | Decide and document deployment strategy for `public/uploads/` (since disk storage doesn't survive Vercel rebuilds — likely needs S3/R2 or persistent volume) | M | Existing uploads break in serverless |
| 0.4 | Define a permissions matrix doc (`docs/PERMISSIONS.md`) for `Admin` / `Editor` / `Author` | S | Drives 6.1 |
| 0.5 | Document new env vars expected (PDF, push, chatbot, social APIs) | S | — |

### Phase 1 — Compliance, Trust & Donation Hardening (P0)

The donation flow is live but legally incomplete. **This must ship before any public soft-launch.**

| # | Task | Files affected | Priority |
|---|---|---|---|
| 1.1 | Build managed Privacy Policy, Terms of Service, Refund/Cancellation, Donation Policy as Pages with footer links | Page records via admin; menu update | P0 |
| 1.2 | Cookie consent banner: small block in `components/site/CookieConsent/` + state in `localStorage` + integration in [app/layout.js:175](app/layout.js#L175) so gtag only fires after consent | New component + edit `app/layout.js` | P0 |
| 1.3 | Donation receipt **email** triggered from [app/api/payment/callback/route.js](app/api/payment/callback/route.js) when `status === "success"`; new `sendDonationReceipt()` in [lib/email.js](lib/email.js) | callback route + email lib | P0 |
| 1.4 | Donation purpose **taxonomy**: replace free-text `purpose` with managed enum or new `DonationPurpose` model (Zakat, Interest Money, Payroll Giving, Scheme, Sponsorship, General) | [Donation.js:35](models/Donation.js#L35), donate-now form, admin filter | P0 |
| 1.5 | Donation receipt **PDF** generation; attach to email + expose `GET /api/admin/donations/[id]/receipt` for admin download | New PDF template + callback route + new admin route | P0 |
| 1.6 | 80G certificate metadata: enforce PAN field validation when amount > threshold; add `panRequired` flag at form-level | DonateNow EditForm + initiate route | P0 |
| 1.7 | Add `Refund Policy` and donation T&C checkbox to DonateNow form | DonateNow component | P0 |

### Phase 2 — Core Content Models the Proposal Requires (P0 / P1)

Each row builds an entity following the §3.1 pattern. Detailed file-level breakdown is in Section 6.

| # | Module | Priority | Reason |
|---|---|---|---|
| 2.1 | **Event** + **EventRegistration / StudentApplication** | P0 | Central to "Latest Events" section + Our Work menu |
| 2.2 | **Job** + **JobApplication** | P1 | Required by Get Involved → Work/Career |
| 2.3 | **VolunteerOpportunity** + **VolunteerApplication** + lifecycle | P0 | Required by Get Involved → Volunteer/Internship |
| 2.4 | **CSRPartnership** inquiry form | P1 | Get Involved → CSR Partnership |
| 2.5 | **AnnualReport** | P1 | Media → Annual Reports |
| 2.6 | **Newsletter** | P1 | Media → Newsletters |
| 2.7 | **MediaCoverage** ("In Media / In the News") | P1 | Media → In Media + In the News |
| 2.8 | **Gallery** + **GalleryItem** (Photo) | P1 | Media → Image Gallery (categorized) |
| 2.9 | **Video** | P1 | Media → Video Gallery |
| 2.10 | **Story** (Success Stories) | P1 | Impact → Success Stories |
| 2.11 | **Testimonial** | P1 | Home + Impact → Testimonials |
| 2.12 | **Award** | P1 | Home + Impact → Awards & Recognition |
| 2.13 | **Partner** | P1 | Home → Partners |
| 2.14 | **TeamMember** (with `category` enum: Trustee/Committee/Leadership/Advisor/Volunteer) | P1 | About → Our Team / Governance |
| 2.15 | **Institution** | P1 | About → Institutions |
| 2.16 | **Clinic** (subtype of Institution OR separate model) | P1 | Our Work → Clinics & Dispensaries |
| 2.17 | **Scholarship** + **ScholarshipApplication** | P1 | Our Work → Education Scholarships |
| 2.18 | **Campaign** (linked to donation purpose) | P1 | Our Work → Campaigns |
| 2.19 | **Milestone** | P2 | About → Milestones |
| 2.20 | **Department** (for Contact Us departmental directory) | P2 | Contact Us → Departmental Contact |
| 2.21 | **HeroSlide** (data-driven home slider) | P2 | Home → Slider |
| 2.22 | **Announcement** / **PopupBanner** | P2 | Home → Pop-up Banner |

### Phase 3 — Volunteer / Internship Pipeline (P0)

This section needs more than CRUD because the proposal specifies a full lifecycle.

| # | Task | Notes |
|---|---|---|
| 3.1 | `VolunteerOpportunity` model | Title, category, description, SPOC name+email, openings count |
| 3.2 | `VolunteerApplication` model | Lifecycle status enum: `applied` → `screening` → `interview` → `oriented` → `active` → `completed` → `certified`. Embedded `feedback` subdoc. |
| 3.3 | Public Volunteer/Internship landing page `app/(site)/volunteer/page.js` | Sections: why volunteer, eligibility, opportunities (list from API), application form, lifecycle diagram |
| 3.4 | Application form with file upload (resume, ID) | Reuse Media model |
| 3.5 | Admin pipeline view at `app/admin/(authenticated)/volunteers/page.js` | Kanban or filtered table by status |
| 3.6 | Status-transition emails via `sendVolunteerStatusEmail()` | Acknowledgement, interview invite, orientation, certification |
| 3.7 | Volunteer feedback form post-completion | Stores `feedback` subdoc |
| 3.8 | Certificate PDF on completion | Reuses Phase-0 PDF lib |
| 3.9 | Department / SPOC contact directory (depends on 2.20) | — |

### Phase 4 — Form Builder (P1)

| # | Task | Notes |
|---|---|---|
| 4.1 | `Form` model | name, slug, fields[] (each: type, key, label, required, options, validation), settings (submitButton, redirect, recipients, autoReply) |
| 4.2 | `FormSubmission` model | form ref, payload, isRead, source page, IP |
| 4.3 | Admin "Forms" section (`app/admin/(authenticated)/forms/`) | List, edit, drag-and-drop field editor (mirrors PageBuilder DnD with `@dnd-kit`) |
| 4.4 | Public renderer `components/forms/DynamicForm.js` | Reads form by slug, renders fields, validates client-side, posts to `/api/public/forms/[slug]/submit` |
| 4.5 | New PageBuilder block `components/cms/blocks/Form.js` + register in [systemComponents.js](lib/systemComponents.js) | Picks form by slug |
| 4.6 | Submission inbox per form (`/admin/forms/[id]/submissions`) + CSV export | — |
| 4.7 | Spam protection: honeypot field + IP rate limit (reuse [lib/rateLimit.js](lib/rateLimit.js)) + optional Turnstile/hCaptcha | — |

### Phase 5 — SEO, Performance & Accessibility (P1)

| # | Task | Notes |
|---|---|---|
| 5.1 | Migrate raw `<img>` to `next/image` across blocks/site components | High-traffic surfaces first: HomeHero, Hero, Card, Gallery, blog list/detail |
| 5.2 | Image upload pipeline using `sharp`: on POST to `/api/admin/media`, generate WebP variants (e.g. 400/800/1600 widths) and store in Media doc | Modify [app/api/admin/media/route.js](app/api/admin/media/route.js) |
| 5.3 | Lazy-loading audit (default for `next/image`, manual `loading="lazy"` for embeds/iframes) | — |
| 5.4 | JSON-LD generators: `Organization`, `Article`, `Event`, `BreadcrumbList`, `FAQPage` | New helper file `lib/structuredData.js` |
| 5.5 | FAQ block in PageBuilder that emits FAQ schema | New `components/cms/blocks/FAQ.js` + entry in [systemComponents.js](lib/systemComponents.js) |
| 5.6 | Breadcrumbs component on every interior page with schema | Reuse existing `Breadcrumbs` block, auto-inject |
| 5.7 | Caching strategy: ISR (`revalidate`) on listing pages + cache headers on API; `revalidatePath()` calls in admin save handlers | — |
| 5.8 | Lighthouse / Core Web Vitals audit + fix pass | — |
| 5.9 | Accessibility audit: enforce alt text on Media model, ARIA roles on nav/header, focus rings, contrast | — |
| 5.10 | Extend [app/sitemap.js](app/sitemap.js) to include all new entities (events, jobs, stories, etc.) | — |

### Phase 6 — Roles, Permissions & Admin Hardening (P1)

| # | Task | Notes |
|---|---|---|
| 6.1 | Add `Author` role to [User.js:8](models/User.js#L8) enum | DB migration if needed |
| 6.2 | Build permissions matrix in [lib/permissions.js](lib/permissions.js) — `can(session, action, resource)` | New helper functions |
| 6.3 | Apply guards in every admin route file: `if (!can(session, "edit", "blog")) return 403` | All `/api/admin/**` routes |
| 6.4 | Hide sidebar items based on role in [AdminLayoutClient.js](components/admin/AdminLayoutClient.js) | — |
| 6.5 | Resource-level guards: Author can only edit own draft pages/blogs (use `createdBy`) | — |
| 6.6 | `AuditLog` model + middleware | — |
| 6.7 | 2FA for Admin (TOTP via `speakeasy`) | P2 |

### Phase 7 — Donor Portal (P2 — Optional in proposal)

| # | Task |
|---|---|
| 7.1 | Add `Donor` role to User enum OR separate `Donor` collection with own auth |
| 7.2 | Second NextAuth scope for donor login (OTP via email/SMS preferred over password) |
| 7.3 | `app/donor/(authenticated)/` route group with dashboard |
| 7.4 | Profile management (update contact info, communication preferences) |
| 7.5 | Donation history list + receipt download buttons (depends on 1.5) |
| 7.6 | Backfill: link historical Donation records to Donor by `donor.email` / `donor.mobile` |
| 7.7 | Recurring donation / payroll giving (CCAvenue tokenization or external scheduler) |

### Phase 8 — Alumni Module (P2 — Optional in proposal)

| # | Task |
|---|---|
| 8.1 | `Alumnus` model: name, batch, country, profession, photo, bio, social links, contact prefs |
| 8.2 | Alumni registration + login (reuse Donor auth scaffolding) |
| 8.3 | Searchable directory with filters (batch, country, profession) |
| 8.4 | Alumni posts / job board (`AlumniPost` model with type enum: update/job/event) |
| 8.5 | Meetup planning form/tool (`Meetup` model + RSVP) |
| 8.6 | Admin moderation panel for alumni content |
| 8.7 | Public alumni showcase grid component |

### Phase 9 — Engagement Features

| # | Task | Priority | Notes |
|---|---|---|---|
| 9.1 | **Push notifications**: VAPID keys, service worker (`public/sw.js`), `PushSubscription` model, opt-in component, `app/api/admin/push/route.js` for composing & sending | P1 | — |
| 9.2 | **Persistent Donate + Volunteer header CTAs** enforced structurally | P1 | Extend Header EditForm with required CTA fields |
| 9.3 | **Pop-up banner** for announcements with admin-managed schedule | P2 | Depends on 2.22 |
| 9.4 | **Footer feedback form** | P2 | Reuse Form Builder |
| 9.5 | **Social media wall**: Instagram Graph API + Facebook Page feed + 30-min cache + "Wall" block | P2 | New `components/cms/blocks/SocialWall.js` |
| 9.6 | **AI chatbot**: provider selection (OpenAI/Anthropic), FAQ corpus from Pages/FAQ block, chat widget, `ChatConversation` log model, escalation to contact form | P2 | New `lib/chatbot.js` |

### Phase 10 — Search Upgrade (P1)

| # | Task |
|---|---|
| 10.1 | Extend [app/api/public/search/route.js](app/api/public/search/route.js) to query all new entities |
| 10.2 | Replace regex with MongoDB Atlas Search or Meilisearch for full-text + relevance ranking |
| 10.3 | Faceted filters on `/search` page (type, category, year) |
| 10.4 | Search analytics (top queries, no-result queries) — `SearchQuery` log model |

### Phase 11 — Operations & Handover (P0)

| # | Task |
|---|---|
| 11.1 | Staging environment automation (CI/CD to MESCO Cloud Servers as proposal mandates) |
| 11.2 | Production deploy runbook in `docs/DEPLOYMENT.md` |
| 11.3 | Automated DB backup schedule (extend `scripts/backup-db.js`) + restore drill |
| 11.4 | OWASP top-10 security audit + remediation log |
| 11.5 | Admin user manual per section in `docs/admin-manual/` |
| 11.6 | Technical documentation (architecture, models, APIs, deployment) — extend existing `docs/` |
| 11.7 | Hands-on training sessions for MESCO staff |
| 11.8 | Source code handover + repository transfer to MESCO |

---

## 6. File-Level Task Breakdown per New Module

This section gives a copy-pasteable checklist for the **canonical new module pattern** so each entity in §5.2 can be scaffolded the same way. Replace `{Name}` with the entity (e.g. `Event`, `Job`, `Story`).

> **Estimate per module:** ~12–18 file additions, ~3 file edits.

### 6.1 Backend

1. `models/{Name}.js` — Mongoose schema (status, slug, locale, meta, createdBy, updatedBy, indexes).
2. `app/api/admin/{name-plural}/route.js` — `GET` (paginated list) + `POST` (create) with `requireAuth`, `normalizeSlug`, uniqueness check.
3. `app/api/admin/{name-plural}/[id]/route.js` — `GET` / `PUT` / `DELETE` with ObjectId validation.
4. `app/api/public/{name-plural}/route.js` — public list with pagination, locale, status=published, optional category filter.
5. `app/api/public/{name-plural}/[slug]/route.js` — public detail.
6. (If submission inbox) `models/{Name}Submission.js` + `app/api/admin/{name-plural}/submissions/route.js` + detail route.
7. (If submission inbox) `app/api/public/{name-plural}/submissions/route.js` for `POST` from public form.

### 6.2 Admin UI

8. `app/admin/(authenticated)/{name-plural}/page.js` — list with `Table`, search, filter, pagination, modal create.
9. `app/admin/(authenticated)/{name-plural}/[id]/page.js` — detail edit `Form` with RichTextEditor, Media picker, status select, meta fields.
10. (If submission inbox) `app/admin/(authenticated)/{name-plural}/submissions/page.js` — list with view-detail modal.
11. Edit `components/admin/AdminLayoutClient.js` `menuItems[]` to add the sidebar entry (and `children[]` if grouping submissions/categories).
12. (If inbox) Add `fetch("/api/admin/{name-plural}/submissions?limit=N")` to `fetchNotifications()` in the same file.

### 6.3 Public site

13. `app/(site)/{name-plural}/page.js` — listing with pagination + category filter.
14. `app/(site)/{name-plural}/[slug]/page.js` — detail with `generateMetadata()`.
15. Edit `app/(site)/[...slug]/page.js` `RESERVED` array to add `{name-plural}`.
16. (If listed on home) `components/site/{Name}List/index.js` + `components/site/{Name}List/EditForm.js` + register in `components/site/index.js`.
17. (If JSON-LD) Extend `lib/structuredData.js` (after 5.4) with the entity's schema.

### 6.4 Cross-cutting

18. Extend [app/api/public/search/route.js](app/api/public/search/route.js) to include the new model.
19. Extend [app/sitemap.js](app/sitemap.js) to include new entity URLs.
20. (If menu link) Update header Menu via admin to add new dropdown items.

### 6.5 Per-module field guides

The schemas below list the **proposal-driven required fields** beyond the common base (`title`, `slug`, `status`, `publishedAt`, `createdBy`, `updatedBy`, `locale`, `meta`).

| Model | Domain Fields |
|---|---|
| **Event** | `description`, `excerpt`, `eventDate`, `endDate`, `venue`, `image`, `category`, `acceptsApplications:Boolean`, `applicationDeadline`, `registrationLimit`, `contactEmail`, `tags[]` |
| **EventRegistration / StudentApplication** | `eventId(ref)`, `applicant.{name,email,phone,dob,address,school,class}`, `documents[Media]`, `status:enum`, `note`, `isRead` |
| **Job** | `description`, `department`, `location`, `type:enum(full-time/part-time/internship)`, `experience`, `salaryRange`, `applyByDate`, `image` |
| **JobApplication** | `jobId(ref)`, `applicant.{name,email,phone,...}`, `resume(Media)`, `coverLetter`, `status:enum`, `isRead` |
| **VolunteerOpportunity** | `category`, `description`, `responsibilities`, `eligibility`, `openings`, `spoc.{name,email,phone}`, `image` |
| **VolunteerApplication** | `opportunityId(ref)`, `applicant.{...}`, `documents[]`, `status:enum(applied/screening/interview/oriented/active/completed/certified)`, `feedback.{rating,text,submittedAt}`, `certificateUrl` |
| **CSRPartnership** | (inquiry only — single submission model with company info, focus areas, budget) |
| **AnnualReport** | `year:Number`, `summary`, `pdfUrl(Media)`, `coverImage(Media)` |
| **Newsletter** | `issueDate`, `category`, `pdfUrl(Media)`, `coverImage(Media)`, `summary` |
| **MediaCoverage** | `headline`, `publication`, `publishedDate`, `image(Media)`, `externalUrl`, `summary`, `category:enum(in-media/in-the-news)` |
| **Gallery** + **GalleryItem** | Gallery: `title`, `eventDate`, `category`, `coverImage`. GalleryItem: `galleryId(ref)`, `image(Media)`, `caption`, `order` |
| **Video** | `title`, `description`, `category`, `provider:enum(youtube/vimeo/upload)`, `videoUrl`, `thumbnail`, `eventDate` |
| **Story** | `beneficiaryName`, `category`, `image`, `quote`, `content`, `featured:Boolean` |
| **Testimonial** | `author`, `role`, `photo`, `quote`, `category:enum(donor/volunteer/community/student)`, `featured:Boolean`, `order` |
| **Award** | `year`, `awardingBody`, `image`, `description` |
| **Partner** | `name`, `logo(Media)`, `type:enum(institutional/corporate)`, `url`, `order` |
| **TeamMember** | `name`, `role`, `category:enum(trustee/committee/leadership/advisor/volunteer)`, `photo`, `bio`, `order`, `linkedinUrl`, `email` |
| **Institution** | `name`, `type:enum(school/clinic/unit)`, `address`, `contact.{phone,email}`, `image`, `description`, `mapUrl` |
| **Clinic** | (or generalized Institution) `address`, `hours`, `services[]`, `doctors[]`, `contact.{phone,email}` |
| **Scholarship** | `eligibility`, `amount`, `deadline`, `applyFormSlug`, `image`, `criteria` |
| **ScholarshipApplication** | `scholarshipId(ref)`, `applicant.{...}`, `documents[]`, `status:enum`, `isRead` |
| **Campaign** | `description`, `goalAmount`, `raisedAmount`, `image`, `purposeRef`, `donateLink` |
| **Milestone** | `year:Number`, `description`, `image`, `order` |
| **Department** | `name`, `email`, `phone`, `extension`, `description`, `order` |
| **HeroSlide** | `image`, `mobileImage`, `headline`, `subheadline`, `cta.{label,url}`, `order`, `active`, `startDate`, `endDate` |
| **Announcement / PopupBanner** | `title`, `body`, `image`, `cta.{label,url}`, `displayPages[]`, `startDate`, `endDate`, `active`, `dismissible`, `frequency` |
| **Form** | `name`, `slug`, `fields[]`, `settings.{submitButton,redirect,recipients,autoReply}` |
| **FormSubmission** | `formId(ref)`, `payload`, `source`, `isRead`, `ip` |
| **PushSubscription** | `endpoint`, `keys.{p256dh,auth}`, `userAgent`, `subscribedAt` |
| **AuditLog** | `actor:{id,email,role}`, `action`, `resource`, `resourceId`, `before`, `after`, `ip`, `at` |
| **Donor** (Phase 7) | `name`, `email`, `mobile`, `passwordHash`, `pan`, `address.{...}`, `preferences.{...}`, `linkedDonations[ref]` |
| **Alumnus** (Phase 8) | `name`, `email`, `passwordHash`, `batch`, `country`, `profession`, `photo`, `bio`, `socialLinks`, `visibility` |

---

## 7. Suggested Implementation Order

This is the order in which work should land, optimized for value-per-week and dependency safety.

1. **Phase 0** — Foundations (sharp, PDF lib, storage decision, permissions doc).
2. **Phase 1** — Compliance & donation hardening. *Must precede any public soft-launch.*
3. **Phase 11** (1–4 only) — Staging, backups, security audit baseline. *Run in parallel with Phase 1.*
4. **Phase 2** — Core content models, in this sub-order matching the proposal menu structure:
   - Top of "About Us": **TeamMember**, **Award**, **Testimonial**, **Milestone**, **Institution**.
   - "Our Work": **Event** + **EventRegistration**, **Campaign**, **Scholarship** + applications, **Clinic**.
   - "Impact": **Story** (Awards & Testimonials already done).
   - "Get Involved": **Job** + applications, **CSRPartnership**.
   - "Media": **AnnualReport**, **Newsletter**, **MediaCoverage**, **Gallery** + items, **Video**.
5. **Phase 3** — Volunteer / Internship pipeline (depends on Phase 2 patterns being settled).
6. **Phase 5** — SEO/perf upgrades once new models exist to be indexed/structured.
7. **Phase 6** — Roles & permissions before content team is onboarded.
8. **Phase 4** — Form Builder (unlocks Contact Us departmental forms, footer feedback, etc.).
9. **Phase 9.1** (Push notifications) and **9.2** (header CTAs) — quick engagement wins.
10. **Phase 10** — Search upgrade after all entities exist.
11. **Phase 11** (5–8) — Documentation & training.
12. **Phase 7** — Donor Portal (optional in proposal).
13. **Phase 8** — Alumni module (optional in proposal).
14. **Phase 9.3 / 9.4 / 9.5 / 9.6** — Pop-up banner, footer feedback form, social wall, chatbot.

---

## 8. Risk Register

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | Donation flow is **live but legally incomplete** (no receipts, no policy pages, no consent gating). | 🔴 Critical | Phase 1 must ship before any public donation campaign. |
| R2 | GA is wired without consent gating — likely DPDP/GDPR non-compliant. | 🔴 Critical | Phase 1.2 cookie consent. |
| R3 | `public/uploads/` disk storage is incompatible with serverless deploys (Vercel) and survives only on stateful hosts. | 🟡 High | Phase 0.3 — decide on S3 / R2 / persistent volume before scale-up. |
| R4 | ~~"Display-only sections cannot be managed today"~~ — **REVOKED.** This claim was based on a misreading of the codebase. After deeper review, the existing reusable Page Builder blocks already cover the vast majority of proposal sections (see §4). The real risk is editor confusion about *which* page each block lives on, which is a documentation issue addressed by the new "Reusable Components Reference" page in the admin manual. | 🟢 Low | Documentation only. |
| R5 | Search indexes only Pages + Blogs and uses regex (slow, no relevance). | 🟡 High | Will matter once new submission entities (B1–B5) have public detail pages. |
| R6 | Only 2 roles (Admin/Editor); Editor currently has near-full access in code. | 🟡 High | Category B item B11. |
| R7 | Image upload only accepts already-WebP files; no auto-conversion or resizing. | 🟡 Medium | Category B item B18. |
| R8 | No staging environment automation despite the proposal mandating it. | 🟡 High | Category B item B23. |
| R9 | No audit log — admin actions are unattributable beyond `createdBy` / `updatedBy`. | 🟢 Medium | Optional. |
| R10 | Editors may not realise that the same content (e.g. Testimonials) entered on Home and Impact pages are independent copies — there is no shared library yet. | 🟢 Medium | Category C item C1; documentation in admin manual. |
| R11 | No 80G certificate logic — required for Indian charitable donations claiming tax exemption. | 🟡 High | Phase 1.6. |
| R12 | No transactional email infrastructure beyond contact form (Resend wrapper exists; templates do not). | 🟡 High | Phase 1.3, 3.6 establish reusable templates. |
| R13 | Push notifications, chatbot, social wall and alumni module are entirely new domains the team has not built before — schedule pessimistically. | 🟢 Medium | Phase them late (9.x, 8.x). |

---

## 9. Out of Scope (intentional)

- Native mobile apps — proposal only mandates responsive web.
- Donor CRM beyond what's listed in §7. Full CRM is a separate product decision.
- Multi-tenant support.
- Online courses / LMS.
- Real-time chat between users (alumni community is async).

---

## 10. Sessions completed so far

### Session 1 — Compliance & donation hardening (shipped)

| Item | Files |
|---|---|
| Cookie consent banner with Google Consent Mode v2 (default-deny, banner triggers consent update on accept, GA only fires after accept) | New: [components/site/CookieConsent](components/site/CookieConsent) · Edit: [app/layout.js](app/layout.js), [app/(site)/layout.js](app/(site)/layout.js) |
| Donation receipt email — `sendDonationReceipt(donation, orgInfo)` with HTML template, hooked into CCAvenue success path | Edit: [lib/email.js](lib/email.js), [app/api/payment/callback/route.js](app/api/payment/callback/route.js) |
| Featured image (mobile) field on the dedicated blog edit page (was already in the in-list Drawer but missing from the standalone editor) | Edit: [app/admin/(authenticated)/blogs/[id]/page.js](app/admin/(authenticated)/blogs/[id]/page.js) |
| Alt text editing modal in the Media library (PUT route already supported it; only the UI was missing) | Edit: [app/admin/(authenticated)/media/page.js](app/admin/(authenticated)/media/page.js) |
| Admin user manual (initial pass — README + 8 sections) | New: [docs/admin-manual/](docs/admin-manual/) |
| Audit pass — fact-checked every claim in the manual against the code; corrected 6 inaccuracies (comment status enum, missing UI features, etc.) | Edit: 6 manual files |

### Session 2 — Phase 2A rollback + corrected understanding (this session)

| Item | Outcome |
|---|---|
| Built 3 CRUD modules (Testimonial / Award / TeamMember) under wrong premise | **Deleted** — see §11 below |
| Re-investigated existing reusable site components in detail | Discovered the two-mode storage architecture (page-block vs global) and confirmed that ~26 of 30 proposal sections are already manageable |
| Updated this plan document with the corrected gap analysis | This file |
| New admin manual page documenting how to use the existing reusable Page Builder blocks | [docs/admin-manual/09-reusable-components.md](docs/admin-manual/09-reusable-components.md) (next step in this session) |
| Started **Event Registration** module — pairs with the existing `LatestEvents1` display block, gives visitors a way to actually register | Next step in this session |

---

## 11. Appendix — what was deleted in the Phase 2A rollback

Between Session 1 and the corrected understanding, three new database-backed CRUD modules were created in error: **Testimonial**, **Award**, **TeamMember**, with their own admin sidebar group called "Site Content". These duplicated the editing capability already provided by the existing reusable site components (`Testimonials`, `OverviewOfOurWork`, `CommitteeMembers`).

Once the duplication was confirmed, the following 16 files were deleted and 2 files were reverted to their pre-Phase-2A state:

**Deleted files (16):**

```
models/Testimonial.js
models/Award.js
models/TeamMember.js

app/api/admin/testimonials/route.js
app/api/admin/testimonials/[id]/route.js
app/api/public/testimonials/route.js
app/admin/(authenticated)/testimonials/page.js

app/api/admin/awards/route.js
app/api/admin/awards/[id]/route.js
app/api/public/awards/route.js
app/admin/(authenticated)/awards/page.js

app/api/admin/team-members/route.js
app/api/admin/team-members/[id]/route.js
app/api/public/team-members/route.js
app/admin/(authenticated)/team-members/page.js

docs/admin-manual/09-site-content.md
```

**Reverted edits (2):**

- [components/admin/AdminLayoutClient.js](components/admin/AdminLayoutClient.js) — removed 4 icon imports (`TrophyOutlined`, `StarOutlined`, `IdcardOutlined`, `ReadOutlined`) and the `/admin/site-content` parent menu group with its 3 children.
- [docs/admin-manual/README.md](docs/admin-manual/README.md) — removed Section 9 from the index and the 3 quick-reference rows for Testimonials / Awards / Team Members.

Lessons captured:

1. **Read EditForm files, not just folder names** — many "site components" turned out to be fully editable Page Builder blocks once their `EditForm.js` was actually opened.
2. **Trace `props` to its source** — if a component reads `props.testimonialItems`, those props come from `Page.layout[].props`, which is editable in the Page Builder. No new model needed.
3. **Check `app/api/theme/[componentId]/route.js`** — global/singleton components store their content there. Don't propose duplicating it.
4. **Distinguish display content from submission storage** — display content is what existing components handle. The genuine gaps are submission inboxes (event registrations, job applications, volunteer applications, scholarship applications, CSR inquiries) and form submissions, plus compliance items. Those are what Category B in §5.2 covers.

---

## 12. Approval Checkpoints

Before starting each Category B item, the team should confirm with MESCO:

1. **Storage backend.** S3, R2, or persistent volume? Affects budget. (B19)
2. **Donation policies.** MESCO must provide legal copy for Privacy/Refund/Donation/T&C. (B9)
3. **Donation purposes.** MESCO must finalize the canonical purpose list. (B8)
4. **80G threshold rules.** PAN-required threshold + receipt format. (B10)
5. **Permissions matrix.** What `Author` role can/can't do. (B11)
6. **Optional modules.** Confirm if Donor Portal and Alumni module are in or out for v1. (B15, B16)
7. **Chatbot provider.** OpenAI vs Anthropic vs self-hosted; cost and data-residency. (B13)
8. **Submission field schemas.** Each new submission model (event registration, job application, volunteer, scholarship, CSR) needs MESCO sign-off on the field list before building.

---

*End of document. This file is for planning only and does not modify any application code.*
