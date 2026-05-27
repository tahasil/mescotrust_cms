# TSUV-to-Mesco Admin Restructure and Parity Plan

Date: 2026-05-27

Reference (read-only): `D:\tahasil-projects\TSUV-CMS` on `admin_cms_v1`
Target: `D:\tahasil-projects\mescotrust_cms` on `tahasil_mesco_stage`

Status:
- Analysis and planning only.
- No implementation has started.
- No files were modified in `TSUV-CMS`.

## 1. Objective and Non-Negotiables

Objective:
- Restructure `mescotrust_cms` admin architecture to match TSUV structure and behavior parity while preserving Mesco data, branding values, URLs, and current user-facing functionality.

Mandatory admin sidebar groups for Mesco target:
1. Dashboard
2. Pages
3. Forms
4. Sliders
5. Popups
6. Blogs
7. Events
8. Media
9. Appearance (all submenus)
10. Submissions
11. Roles

Mandatory parity scope:
- Page Builder flow parity:
  - component style changes
  - slider style changes
  - dynamic section styling
  - theme/color handling
  - layout customization flow
  - appearance and design control flow
  - save/publish/preview/update behavior parity
- Media flow parity inside Page Builder and schema-driven editors:
  - image upload flow
  - media selection flow
  - media modal behavior
  - image mapping and storage
  - responsive image handling
  - resolution/validation handling
  - reusable media integration
  - desktop/mobile image handling
  - preview/update behavior
- Color system parity:
  - centralized color handling
  - dynamic color fetching
  - theme-based usage
  - appearance integration
  - reusable color structure
  - Mesco color values remain Mesco values

Hard constraints:
- Keep existing Mesco routes working.
- Keep existing Mesco API consumers working via compatibility aliases/adapters until planned deprecation.
- No TSUV code changes.
- No UI/functional/data-flow breakage during migration.

## 2. Baseline Verification Snapshot

Verified current state:
- Mesco admin is route-heavy; TSUV admin is module-first with thin route wrappers.
- Mesco uses role checks (`Admin|Editor|Author`), TSUV uses permission-key RBAC.
- Mesco Page Builder uses `components/site`; TSUV uses `components/theme-components` plus extra governance hooks.
- Mesco has no publish endpoint and no preview-token endpoint for pages.
- Mesco color system is monolithic around `/api/theme`; TSUV uses centralized `themeColors`, `appearanceColors`, `siteSettings`, ownership boundaries.
- Mesco media picker is image-focused and lacks TSUV-level mime-filter and required-resolution controls.

## 3. Canonical Information Architecture and Route Strategy

### 3.1 Canonical admin route groups

Canonical targets:
- `/admin`
- `/admin/pages`
- `/admin/forms`
- `/admin/sliders`
- `/admin/popups`
- `/admin/blogs`
- `/admin/events`
- `/admin/media`
- `/admin/appearance`
- `/admin/submissions`
- `/admin/rbac/roles`

### 3.2 Compatibility route policy

Policy:
- Existing Mesco routes remain valid.
- Canonical TSUV-style routes become primary navigation targets.
- Legacy routes redirect or wrap to canonical modules without changing behavior.

Route compatibility matrix:

| Existing Mesco route | Canonical target | Strategy |
|---|---|---|
| `/admin/theme` | `/admin/appearance/header` | Redirect wrapper |
| `/admin/menus` | `/admin/appearance/menu` | Keep both valid; same backend source |
| `/admin/pages` | `/admin/pages` | Keep path; refactor internals only |
| `/admin/pages/[id]` | `/admin/pages/[id]` | Keep path; upgrade edit flow internals |
| `/admin/components` | `/admin/components` | Keep path |
| `/admin/components/[id]/edit` | `/admin/components/[id]/edit` | Keep path |
| `/admin/sliders` | `/admin/sliders` | Keep path |
| `/admin/blogs` | `/admin/blogs` | Keep path |
| `/admin/events` | `/admin/events` | Keep path |
| `/admin/media` | `/admin/media` | Keep path |
| `/admin/subscribers` | `/admin/subscribers` | Keep path under Submissions |
| `/admin/donations` | `/admin/donations` | Keep path under Submissions |
| `/admin/event-registrations` | `/admin/event-registrations` | Keep path under Submissions |
| `/admin/volunteer-form` | `/admin/volunteer-form` | Keep path under Submissions |
| `/admin/contacts` | `/admin/contacts` | Keep path under Submissions |

New routes to add:
- `/admin/appearance`
- `/admin/appearance/[section]`
- `/admin/forms`
- `/admin/forms/[id]/edit`
- `/admin/popups`
- `/admin/popups/[slug]`
- `/admin/rbac/roles`
- `/admin/submission/[formKey]` (alias)
- `/admin/submissions/[formKey]` (alias)

## 4. Gap Matrix (What is Missing)

| Domain | Status | Missing items |
|---|---|---|
| Sidebar/menu structure | Partial | Forms, Popups, Appearance grouping, Roles, dynamic form submissions children |
| Appearance module | Missing | `components/admin/appearance/*` module, config router, section pages |
| Routing architecture | Partial | Canonical TSUV-style routes and wrappers |
| Page Builder structure | Partial | Moduleized pages flow, component-source parity, block governance parity |
| Save/publish/preview flow | Missing/Partial | `/publish`, `/preview-token`, conflict-safe update, unsaved-change guards |
| Dynamic styling system | Partial | Full `manageSectionFields` parity including section-id and broader mapping coverage |
| Theme/color architecture | Partial | `themeColors`, `appearanceColors`, `siteSettings`, ownership boundaries |
| Media flow in builders | Partial | Picker contract parity, mime filtering, resolution checks, richer modal behavior |
| Responsive media behavior | Partial | Consistent desktop/mobile validation and behavior across all relevant forms |
| Forms module | Missing | model/routes/admin UI/public submit flow |
| Popups module | Missing | model/routes/admin UI/public flow |
| RBAC | Missing | models, permission keys, middleware/API enforcement, menu gating |
| API surface | Partial | forms/form-submissions/rbac/dashboard/notifications/title-and-colors/appearance APIs |
| Shared helper architecture | Partial | centralized helper stack parity and ownership guardrails |

## 5. API Compatibility Contract (No Break Policy)

Compatibility policy:
- Existing Mesco endpoints remain functional during migration window.
- New TSUV-aligned endpoints are added additively.
- If payload shape changes, support compatibility adapters in handlers.
- Deprecation only after explicit sign-off and smoke-test evidence.

Required admin additions:
- `/api/admin/forms`
- `/api/admin/forms/[id]`
- `/api/admin/form-submissions`
- `/api/admin/form-submissions/[submissionId]`
- `/api/admin/rbac/permissions`
- `/api/admin/rbac/roles`
- `/api/admin/rbac/roles/[key]`
- `/api/admin/pages/[id]/publish`
- `/api/admin/pages/[id]/preview-token`
- `/api/admin/title-and-colors-config`
- `/api/admin/appearance/title-and-colors-config`

Required public additions for parity:
- `/api/public/forms/[formKey]`
- `/api/public/forms/[formKey]/submit`
- `/api/public/popups`

## 6. Data Model and Migration Contract

Required model additions:
- `models/Form.js`
- `models/Popup.js`
- `models/Slider.js` (or explicit module ownership strategy)
- `models/AdminRole.js`
- `models/Permission.js`
- `models/RolePermission.js`
- `models/PermissionAuditLog.js`
- `models/AppearanceColorConfig.js`

Required model changes:
- `models/SiteComponentMeta.js`: add `module` ownership.
- `models/User.js`: add `roleKey`, `userType`, `permissionVersion`, `sessionVersion` compatibility fields.
- `models/Page.js`: add published snapshot lifecycle fields (`publishedLayout`, `publishedSlug`, `publishedMeta`, `publishedAt`, `publishedBy`, revision markers, safe-delete fields if used by parity flow).

Migration rules:
- Additive-first schema rollout.
- Backfill scripts must be idempotent.
- Dry-run mode required before write mode.
- Pre/post migration verification queries required.
- Rollback trigger defined per phase.

## 7. RBAC Migration Contract

Role mapping baseline:
- Current `Admin`, `Editor`, `Author` must map to permission sets without reducing current capabilities during transition.

Transition model:
- Stage 1: dual auth mode (`legacy role` OR `permission keys`).
- Stage 2: enforce permission checks on new modules first.
- Stage 3: enforce permission checks broadly after parity tests pass.

Lockout safeguards:
- Seeded emergency super-admin fallback.
- Session versioning and forced re-login behavior documented.
- Permission audit logs enabled before full enforcement.

## 8. Unified Phased Plan (Single Source of Truth)

### Phase 0: Baseline and Safety

Deliverables:
- branch baseline
- DB backup
- media backup
- baseline smoke report

Tasks:
- run DB backup (`npm run backup-db`)
- backup `public/uploads`
- capture baseline behavior for key routes and APIs

Exit criteria:
- restorable backups exist and are verified
- baseline checklist recorded

Rollback trigger:
- if baseline backup or restore validation fails, stop all work

### Phase 1: Sidebar IA and Compatibility Wrappers

Deliverables:
- target sidebar grouping
- appearance entry routes
- no broken legacy links

Tasks:
- update `components/admin/AdminLayoutClient.js`
- add `/admin/appearance` and `/admin/appearance/[section]`
- add wrapper/redirect behavior for `/admin/theme` and menu coexistence

Exit criteria:
- old routes open successfully
- new menu structure visible and navigable

Rollback trigger:
- any menu or route regression in smoke paths

### Phase 2: Moduleization Foundation

Deliverables:
- domain modules under `components/admin/*`
- thin route wrappers

Tasks:
- extract route-heavy pages to modules (`pages`, `blogs`, `events`, `media`, `menus`, `submissions`)
- preserve existing route contracts

Exit criteria:
- no functional behavior change in migrated modules
- route wrappers are thin and stable

Rollback trigger:
- behavior drift in baseline routes

### Phase 3: Page Builder Core Parity

Deliverables:
- TSUV-style Page Builder core behavior parity
- moduleized pages edit/create flow

Tasks:
- align component-source and block governance behavior
- replace inline color option logic with centralized helper usage
- add dynamic styling parity features including section-id path
- introduce draft-first save flow and conflict-safe writes (`ifMatchUpdatedAt`)
- add publish lifecycle API and model integration
- add preview-token flow integration
- add unsaved-change guards (beforeunload/navigation/back)

Exit criteria:
- page editing matches parity requirements
- legacy route paths still work

Rollback trigger:
- save/publish/preview regression on existing pages

### Phase 4: Media Flow Parity in Builder and Editors

Deliverables:
- TSUV-equivalent media flow where required by parity scope

Tasks:
- upgrade `MediaPickerInput` contract parity:
  - media type mode support as required
  - mime-type filters
  - configurable modal labels/states
  - required resolution checks
- align media API filtering and upload validation behavior
- keep stored media mapping compatibility (`/media/{id}` with variant params)
- validate desktop/mobile image behavior across schema-driven and custom forms

Exit criteria:
- upload/select/replace/preview behavior parity achieved
- no breakage for existing saved media values

Rollback trigger:
- media selection/upload failures in existing editors

### Phase 5: Centralized Theme and Color System Parity

Deliverables:
- centralized color architecture using Mesco values

Tasks:
- add `lib/themeColors.js`
- add `lib/appearanceColors.js`
- add `lib/siteSettings.js`
- add `lib/appearanceThemeOwnership.js`
- integrate `/api/theme` with centralized pipeline
- add title-and-colors config APIs

Exit criteria:
- all relevant color controls consume centralized options
- Mesco branding values remain intact

Rollback trigger:
- visual drift caused by color source mismatch

### Phase 6: Forms, Popups, and Dynamic Submissions

Deliverables:
- Forms and Popups modules
- dynamic submissions route support

Tasks:
- add forms/popups models, APIs, admin routes
- add required public endpoints for parity
- wire `/admin/submission/[formKey]` and `/admin/submissions/[formKey]`
- preserve legacy submissions routes

Exit criteria:
- forms/popups and submissions flows function without regression to existing submissions modules

Rollback trigger:
- submission flow instability or data write regression

### Phase 7: Appearance Consolidation

Deliverables:
- Header/Footer/Subscribe managed under Appearance

Tasks:
- create `components/admin/appearance/*` module structure
- move appearance entrypoints while preserving storage contracts
- retain fallback adapters during transition

Exit criteria:
- no frontend render drift for header/footer/subscribe

Rollback trigger:
- public shell rendering regression

### Phase 8: RBAC Enforcement Rollout

Deliverables:
- roles UI
- permission-key enforcement with compatibility fallback

Tasks:
- add RBAC models and APIs
- add permission helpers in middleware and API auth
- gate admin menus and actions by permission
- keep legacy fallback until full validation passes

Exit criteria:
- no unauthorized access
- no unintended lockout for valid roles

Rollback trigger:
- lockout or permission regression detected

### Phase 9: Hardening, Validation, and Decommission Readiness

Deliverables:
- finalized compatibility report
- regression checklist pass
- deprecation candidate list (not yet removed)

Tasks:
- run lint/build and full smoke validation
- verify migration scripts and backfill integrity
- verify all compatibility routes and API aliases
- update documentation (`AGENTS.md` and implementation notes)

Exit criteria:
- `npm run lint` passes
- `npm run build` passes
- smoke suites pass for all critical paths

Rollback trigger:
- any critical path fails after release-candidate validation

## 9. Validation Matrix (Measurable)

Required test packs before phase completion:

Routing pack:
- all legacy admin routes return expected screens
- all new canonical routes return expected screens
- redirect rules have no loops

Page Builder pack:
- block add/edit/reorder/delete
- component style control save/apply
- slider style control save/apply
- section dynamic styling save/apply
- draft save, publish, preview-token flow
- unsaved-change guard behavior

Media pack:
- upload from picker
- select/replace from library modal
- resolution validation behavior where required
- mime-filter behavior where configured
- desktop/mobile image behavior and fallback
- preview updates after replace/variant change

Appearance and color pack:
- all appearance sections load and save
- centralized color options resolve in all target forms
- Mesco brand values preserved

Permissions pack:
- legacy role compatibility during transition
- permission-key enforcement after rollout
- no lockouts for authorized users

Data integrity pack:
- no schema cast errors
- no data loss for existing pages/components/theme/media
- migration/backfill verification queries pass

## 10. Risk Register

1. Data migration risk
- Mitigation: additive schemas, idempotent scripts, dry-run and rollback checkpoints.

2. Permission lockout risk
- Mitigation: phased RBAC, fallback mode, emergency admin path, audit logging.

3. Route/API break risk
- Mitigation: compatibility wrappers and explicit route/API contract testing.

4. Visual drift risk
- Mitigation: centralized color ownership boundaries and Mesco-value seeding.

5. Media regression risk
- Mitigation: backward-compatible media URL contract and focused media test pack.

## 11. Out of Scope (Initial Migration Pass)

- Portfolio parity unless explicitly requested.
- Full one-pass soft-delete conversion across every model.
- Immediate removal of all legacy role checks before RBAC stabilization.

## 12. Final Gate

This plan is now the single canonical migration plan.
No implementation should start until this plan is approved.