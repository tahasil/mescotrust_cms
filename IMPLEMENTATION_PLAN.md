# CMS Implementation Plan

This document is the **implementation plan** for the Mesco Trust CMS. It breaks the [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md) into concrete tasks, file paths, and order of work. Use it as a checklist during development. **Aligned with CMS_FEATURE_PLAN.md** (routing, reserved paths, env, DB/health, user and role management, blogs, component/page builder, rate limiting, security).

**Reference:** [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md) — feature scope, must-haves, and phases.

**Gap analysis:** [PROJECT_PLAN_GAPS.md](PROJECT_PLAN_GAPS.md) lists planned-vs-current by phase; closing gaps = completing the tasks below.

**Entry point:** [PROJECT_PLAN.md](PROJECT_PLAN.md) — goals and phase backlog.

**Stack:** Next.js 14, MongoDB (Mongoose), NextAuth, Ant Design. Existing: admin panel, CRUD for pages/components/blogs/media/theme/contacts/users, page builder, theme GET public.

---

## Phase 1 — Foundation (critical)

**Goal:** Per [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md) Phase 1 — routing and folder structure, reserved paths, initial admin user, DB/health, env validation, auth, admin layout and dashboard, middleware, content model and slug rules, blogs implementation, public read APIs, public rendering, error/loading, metadata.

### 1.1 Routing, reserved paths, env, auth, admin layout

- [ ] **Routing and folder structure**  
  - Frontend at root `/` (e.g. `app/`, `app/[slug]/`, `app/blog/`); admin under `/admin`. Use explicit routes for reserved paths so `[slug]` does not catch them.  
  - **Reserved paths** (per feature plan Section 5.1): `admin`, `blog`, `contact`, `search`, `api`, `preview` (and optionally `sitemap.xml`, `robots.txt`). Enforce in admin when saving page slug (validation); document in API/README.

- [ ] **Initial admin user**  
  - Seed script or env-based bootstrap (e.g. `ADMIN_EMAIL`, `ADMIN_PASSWORD`); document in README. Optional: seed default theme, one menu, one home page.

- [ ] **Database and health**  
  - Document Mongoose connection strategy (e.g. cached connection).  
  - Add `GET /api/health/route.js`: check DB connectivity; return 200 or 503.  
  - Define behavior when DB is down: public (friendly error/503), admin (clear message), APIs (consistent 5xx shape).

- [ ] **Environment validation**  
  - Validate required env at startup (per feature plan Section 2: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`); fail fast with clear message if missing.

- [ ] **Auth**  
  - Login at `/admin/login`; session; protected admin layout and API guards (middleware or per-route check).

- [ ] **Admin layout**  
  - Ant Design layout with header and sidebar; responsive (collapsible sidebar, mobile-friendly). Per feature plan Section 5.1.

- [ ] **Admin dashboard**  
  - `/admin` (or `app/admin/page.js`): show at least summary counts (pages, posts, contact submissions) and links to main sections; optional recent activity.

- [ ] **Middleware**  
  - Protect `/admin` routes; allow public routes and public API paths; ensure frontend fetches CMS data via public read APIs.

### 1.2 Content model, slug rules, blogs

- [ ] **Content model and slug rules**  
  - Pages: title, slug, status, layout array, meta fields. Blogs + Categories per Section 4 (Blogs management).  
  - **Slug rules** (per feature plan Section 4): uniqueness scope, allowed characters, max length, reserved-path rejection; API returns 400 on duplicate or invalid slug.  
  - Protected CRUD APIs for pages and blogs.

- [ ] **Blogs and categories (implementation)**  
  - Implement per feature plan Section 4 (Blogs management): Blog and BlogCategory models; admin CRUD APIs (`/api/admin/blogs`, `/api/admin/blog-categories`); admin UI at `/admin/blogs` and `/admin/blogs/categories`; public APIs and pages `app/blog/page.js`, `app/blog/[slug]/page.js`. Rich text for post body can be plain text in Phase 1; WYSIWYG in Phase 5.

- [ ] **Pages admin APIs and UI**  
  - Protected CRUD for pages: `GET/POST/PUT/DELETE` for pages (e.g. `/api/admin/pages` or `/api/pages`); slug validation per feature plan Section 4 (uniqueness, reserved-path rejection, 400 on duplicate/invalid).  
  - Admin UI at `/admin/pages`: list pages (table with title, slug, status, etc.); create/edit page (with page builder for layout); slug field with validation. Per feature plan Phase 1.

### 1.3 Public read APIs (no auth)

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

- [ ] **Middleware** — Ensure `/api/public/*` (and any public GET routes you choose) are not protected. If you use `/api/public/...`, add to middleware allow list. Document path convention and optional version prefix (e.g. `/api/v1/public/...`) per feature plan Section 5.1.

### 1.4 Public routes and component renderer

- [ ] **Dynamic page route**  
  - Add `app/[slug]/page.js` (reserved paths have explicit routes, so `[slug]` only matches non-reserved).  
  - Fetch published page by slug from public API (or server-side DB call). If not found or draft → `notFound()`.  
  - Render layout: pass `layout` array (instance id, componentId/baseComponent, props, order) to component renderer.

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

- [ ] **Error and loading**  
  - Root/route `error.js` for public and admin. `loading.js` or skeletons for dynamic public routes (`[slug]`, blog). 404 for missing/draft; consistent 5xx page.

### 1.5 Metadata

- [ ] **generateMetadata for dynamic page**  
  - In `app/[slug]/page.js`, export `generateMetadata` async; fetch page (or at least meta) by slug; return `{ title: metaTitle, description: metaDescription }` (and optional `openGraph`).

- [ ] **generateMetadata for blog post**  
  - In `app/blog/[slug]/page.js`, export `generateMetadata`; return title, description from CMS post.

- [ ] **Root layout**  
  - Keep or update `app/layout.js` static `metadata` for default title/description.

### Phase 1 done when

- Reserved paths enforced (including optional sitemap.xml, robots.txt); initial admin user exists; `GET /api/health` works; env validated at startup; admin layout and dashboard in place; middleware protects admin.  
- Pages and blogs: protected CRUD APIs and admin UI (`/admin/pages`, `/admin/blogs`, `/admin/blogs/categories`); slug rules enforced (400 on duplicate/invalid).  
- Public can open `/{slug}` (non-reserved) and see published CMS pages; blog list at `/blog`, single at `/blog/[slug]`.  
- Metadata for pages and posts; 404 for draft or invalid slug; error/loading UX in place.

---

## Phase 2 — Component library and page builder (must-have)

**Goal:** Per [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md) Phase 2 — component model, props schema, component map, default set, layout structure, validation, renderer fallback.

- [ ] **Component model** — Name, displayName, type (system/custom), category, baseComponent, propsSchema, defaultProps, active flag. Define system vs custom (e.g. system = not deletable; custom = admin-created, same code-backed map).

- [ ] **Props schema format** — Field types (text, richtext, image, url, number, select, boolean) and optional validation (required, maxLength); defaultProps must conform. Document schema format for API and admin.

- [ ] **Component map and deploy** — Map from baseComponent name to React component lives in code; admin defines component in DB. New block types require code deploy (new component + map entry). Document in README.

- [ ] **Default component set** — Seed or register: Paragraph, Heading, Image, Buttons, Spacer, Columns (per feature plan Section 8.2). Each `baseComponent` matches key in `ComponentRenderer` map.

- [ ] **Page layout data structure** — Layout = array of blocks; each block: unique instance id, componentId (or baseComponent), props, order. Document in page model and public page API. Decide flat-only or nested (max depth and shape). Document that a corresponding React component must exist in the renderer map for each baseComponent; otherwise render “missing block” placeholder.

- [ ] **Public page API layout contract** — Document whether GET page returns layout with only componentId + props (renderer resolves in app) or also embeds component metadata.

- [ ] **Admin component CRUD** — Create/edit component definitions and props schema; categories or grouping (e.g. group or filter components by category in admin list). Before deactivate/delete: show count of pages using the component; require confirmation. Per feature plan Section 4 (Component library).

- [ ] **Page builder UI** — Add/remove/duplicate (clone) block; drag/reorder; optional keyboard move up/down; edit per-instance props (drawer or inline); save layout. Optional: component preview (defaultProps), device/breakpoint preview.

- [ ] **Validation on save** — When saving a page, validate each block's props against its component's propsSchema; reject invalid payloads with clear errors (or sanitize where safe).

- [ ] **Component renderer** — Map baseComponent + props to React components. Missing/deactivated component: render fallback (e.g. Unavailable block placeholder). Document snapshot vs current schema for layout props; optional migration path.

### Phase 2 done when

- Default component set available and renderable; component map sync documented; duplicate block and validation on save work; renderer handles missing component; new components in admin render when baseComponent exists in map.

---

## Phase 3 — Menus, theme editor, responsive (must-have)

**Goal:** Per [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md) Phase 3 — editable menus (header/footer); theme editor (implement per Section 4: fonts, RTL, colors, layout); responsive layout.

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

## Phase 4 — Contact form and email (must-have)

**Goal:** Per [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md) Phase 4 — contact submission model; public contact submit; store and email; rate limit contact POST; admin list (mark read, delete).

- [ ] **Contact submission model**  
  - Ensure `ContactSubmission` (or equivalent) has: form id (or submission id), payload (e.g. name, email, message), page/source, isRead. Admin can list submissions, mark read, delete. Per feature plan Section 4 (Contact forms).

- [ ] **Public contact API**  
  - Add `POST /api/contact/route.js` (or `POST /api/public/contact`).  
  - No auth. Validate body (e.g. name, email, message).  
  - Save to `ContactSubmission` (existing model).  
  - Call email service (see below). Return 200 or 201.  
  - **Rate limit** (e.g. by IP or identifier) to prevent abuse. Per feature plan Phase 4.  
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
  - Contact submissions at `admin/contacts`: list submissions, mark read, delete. Ensure API supports list, mark read, delete (e.g. `GET /api/contacts`, `PATCH /api/contacts/[id]` for isRead, `DELETE /api/contacts/[id]`). Per feature plan Section 4 (Contact forms: admin list of submissions).

### Phase 4 done when

- Submitting the contact form saves to DB and sends email(s); rate limit on `POST /api/contact` in place.  
- Admin can view submissions.

---

## Phase 5 — SEO advanced, media validation, rich text (must-have)

**Goal:** Per [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md) Phase 5 — sitemap, robots, canonical, Open Graph; image validation on upload; WYSIWYG for blog/richtext and safe render.

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

- [ ] **Optional: schema.org**  
  - Add optional schema.org structured data where useful (e.g. Article for blog posts, Organization for site). Per feature plan Phase 5 (SEO advanced).

### 5.2 Media validation

- [ ] **Upload validation (images)**  
  - In `POST /api/media/route.js` (or wherever upload is handled):  
    - Allowed extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` (and optionally MIME check). Reject others with 400.  
    - Max file size (e.g. 5MB). Reject if over.  
    - Optional: max dimensions (e.g. 4096px); reject or resize (use sharp or similar) before save.  
  - Return clear error messages.

- [ ] **Media in content**  
  - Media linkable from pages, blogs, and components (e.g. image picker in admin for featured image, component image fields). On public site, use `next/image` with responsive `sizes` and lazy loading for CMS-sourced images. Per feature plan Section 4 (Media library and optimization).

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

## Phase 6 — Draft preview, roles, search, i18n (must-have)

**Goal:** Per [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md) Phase 6 — draft preview; user management and role management (implement per Section 4); search with rate limit; optional password reset; i18n and RTL.

### 6.1 Draft preview

- [ ] **Preview URL**  
  - Option A: `/[slug]?preview=token` where token is a signed or random value stored with the draft.  
  - Option B: `/preview/[slug]` or `/preview/page/[id]` restricted to logged-in Editor/Admin; fetch draft by id/slug.  
  - Implement one option: route + API (e.g. GET page by id for preview if role allowed).  
  - Render same component renderer with draft content.

### 6.2 User management (implement per feature plan Section 4)

- [ ] **User model** — name, email, password (hashed, e.g. bcrypt), role (Admin | Editor), status (active | inactive), timestamps; optional avatar, lastLoginAt.

- [ ] **User APIs** — `GET /api/admin/users` (list, paginate, filter by role/status, search by name/email), `GET /api/admin/users/[id]`, `POST /api/admin/users`, `PUT /api/admin/users/[id]`, `DELETE /api/admin/users/[id]` or soft-delete. All require Admin role; return 403 otherwise.

- [ ] **Admin UI** — `app/admin/users/page.js`: list (antd Table), add user (modal/form), edit user (drawer or modal), delete/deactivate with confirmation; role dropdown; prevent deleting or demoting the last Admin. Validate email uniqueness and strong password on create/update.

### 6.3 Role management (implement per feature plan Section 4)

- [ ] **Roles in code** — Admin, Editor. Implement permission helper (e.g. `canAccessUsers(session)`, `canAccessTheme(session)`): Admin → all; Editor → pages, blogs, media, components, contacts, draft preview; Editor → no users, no theme, no menus (or read-only per decision).

- [ ] **Enforcement** — In middleware or each admin API and admin page: get session, check role, redirect or return 403 if not allowed. Protect `/admin/users`, `/admin/theme`, `/admin/settings` (and their APIs) → Admin only; `/admin/pages`, `/admin/blogs`, etc. → Admin or Editor.

- [ ] **Editor scope** — Define in permission matrix whether Editor can edit only their own content (e.g. pages/posts they created) or all content; implement ownership check if “own content” is chosen. Per feature plan Section 4 (Role management: “manage own content”).

- [ ] **Document** — Permission matrix in README or `docs/PERMISSIONS.md`.

### 6.4 Password reset (optional)

- [ ] **Forgot-password flow** — Request reset, email with link, reset form, token validation; or explicitly out of scope (admins managed by seed/super-admin only).

### 6.5 Search

- [ ] **Public search**  
  - Add `GET /api/public/search?q=...` — search published pages and posts by title, slug, excerpt (or content). Return list with links.  
  - **Rate limit** public search API to prevent abuse. Per feature plan Phase 6.  
  - Add a search UI on the public site (e.g. header icon + input or dedicated `/search` page).

- [ ] **Admin search**  
  - Already possible via list filters (e.g. pages, blogs). Optional: global admin search bar.

### 6.6 Multi-language (i18n)

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
- User management (CRUD, `/admin/users`) and role management (permission matrix, enforcement) implemented per feature plan Section 4.  
- Optional password reset in place or explicitly out of scope.  
- Public (and optionally admin) search works; public search rate limited.  
- i18n: locale in content and APIs; locale switcher and RTL where needed.

---

## Phase 7 — Analytics and backups (must-have)

**Goal:** Per [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md) Phase 7 — security (CSRF, headers); document analytics; document backup/restore.

- [ ] **Security** — Implement per feature plan Section 4 (Security): same-origin or CSRF protection for state-changing APIs; document or set security headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options) in middleware or server config.

- [ ] **Analytics**  
  - Add a short doc (e.g. in README or `docs/ANALYTICS.md`): how to add Google Analytics, Plausible, or similar (script in layout or server-side event).  
  - Optional: simple events table in DB for internal analytics (e.g. page views); API to record and admin to view.

- [ ] **Backups**  
  - Document backup/restore for MongoDB and for uploaded media (e.g. `public/uploads` and any font uploads).  
  - Optional: script or cron to export DB and tarball uploads; or use managed backup (e.g. Atlas backup, S3 for media).

- [ ] **Media storage (production)**  
  - If moving to S3 or external storage: document in README; implement upload to S3 in media API and serve via CDN or signed URL.

### Phase 7 done when

- Security (CSRF and/or security headers) implemented per feature plan Section 4.  
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
| Health | `app/api/health/route.js` — DB check, 200/503 |
| Public APIs | `app/api/public/pages/[slug]/route.js`, `app/api/public/blogs/route.js`, `app/api/public/blogs/[slug]/route.js`, `app/api/public/blog-categories/route.js`, `app/api/public/menus/route.js`, `app/api/public/search/route.js` (Phase 6) |
| Admin APIs | `app/api/admin/pages/` (or `app/api/pages/`), `app/api/admin/blogs/`, `app/api/admin/blog-categories/`, `app/api/admin/users/` (Phase 6) |
| Contact | `app/api/contact/route.js` (rate limited); ContactSubmission model (form id, payload, page/source, isRead) |
| Email | `src/lib/email.js` (or `lib/email/`) |
| Public pages | `app/page.js`, `app/[slug]/page.js`, `app/blog/page.js`, `app/blog/[slug]/page.js`, `app/contact/page.js` (optional) |
| Renderer | `components/cms/ComponentRenderer.js`, component map and block components |
| Layout | Public layout with theme, menu, RTL; admin layout with antd header/sidebar |
| SEO | `app/sitemap.js`, `app/robots.js` |
| Menu | `models/Menu.js`, `app/admin/menus/page.js` |
| Theme | Extend `models/ThemeConfig.js`, extend `admin/theme/page.js` |
| Users / roles | `app/admin/users/page.js`; permission helpers; `docs/PERMISSIONS.md` (Phase 6) |

---

## Checklist overview

- [ ] Phase 1 — Foundation (routing, reserved paths, env, DB/health, auth, admin layout and dashboard, slug rules, blogs, public APIs and rendering, error/loading, metadata)  
- [ ] Phase 2 — Component library and page builder (model, props schema, layout structure, default set, validation, renderer fallback)  
- [ ] Phase 3 — Menus, theme editor (fonts, RTL), responsive  
- [ ] Phase 4 — Contact form, email, rate limit  
- [ ] Phase 5 — SEO (sitemap, robots, OG), media validation, rich text  
- [ ] Phase 6 — Draft preview, user management, role management, search (rate limited), optional password reset, i18n  
- [ ] Phase 7 — Security, analytics, backups  

Update this file as tasks are completed. After completing a phase, update [PROJECT_PLAN_GAPS.md](PROJECT_PLAN_GAPS.md) Section 4 (and the relevant 2.x subsection) so the gap list reflects the new state.
