# AGENTS.md

Project operating guide for engineers and coding agents working in `mescotrust_cms`.

## 1. Project Snapshot

- Project: MESCO Trust CMS
- Framework: Next.js 14 (App Router)
- Runtime: Node.js + React 18
- Database: MongoDB via Mongoose
- Auth: NextAuth Credentials + JWT sessions
- UI: Ant Design 5 + Bootstrap + styled-components

Primary goals:
- Public website rendering from CMS-managed content.
- Admin panel for content, media, theme, menus, users, and operations.
- Reusable block/page builder + site component platform.

## 2. High-Level Architecture

- `app/`:
  - Public routes: `app/(site)/...`
  - Admin routes: `app/admin/...`
  - API routes: `app/api/...`
- `components/`:
  - CMS block renderer and block library: `components/cms/`
  - Site components (header/footer + business sections): `components/site/`
  - Admin UI/forms: `components/admin/`
- `models/`: Mongoose schemas
- `lib/`: shared utilities (DB, auth, permissions, validation, layout, integrations)
- `scripts/`: operational scripts (seed, backup, DB checks, migrations)
- `docs/`: product, API, architecture, admin manuals, ops notes

Core rendering flow:
1. Middleware sets `x-pathname` on requests.
2. `app/(site)/layout.js` calls `getLayoutData(pathname)` from `lib/layoutData.js`.
3. Theme + menus + site component metadata + independent Appearance Header Ribbon/Header/Footer settings are assembled.
4. `components/layout/PublicShell.js` renders the Appearance shell (including Header Ribbon above Header, and falling back to legacy Header/Footer components when Appearance is unavailable).
5. Page layouts are rendered by `components/cms/ComponentRenderer.js`.
6. Site components are dynamically registered from `components/site/index.js`.

## 3. Authentication and Permissions

- NextAuth config: `lib/auth.js` and `app/api/auth/[...nextauth]/route.js`
- Route protection:
  - `middleware.js` protects `/admin/*` and `/api/admin/*`
  - unauthenticated users are redirected to `/admin/login`
- API auth helper:
  - `lib/apiAuth.js` -> `requireAuth(req)` used by admin APIs
- Role helpers:
  - `lib/permissions.js` -> `isAdmin`, `isEditor`
- RBAC:
  - `lib/rbac/catalog.js` maps the current admin modules/pages/APIs to generated permissions
  - `lib/rbac/resolver.js` resolves active database-backed role permissions
  - middleware, the authenticated admin layout, and `requireAuth` enforce permissions

Security notes currently implemented:
- Login rate limiting in middleware for auth POST.
- Same-origin checks for state-changing API requests (POST/PUT/PATCH/DELETE).

## 4. Data Model Inventory

Models in `models/`:
- `Page`
- `Component`
- `SiteComponentMeta`
- `Appearance` (collection: `appearance`; independent Header Ribbon/Header/Footer shell configuration)
- `ThemeConfig`
- `Menu`
- `PageSlugRedirect` (slug history so moved/renamed pages redirect instead of 404)
- `User`
- `Media`
- `SiteFileSetting`
- `Blog`
- `BlogCategory`
- `BlogComment`
- `ContactSubmission`
- `Subscriber`
- `Donation`
- `DonateNowSubmission`
- `Event`
- `EventRegistration`
- `VolunteersFeedbackSubmission`
- `Form`
- `FormSubmission`
- `SubmissionFile`
- `FormCounter`
- `SocialWallSettings`
- `SocialWallPlatformConfig`
- `SocialWallPost`
- `SocialWallFetchLog`
- `SocialWallConfigAudit`
- `Team`
- `Gallery`
- `AdminRole`
- `Permission`
- `RolePermission`
- `PermissionAuditLog`
- `PushSubscription`
- `PushNotification`
- `PdfSearchIndex` (extracted PDF text and document metadata for unified search)

For field-level schema details, use `docs/TECHNICAL_DESIGN.md`.

## 5. API Surface (Practical Map)

Conventions:
- `/api/public/*` -> public read endpoints
- `/api/admin/*` -> authenticated admin CRUD endpoints
- `/api/theme` and `/api/theme/*` -> theme and site-component defaults
- `/api/auth/*` -> NextAuth
- `/api/health` -> DB health

Key public groups:
- Pages, blogs, categories, menus, search, theme, social wall, event registrations

Key admin groups:
- Pages, blogs, categories, comments, components, site-components, menus
- Appearance Header Ribbon/Header/Footer under `/api/admin/appearance/*`
- Sitemap and robots management under `/api/admin/settings/*`
- Media, contacts, users, subscribers, donations, events, event-registrations, volunteers-feedback, fonts
- Roles and permissions under `/api/admin/rbac/*`

Use `docs/API.md` for endpoint behavior and request/response contracts.

## 6. Environment and Commands

Required env vars:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

Common optional env vars:
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (seed)
- Email settings (`SMTP_FROM`, `ADMIN_NOTIFICATION_EMAIL`, `EMAIL_FROM`, `EMAIL_TO`, `RESEND_API_KEY` or SMTP vars)
- `NEXT_PUBLIC_SITE_URL`
- Social media wall provider credentials

The project uses one environment file: `.env`. It is git-ignored (only
`.env.example` is tracked) because it holds live credentials — never commit
real values.

Sender/recipient resolution lives in `lib/mailTransport.js` and is the single
source of truth used by every email call site in `lib/email.js`:
- From address: `SMTP_FROM` -> `EMAIL_FROM` -> caller fallback
- Admin copy: `ADMIN_NOTIFICATION_EMAIL` -> `EMAIL_TO` -> `ADMIN_EMAIL`

The sender domain must be verified with the active provider (SES identity /
Resend domain), or every send fails. Check config and deliver a real test
receipt with `npm run test:email-config -- --send <email>`.

NPM scripts:
- `npm run dev` -> start development server
- `npm run build` -> production build
- `npm run start` -> start production server
- `npm run lint` -> ESLint
- `npm run seed` -> initial admin + baseline CMS setup
- `npm run check-db` -> DB connectivity check script
- `npm run seed-subscribe` -> seed subscribers from source data
- `npm run backup-db` -> complete Extended JSON database backup outside the repository
- `npm run audit:menu-links` -> report every nav link that would 404 (read-only)
- `npm run fix:menu-links` -> re-point menu items at the slug that actually resolves
- `npm run test:menu-page-sync` -> end-to-end tests for page/menu sync and move behaviour
- `npm run test:xss` -> comprehensive 10-scenario XSS contract security test suite
- `npm run test:e2e:xss` -> Playwright E2E browser XSS execution protection test suite
- `npm run test:404` -> comprehensive 13-scenario HTTP 404 status and SEO verification test suite
- `npm run test:e2e:404` -> Playwright E2E browser 404 status, responsive UI, and navigation test suite
- `npm run test:donate-schemes` -> 11-scenario contract test suite for multi-scheme selection, trusted pricing, and returning donor restoration
- `npm run test:donate-categories` -> 10-scenario contract test suite for unified donation category dropdown and Non-Zakat scheme allocation rules (DON-04)
- `npm run test:membership-button` -> 7-scenario contract test suite for Admin CMS management and frontend integration of Membership Header Button

## 7. Standard Workflows

### A) First-time local setup
1. Install dependencies: `npm install`
2. Configure `.env`
3. Seed baseline data: `npm run seed`
4. Start app: `npm run dev`
5. Verify:
   - public: `/`
   - admin: `/admin`
   - health: `/api/health`

### B) Content/page editing workflow
1. Admin updates page/blog/component/theme/menu through UI.
2. Admin API routes validate and persist to MongoDB.
3. Public pages render from saved `Page.layout` + component props.
4. Global shell elements (header/footer/global before/after) come from layout/theme data assembly.

### C) Add a new admin-managed domain module (recommended pattern)
1. Add model in `models/`.
2. Add admin API list/create route in `app/api/admin/<resource>/route.js`.
3. Add admin API detail route in `app/api/admin/<resource>/[id]/route.js`.
4. Protect with `requireAuth(req)` and role checks where required.
5. Add admin pages under `app/admin/(authenticated)/<resource>/...`.
6. Add public API + public pages only if needed.
7. Run `npm run lint` and smoke test CRUD manually.

### D) Add a new site component (supported scaffold flow)
Preferred path:
1. Create in Admin: Components -> New component
2. System scaffolds files and registration via `/api/admin/site-components`:
   - `components/site/<ComponentId>/<ComponentId>.js`
   - `components/site/<ComponentId>/EditForm.js`
   - `components/site/<ComponentId>/index.js`
3. Ensure registry + exports are present:
   - `lib/siteComponentRegistry.js`
   - `components/site/index.js` (including `EDITABLE_SITE_EDIT_FORMS`)
4. Validate edit drawer + preview behavior in:
   - `app/admin/(authenticated)/components/[id]/edit/page.js`

Detailed checklist: `docs/NEW_SITE_COMPONENT_CHECKLIST.md`

### E) Backup workflow before risky changes
1. Run `npm run backup-db`
2. Confirm timestamped output under `../mescotrust_cms_backups/YYYY-MM-DD_HH-mm-ss/database/`
3. If media changed, back up `public/uploads/` as well

Reference: `docs/BACKUPS.md`

### F) Pre-release sanity checks
1. `npm run lint`
2. `npm run build`
3. Validate auth redirects and role restrictions
4. Smoke test high-risk paths:
   - page render
   - blog list/detail
   - admin save/edit flows
   - media upload
   - contact/subscribe flows
   - payment callbacks (if touched)

## 8. Code Patterns to Follow

- Always reuse `connectDB()` from `lib/db.js`.
- For admin APIs:
  - call `requireAuth(req)` first
  - apply role restrictions with `isAdmin`/`isEditor` as needed
- Keep page layout blocks flat (`layout[]` of blocks).
- Keep component prop schemas aligned with `defaultProps`.
- For public rendering, map by `baseComponent` through `ComponentRenderer`.
- Prefer existing patterns in equivalent modules before introducing new abstractions.

### Permanent site-component wrapper invariant

When editing or redesigning any site component, never remove, replace, rename,
or modify these outer wrapper elements:

```jsx
<FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
  <PageContainer style={pageContainerBgStyle}>
```

New design markup, styling, and behavior must be implemented only inside these
wrappers. Preserve each component as an independent, self-contained component;
do not couple or merge its logic, styles, data, or animations with another
component.

## 9. Page <-> Menu Sync Invariant

A page's URL is derived from where it sits in the menu tree: a `page` item
nested under `Media` lives at `/media/<basename>`. Two admin surfaces mutate
that structure — the Page Builder "Parent Menu" select and the Menu editor
(drag / Indent / Move up level). Both must stay in sync, and neither may
leave a navigation link pointing at a dead slug.

**All of this lives in `lib/menuPageSync.js`.** Never re-implement slug
rewalking inside a route handler. The entry points are:

| Caller | Function |
| --- | --- |
| `PUT /api/admin/pages/[id]` | `syncAfterPageChange({ oldSlug, newSlug, title })` |
| `PUT|POST /api/admin/menus` and `PUT /api/admin/menus/[name]` | `syncAfterMenuSave({ menuName, items })` |
| `DELETE /api/admin/pages/[id]` | `removePageItems(items, slug)` |
| Public page routes | `resolveRedirect(slug)` |

Guarantees the module provides:

1. **Menu position decides the folder; the basename only changes when the
   page is explicitly renamed.**
2. **Moves are subtree moves** — moving `a/b` to `c/b` also moves `a/b/...`.
   Descendant pages are never orphaned.
3. **Every menu is repaired after any change**, so footer / secondary menus
   never keep a stale `pageSlug` or `url` for a page that moved.
4. **Healed items are re-nested** under the parent they now belong to,
   otherwise the other menu would pull the page back on its next save.
5. **Every rename writes a `PageSlugRedirect` row**, and the public routes
   answer with a `permanentRedirect` instead of a 404.
6. **`order` is re-indexed per sibling group** after every mutation, so the
   header renders in the order shown in the editor.
7. **Moves are atomic** — a slug collision aborts the whole batch and the menu
   keeps linking to the slug that actually exists, so a conflict degrades into
   a warning rather than a broken link.
8. **Page labels are only auto-updated** when the menu label still matches the
   page's previous title; custom navigation labels are never clobbered.

Verify with:

```
npm run test:menu-page-sync   # round-trip tests (creates + removes its own data)
npm run audit:menu-links      # read-only report of links that would 404
npm run fix:menu-links        # re-point menu items at the slug that resolves
```

`lib/menuPageSync.js` is CommonJS on purpose so operational scripts can
`require` it directly; route handlers still use named ESM imports.

## 10. Operational Notes

- Working tree may contain unrelated changes; do not revert unless explicitly requested.
- There is no formal automated test suite wired in `package.json`; validation is currently lint + build + manual smoke tests + targeted scripts.

## 11. Reference Index

Core docs:
- `README.md`
- `docs/TECHNICAL_DESIGN.md`
- `docs/API.md`
- `docs/PERMISSIONS.md`
- `docs/SITE_COMPONENTS_STORAGE.md`
- `docs/NEW_SITE_COMPONENT_CHECKLIST.md`
- `docs/DYNAMIC_IMAGE_CROP_AND_VALIDATION_GUIDE.md`
- `docs/COMPONENT_PLATFORM.md`
- `docs/BACKUPS.md`
- `docs/ANALYTICS.md`
- `docs/I18N.md`

Key implementation files:
- `components/admin/loading/AdminLoading.js` (single source of truth for every admin loader/skeleton; colours come from Admin Settings → Admin Loader via `--admin-loader-color`)
- `middleware.js`
- `lib/auth.js`
- `lib/apiAuth.js`
- `lib/rbac/catalog.js`
- `lib/rbac/bootstrap.js`
- `lib/rbac/resolver.js`
- `lib/layoutData.js`
- `lib/menuPageSync.js` (single source of truth for Page <-> Menu sync: subtree moves, cross-menu repair, slug redirects)
- `models/PageSlugRedirect.js`
- `components/cms/ComponentRenderer.js`
- `components/layout/PublicShell.js`
- `components/admin/AppearanceEditor.js`
- `components/appearance/AppearanceHeader.js`
- `components/appearance/AppearanceHeaderRibbon.js`
- `components/appearance/AppearanceFooter.js`
- `models/Appearance.js`
- `lib/appearance.js`
- `lib/siteComponentRegistry.js`
- `components/site/index.js`
- `app/api/admin/site-components/route.js`
- `app/api/admin/appearance/[module]/route.js`
- `app/admin/(authenticated)/components/[id]/edit/page.js`
- `lib/webPush.js` (Web Push VAPID signing and chunked broadcast engine)
- `public/sw.js` (Service Worker handling push and notificationclick events)
- `components/site/PushNotification/PushNotificationWidget.js` (Client-side opt-in notification bell widget)
- `components/admin/push-notifications/PushNotificationsModule.js` (Push Notifications admin management module)
- `models/PdfSearchIndex.js` (PDF text search index schema)
- `lib/pdf/extractor.js` (PDF text extraction and search indexing engine)
- `lib/search/unifiedSearch.js` (Unified Search across Pages, Events, Blogs, News, and Annual Reports)
- `components/search/SearchResultsClient.js` (Search Results client component with tabs, filters, highlighting)
- `app/(site)/search/page.js` (Search results public route)
- `lib/security/sanitize.js` (Universal sanitization engine: HTML allowlist, plain-text tag stripping, URL protocol filter, CSS token defense)
- `lib/security/jsonLd.js` (Unicode-escaped JSON-LD serializer preventing inline script breakout)
- `lib/workflow/constants.js` (Content approval workflow statuses and metadata)
- `lib/workflow/workflowEngine.js` (RBAC ownership validation, review transitions, and published revision engine)
- `app/api/admin/blogs/[id]/workflow/route.js` (Blog workflow approval, rejection, and publish API)
- `app/api/admin/events/[id]/workflow/route.js` (Event workflow approval, rejection, and publish API)
- `scripts/test-rbac-workflow-security.js` (Automated 14-scenario RBAC workflow security contract test suite)
- `e2e/rbac-content-approval.spec.js` (Playwright E2E content approval verification suite)
- `scripts/test-xss-security.js` (Automated 10-scenario contract security suite)
- `e2e/xss-protection.spec.js` (Playwright E2E browser execution prevention suite)
- `app/not-found.js` (Custom 404 Page with brand styling, animated SVG scene, section exploration, and soft 404 prevention)
- `scripts/test-404-seo.js` (Automated 13-scenario contract test suite for HTTP 404, status codes, and XML sitemap integrity)
- `e2e/404-seo-handling.spec.js` (Playwright E2E 404 status codes and responsive design verification suite)
- `lib/donateNowConfig.js` (Canonical donation schemes, category eligibility rules, and multi-scheme calculation)
- `components/site/DonateNow/DonateNow.js` (Donate Now public client component with unified category dropdown, Non-Zakat auto-lock, and mobile sticky cart drawer)
- `scripts/test-donate-non-zakat-and-category-contracts.js` (Automated 10-scenario contract test suite for unified categories and DON-04 Non-Zakat rules)
- `scripts/test-donate-multi-scheme-contracts.js` (Automated 11-scenario contract test suite for multi-scheme selection, trusted pricing, and returning donor restoration)
- `scripts/test-membership-header-button-contracts.js` (Automated 7-scenario contract test suite for Membership Header Button admin CMS management and frontend integration)

---

If this file diverges from implementation, treat code as source of truth and update `AGENTS.md` in the same change.

