# CMS Implementation Plan

This document is the **implementation plan** for the Mesco Trust CMS. It breaks the [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md) into concrete tasks, file paths, and order of work. Use it as a checklist during development.

**Reference:** [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md) — feature scope, must-haves, and phases.

**Gap analysis:** [PROJECT_PLAN_GAPS.md](PROJECT_PLAN_GAPS.md) lists planned-vs-current by phase; closing gaps = completing the tasks below.

**Entry point:** [PROJECT_PLAN.md](PROJECT_PLAN.md) — goals and phase backlog.

**Stack:** Next.js 14, MongoDB (Mongoose), NextAuth, Ant Design. Existing: admin panel, CRUD for pages/components/blogs/media/theme/contacts/users, page builder, theme GET public.

---

## Phase 1 — Public site foundation (critical)

**Goal:** Visitors can see CMS pages and blog posts; only published content; metadata for SEO.

### 1.1 Public read APIs (no auth)

- [ ] **Page by slug (public)**  
  - Add `GET /api/public/pages/[slug]/route.js` (or extend existing with optional auth: if no session, return only published page by slug).  
  - Query: `Page.findOne({ slug, status: 'published' }).populate('layout.componentId')`.  
  - Return 404 if not found or draft.

- [ ] **Blogs list (public)**  
  - Add `GET /api/public/blogs/route.js` — list published blogs (paginate), optional `?category=`, `?search=`.  
  - Query: `Blog.find({ status: 'published' }).populate('category').sort({ publishedAt or updatedAt: -1 })`.

- [ ] **Blog by slug (public)**  
  - Add `GET /api/public/blogs/[slug]/route.js` — single published post by slug; 404 if draft/missing.

- [ ] **Blog categories (public)**  
  - Add `GET /api/public/blog-categories/route.js` — list categories (no auth).  
  - Or allow unauthenticated GET on existing `GET /api/blog-categories` and filter to active only.

- [ ] **Theme** — Already public at `GET /api/theme`. Ensure middleware does not block it. No change if already working.

- [ ] **Middleware** — Ensure `/api/public/*` (and any public GET routes you choose) are not protected. If you use `/api/public/...`, add to middleware allow list.

### 1.2 Public routes and component renderer

- [ ] **Dynamic page route**  
  - Add `src/app/[slug]/page.js` (or `app/[[...slug]]/page.js` if you need to reserve `/blog`, `/admin`).  
  - In the page: fetch published page by slug from public API (or server-side DB call).  
  - If not found or draft → `notFound()`.  
  - Render layout: pass `layout` array (with componentId, props, order) to a component renderer.

- [ ] **Component renderer**  
  - Create `src/components/cms/ComponentRenderer.js` (or under `app/`): accepts `layout` array, maps each item to a React component by `baseComponent` (from populated componentId or a lookup map).  
  - Implement a **component map**: object mapping `baseComponent` string (e.g. `Hero`, `Paragraph`, `Image`) to actual React components.  
  - Handle missing component: render placeholder or skip.  
  - Use Server Component where possible; client only if a block needs interactivity.

- [ ] **Default/placeholder components**  
  - Create at least 2–3 simple components (e.g. `Paragraph`, `Heading`, `Image`) so the renderer has something to show. Register them in the component map and ensure they exist in DB (or seed) with matching `baseComponent` names.

- [ ] **Blog list page**  
  - Add `src/app/blog/page.js` — fetch from public blogs API, render list (title, excerpt, link to `/blog/[slug]`).

- [ ] **Blog single page**  
  - Add `src/app/blog/[slug]/page.js` — fetch published post by slug; 404 if missing/draft; render title, content, featured image, metadata.

- [ ] **Home page**  
  - Update `src/app/page.js`: either (a) redirect to a CMS “home” page slug, or (b) fetch page with slug `home` and render via component renderer, or (c) static hero + link to main content. Decide and implement.

### 1.3 Metadata

- [ ] **generateMetadata for dynamic page**  
  - In `app/[slug]/page.js`, export `generateMetadata` async; fetch page (or at least meta) by slug; return `{ title: metaTitle, description: metaDescription }` (and optional `openGraph`).

- [ ] **generateMetadata for blog post**  
  - In `app/blog/[slug]/page.js`, export `generateMetadata`; return title, description from CMS post.

- [ ] **Root layout**  
  - Keep or update `app/layout.js` static `metadata` for default title/description.

### Phase 1 done when

- Public can open `/{slug}` and see published CMS pages; blog list at `/blog`, single at `/blog/[slug]`.  
- Metadata shows correct title/description for pages and posts.  
- 404 for draft or invalid slug.

---

## Phase 2 — Component library and page builder (enhance)

**Goal:** Component library and page builder are already in place; ensure public renderer and default components are complete.

- [ ] **Default component set**  
  - Add to Component library (via admin or seed): Paragraph, Heading, Image, Buttons, Spacer, Columns (or as per [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md) Section 8.2).  
  - Each has `baseComponent` matching the key in the component map in `ComponentRenderer`.

- [ ] **Component map sync**  
  - Document or automate: when adding a new component in admin with `baseComponent: X`, a corresponding React component must exist in the renderer map; otherwise render a “missing block” placeholder.

- [ ] **Page builder (admin)**  
  - Already exists at `admin/pages/[id]`. Optional: improve UX (drag handle, duplicate block, copy/paste).

### Phase 2 done when

- At least one default set of blocks is available and renderable on the public site.  
- New components added in admin can be rendered if their `baseComponent` is implemented in the renderer.

---

## Phase 3 — Menus, theme editor, responsive

**Goal:** Editable menus (header/footer), theme editor with fonts and RTL, responsive layout.

### 3.1 Menu

- [ ] **Menu model**  
  - Create `src/models/Menu.js`: `{ name: String, items: [{ label, url, order, openInNewTab }] }`.  
  - Optional: `locale` if i18n later.

- [ ] **Menu API (admin)**  
  - `GET/PUT /api/menus/route.js` or `GET/PUT /api/menus/[name]/route.js` — list all menus or get/update by name. Protected (session required).

- [ ] **Menu API (public)**  
  - `GET /api/public/menus/route.js` or `GET /api/public/menus?name=header` — return menu(s). No auth.

- [ ] **Admin UI**  
  - Add `src/app/admin/menus/page.js` (or under Theme): list menus (e.g. header, footer), edit items (add/remove/reorder, label, URL, open in new tab). Use antd Form/Table.

- [ ] **Public layout: render menu**  
  - Create a shared layout or component for public site (e.g. `src/app/(public)/layout.js` or `components/layout/PublicHeader.js`).  
  - Fetch menu(s) from public API (or pass from parent). Render `<nav>` with links; support responsive (hamburger) if needed.

- [ ] **Responsive nav**  
  - Implement mobile menu (e.g. hamburger, drawer) for header. Use CSS breakpoints and existing theme/layout width.

### 3.2 Theme editor (fonts, RTL)

- [ ] **Theme config model**  
  - Extend `ThemeConfig` (or add fields): font sources (e.g. `googleFonts: [{ family, weights }]`, `customFonts: [{ name, url or path }]`), `direction: 'ltr' | 'rtl'`.  
  - Ensure `fontFamily`, `fontSize`, colors, layoutWidth already present.

- [ ] **Theme admin UI**  
  - Extend `admin/theme/page.js`: add Google Fonts selector (dropdown or search from a list); add “Custom fonts” upload (.woff2/.woff/.ttf), store under `public/fonts` or media, save URL in theme config.  
  - Add direction (LTR/RTL) toggle.  
  - Save and load via existing `GET/PUT /api/theme`.

- [ ] **Public site: apply theme**  
  - In public layout, fetch theme from `GET /api/theme`; inject CSS variables (e.g. `--font-family`, `--primary-color`) and optional `<link>` for Google Fonts / custom font URLs.  
  - Set `<html dir={theme.direction}>` for RTL.

- [ ] **RTL-aware CSS**  
  - Use logical properties (e.g. `margin-inline-start`) or RTL-specific overrides for layout and menu so RTL looks correct.

### 3.3 Responsive

- [ ] **Breakpoints and layout**  
  - Ensure public pages and components use responsive widths (e.g. max-width from theme, padding).  
  - Test menu and key components on mobile/tablet.

### Phase 3 done when

- Menus are editable in admin and visible on public site (header/footer).  
- Theme editor supports font import (Google + custom upload) and RTL.  
- Public site applies theme and is responsive.

---

## Phase 4 — Contact form and email

**Goal:** Public can submit a contact form; data stored and email sent.

- [ ] **Public contact API**  
  - Add `POST /api/contact/route.js` (or `POST /api/public/contact`).  
  - No auth. Validate body (e.g. name, email, message).  
  - Save to `ContactSubmission` (existing model).  
  - Call email service (see below). Return 200 or 201.  
  - Middleware: ensure `/api/contact` is allowed (no redirect to login).

- [ ] **Email service**  
  - Choose provider: Resend, SendGrid, or nodemailer (SMTP).  
  - Add env vars (e.g. `EMAIL_FROM`, `EMAIL_TO`, `RESEND_API_KEY` or `SMTP_*`).  
  - Create `src/lib/email.js` (or similar): function `sendContactNotification(submission)` and optional `sendContactAutoReply(submission)`.  
  - Call from `POST /api/contact` after saving.

- [ ] **Contact form component**  
  - Create a React form (e.g. `src/components/forms/ContactForm.js`): fields name, email, message; submit to `POST /api/contact`.  
  - Client-side validation; optional reCAPTCHA (add key in env).  
  - Use on a “Contact” page (CMS page with contact block) or dedicated `app/contact/page.js`.

- [ ] **Admin**  
  - Contact submissions list already at `admin/contacts`. Ensure it uses correct API (`/api/contacts`). No change unless API path differs.

### Phase 4 done when

- Submitting the contact form saves to DB and sends email(s).  
- Admin can view submissions.

---

## Phase 5 — SEO advanced, media validation, rich text

**Goal:** Sitemap, robots, canonical, Open Graph; image validation on upload; WYSIWYG for blog/richtext.

### 5.1 SEO

- [ ] **Sitemap**  
  - Add `src/app/sitemap.js`: fetch all published pages (slug) and blogs (slug); return array of `{ url: baseUrl + slug, lastModified, changeFrequency, priority }`.  
  - Use Next.js convention so it serves at `/sitemap.xml`.

- [ ] **Robots**  
  - Add `src/app/robots.js`: return `{ rules: [...], sitemap: baseUrl + '/sitemap.xml' }`.  
  - Or static `public/robots.txt` if preferred.

- [ ] **Canonical and Open Graph**  
  - In `generateMetadata` for page and blog, add `alternates: { canonical }` and `openGraph: { title, description, images }`.  
  - Use site base URL from env.

### 5.2 Media validation

- [ ] **Upload validation (images)**  
  - In `POST /api/media/route.js` (or wherever upload is handled):  
    - Allowed extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` (and optionally MIME check). Reject others with 400.  
    - Max file size (e.g. 5MB). Reject if over.  
    - Optional: max dimensions (e.g. 4096px); reject or resize (use sharp or similar) before save.  
  - Return clear error messages.

### 5.3 Rich text / WYSIWYG

- [ ] **Editor in admin**  
  - Add a rich text editor for blog body (and for any “richtext” field in components). Options: TipTap, Lexical, or a simple wrapper around `contentEditable` with toolbar.  
  - Store as HTML or structured JSON; sanitize on save and on render.

- [ ] **Safe render on public**  
  - When rendering blog content or richtext in components, use a sanitizer (e.g. DOMPurify) or a safe HTML renderer to avoid XSS.

### Phase 5 done when

- `/sitemap.xml` and `/robots.txt` work.  
- Metadata includes canonical and Open Graph where needed.  
- Image uploads are validated (format, size, optionally dimensions).  
- Blog and richtext fields use WYSIWYG and render safely.

---

## Phase 6 — Draft preview, roles, search, i18n

**Goal:** Preview drafts; enforce roles; site and/or admin search; locale and RTL.

### 6.1 Draft preview

- [ ] **Preview URL**  
  - Option A: `/[slug]?preview=token` where token is a signed or random value stored with the draft.  
  - Option B: `/preview/[slug]` or `/preview/page/[id]` restricted to logged-in Editor/Admin; fetch draft by id/slug.  
  - Implement one option: route + API (e.g. GET page by id for preview if role allowed).  
  - Render same component renderer with draft content.

### 6.2 Role-based access

- [ ] **Audit**  
  - Ensure admin APIs check `session.user.role` (admin vs editor). Editors can edit only their content or have limited menus.  
  - Document in code or README which routes require admin.

- [ ] **Theme and users**  
  - Only admin can change theme and manage users. Already partially in place; confirm and lock down.

### 6.3 Search

- [ ] **Public search**  
  - Add `GET /api/public/search?q=...` — search published pages and posts by title, slug, excerpt (or content). Return list with links.  
  - Add a search UI on the public site (e.g. header icon + input or dedicated `/search` page).

- [ ] **Admin search**  
  - Already possible via list filters (e.g. pages, blogs). Optional: global admin search bar.

### 6.4 Multi-language (i18n)

- [ ] **Content model**  
  - Add `locale` (or `lang`) to Page, Blog, Menu (and optionally Component labels). Default `en`.

- [ ] **APIs**  
  - Public APIs accept `?locale=en` or read from cookie/header; return content for that locale.  
  - Admin: filter by locale; add/edit content per locale.

- [ ] **Locale switcher**  
  - On public site, show language switcher; set cookie or URL (e.g. `/en/about`, `/ar/about`) and pass locale to APIs and layout.

- [ ] **RTL per locale**  
  - When locale is RTL (e.g. `ar`), set `dir="rtl"` and apply RTL layout (see Phase 3).

### Phase 6 done when

- Draft preview works for editors/admins.  
- Roles are enforced; theme and user management are admin-only.  
- Public (and optionally admin) search works.  
- i18n: locale in content and APIs; locale switcher and RTL where needed.

---

## Phase 7 — Analytics and backups

**Goal:** Document analytics integration; document backup/restore.

- [ ] **Analytics**  
  - Add a short doc (e.g. in README or `docs/ANALYTICS.md`): how to add Google Analytics, Plausible, or similar (script in layout or server-side event).  
  - Optional: simple events table in DB for internal analytics (e.g. page views); API to record and admin to view.

- [ ] **Backups**  
  - Document backup/restore for MongoDB and for uploaded media (e.g. `public/uploads` and any font uploads).  
  - Optional: script or cron to export DB and tarball uploads; or use managed backup (e.g. Atlas backup, S3 for media).

- [ ] **Media storage (production)**  
  - If moving to S3 or external storage: document in README; implement upload to S3 in media API and serve via CDN or signed URL.

### Phase 7 done when

- Analytics and backups are documented and (where applicable) implemented.

---

## Optional / later (from senior review)

- **Revisions** — Store last N versions of page/post; compare and restore.  
- **Scheduled publish** — `publishedAt` date; cron or Vercel cron to flip status.  
- **Comments** — Model + moderation UI + public display.  
- **Redirects** — Redirect model + middleware or next.config redirects.  
- **Content export/import** — JSON export/import for pages, posts, menus.  
- **Sticky posts** — Boolean on Blog; sort sticky first in list.  
- **2FA** — TOTP for admin (e.g. next-auth with 2FA provider or custom).

---

## File and route summary

| Add or change | Path / purpose |
|---------------|----------------|
| Public APIs | `app/api/public/pages/[slug]/route.js`, `app/api/public/blogs/route.js`, `app/api/public/blogs/[slug]/route.js`, `app/api/public/blog-categories/route.js`, `app/api/public/menus/route.js` |
| Contact | `app/api/contact/route.js` |
| Email | `src/lib/email.js` (or `lib/email/`) |
| Public pages | `app/[slug]/page.js`, `app/blog/page.js`, `app/blog/[slug]/page.js`, `app/contact/page.js` (optional) |
| Renderer | `components/cms/ComponentRenderer.js`, component map and block components |
| Layout | Public layout with theme, menu, RTL |
| SEO | `app/sitemap.js`, `app/robots.js` |
| Menu | `models/Menu.js`, `app/admin/menus/page.js` |
| Theme | Extend `models/ThemeConfig.js`, extend `admin/theme/page.js` |

---

## Checklist overview

- [ ] Phase 1 — Public site foundation  
- [ ] Phase 2 — Component library and default blocks  
- [ ] Phase 3 — Menus, theme editor (fonts, RTL), responsive  
- [ ] Phase 4 — Contact form and email  
- [ ] Phase 5 — SEO (sitemap, robots, OG), media validation, rich text  
- [ ] Phase 6 — Draft preview, roles, search, i18n  
- [ ] Phase 7 — Analytics and backups  

Update this file as tasks are completed. After completing a phase, update [PROJECT_PLAN_GAPS.md](PROJECT_PLAN_GAPS.md) Section 4 (and the relevant 2.x subsection) so the gap list reflects the new state.
