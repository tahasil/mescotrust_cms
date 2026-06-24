# Form Builder Module Plan (MVP Scope Locked)

## 1. Scope Lock (Final)

This module will follow the project's **existing form flow**.
Only the **form design/authoring UI** will be made Google Forms-like.

In simple terms:
- Flow stays same: create -> edit -> save/publish -> embed -> submit -> admin inbox.
- Only Questions designer UX changes to Google Forms-style cards.
- Settings screen is out of scope for current MVP.

This keeps alignment with current Mesco Trust CMS architecture:
- Next.js 14 App Router
- MongoDB + Mongoose
- NextAuth + `requireAuth(req)`
- Ant Design admin patterns

---

## 2. Current Baseline (As-Is)

Existing forms are component-specific and already production-used:

1. Contact:
- UI: `components/forms/ContactForm.js`, `components/site/ContactUs/ContactUs.js`
- API: `POST /api/contact`
- Admin inbox: `/admin/contacts`

2. Event Registration:
- UI: `components/site/EventRegistrationForm/EventRegistrationForm.js`
- API: `POST /api/public/event-registrations`
- Admin inbox: `/admin/event-registrations`

3. Donation:
- UI: `components/site/DonateNow/DonateNow.js`
- APIs: `/api/payment/*`
- Admin inbox: `/admin/donations`

4. Volunteers Feedback:
- UI: `components/site/VolunteersFeedback/*`
- API: `POST /api/public/volunteers-feedback`
- Admin inbox: `/admin/volunteers-feedback`

---

## 3. MVP Product Goal

Deliver a reusable Form Builder where:

1. Admin can design questions in a Google Forms-like editor.
2. Form lifecycle follows existing CMS behavior (draft/published/archive).
3. Form render + submit works in existing CMS/public architecture.
4. Admin can view submissions in existing inbox style (table + detail + mark-read).
5. No regression in current Contact/Event/Donation/Volunteer modules.

---

## 4. UX Plan (Google Forms-Style for Questions Only)

## 4.1 Form List and Create

1. Add sidebar item: `Form Builder`.
2. List page: `/admin/form-builder` with:
- Form ID
- Form Name
- Shortcode
- Status
- Created/Updated
- Actions: Edit, Preview, Delete, Copy shortcode

3. Create flow (MVP):
- `Create Form` -> blank form only
- generate immutable `formId` (`FORM_001`...) and immutable shortcode
- open editor directly

Note:
- Template-based create is deferred.
- Duplicate form can be phase-2 if needed, not mandatory for MVP.

## 4.2 Questions Editor (Core)

Editor at `/admin/form-builder/[formId]/edit`:

1. Top bar:
- editable form title
- status chip
- Save
- Publish/Unpublish
- Preview
- Copy shortcode

2. Questions workspace only:
- card-based question UI (Google Forms-like)
- drag and drop reorder
- add/delete/duplicate question
- required toggle
- question type switcher
- inline label/description/options editing

3. Supported question types (MVP):
- short text
- paragraph
- email
- number
- mobile/phone
- URL
- date
- single choice (radio/dropdown)
- multiple choice (checkbox)
- file
- hidden
- visual-only block: divider

## 4.3 Sections in MVP

Sections are first-class schema groups in MVP:
- add/edit section title and description in section metadata
- reorder questions across sections
- no conditional branching
- no "go to section based on answer" yet

This keeps runtime flow same as existing linear forms.

## 4.4 Settings

No settings page in MVP.

Explicit default behavior (hard-coded at backend for this phase):
- published forms accept responses
- draft/archived forms reject responses
- default submit label: `Submit`
- default success message: `Thank you for your response.`
- edit-after-submit: disabled
- one-response-limit: disabled

---

## 5. Data Contract (MVP)

## 5.1 IDs and immutability

1. `formId`: immutable.
2. `shortcode`: immutable after create.
3. `fieldKey` (UUID): immutable per question.

## 5.2 Field naming

`fieldName` normalization rules:
- lowercase snake_case
- starts with letter
- only `a-z`, `0-9`, `_`
- unique within form for data fields

## 5.3 Models

1. `Form`:
- `formId`, `name`, `status`, shortcode fields
- `schema` (canonical shape):
  - `sections[]` with `sectionId`, `title`, `description`, `order`
  - `questions[]` with `fieldKey`, `sectionId`, `type`, `label`, `fieldName`, `required`, `options`, `order`
- `schemaVersion`
- audit fields + timestamps

2. `FormSubmission`:
- `formId`, `schemaVersion`
- `fieldSnapshot`
- `payloadByFieldKey`
- `payloadByFieldNameSnapshot`
- `searchText` (denormalized searchable text)
- `isRead`
- `source`, `pagePath`
- timestamps

3. `SubmissionFile`:
- `formId`, `submissionId`, `fieldKey`
- filename, mimeType, size, storagePath/url

4. `FormCounter`:
- atomic counter for `FORM_###`

## 5.4 Section schema contract (explicit)

MVP section behavior is linear grouping only, so schema must store section linkage explicitly:

1. `schema.sections[]`:
- `sectionId` (UUID, immutable)
- `title`
- `description`
- `order`

2. `schema.questions[]`:
- `fieldKey` (UUID, immutable)
- `sectionId` (required for all question/data fields)
- `type`
- `label`
- `fieldName` (for data fields)
- `required`
- `options` (when applicable)
- `order`

3. Rules:
- every question belongs to exactly one section
- section heading is not a question type in MVP (section titles come from `schema.sections[]`)
- no branching metadata in MVP schema
- runtime renders sections/questions in ascending `order`

## 5.5 Indexes

Minimum indexes:
- `Form.formId` unique
- `Form.shortcode` unique
- `Form.shortcodeAlt` unique
- `FormSubmission.formId + createdAt`
- `FormSubmission.formId + isRead + createdAt`
- `FormSubmission.searchText` text index
- `SubmissionFile.submissionId`

Shortcode collision rule:
- if generated shortcode already exists, regenerate using deterministic suffix until unique
- shortcode once assigned never changes

---

## 6. API Plan (MVP Only)

Follow existing route conventions.

## 6.1 Admin APIs

1. Forms:
- `GET /api/admin/forms`
- `POST /api/admin/forms`
- `GET /api/admin/forms/[formId]`
- `PUT /api/admin/forms/[formId]`
- `DELETE /api/admin/forms/[formId]`

Delete policy (required):
- if form has one or more submissions, `DELETE` must return `409` and instruct user to archive instead
- hard delete is allowed only when submission count is zero
- archived forms remain hidden from default pickers and non-submittable

2. Schema/lifecycle:
- `PUT /api/admin/forms/[formId]/schema`
- `POST /api/admin/forms/[formId]/publish`
- `POST /api/admin/forms/[formId]/unpublish` (published -> draft)
- `POST /api/admin/forms/[formId]/archive`

Lifecycle transition contract:
- `draft` -> `published` via `publish`
- `published` -> `draft` via `unpublish`
- `draft|published` -> `archived` via `archive`
- `archived` -> `draft` via `unpublish` (explicit restore flow)

3. Submissions (existing inbox style):
- `GET /api/admin/forms/[formId]/submissions`
- `GET /api/admin/forms/[formId]/submissions/[submissionId]`
- `PATCH /api/admin/forms/[formId]/submissions/[submissionId]` (`isRead` only)
- `DELETE /api/admin/forms/[formId]/submissions/[submissionId]`

Submission listing query contract (required):
- `page` (default 1)
- `limit` (default 20, max 100)
- `search` (matches denormalized `searchText`)
- `isRead` (`true|false|all`, default `all`)
- `dateFrom`, `dateTo` (ISO date filters)
- `sort` (`createdAt_desc` default, `createdAt_asc`)

`searchText` generation contract:
- build at submission write-time from identity answers (name/email/phone where available) + plain-text answer values
- normalize to lowercase trimmed text
- include file names only (not binary content)

Submission list response contract (required):
- `{ items, total, page, totalPages, limit }`
- item minimum fields for table: `_id`, `formId`, `isRead`, `createdAt`, `payloadByFieldNameSnapshot`

4. Notifications support endpoint:
- `GET /api/admin/forms/submissions/unread?limit=10`
- returns latest unread submissions across forms for bell popover
- avoids per-form N+1 polling in admin shell

## 6.2 Public APIs

1. Runtime:
- `GET /api/public/forms/[formId]`
- `GET /api/public/forms/resolve?shortcode=...`

2. Submit:
- `POST /api/public/forms/[formId]/submit`
- `POST /api/public/forms/[formId]/upload` (for file fields)

---

## 7. Validation, Files, and Runtime Rules

## 7.1 Validation contract

Single shared schema validator:
- client performs pre-checks
- server is authoritative

MVP rule set:
- email/url/mobile format
- number/date min/max
- text min/max and regex
- option key validity for select/checkbox
- required checks

## 7.2 File upload safety (explicit)

MVP constraints:
- allowlisted mime types only
- max file size per field
- max file count per field (default 1)
- reject executable/script mime types
- orphan uploads cleanup via scheduled job

Cleanup mechanism (required in MVP):
- temporary uploads are marked `pending` until linked to a saved submission
- daily cleanup job removes `pending` files older than 24h
- cleanup runs via script `npm run form-upload-cleanup` (or equivalent cron trigger)
- cleanup action logs deleted count + failures for ops review

Operational ownership:
- production scheduler ownership: DevOps/Ops
- non-production/manual fallback ownership: engineering team
- release gate requires one successful dry-run cleanup log in target environment

## 7.3 Historical readability

Even if labels/questions change later:
- old submissions remain readable via `fieldSnapshot` + `schemaVersion`

---

## 8. Admin Integration (MVP)

1. Sidebar:
- Add `Form Builder`.

2. Submissions UI:
- use existing admin inbox pattern (table + modal/detail + mark-read + delete)
- no Google Forms analytics tabs in MVP

Submissions route contract:
- page route: `/admin/form-builder/[formId]/submissions`
- list loads from `GET /api/admin/forms/[formId]/submissions`
- detail loads from `GET /api/admin/forms/[formId]/submissions/[submissionId]`
- row open marks read via `PATCH /api/admin/forms/[formId]/submissions/[submissionId]`
- supports list filters from API query contract (`page`, `limit`, `search`, `isRead`, `dateFrom`, `dateTo`, `sort`)

3. Notification bell integration:
- include unread Form Builder submissions in existing polling aggregator
- aggregator must call one endpoint: `GET /api/admin/forms/submissions/unread?limit=10`
- event name: `new-form-submission`
- deep-link target: `/admin/form-builder/[formId]/submissions`

---

## 9. Permissions and Security

1. Permissions:
- `Admin`: full CRUD and submissions actions
- `Editor`: create/edit/publish + submissions view/mark-read
- `Author`: no Form Builder access

2. Middleware/API protections:
- `requireAuth(req)` for admin routes
- follow current middleware role restrictions
- same-origin checks apply to state-changing APIs
- rate-limit public submit/upload endpoints
- public upload endpoint must verify MIME + extension + size before persistence

Route enforcement points (required):
- middleware must explicitly guard `/admin/form-builder` and `/admin/form-builder/*`
- middleware must explicitly guard `/api/admin/forms` and `/api/admin/forms/*`
- `Author` role denied for both UI and API paths above
- `Editor` and `Admin` allowed for form-builder UI/API as per permission matrix
- sidebar menu visibility must follow same role matrix (no hidden-route bypass)

---

## 10. Deferred (Not in MVP)

These are intentionally excluded for now:

1. Settings page UI.
2. Template library / template-based create.
3. Conditional branching (`go to section based on answer`).
4. Advanced response analytics tabs (`Summary`, `Question`, charts).
5. Export (`csv/json`) if not needed for first release.
6. Submission workflow status (beyond `isRead`) is deferred.

---

## 11. Rollout Plan

## Phase 1: Foundation
- models, IDs, schema persistence, base APIs

## Phase 2: Questions Builder UX
- Google Forms-like questions card editor
- create/edit/save/publish/preview flow

## Phase 3: Runtime + Inbox
- public render + submit + upload
- admin submissions list/detail/read-state
- bell notification integration

## Phase 4: CMS Embed
- page builder `Form Embed` component
- shortcode resolver + renderer integration

Important:
- MVP release is complete only after Phase 1 + Phase 2 + Phase 3 + Phase 4.
- Phases are execution order, not optional scope cuts.

---

## 12. Acceptance Checklist (MVP Release Gate)

1. Form can be created with immutable `formId` and shortcode.
2. Questions editor is Google Forms-like card UX.
3. Existing flow remains same (create -> edit -> save/publish -> preview -> submit -> inbox).
4. No settings UI exists in MVP, and backend defaults are correctly enforced.
5. Linear sections work as grouping; no branching required.
6. Client/server validation works for all MVP question types.
7. Submissions are stored and visible in admin inbox style with mark-read.
8. Notification bell shows unread form submissions with correct deep-link.
9. `Form Embed` renders selected/shortcode form on public pages.
10. Regression pass:
- `npm run lint`
- `npm run build`
- smoke tests for Contact/Event/Donation/Volunteer existing modules
11. Admin unread bell integration uses single aggregated endpoint (no per-form N+1 fetches).
12. Upload cleanup job runs and removes stale pending files as expected.

Release rule:
- Block release if any critical checklist item fails.
