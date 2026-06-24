# Form Builder Detailed Implementation Checklist (MVP)

Source of truth: `docs/FORM_BUILDER_MODULE_PLAN.md`  
Architecture alignment: Next.js 14 App Router, MongoDB/Mongoose, NextAuth + `requireAuth(req)`, Ant Design admin patterns.

## 1. Phase Plan Overview

Execution order is mandatory and matches approved scope:

1. Phase 1: Foundation
2. Phase 2: Questions Builder UX
3. Phase 3: Runtime + Inbox
4. Phase 4: CMS Embed

Release is blocked until all four phases and regression gates pass.

## 2. Detailed Checklist By Phase

## Phase 1: Foundation

### P1-1. Data models and schema contracts
- [x] Create models:
  - `models/Form.js`
  - `models/FormSubmission.js`
  - `models/SubmissionFile.js`
  - `models/FormCounter.js`
- [x] Implement immutable IDs and canonical schema:
  - immutable `formId`
  - immutable `shortcode` and `shortcodeAlt`
  - immutable `fieldKey` and `sectionId`
  - `schema.sections[]` and `schema.questions[]` linkage via `sectionId`
- [x] Add required indexes from plan.

Dependencies:
- None (starting point).

Acceptance criteria:
- Creating a form generates `formId` in `FORM_###` format.
- Duplicate shortcode collisions are resolved deterministically and uniquely.
- Form schema persists with section/question order integrity.
- All required unique and query indexes are present.

### P1-2. Shared validation and helper utilities
- [x] Add shared utilities under `lib/forms/`:
  - constants (`status`, question types, defaults)
  - `fieldName` normalizer/validator (snake_case contract)
  - schema validator for sections/questions
  - lifecycle transition guard
  - shortcode/id generation helpers
- [x] Enforce server-authoritative validation contracts.

Dependencies:
- P1-1.

Acceptance criteria:
- Invalid field names are rejected with `400`.
- Duplicate field names within a form are rejected with `400`.
- Invalid lifecycle transitions are rejected with `400`.
- Shared validator can be reused by admin and public endpoints.

### P1-3. Admin Forms CRUD APIs
- [x] Add routes:
  - `app/api/admin/forms/route.js` (`GET`, `POST`)
  - `app/api/admin/forms/[formId]/route.js` (`GET`, `PUT`, `DELETE`)
- [x] Add required auth/role enforcement:
  - `requireAuth(req)` in every route
  - allow `Admin`, `Editor`
  - deny `Author` with `403`
- [x] Implement delete policy:
  - `409` if submissions exist
  - hard-delete only if submission count is zero

Dependencies:
- P1-1, P1-2.

Acceptance criteria:
- CRUD endpoints return documented status codes and payload shapes.
- Delete behavior follows `409 archive-instead` rule.
- Author role cannot call these endpoints.

### P1-4. Schema + lifecycle APIs
- [x] Add routes:
  - `app/api/admin/forms/[formId]/schema/route.js` (`PUT`)
  - `app/api/admin/forms/[formId]/publish/route.js` (`POST`)
  - `app/api/admin/forms/[formId]/unpublish/route.js` (`POST`)
  - `app/api/admin/forms/[formId]/archive/route.js` (`POST`)
- [x] Ensure `schemaVersion` updates only when schema changes.

Dependencies:
- P1-1, P1-2, P1-3.

Acceptance criteria:
- Lifecycle transitions obey contract:
  - `draft -> published`
  - `published -> draft`
  - `draft|published -> archived`
  - `archived -> draft` via unpublish restore path
- Invalid transition returns `400` with actionable error.

### P1-5. Middleware and permission surface
- [x] Update `middleware.js`:
  - guard `/admin/form-builder` and descendants
  - guard `/api/admin/forms` and descendants
  - deny `Author`, allow `Editor`/`Admin`
- [x] Update admin menu visibility (`components/admin/AdminLayoutClient.js`) with same role matrix.

Dependencies:
- P1-3.

Acceptance criteria:
- UI and API both enforce the same role matrix.
- Hidden-route bypass is prevented.
- Existing blog/event author access remains unchanged.

### P1-6. Notification unread aggregation API
- [x] Add `GET /api/admin/forms/submissions/unread?limit=10` with cross-form unread results.

Dependencies:
- P1-1.

Acceptance criteria:
- Endpoint returns latest unread submissions across forms, sorted by newest first.
- `limit` defaults and max caps are enforced.

## Phase 2: Questions Builder UX

### P2-1. Form Builder admin routes
- [x] Add pages:
  - `/admin/form-builder`
  - `/admin/form-builder/[formId]/edit`
- [x] Add sidebar navigation item `Form Builder`.

Dependencies:
- Phase 1 complete.

Acceptance criteria:
- Admin/Editor can list forms and open editor.
- Author cannot access pages.

### P2-2. Google Forms-like question card editor
- [x] Implement question card workspace:
  - add/delete/duplicate
  - drag-drop reorder
  - type switch
  - required toggle
  - inline label/description/options editing
- [x] Implement section management:
  - add/edit section title/description
  - move questions across sections

Dependencies:
- P2-1, P1-4 schema APIs.

Acceptance criteria:
- Supported MVP field types are available and persisted.
- Reorder across sections persists reliably.
- No branching UI is present.

### P2-3. Top bar lifecycle controls
- [x] Add title edit, status chip, Save, Publish/Unpublish, Preview, Copy shortcode.

Dependencies:
- P1 lifecycle APIs.

Acceptance criteria:
- UI state and server status always match after save/publish/unpublish/archive.
- Immutable shortcode is copyable but never editable.

## Phase 3: Runtime + Inbox

### P3-1. Public form resolution and render APIs
- [x] Add:
  - `GET /api/public/forms/[formId]`
  - `GET /api/public/forms/resolve?shortcode=...`
- [x] Enforce published-only exposure.

Dependencies:
- Phase 1 complete.

Acceptance criteria:
- Draft/archived forms are not submittable.
- Public resolver returns stable form metadata for runtime rendering.

### P3-2. Public submit and upload APIs
- [x] Add:
  - `POST /api/public/forms/[formId]/submit`
  - `POST /api/public/forms/[formId]/upload`
- [x] Persist:
  - `fieldSnapshot`
  - `payloadByFieldKey`
  - `payloadByFieldNameSnapshot`
  - normalized `searchText`
- [x] Apply upload constraints and pending-file strategy.

Dependencies:
- P3-1, P1-1, P1-2.

Acceptance criteria:
- Server validation is authoritative for all supported types.
- Invalid payloads fail with `400` and field-level errors.
- Unsupported MIME/extensions or oversize files are rejected.

### P3-3. Admin submissions inbox pages
- [x] Add page:
  - `/admin/form-builder/[formId]/submissions`
- [x] Implement table + detail + mark-read + delete flows.
- [x] Support filters per API contract: `page`, `limit`, `search`, `isRead`, `dateFrom`, `dateTo`, `sort`.

Dependencies:
- P3-2 and admin submissions APIs.

Acceptance criteria:
- List response shape: `{ items, total, page, totalPages, limit }`.
- Row open marks read via `PATCH`.
- Search uses denormalized `searchText`.

### P3-4. Notification bell integration
- [x] Integrate form unread notifications into `components/admin/AdminLayoutClient.js`.
- [x] Use single aggregation endpoint (no per-form polling).
- [x] Event name support: `new-form-submission`.

Dependencies:
- P1-6, P3-3.

Acceptance criteria:
- Bell shows form unread items with deep-link `/admin/form-builder/[formId]/submissions`.
- Existing contact/donation/subscriber/event notifications still work.

### P3-5. Upload cleanup job
- [x] Add script:
  - `scripts/form-upload-cleanup.js`
- [x] Add npm command:
  - `npm run form-upload-cleanup`
- [x] Delete pending uploads older than 24h; log counts/failures.

Dependencies:
- P3-2.

Acceptance criteria:
- Dry-run and live-run logs are verifiable.
- Production release checklist includes one successful dry-run log.

## Phase 4: CMS Embed

### P4-1. Form Embed component integration
- [x] Add CMS block/component for embedding forms via form picker and shortcode fallback.
- [x] Integrate runtime renderer with existing `ComponentRenderer` and site component registry patterns.

Dependencies:
- Phase 2 and Phase 3 complete.

Acceptance criteria:
- Embedded form renders on public pages by selected `formId` or shortcode.
- Preview/edit in CMS does not break existing component rendering.

### P4-2. End-to-end publishing flow
- [x] Verify full path:
  - create form -> design questions -> publish -> embed -> submit -> admin inbox

Dependencies:
- P4-1.

Acceptance criteria:
- End-to-end flow passes with immutable IDs and preserved schema snapshots.

## 3. Cross-Phase Regression Gates

## RG-1. Contact module regression gate
- [x] `components/forms/ContactForm.js` submit path unchanged.
- [x] `POST /api/contact` behavior unchanged.
- [x] `/admin/contacts` list/detail/mark-read/delete unchanged.

Acceptance criteria:
- Existing contact submissions continue to save and appear in admin.

## RG-2. Event registration regression gate
- [x] `components/site/EventRegistrationForm/EventRegistrationForm.js` submit path unchanged.
- [x] `POST /api/public/event-registrations` unchanged.
- [x] `/admin/event-registrations` status/read flows unchanged.

Acceptance criteria:
- Event registration lifecycle remains functional and unaffected.

## RG-3. Donation regression gate
- [x] Donate Now flow (`/api/payment/*`) unchanged.
- [x] `/admin/donations` queries and statuses unchanged.
- [x] Notification bell still shows successful donations.

Acceptance criteria:
- Payment initiation/callback + donation inbox behavior unchanged.

## RG-4. Volunteer/feedback regression gate
- [x] Volunteers feedback public submit unchanged.
- [x] `/admin/volunteers-feedback` filters/read/delete unchanged.
- [x] Existing volunteer/contact notification events remain intact.

Acceptance criteria:
- Volunteer feedback submissions continue to persist and display correctly.

## RG-5. Global quality gate
- [x] `npm run lint` (non-interactive ESLint config present).
- [x] `npm run build`.
- [x] Smoke test across Contact/Event/Donation/Volunteer + Form Builder MVP (`npm run form-builder-qa`).

Acceptance criteria:
- No critical errors or high-severity regressions.

## 4. Implementation Kickoff: First Development Phase

First development phase: **Phase 1 (Foundation)**.

### Immediate actionable development tasks (execution order)

1. Add Form Builder model layer (`Form`, `FormSubmission`, `SubmissionFile`, `FormCounter`) with indexes and immutable field rules.
2. Build shared backend helpers in `lib/forms/*` for:
   - ID and shortcode generation
   - schema and field-name validation
   - lifecycle transition validation
3. Implement admin form CRUD and lifecycle route handlers under `app/api/admin/forms/**`.
4. Implement middleware role guards and admin menu visibility updates.
5. Add unread aggregation endpoint for form submissions.
6. Add Phase 1 API contract docs in `docs/API.md` (forms admin endpoints and error codes).

### Required change areas in Phase 1

Database changes:
- New collections: `forms`, `form_submissions`, `submission_files`, `form_counters`.
- New indexes (uniqueness and read/search performance).

API changes:
- New admin route group `/api/admin/forms/**`.
- New admin unread endpoint `/api/admin/forms/submissions/unread`.

Backend changes:
- Shared validators/helpers in `lib/forms`.
- Role enforcement in middleware and route handlers.
- Standardized error contracts for invalid schema/lifecycle requests.

Frontend changes (minimal in Phase 1):
- Sidebar entry visibility and route placeholders.
- No full builder UI yet (Phase 2).

### Phase 1 risk and edge-case watchlist

1. ID collisions and race conditions when creating many forms concurrently.
2. Shortcode uniqueness/collision handling drift.
3. Field-name normalization accidentally mutating existing form data on update.
4. Incorrect lifecycle transitions allowing archived/published mismatch.
5. Middleware guard regressions that broaden or restrict Author/Editor access unexpectedly.
6. Notification endpoint performance under high submission volume without proper indexing.
7. Contract drift between route validation and future frontend builder payload shape.

### Phase 1 regression controls for existing modules

1. Do not modify existing schemas/routes for Contact/Event/Donation/Volunteer.
2. Keep notification bell logic backward-compatible while adding form unread feed.
3. Validate no middleware side effects on:
   - `/api/contact`
   - `/api/public/event-registrations`
   - `/api/payment/*`
   - `/api/public/volunteers-feedback`
4. Re-run manual smoke flows for those four modules after each middleware or admin shell change.
