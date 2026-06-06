# Form Builder QA Run (2026-06-05)

Environment:
- App server: `npm run start -- -p 4010`
- Date: 2026-06-05
- Mode: automated API + DB + authenticated admin smoke checks
- QA command: `npm run form-builder-qa`

## Automated Checks Passed

1. Global health and auth setup
- `GET /api/health` -> `200`
- Temporary QA admin user is created, authenticated via NextAuth credentials flow, and removed after run.

2. Existing module regression checks
- Contact:
  - `POST /api/contact` -> `201`
  - `/api/admin/contacts` list -> includes submission
  - `/api/admin/contacts/[id]` mark-read + delete -> `200`
- Event registration:
  - `POST /api/public/event-registrations` -> `201`
  - `/api/admin/event-registrations` list/detail/patch/delete -> `200`
- Donation:
  - `POST /api/payment/initiate` invalid payload -> `400` (guardrail)
  - `POST /api/payment/callback` missing `encResp` -> `303` redirect to failed reason
  - `/api/admin/donations` list/detail -> includes seeded success donation fixture
- Volunteers feedback:
  - `POST /api/public/volunteers-feedback` -> `201`
  - `/api/admin/volunteers-feedback` list/detail/patch/delete -> `200`

3. Form Builder end-to-end (admin + public)
- Admin create form -> schema save -> publish
- Public runtime resolution:
  - `GET /api/public/forms/[formId]` -> `200`
  - `GET /api/public/forms/resolve?shortcode=...` -> `200`
- Public submit:
  - `POST /api/public/forms/[formId]/submit` -> `201`
- Admin inbox:
  - `/api/admin/forms/submissions/unread` includes submission
  - `/api/admin/forms/[formId]/submissions` list/detail/mark-read/delete -> `200`
  - form delete after submission cleanup -> `200`

4. CMS embed path verification
- Published temp page with `FormEmbed` block created in DB.
- Public page render (`/<qa-slug>`) returns `200` and contains embed heading + question label.
- Embedded form submission appears in admin form submissions inbox.

5. Build/lint quality gates
- `npm run lint` executes non-interactively (warnings only).
- `npm run build` succeeds.

## Cleanup Completed
- QA forms/submissions/files removed from DB.
- QA contact/event/volunteer submissions removed.
- QA donation fixture removed.
- QA page slug removed.
- QA admin user removed.
- QA upload folders under `public/uploads/forms/FORM_QA_*` removed.

## Result
- Form Builder Phase 4 end-to-end flow verified.
- Regression gates for Contact, Event, Donation, and Volunteer modules verified by automated smoke checks.
