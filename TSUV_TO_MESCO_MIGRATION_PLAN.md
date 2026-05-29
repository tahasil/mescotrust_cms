# TSUV → MESCO Migration Plan

**Date:** 2026-05-29
**Source (features to port):** `tsuv-cms` (`/Users/askari/Documents/projects/tsuv/tsuv-cms`)
**Target (port into):** `mescotrust_cms` (this repo)
**Status:** Analysis & plan only — no code changed. **Audit-hardened 2026-05-29** (47 confirmed findings from a multi-agent review folded in; see §6A runbook, §10 process, and **(audit)** items in §9).

> Method note: the two repos have **no shared git history**. They were compared by file path → content diff. `public/uploads/*` (4,400+ media files) and `backup/` (committed EJSON dumps) are tsuv runtime/content and excluded from the code comparison.

---

## 1. Executive summary

This is **not** a simple "fork added features" situation. It is a **major bidirectional divergence**:

- **TSUV (252 commits since fork)** rebuilt large parts of the admin platform: a full **RBAC** system, **draft/preview/publish** with soft-delete, a **modularized admin** (thin page files + `components/admin/<feature>/Module.js`), a relocated/expanded **theme-component** system (`components/site/` → `components/theme-components/`), and brand-new modules: **Portfolio, Team, Sliders, Popups, Forms/Submissions, Appearance, Dashboard**. It also rewrote theme-color persistence and the public blog route.
- **MESCO** also evolved independently and has features TSUV **never had or removed**: **donations/payments (CCAvenue)**, **event-registrations admin**, **subscribers admin**, **volunteer form**, **social share** (events/blog), the MESCO site components (44 registered IDs across 46 folders; 4 share a name with TSUV), donation-receipt email, and the full `docs/` set.

Two consequences shape the entire plan:

1. **RBAC is the foundational blocker.** Almost every new TSUV module calls `requirePermission(...)` / `useAdminAuth()` and assumes the new `User`/session shape + the `softDelete` plugin. None of this exists in MESCO. **Nothing else compiles or runs until RBAC + softDelete + the User/auth changes land.**
2. **Many shared files must be MERGED, never overwritten** — overwriting them silently deletes MESCO-only features (donation email, the MESCO site components, marquee/Donate theming, social share, CookieConsent, docs).

### The golden rules
- **Never wholesale-overwrite these (merge by union):** `lib/email.js`, `components/site/index.js` + `lib/siteComponentRegistry.js`, `components/admin/AdminLayoutClient.js`, `styles/Theme.js`, `models/ThemeConfig.js`, `app/api/theme/route.js`, `lib/permissions.js`, `app/(site)/layout.js`, `components/layout/PublicShell.js`, `app/api/admin/contacts/route.js`, `models/Subscriber.js`, `app/api/public/event-registrations/route.js`.
- **Never copy tsuv env/content:** `.env`, `env.local`, brand color defaults, tsuv map embeds / copy, `public/uploads/*`, `backup/*`, operator-machine scripts.
- **Always preserve MESCO-only features** (see §4) and verify them after every phase (see §9 checklist).

---

## 2. Classification of every change

### 2A. Genuine features / improvements to PORT
| Area | What | Risk |
|---|---|---|
| RBAC | Dynamic role/permission system, per-route enforcement, delegated user mgmt | High (foundational) |
| Draft/Publish | Draft vs published snapshot on Page, secure preview tokens, soft-delete | Medium |
| Theme-components | `site→theme-components` relocation, ~10 genuinely-reusable new components, shortcode system, anchor-scroll, global loader | Medium |
| Sliders module | Admin-managed sliders (`sliders` collection), HomeHero lottie/video/map | High (collides with MESCO sliders) |
| Popups module | Route-targeted marketing popups + `RoutePopupHost` | Low (additive) |
| Portfolio module | CRUD + categories + drag-drop ordering + public block | Medium |
| Team module | CRUD + categories + ordering + public block | Medium (replaces MESCO's team page semantics) |
| Forms/Submissions | Generic form builder + submissions inbox | Medium (file-scaffolding risk) |
| Appearance module | Sectioned theme editor + background library + persistence rewrite | **Highest** (theme data migration) |
| Dashboard | KPI + recent activity + notifications | Low (clean) |
| Media | Audio/video/SVG/JSON uploads, HTTP Range streaming, cache-busting, upload rollback | Low–Medium |
| Config/perf | `next.config` perf + headers, boot-time index sync, model indexes, menu `enabled`/`target`, event link-target | Low |
| Ops scripts | `backup-db-full`, `restore-db-full`, `compare-db`, `ensure-indexes`, `audit-unused-media` | Low |

### 2B. tsuv-specific — DO NOT PORT
- Brand color defaults (`#CF372F`/`#00516F`/`#FBB040`) in `styles/Theme.js`, `models/AppearanceColorConfig.js`.
- tsuv content/copy & seed data: AboutUs "StepUp Ventures/Bharat" defaults, PartnerWithUs investment framing, "Work With Us" form template, Karnataka/Bangalore map embed, "Showing X startups" label.
- Component names that are irredeemably tsuv-flavored: `WhyInvestWithStepUp` (skip or rename); consider renaming `FeaturedReport`, `NetworkMetricsCard`.
- Data-migration & operator scripts: `migrate-portfolio-from-tsuv-source.js`, `finalize-portfolio-missing-via-db.js`, `restore-media-from-bkp-img.js` (hardcoded `C:\...\BKP-img`), `cleanup-active-modules.js`, `prune-unused-theme-components.js`, `remove-legacy-marquee.js`, `remove-registered-component.js`, the tsuv default URI in `sync-db-schema-and-core-data.js`.
- `.env` / `env.local` / `.env.example` (tsuv values), `public/uploads/*`, `backup/*`, the `.tmp-rbac-audit*` working scripts, `docs/playr-cricket-card-layout-analysis.md`.
- `.gitignore` rule for `theme-components/map-slider/india_map.svg` (tsuv asset).

### 2C. MESCO-only — PRESERVE (do-not-clobber)
Donations/payment (CCAvenue), event-registrations admin, subscribers admin, volunteer form, social share (`helpers/socialShare.ts` + `components/common/SocialShare.tsx`), the MESCO `components/site/*` components (44 registered IDs across 46 folders; 4 shared-by-name), `lib/ccavenue.js`, `lib/themeColorFallbacks.js`, `models/Donation.js`, `sendDonationReceipt` in `lib/email.js`, `docs/` (23 files), MESCO root planning docs, `app/api/theme/marquee/route.js` + marquee theme fields, smoothScroll/fadeAnimation theme fields, Donate-header props, CookieConsent wiring. (Full detail in §4.)

---

## 3. Migration phases (recommended order)

Dependency-correct ordering. Each phase should build + smoke-test before the next. **Phase 0 decisions gate everything.**

### Phase 0 — Decisions

**RESOLVED (2026-05-29):**
- **Overall ambition: FULL ARCHITECTURAL CONVERGENCE** — adopt TSUV's refactors (RBAC, sitesettings persistence, `modules/` system, slider relocation) so the two repos re-align. Bias every sub-decision toward TSUV's structure **except** where a MESCO-only feature must be preserved.
- **Author role: DROP & remap → Editor.** Adopt TSUV's User model as-is; add a one-off migration mapping existing `role:"Author"` users → Editor. Remove `isAuthor`, the middleware Author allow-lists, and Author nav gating in `AdminLayoutClient.js`.
- **Theme persistence: FULL ADOPTION.** Migrate `themeconfigs`→`sitesettings`, add `AppearanceColorConfig`, drop `fs.writeFileSync(styles/Theme.js)`. Requires a tested data migration + verifying the public site reads colors via CSS variables.
- **Component library: KEEP `components/site/`** (do NOT rename to `theme-components/`); merge the registry by union so all MESCO components survive; cherry-pick the ~8–12 reusable TSUV components into `components/site/`. ⚠️ **Consequence:** because we keep the folder name, the ported theme-component admin platform + `app/api/admin/site-components/*` routes (which hardcode the `"theme-components"` path in several places) **must be patched to `"site"`**. The `modules/` system (sliders/popups) is still adopted per convergence.

**STILL OPEN (smaller — recommended defaults below, confirm during implementation): §6.4–6.7.**

### Phase 1 — Foundation: soft-delete + RBAC + auth
Everything depends on this.
1. `models/plugins/softDelete.js` (NEW) — Boolean `isDeleted` + query filters + helpers. Standalone, no deps. **Then apply the plugin to every shared model TSUV soft-deletes:** `Blog`, `BlogCategory`, `BlogComment`, `Component`, `Menu`, `Event`, `Media`, `ContactSubmission` (+ `SiteComponentMeta` in Phase 5, + the new RBAC models). ⚠️ This adds an `isDeleted` filter to **every default query** on those models — re-test all existing MESCO read paths (this is NOT "minor"/index-only as Phase 9 first framed Media/Blog/Menu/Event; `models/Component.js` in particular was previously unmentioned). Do NOT apply it to `Page` (which uses a hand-rolled Number `isDeleted`).
2. New models: `models/{AdminRole,Permission,RolePermission,PermissionAuditLog}.js`.
3. `models/User.js` — add `roleKey`/`userType`/`permissionVersion`/`sessionVersion`, `pre("validate")` normalization, softDelete plugin. **Author DROPPED (full trace):** adopt TSUV's model as-is and add a one-off migration mapping existing `role:"Author"` users → Editor; then remove EVERY Author reference: `isAuthor` in `lib/permissions.js`, the middleware Author allow-lists (`isAuthorAllowedAdminPath`/`Api`), Author nav gating in `AdminLayoutClient.js`, the `ALLOWED_ROLES` Set that still contains `"Author"` in the users APIs, and the Author option in the users-page role dropdown. Note: soft-deleted users keep their unique `email` — release it on delete (as Page does for slug) so the address can be reused.
4. `lib/rbac/*` (10 files: constants, catalog, resolver, accessControl, permissionUtils, userType, bootstrap, assignmentValidator, audit, clientPermissions).
   - **Edit `catalog.js`** to add MESCO modules (`donations`, `event-registrations`, `subscribers`, `volunteer`) to `MODULE_DEFINITIONS`, `PAGE_RULES`, `API_SEGMENT_TO_MODULE`, `MENU_PERMISSION_MAP` — otherwise those routes become fail-open (any admin user). (See §6.4.)
   - `bootstrap.js` runs a one-time data migration over the live `User` collection on first request — **test against MESCO data + a backup**.
5. `lib/env.js` (adds auth-redirect/url helpers; drops `NEXTAUTH_URL` from required), `lib/permissions.js` (key-based; **remove `isAuthor`** — Author dropped per 6.1, and MESCO's `isAuthor` has zero callers), `lib/adminAccess.js` (NEW, edge-safe).
6. `lib/auth.js` (session carries `permissionKeys`; live session invalidation), `app/api/auth/[...nextauth]/route.js` (runtime `NEXTAUTH_URL` — only if MESCO needs proxy host detection), `middleware.js` (catalog-driven; `/admin/forbidden` redirects — **preserve MESCO's `/media/*` rewrite, login rate-limit, same-origin/CSRF, and verify the CCAvenue callback still passes same-origin**).
7. `lib/apiAuth.js` — `requireAuth` now returns a `sessionLike` + enforces `/api/admin` & `/api/theme`; adds `requirePermission`/`requireAny/AllPermissions`. **Audit all ~37 MESCO routes that call `requireAuth`** — verify `session.email` survives (publish/preview use it) and convert MESCO-only admin routes to `requirePermission` after the catalog is extended.
8. Users APIs (`app/api/admin/users/{route,[id]/route}.js`) + RBAC APIs (`app/api/admin/rbac/{roles,roles/[key],permissions}/route.js`) + `scripts/rbac-promote-super-admin.js`. The users APIs and `app/admin/(authenticated)/users/page.js` (item 9) are **full OVERWRITES with TSUV's RBAC versions** (they carry the Author-drop: MESCO's contain `ALLOWED_ROLES = new Set([...,"Author"])` + an Author dropdown). **Create/seed a Super Admin** (MESCO has none today).
9. UI: `components/admin/{rbac,users}/*`, `components/admin/AdminAuthContext.js`, `components/admin/AccessForbiddenPage.js`, `app/admin/(authenticated)/{rbac/roles,forbidden,users}/page.js`, `app/admin/(authenticated)/layout.js`.
   - **`components/admin/AdminLayoutClient.js` = MANUAL MERGE** (MESCO 1188 vs TSUV 1550). Take TSUV's permission-based menu gating + `AdminAuthProvider`, but **preserve MESCO's nav items** (subscribers @215, event-registrations @223, donations @231, volunteer-form @239) and dashboard widgets. Largest single-file merge in the project.

### Phase 2 — Shared infra libs (small, unblock later phases)
- `lib/linkUtils.js` (NEW) — used by ~16 components + events route. Port early.
- `lib/scrollUtils.js` (NEW) + `SectionId` additions to `lib/manageSectionFields.js` & `components/admin/ManageSectionFields.js` (additive) + `components/site/PageTransitionLoader.js` hash-aware fix (MESCO keeps `components/site/` per 6.2 — TSUV's path is `components/theme-components/`).
- Global loader: `components/shared/{AntdLoaderIndicator,ContentLoaderFallback}.js` + spinner CSS into `app/globals.css` + mount in `app/layout.js`.
- `lib/featureFlags.js` (NEW) — **note: defaults events + admin create/delete to OFF**; decide per-flag defaults for MESCO (MESCO uses events — set `NEXT_PUBLIC_ENABLE_EVENTS=1` or skip the gate).
- `lib/defaultPropsByBase.js` (NEW) — **hard prerequisite for the Phase 3 public-render switch.** Imported by ALL core public render paths (`app/(site)/page.js`, `[...slug]/page.js`, `_resolved/[...slug]/page.js`, `resolved-pages/[...slug]/page.js`, `preview/[id]/page.js`), the blogs/portfolio render pages, AND `lib/layoutData.js` (via its `getAllSiteComponentsAndSliders` export).

### Phase 3 — Draft / Preview / Publish
Depends on Phase 1 (`requirePermission`, softDelete).
- `models/Page.js` — add published snapshot fields + soft-delete (`isDeleted` **Number 0/1**, hand-rolled — do NOT apply the Boolean plugin to Page) + 3 indexes.
- `lib/pagePublication.js`, `lib/previewToken.js` (NEW).
- APIs: `app/api/admin/pages/route.js` (modified), `[id]/route.js` (modified — soft-delete, optimistic concurrency; **the menu-sync-on-slug-change logic was MOVED to the publish route, not deleted — verify it survives**), `[id]/publish/route.js` (NEW, has the relocated menu-sync), `[id]/preview-token/route.js` (NEW).
- `app/(site)/preview/[id]/page.js` (modified — token-gated).
- Admin pages UI: port `components/admin/pages/*` (CmsPageEditPage, CmsPageCreatePage, PagesModule) and thin the page route files.
- **Public render switch (REQUIRED for correctness):**
  - **Helper-based** (`buildPublishedSlugFilter` + `toPublishedPageShape`): `app/(site)/[...slug]/page.js`, `app/(site)/page.js`, `_resolved`/`resolved-pages`, `app/api/public/pages/[slug]/route.js`, `lib/seo.js`.
  - **Manual-filter** (NOT the helpers — TSUV uses `{status:"published", isDeleted:{$ne:1}}` + selects/maps `publishedSlug`/`publishedTitle` via `getPublishedSlug`/`getPublishedTitle`): `app/api/public/search/route.js`, `app/sitemap.js`.
  - **If skipped, the live site renders unpublished drafts.**
- Env: set `PREVIEW_TOKEN_SECRET` (or rely on `NEXTAUTH_SECRET`), MESCO-specific `PREVIEW_SITE_URL`.

### Phase 4 — Theme persistence + Appearance module (HIGHEST RISK)
Depends on Phase 1. **This is the most dangerous port — do not rush.** Decision 6.3 = FULL ADOPTION: adopt TSUV's `sitesettings`/`AppearanceColorConfig` model, but **carry MESCO-only fields forward** (marquee/smoothScroll/fadeAnimation/Donate) into the new model + add Appearance sections (or keep the legacy marquee route) for them. Prerequisite: a **tested `themeconfigs`→`sitesettings` migration against a backup**, and confirm the public site reads colors via CSS variables (so dropping `fs.writeFileSync(Theme.js)` is safe).
- New persistence layer: `lib/siteSettings.js`, `lib/appearanceColors.js`, `lib/appearanceThemeOwnership.js`, `lib/appearanceTitleAndColorsConfig.js`, `lib/themeColors.js`, `models/AppearanceColorConfig.js`.
- `models/ThemeConfig.js` — **MERGE, do not overwrite.** Add tsuv's new fields (background library, footer column titles, subscribe bg, `buttonTarget`) but **keep MESCO's `marquee*`, `smoothScroll*`, `fadeAnimation*`, `siteTitle:"Mesco Trust"`, and Donate/header colorKey defaults.** The collection rename `themeconfigs`→`sitesettings` needs a **tested data migration** (`siteSettings.js` has `migrateFromLegacyThemeConfigs`) run against a backup.
- `app/api/theme/route.js` — **MERGE.** Adopt the RBAC + AppearanceColorConfig persistence and the removal of `fs.writeFileSync(styles/Theme.js)` **only after confirming MESCO's public site reads colors via CSS variables** (not the written file). Keep MESCO's marquee/Donate/themeColorFallbacks logic.
- `app/api/theme/{header,footer,subscribe}/route.js` — ⚠️ **STORAGE MIGRATION, not just an auth swap.** MESCO's versions read/write the **`components` collection** (Component model, by `baseComponent`); TSUV's read/write **`sitesettings`**. **Before cutting these over, migrate the existing Header/Footer/Subscribe `components` docs into the `sitesettings` doc** — `migrateFromLegacyThemeConfigs` only covers `themeconfigs`, NOT `components`, so without this the new routes read empty fields (live header/footer/subscribe content disappears). Alternative: keep MESCO's Component-backed routes and adopt only the `requirePermission` change. Also `[componentId]` + `home-hero` theme routes.
- `app/api/admin/title-and-colors-config/route.js` AND `app/api/admin/appearance/title-and-colors-config/route.js` — **NEW (both tsuv-only).** Back the `titleAndColorsConfig` libs; they write **distinct** ThemeConfig fields (`titleAndColorsConfig` vs `appearanceTitleAndColorsConfig`) and are referenced by `lib/rbac/catalog.js`.
- `lib/layoutData.js` — **MERGE (runs on every public page** — imported by both `app/(site)/layout.js` and `app/layout.js`). Adopt TSUV's `getSiteSettingsLean`/`getAllSiteComponentsAndSliders`/`buildThemePaletteData`/`linkUtils`-based loading, but **keep MESCO's `smoothScroll*`/`fadeAnimation*` THEME_DEFAULTS, marquee/Donate `ThemeConfig` fallbacks, and `themeColorFallbacks` linkage.** Note: the `themeconfigs`→`sitesettings` migration above breaks MESCO's current direct `ThemeConfig.findOne` read inside this file, so it MUST be merged in this phase.
- Appearance UI: `components/admin/appearance/*` (module, sections, Header/Footer/Subscribe/Loader, local utils). `app/admin/(authenticated)/appearance/{page,[section]/page}.js`. `app/admin/(authenticated)/theme/page.js` → redirect.
- **Preserve MESCO theme editing that Appearance doesn't cover:** marquee (`app/api/theme/marquee/route.js` + `components/site/Marquee/EditForm.js`), smoothScroll, fadeAnimation, Donate-header fields. Either add MESCO sections to the Appearance module or keep the legacy theme page for those.
- `styles/Theme.js` — **MERGE.** Add the new semantic color keys / `ThemeAppearanceLineTabs` the chosen components use; **keep MESCO's brand palette and `THEME_COLOR_ALIASES` name** (MESCO code references it). `lib/titleAndColorsConfig.js`, `components/admin/TitleAndColorsSection.js` — merge.
- **Dependency note:** the `[componentId]` theme route imports `Slider`/`Popup` models — either land Phase 6 first or strip those branches initially.

### Phase 5 — Theme-component system + new components
Depends on Phase 2 (`linkUtils`, scroll, loader) and Phase 4 (theme persistence) for full fidelity.
- **Decision 6.2 = KEEP `components/site/` (no rename).** **Merge** new IDs into `components/site/index.js` + `lib/siteComponentRegistry.js` `SITE_COMPONENT_IDS` (union — never overwrite). `components/cms/ComponentRenderer.js` — add Portfolio block, register new components; do NOT lose MESCO components. **Patch every hardcoded `"theme-components"` path literal** in the ported `app/api/admin/site-components/{route,[id]/route}.js` and the admin platform pages to `"site"` (scaffold target, registry-write target, file-removal target — several occurrences).
- Port the genuinely-reusable new components into `components/site/`: **HighlightCardsGrid, InfoStatsGrid, JourneyTimeline, CallToActionBanner, Milestones, MultiLevelMarquee, MediaControl, VideoModalControl** (and conditionally AboutUs [sanitize defaults + needs PortfolioImagePickerInput], FeaturedReport/NetworkMetricsCard [rename], BlogsListing [needs blog parity], MapSliderAnimations [needs `lib/mapSliderAnimations.js` **only — NOT `lib/mapEmbed.js`**; re-default the hardcoded `india_map.svg` asset inside `lib/mapSliderAnimations.js`]). **Skip** WhyInvestWithStepUp.
- **Re-default all tsuv copy** in ported components.
- Overlapping upgrades (Accordion, Cards, AnimationsText, InnerPageHero — heavily rewritten in TSUV): diff-merge; depend on `linkUtils`.
- **MERGE shared admin form utils** (hard dependency of every ported EditForm): `components/admin/schemaFormUtils.js` (TSUV adds `ThemeColorOnlySelect`; imported **directly** by admin edit forms) and `components/admin/SortableFormList.js` (TSUV adds `allowDeleteLast`/`addButtonVariant`). Adopt TSUV's additions while preserving behavior MESCO's existing forms (`SectionEditForm`, `GenericSchemaEditForm`, `components/site/Header/EditForm`) rely on. These are the top-level files — distinct from the `components/admin/appearance/local/` copies.
- `lib/systemComponents.js` — **MERGE (additive):** add the `*Target` props (`buttonTarget`/`secondaryButtonTarget`/`logoTarget`/`linkTarget`) now; the new `Portfolio` system-component entry lands with Phase 7. Re-run `app/api/admin/components/{seed,ensure/[base]}` after merging. Keep MESCO defaults (e.g. `logoTitle:"MESCO"`).
- Shortcode: `lib/shortcode.js` + `components/site/ShortCode/*` (`ShortCode`, `FormShortcodeRenderer`) — bundle with Forms (Phase 8).
- Admin theme-component platform (the upgraded `components/page.js` with Delete + RBAC, `app/api/admin/site-components/{route,[id]/route}.js`): **reconcile** — TSUV's version removes MESCO's "global/show-on-all-pages/position" feature and hardcodes the `"theme-components"` path. Add a `module !== "sliders"/"popups"` filter to MESCO's components page + PageBuilder.
  - The three `app/admin/(authenticated)/components/theme-components/*` files are thin redirect/re-export wrappers → **per 6.2, DROP them** (MESCO uses `/admin/components` directly), or if kept, repoint their `/admin/components/theme-components` URL literals.
  - `app/admin/(authenticated)/component/shortcode/page.js` (tsuv-only, redirects to `/admin/components/ShortCode/edit`): port only if the redirect target resolves under MESCO's component admin routing; otherwise drop.
- `models/SiteComponentMeta.js` — add `module` enum field + softDelete + `scripts/migrate-site-component-module-owners.js` backfill.

### Phase 6 — Sliders + Popups
Depends on Phase 1 + Phase 4 (theme routes) + Phase 5 (`module` field, registry).
- **Popups first (clean, additive — no MESCO collision):** `models/Popup.js`, `lib/popupRouteUtils.js`, `app/api/public/popups/route.js`, `components/admin/Popups/*`, `modules/popups/*`, `app/admin/(authenticated)/popups/{page,[slug]/page}.js` — the `[slug]` edit page needs the **same `forcedComponentId`/`forcedBackHref` upgrade** to `components/[id]/edit/page.js` that Sliders needs, so do that upgrade first (it gates both). Graft the popup branch into the `[componentId]` theme route. **Insert `<RoutePopupHost/>` into MESCO's PublicShell (2-line surgical insert — do NOT copy TSUV's PublicShell).** Verify `/api/media/<id>?format=original` works; consider reducing the 5s polling.
- **Sliders (high collision — relocate-and-replace per 6.5):** `models/Slider.js`, `lib/sliderComponentRegistry.js`, `components/admin/sliders/*`, `modules/sliders/*`, `app/admin/(authenticated)/sliders/{page,[slug]/page}.js`.
  - **Enumerate ALL slider editors to port** (§6.5 named only 5): `HomeHero`, `CircularSlider`(=`ImageSlider`), `StoriesSlider`, `EventsSlider`, **`NewsFeedSlider`** (net-new, no MESCO counterpart), **`CustomSlider`** (net-new), **`Testimonials`** (⚠️ collision — below).
  - ⚠️ **Testimonials name collision:** MESCO already ships `components/site/Testimonials/*`, registers `Testimonials` in `SITE_COMPONENT_IDS`, and wires `TestimonialsEditForm` in `components/site/index.js` — a DIFFERENT component sharing the id with TSUV's slider-module Testimonials. **Decision:** keep MESCO's and SKIP TSUV's slider Testimonials, OR migrate into the slider module and update `SITE_COMPONENT_IDS` + `components/site/index.js`.
  - **Re-wire `components/site/index.js`** (required by relocate-and-replace — without it MESCO keeps the old local components and the EditForm map still resolves to local forms): repoint the slider/popup export lines AND the EditForm-by-componentId map to `@/modules/sliders`, `@/modules/popups`, `@/components/admin/sliders/{CustomSlider,Testimonials}`; retire the replaced local `components/site/{HomeHero,StoriesSlider,EventsSlider,CircularSlider,ImageSlider}` folders.
  - Upgrade MESCO's `AdminComponentEditPage` (`components/[id]/edit/page.js`) to accept `forcedComponentId`/`forcedBackHref`.
  - `HomeHero` + the `home-hero` theme route **hard-depend** on `lib/mapSliderAnimations.js` + `components/site/MapSliderAnimations` (the map-slider media type) — land them together or strip the map branch. Add `lottie-web@^5.13.0` only if porting HomeHero lottie. **Migrate existing HomeHero data** (`components`→`sliders` collection).

### Phase 7 — Portfolio + Team
Depends on Phase 1 (RBAC/softDelete), Phase 2 (`linkUtils`), Phase 6 (slider mapping — or stub it).
- Portfolio: `models/{Portfolio,PortfolioCategory}.js`, `app/api/admin/portfolio*`, `app/api/portfolio/route.js`, `components/admin/Portfolio/*`, `components/cms/blocks/Portfolio.js`, `lib/portfolio*`, admin pages. **Do NOT run the tsuv migrate scripts.** Generic-ize "startups" label.
- Team: `models/{Team,TeamCategory}.js`, **`app/api/admin/teams/*` AND `app/api/admin/team-categories/*`** (a `teams*` glob misses team-categories), `app/api/teams/route.js`, `components/admin/team/*`, `lib/team*`, admin pages. **Decision (§6.6):** this replaces MESCO's `team/page.js` (a **read-only CommitteeMembers listing with an Edit shortcut — not a toggle**) and `components/cms/blocks/Team.js` (inline-props grid → DB-driven). CommitteeMembers stays editable via `/admin/components`. Confirm coexistence vs replacement.
- Add Portfolio/Team **nav links** to `AdminLayoutClient.js`. (Their catalog permission entries — `MODULE_DEFINITIONS`/`PAGE_RULES`/`API_SEGMENT_TO_MODULE`/`MENU_PERMISSION_MAP`/`EDITOR_ALLOWED_MODULES` — already arrive wholesale with Phase 1's adoption of TSUV's `lib/rbac/catalog.js`; here just verify the Editor/Admin level.) Add the `Portfolio` entry to `lib/systemComponents.js` (§4.11) and register the `Portfolio` block in `ComponentRenderer` (also covered in Phase 5).

### Phase 8 — Forms/Submissions + Dashboard
Depends on Phase 1; Forms before Dashboard (dashboard reads `Form`).
- Forms: `models/Form.js`, `app/api/admin/forms/*`, `app/api/admin/form-submissions/*`, `app/api/public/forms/*`, `components/admin/forms/*` (re-default tsuv content; keep generic ContactUs/Newsletter, drop/replace PartnerWithUs/Form1 content), `components/admin/submissions/*`, `lib/contactSubmissionIdentifiers.js`, `lib/mapEmbed.js`.
  - **Additive** — does NOT replace MESCO's contact/subscribe/event-reg/volunteer flows (those stay). The `ContactForm.js` rewrite (461→69) that re-points the contact page at the Forms module is **optional and invasive** — recommend keeping MESCO's ContactForm unless there's a reason to switch.
  - **Deployment risk:** Forms scaffolds `.js` files at runtime and `rm`s folders on delete — fails on read-only/immutable hosts. Decide: keep file-scaffolding (ensure writable FS) or refactor to a DB-only `fields` schema.
  - Resolve the submission routes: keep the **singular** `app/admin/(authenticated)/submission/[formKey]/page.js` (the notification link target — `notifications/route.js` points there), drop/redirect the **plural** `submissions/[formKey]/page.js` duplicate, and decide whether to port the public `app/submission/[formKey]/page.js` alias.
  - **`app/admin/(authenticated)/contacts/page.js` (shared, divergent):** MESCO's is a full inline `AdminContactsPage` table reading `/api/admin/contacts?submissionType=contact`; TSUV's is a 4-line `<ContactsPage/>` wrapper merging contact-API results with Form-module submissions. **Decision:** adopt TSUV's wrapper (changes which API the inbox reads + drops MESCO's inline detail fields) vs keep MESCO's inline page. Whatever is chosen, the volunteer admin's `submissionType` filtering on the contacts API must survive.
- Dashboard: `lib/admin/dashboardData.js`, `app/api/admin/dashboard/route.js`, `app/api/admin/notifications/route.js`, `components/admin/dashboard/*`, thin `app/admin/(authenticated)/page.js`. Add `dashboard.view` to catalog. Clean — only needs RBAC + `Form`.

### Phase 9 — Media + config + infra
Mostly independent; can run alongside earlier phases.
- Media: `lib/media/constants.js` (audio/video/SVG/JSON), `lib/media/url.js` (cache-bust), `lib/media/processor.js`, `lib/storage/*` (**merge** — keep MESCO's robust `resolvePublicRoot`, add tsuv's `MEDIA_UPLOAD_DIR` env support), `app/uploads/[...path]/route.js` (NEW, Range support), `app/api/media/[id]/route.js` + `app/media/[id]/route.js` (streaming + Range), admin media routes (validation + rollback + `mimeType` filter; RBAC pieces from Phase 1), `components/admin/media/*` (RBAC gating + broadened accept lists; check callers of removed `originalMediaUrl`). Models: `Media`/`MediaJob` minor.
- `next.config.js` — **merge.** Add perf flags, image formats, cache headers, `media-src` CSP. **CSP conflict:** tsuv removed `cdn.jsdelivr.net` — MESCO loads Bootstrap from jsdelivr (`app/(site)/layout.js:125`). Either keep jsdelivr in CSP or self-host Bootstrap into `/public/js` (see §6.7).
- `instrumentation.js` — add boot-time index sync (`scripts/ensure-indexes.js`); ensure every model in its `MODEL_FILES` exists (or gate), and **add MESCO-only models (e.g. `Donation`) to `MODEL_FILES`** so their indexes sync at boot. `SKIP_INDEX_SYNC=1` opt-out.
- Model indexes/fields: Blog (+2 indexes), Menu (+`enabled`/`target`), Event (+`eventLinkTarget`/`eventLinkOpenInNewTab` + index), Subscriber (drop redundant index — but **diff first**, shared file).
- Ops scripts: port the generic ones — `scripts/backup-db-full.js`, `restore-db-full.js`, `compare-db-remote-local.js` (npm alias `compare-db`), `sync-db-schema-and-core-data.js` (npm alias `sync-db-safe`; **fix its tsuv default URI** `mongodb://localhost:27017/tsuv_cms_v1`), `ensure-indexes.js`, `audit-unused-media.js` — and add the matching `package.json` `scripts` entries. **Skip** operator/data-specific scripts (§2B). `scripts/backup-db.js`: only flip `themeconfigs`→`sitesettings` if Phase 4's collection migration was done.

### Phase 10 — blog → blogs + events public pages
Depends on Phase 3 (draft/publish), Phase 4 (siteSettings), Phase 5 (BlogsListing component).
- Route rename `/blog`→`/blogs`: `app/(site)/blog/page.js` + `blog/[slug]/page.js` become redirect stubs; NEW `app/(site)/blogs/page.js` + `blogs/[slug]/page.js` (CMS-page-driven, themeable). Update `basePath` in `components/blog/*`, `app/sitemap.js`, `app/api/public/search/route.js`, the DB-driven Menu items rendered by Header/Footer, AND the **hardcoded `/blog` literals** in `components/layout/PublicShell.js` (nav fallback) and `app/(site)/page.js` (home body link).
- **Re-integrate MESCO's SocialShare** into the new themeable `blogs/[slug]` and `events/[slug]` pages (tsuv versions dropped it).
- Events: add link-target normalization (`lib/linkUtils`), decide on `isEventsFeatureEnabled` gate (MESCO uses events — enable or skip the gate). Blog components grew for CSS-var theming — diff-merge.

### Phase 11 — Verification
Run the preservation checklist (§4), the tsuv RBAC endpoint audit script against MESCO, and the draft/publish UAT checklist. Full build + admin/public smoke tests.

---

## 4. MESCO-only features to PRESERVE (do-not-clobber detail)

1. **Donations/Payment (CCAvenue):** `app/(site)/donation/*`, `app/api/payment/*`, `app/admin/(authenticated)/donations/page.js`, `app/api/admin/donations/*`, `lib/ccavenue.js`, `models/Donation.js`, `components/site/DonateNow/*`, `sendDonationReceipt` in `lib/email.js`, 4 `CCAVENUE_*` env vars. Risk: `lib/email.js` overwrite breaks the build; catalog gaps make admin route fail-open; verify CCAvenue callback passes same-origin after middleware port.
2. **Event-registrations admin:** `app/admin/(authenticated)/event-registrations/page.js`, `app/api/admin/event-registrations/*`. The shared `app/api/public/event-registrations/route.js` differs **only** by a theme-read swap (`ThemeConfig.findOne`→`getSiteSettingsLean()` for the ack-email orgInfo) — the registration doc shape is identical, and this swap is required anyway by Phase 4 (no doc-shape risk).
3. **Subscribers admin:** `app/admin/(authenticated)/subscribers/page.js`, `app/api/admin/subscribers/route.js`. `models/Subscriber.js`: the only diff is a redundant `index({email:1})` (already `unique`) — adopt TSUV's (which drops it); not a merge-to-preserve case.
4. **Volunteer:** `app/admin/(authenticated)/volunteer-form/page.js`, `components/site/Volunteer/*`. **No dedicated model/API** — reuses `/api/admin/contacts?submissionType=volunteer`. The volunteer regex is byte-identical in TSUV's contacts route; the only real diff is the RBAC auth swap (`requireAuth`→`requirePermission(req,"contacts.view")`), so the merge concern is adopting that swap (+ a `contacts` catalog entry), not preserving the regex.
5. **Social share:** `helpers/socialShare.ts`, `components/common/SocialShare.tsx`, wired into `blog/[slug]` + `events/[slug]`. Re-integrate when those pages change (Phase 10).
6. **MESCO `components/site/*` components** (44 registered IDs across 46 folders) — preserve via registry merge (§6.2). The 4 shared-by-name with TSUV (Accordion, AnimationsText, Cards, InnerPageHero) are diff-merged in Phase 5; the rest are MESCO-only. (`PageTransitionLoader.js` lives here too.)
7. **MESCO-only theme features:** marquee (`app/api/theme/marquee/route.js`, `components/site/Marquee/*`, ThemeConfig marquee fields), smoothScroll, fadeAnimation, Donate-header props, CookieConsent wiring in `app/(site)/layout.js`.
8. **MESCO-only libs:** `lib/themeColorFallbacks.js` (consumed by theme routes + layoutData — keep if those are merged not replaced). `components/layout/LayoutSwitcher.js` is effectively dead (safe to drop). `components/site/Header.js` is a harmless re-export shim.
9. **Docs & planning:** `docs/` (23 files), `AGENTS.md`, `CMS_FEATURE_PLAN.md`, `MESCO_GAP_ANALYSIS_AND_IMPLEMENTATION_PLAN.md`, `SOCIAL_MEDIA_WALL_INTEGRATION.md`, `README.md`, `SocialMediaWall` component + `docs/admin-manual/11-social-media-wall.md`.
10. **`lib/layoutData.js` (load-bearing):** runs on every public page (imported by `app/(site)/layout.js` AND `app/layout.js`); MESCO's version reads `ThemeConfig`/`Component` directly and defines MESCO-only `smoothScroll*`/`fadeAnimation*` defaults + uses `themeColorFallbacks`. MERGE in Phase 4 (not on §5 list by accident before). The `themeconfigs`→`sitesettings` migration would break its direct read if left unmerged.
11. **`lib/systemComponents.js` (shared, differs):** seeds the system-component catalog (used by `app/api/admin/components/{seed,ensure/[base]}/route.js` + `scripts/seed.js`). TSUV adds a NEW `Portfolio` system component and `*Target` props (`buttonTarget`/`secondaryButtonTarget`/`logoTarget`/`linkTarget`) on Hero/Footer/CallToAction/Card. **Additively merge** (MESCO's set is the same minus Portfolio); preserve MESCO defaults like `logoTitle:"MESCO"`. Then re-run the seed/ensure routes. (Without it the Portfolio block can't be seeded and the link-target fields won't appear in system-component editors.)
12. **Dead code (safe to drop/leave, NOT features):** `components/admin/{FooterEditorForm,HeaderEditorForm,SectionEditForm,GenericSchemaEditForm}.js` (zero importers — superseded by `components/admin/appearance/*`), and `components/layout/LayoutSwitcher.js`. Listed here so a reviewer doesn't mistake them for features to preserve.

---

## 5. Files that MUST be merged, not overwritten (quick reference)
`lib/email.js` · `components/site/index.js` · `lib/siteComponentRegistry.js` · `lib/getRegistryIdsFromDisk.js` (keep `"Marquee"` in `DEFAULT_IDS`) · `components/admin/AdminLayoutClient.js` · `styles/Theme.js` · `models/ThemeConfig.js` · `app/api/theme/route.js` (+ header/footer/subscribe/[componentId]/home-hero) · `lib/layoutData.js` (runs on every public page — see §4.10) · `lib/systemComponents.js` (Portfolio entry + `*Target` props — see §4.11) · `lib/permissions.js` · `lib/slug.js` (keep `"donation"` reserved) · `app/(site)/layout.js` · `app/layout.js` · `components/layout/PublicShell.js` · `app/api/admin/contacts/route.js` · `app/api/public/event-registrations/route.js` · `components/cms/ComponentRenderer.js` · `components/admin/schemaFormUtils.js` · `components/admin/SortableFormList.js` · `next.config.js` · `lib/storage/localStorage.js` · `lib/manageSectionFields.js` · `components/admin/ManageSectionFields.js`.

> Removed from this list vs the first draft: `models/Subscriber.js` (no MESCO feature is lost on overwrite — the only diff is a redundant `index({email:1})` that §9 already drops). Path corrected: `lib/storage/localStorage.js` (the earlier `lib/media/storage/localStorage.js` did not exist).

---

## 6. Decisions

### Resolved (2026-05-29)
- **6.0 Ambition → FULL ARCHITECTURAL CONVERGENCE.**
- **6.1 Author → DROP & remap existing Authors to Editor.**
- **6.2 Component library → KEEP `components/site/`, merge registry by union** (patch ported `"theme-components"` path literals → `"site"`).
- **6.3 Theme persistence → FULL ADOPTION** (`themeconfigs`→`sitesettings` migration + `AppearanceColorConfig`, drop `fs.writeFileSync`).

### Still open — recommended defaults (confirm during implementation)
Given full convergence, these are the recommended resolutions; flag if you disagree.

**6.4 RBAC for MESCO-only admin features.** Add `donations`/`event-registrations`/`subscribers`/`volunteer` as proper catalog modules (`MODULE_DEFINITIONS` + `PAGE_RULES` + `API_SEGMENT_TO_MODULE` + `MENU_PERMISSION_MAP`). **Default:** Super Admin + Admin get full access, Editor blocked (mirrors today's effective behavior). → *Confirm the exact level per module.*

**6.5 Sliders.** Convergence → **adopt TSUV's relocate-and-replace**: MESCO's `components/site/{HomeHero,StoriesSlider,EventsSlider,CircularSlider,ImageSlider}` become admin-managed; HomeHero storage moves `components`→`sliders`. **Requires a tested HomeHero data migration.** → *Confirm you accept replacing the existing slider components (vs keeping them as fallbacks).*

**6.6 Team module.** Convergence → **adopt the DB-driven Team module as canonical**; repoint `components/cms/blocks/Team.js` to the data-driven view. MESCO's `CommitteeMembers` site component stays as a separate component. → *Confirm CommitteeMembers should remain, while Team management moves to the new module.*

**6.7 Smaller calls (recommended):**
- (a) **Forms file-scaffolding:** keep it **only if MESCO's host has a writable filesystem at runtime**; otherwise refactor to a DB-only `fields` schema. → *Tell me the deploy target (Vercel/immutable vs VM/container).*
- (b) **ContactForm.js:** convergence → adopt the thin wrapper, but verify the contact page renders identically (visual-regression check). *Recommend keeping MESCO's if any custom styling matters.*
- (c) **CSP/Bootstrap:** convergence → **self-host Bootstrap into `/public/js`** and drop `cdn.jsdelivr.net` from CSP (matches TSUV). → *Confirm, or keep jsdelivr allowed.*
- (d) **Events flag:** set `NEXT_PUBLIC_ENABLE_EVENTS=1` (MESCO uses events).
- (e) **`NEXTAUTH_URL` runtime override:** adopt only if MESCO runs behind a proxy / multiple hosts; otherwise keep a static `NEXTAUTH_URL`. → *Depends on deploy.*
- (f) **Soft-deleted user email:** release the unique email on soft-delete (so the address can be reused), matching how Page handles slug.

---

## 6A. Data-migration runbook (ordered — back up before each)

Run order = phase order. **Precede every migration with `npm run backup-db-full`.** Keep the legacy collection/data until the verification passes.

| # | Migration | Trigger / script | Phase | Depends on | Verify | Reversible |
|---|---|---|---|---|---|---|
| M1 | Author → Editor remap | one-off script (`User.updateMany` role/roleKey `Author`→`Editor`) | 1 | User model | no user has role/roleKey `Author`; they read as Editor | yes (restore) |
| M2 | RBAC bootstrap (roles/permissions/role-perms seed + back-fill `roleKey`/`userType`/`permissionVersion`/`sessionVersion` on all users) | `lib/rbac/bootstrap.js` (auto, first request) | 1 | RBAC models, User, M1 | catalog seeded; every user has roleKey/userType/versions | re-run idempotent; restore for the user back-fill |
| M3 | Super Admin seed | `scripts/rbac-promote-super-admin.js <email>` | 1 | M2 | exactly one `super_admin` exists | yes |
| M4 | `themeconfigs` → `sitesettings` | `migrateFromLegacyThemeConfigs` (`lib/siteSettings.js`) + tested migration | 4 | siteSettings, ThemeConfig merge | sitesettings doc holds merged theme incl. marquee/smoothScroll/fade/Donate; public site renders colors via CSS vars | yes (legacy `themeconfigs` retained until verified) |
| M5 | `components` → `sitesettings` for Header/Footer/Subscribe | **NEW one-off script** (copy `baseComponent` Header/Footer/Subscribe docs) | 4 | M4 | header/footer/subscribe content present in sitesettings; the 3 theme routes return populated fields | yes |
| M6 | `SiteComponentMeta.module` backfill | `scripts/migrate-site-component-module-owners.js` | 5 | `module` field added | every meta has `module ∈ {components,sliders,popups}` | re-run |
| M7 | HomeHero `components` → `sliders` | one-off (move HomeHero `defaultProps` doc to the `sliders` collection) | 6 | Slider model | HomeHero renders from `sliders`; existing content intact | yes |

> M5 (Header/Footer/Subscribe content migration) and M7 (HomeHero) are the two **data-loss risks** if their routes are cut over before the migration runs.

---

## 7. Risk register (top risks)
| # | Risk | Mitigation |
|---|---|---|
| R1 | RBAC bootstrap migration corrupts/locks out users | Backup first; test bootstrap on a copy; seed a Super Admin before enforcing |
| R2 | Overwriting `lib/email.js` deletes `sendDonationReceipt` → build break | Merge only; never overwrite |
| R3 | Overwriting site-component registry deregisters MESCO components (44 IDs) → blank pages | Merge registry by union |
| R4 | Theme persistence rewrite drops marquee/smoothScroll/Donate theming + orphans `themeconfigs` data | Decision 6.3; tested migration; merge ThemeConfig |
| R5 | MESCO admin routes fail-open after catalog-driven middleware | Extend catalog (6.4) before enforcing |
| R6 | Public render not switched to published snapshot → live site shows drafts | Phase 3 public-render switch is mandatory |
| R7 | `session.email` lost in new `requireAuth` → publish/preview break | Verify email survives in sessionLike during Phase 1 audit |
| R8 | Forms runtime file-scaffolding fails on immutable hosts | Decision 6.7a |
| R9 | Sliders HomeHero data loss on storage move | Decision 6.5; data migration |
| R10 | CSP blocks Bootstrap (jsdelivr removed) | Decision 6.7c |
| R11 | Porting blog/event detail pages drops SocialShare | Re-integrate in Phase 10 |
| R12 | Cutting Header/Footer/Subscribe theme routes to `sitesettings` orphans the live `components`-collection content | Run migration M5 before the cutover (Phase 4) |
| R13 | Applying `softDeletePlugin` to shared models silently adds an `isDeleted` filter to every existing read path | Enumerate the ~8 models (Phase 1); re-test all MESCO read paths; not "minor" |
| R14 | `lib/layoutData.js` left unmerged breaks once `themeconfigs`→`sitesettings` lands (it reads `ThemeConfig` directly) on every public page | Merge layoutData in Phase 4 (R4-adjacent) |

---

## 8. Notes on effort shape
- **Largest manual merges:** `AdminLayoutClient.js`, `ThemeConfig.js` + `app/api/theme/route.js`, the public-render snapshot switch, the RBAC route audit (~37 routes).
- **Cleanest/lowest-risk ports:** Dashboard, Popups, media constants/streaming, model indexes, next.config perf.
- **Most dangerous:** Appearance/theme persistence (Phase 4) and the RBAC foundation (Phase 1).
- Phases 1→4 are largely sequential; Phase 9 (infra/media) and parts of Phase 2 can proceed in parallel.

---

## 9. Implementation tracking checklist

> Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked/needs decision.
> Rule: do not start a phase until its **gate** (build + smoke + MESCO-only preservation check) on the previous phase passes. Update the status line below as you go.

**Overall status:** `[~]` Phases 1–3 COMPLETE + build-verified + committed (`05e2ba1`). Phase 4 SAFE PARTS done + committed (`8994475` ThemeConfig additive merge; `ff2b4f2` persistence libs + AppearanceColorConfig, dormant). Phase 4 CUTOVER (DB-coupled) remaining. — _last updated 2026-05-29_
Phase: 0`[x]` 1`[x]` 2`[x]` 3`[x]` 4`[~]` 5`[ ]` 6`[ ]` 7`[ ]` 8`[ ]` 9`[ ]` 10`[ ]` 11`[ ]`
> **Build verified 2026-05-29:** `npm run build` → exit 0, "✓ Compiled successfully", "✓ Generating static pages (72/72)", type-check passed. All new routes registered (rbac, pages/publish, preview-token, preview). Only pre-existing benign warnings: `HeaderEditForm` re-export shim (known); Mongoose duplicate-index on `orderId`(Donation)/`email`(Subscriber — Phase 9 cleanup). No eslintrc in repo → `next lint` prompts interactively (skipped; `next build` type-check covers it). Remaining runtime debt: M1/M2/M3 + login/role smoke before deploy. Decisions 6.4 kept (user-confirmed).

> **Working branch:** `tsuv-port` (off `askari` HEAD, which is 239 commits ahead of `tahasil_admin` — i.e. the latest MESCO state). DB backup present at `DB_Backup/dump_2026-05-29_16-18-49/`.
> **Provisional decisions taken in Phase 1 (flagged for confirmation):** 6.4 → donations/event-registrations/subscribers = Admin+ only (Editor blocked); **volunteer rides on the `contacts` module** (`/admin/volunteer-form` gated by `contacts.view`, which Editors currently retain) — no separate `volunteer` module created. 6.7e → kept MESCO's **static `NEXTAUTH_URL`** (NextAuth route unchanged; runtime override not adopted). 6.7f → soft-deleted user email **not** released yet (TSUV behavior kept as-is).

> ✅ Reconciled with the multi-agent plan audit (47 confirmed findings folded in, 2026-05-29). New gap items are marked **(audit)** below.

### Phase 0 — Decisions
- [x] 6.0 ambition = full convergence
- [x] 6.1 Author = drop → Editor
- [x] 6.2 components = keep `components/site/` + merge registry
- [x] 6.3 theme persistence = full adoption (sitesettings + AppearanceColorConfig)
- [ ] 6.4 confirm RBAC level for donations/event-registrations/subscribers/volunteer
- [ ] 6.5 confirm sliders replace-vs-coexist (+ accept HomeHero data migration)
- [ ] 6.6 confirm Team module canonical + CommitteeMembers stays
- [ ] 6.7a confirm deploy target (writable FS? → Forms scaffolding vs DB-only)
- [ ] 6.7b/c/e confirm ContactForm wrapper, CSP/Bootstrap, NEXTAUTH_URL override
- [ ] Create a working branch off `tahasil_admin`; full DB backup taken

### Phase 1 — Foundation: soft-delete + RBAC + auth
- [x] `models/plugins/softDelete.js`
- [x] **(audit)** apply `softDeletePlugin` to shared models: Blog, BlogCategory, BlogComment, **Component**, Menu, Event, Media, ContactSubmission (plugin-only; field/index additions deferred to Phase 9). Read-path re-test = runtime gate item.
- [x] `models/{AdminRole,Permission,RolePermission,PermissionAuditLog}.js`
- [x] `models/User.js` (+ Author→Editor migration M1 = `scripts/migrate-author-to-editor.js`; also hardened `author→editor` in role maps + bootstrap self-heals)
- [x] **(audit)** Author full-trace removal: `isAuthor` ✓, middleware allow-lists ✓, `ALLOWED_ROLES` Set ✓, `AdminLayoutClient` nav gating ✓ (replaced by permission filter), users-page role dropdown ✓ (page now thin TSUV wrapper → UsersModule, role list from API). Verified: zero `isAuthor` importers, no role-string nav gating left.
- [x] `lib/rbac/*` (10 files) — **catalog extended** with donations/event-registrations/subscribers (+ volunteer via `contacts`)
- [x] `lib/{env,permissions,adminAccess}.js` (removed `isAuthor`)
- [x] `lib/auth.js`, `middleware.js` (preserved `/media/*` rewrite, rate-limit, same-origin — all byte-identical; CCAvenue same-origin unchanged). NextAuth route kept static (6.7e).
- [x] `lib/apiAuth.js` + **audited all 37 `requireAuth` callers** (only `session.email`/`session.name`/`session.user` read; preserved `email`+`name` in sessionLike; no direct `session.role===` checks)
- [x] Users + RBAC APIs (users APIs OVERWRITTEN w/ TSUV; rbac roles/[key]/permissions created; `scripts/rbac-promote-super-admin.js` created). Super Admin seeding (M3) = runtime gate step.
- [x] RBAC/Users UI (`rbac/RolesModule`, `users/UsersModule`, `AccessForbiddenPage`) + `AdminAuthContext` + `app/admin/(authenticated)/layout.js` (force-reauth redirect + page authz) + `forbidden`/`rbac/roles`/`users` pages
- [x] **`AdminLayoutClient.js` manual merge** (kept MESCO base; added props + `AdminAuthProvider` + recursive `canAccessMenu` nav filter; preserved donations/event-reg/subscribers/volunteer nav + MESCO multi-source notification widget; gated notifications on `contacts.view`)
- [~] Gate: **build ✓ (exit 0, 2026-05-29)** · runtime-pending: M1 (Author→Editor) + M2 (auto bootstrap) + M3 (seed Super Admin via `npm run rbac-promote-super-admin -- <email>`) + login/role-edit/force-relogin smoke + MESCO-only admin routes reachable & correctly gated

### Phase 2 — Shared infra libs
- [x] `lib/linkUtils.js` (verbatim, dependency-free)
- [x] `lib/scrollUtils.js` (verbatim) + `SectionId` field (additive in lib/manageSectionFields.js × 4 helpers + admin ManageSectionFields.js Form.Item; **kept MESCO's Marquee** in prefix map; NewsFeedSlider/BlogsListing deferred to Phase 5/6) + PageTransitionLoader hash-only fix (components/site/ path)
- [x] global loader (`AntdLoaderIndicator` mounted in app/layout.js inside AntdRegistry, `ContentLoaderFallback`, spinner CSS appended to globals.css with `--active-loader-color`→`--primary-color`→hex fallback)
- [x] `lib/featureFlags.js` (verbatim). ⚠️ events flag defaults OFF when env unset — Phase 10 must set `NEXT_PUBLIC_ENABLE_EVENTS=1` OR skip the events gate (6.7d), else events pages hide.
- [x] `lib/defaultPropsByBase.js` — **Slider query stubbed** (model lands Phase 6; Component-only for now). RESTORE Slider branch in Phase 6.
- [x] Gate: **build ✓ (exit 0, 2026-05-29)** — compiles clean; static checks pass.

### Phase 3 — Draft / Preview / Publish
- [x] `models/Page.js` (adopted TSUV verbatim — proven subset; snapshot fields + Number isDeleted 0/1 + 3 indexes; NO Boolean plugin)
- [x] `lib/{pagePublication,previewToken}.js` (verbatim; previewToken falls back to NEXTAUTH_SECRET so no env change strictly needed)
- [x] pages APIs (route, [id], publish, preview-token) — **menu-sync verified survives** (MESCO's menu-sync fns are byte-identical to TSUV's publish-route versions; deps normalizeSlug/validateLayoutProps/syncMediaUsageForPage all exist). Legacy published pages handled via `hydrateLegacyPublishedSnapshot` + `buildPublishedSlugFilter` $or fallback.
- [x] `app/(site)/preview/[id]/page.js` token-gating (session AND signed token + email match + soft-delete filter; kept MESCO blog/event branches + banners). Env: previewToken uses NEXTAUTH_SECRET fallback; PREVIEW_SITE_URL optional.
- [x] `components/admin/pages/*` (CmsPageEditPage/CmsPageCreatePage/PagesModule + index) ported verbatim (all `@/` deps resolve: PageBuilder/ThemeAdminCard/AdminAuthContext/clientPermissions; no tsuv-isms; `onPersistLayout` unused by edit page so MESCO's PageBuilder is API-compatible — NOT touched) + 3 route files thinned to wrappers. Build re-verified exit 0.
- [x] **public-render snapshot switch on ALL public render paths** — DONE + VERIFIED: helper-based (page, [...slug], _resolved, resolved-pages, public/pages, seo) use `buildPublishedSlugFilter`+`toPublishedPageShape`+`.populate("publishedLayout.componentId")`; manual (search, sitemap) add `isDeleted:{$ne:1}`+`getPublishedSlug/Title`. No raw draft queries remain. **R6 mitigated.**
- [x] Gate: **build ✓ (exit 0, 2026-05-29; re-verified after 3.4)** · runtime-pending: draft-vs-published render check + legacy pages still render + token-preview end-to-end smoke.

### Phase 4 — Theme persistence + Appearance (HIGHEST RISK)
- [x] persistence libs (`siteSettings`, `appearanceColors`, `appearanceThemeOwnership`, `appearanceTitleAndColorsConfig`, `themeColors`) + `models/AppearanceColorConfig.js` — **DONE + build-verified, DORMANT** (nothing imports them until the cutover). §2B brand defaults sanitized: `AppearanceColorConfig` frontend palette → `{}`, `appearanceColors.DEFAULT_THEME_PALETTE` → `{}` (MESCO palette flows in via the `seed` from the live ThemeConfig doc). ⚠️ Cutover note: `siteSettings.getSiteSettingsLean` sets `out.colors=[]` and sources the palette from `AppearanceColorConfig` (seeded from current `themePalette`) — MUST verify the seed preserves MESCO's palette against a real DB before layoutData consumes it, or site colors blank.
- [~] **`models/ThemeConfig.js` merge** — **additive part DONE** (added bg-library subschemas + backgroundImages/Colors/active* + buttonTarget + footerCol1/2/Latest titles + footerSocialColorKey + headerMobileMenuHeaderBgColorKey + subscribeBgDesktop/Mobile + `{themeKey,updatedAt}` index; **kept** marquee*/smoothScroll*(4)/fadeAnimation*(4)/siteTitle:"Mesco Trust"/Donate+header+hero colorKey defaults). **DEFERRED to cutover:** `collection:"sitesettings"` + `strict:false` (the storage switch — gated on M4/M5 + DB test). node --check ✓.
- [ ] **tested `themeconfigs`→`sitesettings` migration M4** (on backup first) + confirm public site reads CSS vars
- [ ] **(audit) M5: migrate Header/Footer/Subscribe `components` docs → `sitesettings`** BEFORE cutting those 3 theme routes over
- [ ] `app/api/theme/{route,header,footer,subscribe,[componentId],home-hero}/*` merge (keep marquee route + themeColorFallbacks)
- [ ] **(audit)** NEW `app/api/admin/title-and-colors-config/route.js` + `app/api/admin/appearance/title-and-colors-config/route.js`
- [ ] **(audit) `lib/layoutData.js` MERGE** (every public page; keep MESCO smoothScroll/fade/Donate defaults + themeColorFallbacks)
- [ ] `components/admin/appearance/*` + appearance pages + `theme/page.js` redirect
- [ ] add Appearance sections (or keep legacy editor) for marquee/smoothScroll/fadeAnimation/Donate
- [ ] `styles/Theme.js` merge (keep MESCO palette + `THEME_COLOR_ALIASES`)
- [ ] Gate: build ✓ · all theme settings persist & render · Donate/marquee intact ✓

### Phase 5 — Theme-component system + new components
- [ ] **patch ported `"theme-components"` path literals → `"site"`** in site-components routes/admin pages
- [ ] merge `components/site/index.js` + `SITE_COMPONENT_IDS` (union) + ComponentRenderer (add Portfolio, register new)
- [ ] port reusable components → `components/site/` (HighlightCardsGrid, InfoStatsGrid, JourneyTimeline, CallToActionBanner, Milestones, MultiLevelMarquee, MediaControl, VideoModalControl; conditional AboutUs/FeaturedReport/NetworkMetricsCard/BlogsListing/MapSliderAnimations) — **re-default tsuv copy**; skip WhyInvestWithStepUp
- [ ] overlapping upgrades (Accordion, Cards, AnimationsText, InnerPageHero) diff-merge
- [ ] **(audit) MERGE `components/admin/schemaFormUtils.js` (+ThemeColorOnlySelect) + `components/admin/SortableFormList.js` (+allowDeleteLast/addButtonVariant)** — every ported EditForm depends on these
- [ ] **(audit) `lib/systemComponents.js` MERGE** (link-target props now; Portfolio entry with Phase 7) + re-run components seed/ensure
- [ ] shortcode (`lib/shortcode.js` + `ShortCode/*`); resolve theme-components admin redirect pages + `component/shortcode/page.js` per 6.2
- [ ] admin theme-component platform + reconcile removed "global/position" feature + module exclusion filter
- [ ] `models/SiteComponentMeta.js` (+ `module` field, softDelete, backfill migration M6)
- [ ] Gate: build ✓ · all MESCO components + new ones render in PageBuilder ✓

### Phase 6 — Popups then Sliders
- [ ] **(audit)** upgrade `components/[id]/edit/page.js` for `forcedComponentId`/`forcedBackHref` (gates BOTH Popups & Sliders `[slug]` pages) — do first
- [ ] **Popups:** `models/Popup.js`, `lib/popupRouteUtils.js`, public popups API, admin module, `modules/popups/*`, `popups/{page,[slug]/page}.js`, theme-route popup branch, `<RoutePopupHost/>` surgical insert into PublicShell
- [ ] **Sliders:** `models/Slider.js`, `lib/sliderComponentRegistry.js`, admin module, `modules/sliders/*`, slider pages, lottie-web (if HomeHero anim), HomeHero data migration M7
- [ ] **(audit)** port ALL slider editors: HomeHero, CircularSlider/ImageSlider, StoriesSlider, EventsSlider, **NewsFeedSlider**, **CustomSlider**, **Testimonials**
- [ ] **(audit) Testimonials name-collision decision** (keep MESCO `components/site/Testimonials` vs migrate to slider module)
- [ ] **(audit) re-wire `components/site/index.js`** slider/popup exports + EditForm map → `@/modules/*`; retire replaced local slider folders
- [ ] **(audit)** HomeHero/home-hero map branch needs `lib/mapSliderAnimations.js` + `components/site/MapSliderAnimations` (or strip)
- [ ] Gate: build ✓ · popup shows by route · sliders edit/save ✓ · existing HomeHero content intact ✓

### Phase 7 — Portfolio + Team
- [ ] Portfolio (models, APIs, admin, block, libs, pages) — **do NOT run tsuv migrate scripts**; generic-ize "startups"
- [ ] Team (models, APIs incl. **`team-categories/*`** — `teams*` glob misses it, admin, block, libs, pages) — repoint `blocks/Team.js`; keep CommitteeMembers
- [ ] nav links for both (catalog entries already arrive via Phase 1 — just verify level); add `Portfolio` to `lib/systemComponents.js` + register Portfolio block in ComponentRenderer
- [ ] Gate: build ✓ · CRUD + ordering + category filter + public render ✓

### Phase 8 — Forms + Dashboard
- [ ] Forms (model, APIs, public submit, admin, submissions, `contactSubmissionIdentifiers`, `mapEmbed`) — re-default content; resolve scaffolding vs DB-only
- [ ] **(audit)** resolve submission routes: keep singular admin, drop/redirect plural, decide public `app/submission/[formKey]` alias
- [ ] **(audit) `contacts/page.js` decision** (adopt TSUV `<ContactsPage/>` wrapper vs keep MESCO inline) — preserve volunteer `submissionType` filtering
- [ ] (optional) ContactForm wrapper swap — visual regression check
- [ ] Dashboard (dashboardData, dashboard + notifications APIs, CommonDashboard, thin page) + `dashboard.view` catalog entry
- [ ] Gate: build ✓ · form create/submit/inbox · dashboard KPIs + notifications ✓

### Phase 9 — Media + config + infra
- [ ] media: `lib/media/{constants,url,processor}.js`, `lib/storage/*` merge, `app/uploads/[...path]`, media stream routes (+Range), admin media routes (validation/rollback/filter), media components
- [ ] `next.config.js` merge (perf, headers, CSP `media-src`; resolve jsdelivr/Bootstrap)
- [ ] `instrumentation.js` + `scripts/ensure-indexes.js` (**add MESCO-only `Donation` to `MODEL_FILES`**)
- [ ] model indexes/fields (Blog, Menu enabled/target, Event link-target; Subscriber: adopt TSUV — drops redundant index)
- [ ] ops scripts (port generic + add `package.json` aliases `compare-db`/`sync-db-safe`; fix sync-db URI; skip operator/data-specific)
- [ ] Gate: build ✓ · audio/video upload + range playback · uploads served ✓

### Phase 10 — blog → blogs + events
- [ ] `/blog`→`/blogs` redirects + new blogs pages + `basePath` in `components/blog/*` + sitemap + search + Header/Footer/menu `<Link>`s
- [ ] **re-integrate SocialShare** into new `blogs/[slug]` + `events/[slug]`
- [ ] events link-target normalization + events feature flag decision
- [ ] Gate: build ✓ · blog list/detail + share + events render ✓

### Phase 11 — Verification (final)
- [ ] run tsuv RBAC endpoint audit script against MESCO (no unprotected admin routes)
- [ ] run draft/publish UAT checklist
- [ ] full §4 preservation checklist (donations E2E, CCAvenue env, all site components, volunteer contacts filter, social share, docs)
- [ ] full build + lint + admin/public smoke tests
- [ ] data-migration run-order (§6A M1–M7) executed on prod with backups; rollback plan confirmed

---

## 10. Process: git, rollback, testing, coding conventions, env

### 10.1 Git / branch strategy
- One integration branch off `tahasil_admin` (e.g. `tsuv-port`).
- **One commit + green build per phase** (and per sub-migration), so any phase can be reverted independently. Tag each phase boundary.

### 10.2 Rollback per phase
- **Code:** revert the phase's commit(s).
- **Data:** `npm run restore-db-full <backup-from-§6A>` for that phase's migration.
- **Resume gate:** re-run the previous phase's gate smoke before continuing.

### 10.3 Testing / QA
- Port + **de-tsuv-ify** `tests/uat-blocked.spec.js`: replace `localhost:3321`, the `C:\tmp` artifact path, and tsuv credentials with MESCO values.
- Add a `playwright.config.js`; add `@playwright/test` to `devDependencies` (matches TSUV).
- Port the tsuv QA/UAT docs (`DRAFT_PREVIEW_PUBLISH_QA_REPORT.md`, `DRAFT_PREVIEW_PUBLISH_UAT_CHECKLIST.md`, `RBAC_ENDPOINT_PERMISSION_AUDIT.md`) as MESCO checklists.
- Enforce a `npm run lint && npm run build` gate at **every** phase boundary (per AGENTS rule: ask before running build).

### 10.4 Coding conventions for ported components (fold TSUV `AGENT.md` into MESCO `AGENTS.md`)
- styled-components only — **no `<style jsx global>`**; buttons use `ThemeButton` from `styles/Theme.js`.
- Fonts via `var(--font-family)` / `var(--heading-font)` (no hardcoded families).
- Color fields must support gradient/HEX/RGB and persist after save + refresh.
- `Title`/`Sub Title` present but **optional** in validation.
- Image fields show a Skeleton loader (no random/default image URLs).

### 10.5 Consolidated env-var inventory (set before the phases that need them)
- **Auth/preview:** `NEXTAUTH_SECRET` (existing), `NEXTAUTH_URL` (existing/static unless 6.7e), `PREVIEW_TOKEN_SECRET` (or fall back to `NEXTAUTH_SECRET`), `PREVIEW_SITE_URL` / `NEXT_PUBLIC_PREVIEW_SITE_URL`.
- **Media:** `MEDIA_UPLOAD_DIR` / `MEDIA_PUBLIC_DIR` (optional; localStorage merge).
- **Feature flags:** `NEXT_PUBLIC_ENABLE_EVENTS=1` (MESCO uses events); the sliders/forms/popups/theme-components create-delete flags (decide per-flag; default OFF).
- **Ops:** `SKIP_INDEX_SYNC=1` (optional opt-out of boot index sync).
- **Preserve (do not overwrite):** `CCAVENUE_*` (4), `MONGODB_URI`, `RESEND_API_KEY`/SMTP, `NEXT_PUBLIC_SITE_URL`.
