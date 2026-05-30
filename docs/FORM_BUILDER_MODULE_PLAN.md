# Form Builder Module Implementation Plan

## 1. Lock Data Contract and ID Strategy

1. Define immutable `formId` format as `FORM_001`, `FORM_002`, etc., generated via atomic counter collection.
2. Define immutable shortcodes at creation time: `[form id="FORM_001"]` and `[form_builder id="FORM_001"]`.
3. Use stable per-field `fieldKey` (UUID) to preserve submission integrity when labels/names change.
4. Keep `label` and `name` editable, but never rewrite stored submission values.
5. Add immutable `schemaVersion` per form save; each submission stores submitted version and a field snapshot for historical rendering.
6. Enforce `fieldName` normalization and uniqueness per form:
7. Normalize to lowercase snake_case.
8. Must start with a letter, allow only `a-z`, `0-9`, `_`.
9. Must be unique within one form, excluding non-data fields (divider/section heading).

## 2. Create New Database Models

1. `Form` collection: `formId`, `name`, `status`, `shortcode`, `shortcodeAlt`, timestamps, created/updated by.
2. `FormField` collection: `formId`, `fieldKey`, `type`, `label`, `name`, order, UI config, validation config, flags (`required`, `readOnly`, `hidden`), options.
3. `FormConfiguration` collection: `formId`, layout-level settings (submit text, success message, optional behavior flags), schema version metadata.
4. `FormSubmission` collection: `formId`, `schemaVersion`, `fieldSnapshot`, `payloadByFieldKey`, `payloadByFieldNameSnapshot`, read/status flags, source/page info, timestamps.
5. `SubmissionFile` collection: `formId`, `submissionId`, `fieldKey`, file metadata and storage path.
6. Add indexes for `formId`, `fieldKey`, `createdAt`, and read/status filters.
7. Add atomic counter collection (for `FORM_###`) with unique index on counter key.
8. Define form status enum and behavior:
9. `draft`: editable in admin, not renderable on public pages, submission blocked.
10. `published`: renderable and submittable.
11. `archived`: renderable optional (configurable), default submission blocked and hidden from picker unless explicitly selected.

## 3. Admin API Layer

1. Add protected admin CRUD endpoints for forms (`list/create/update/delete`), enforcing immutable `formId` + shortcode.
2. Add endpoint to save full builder schema (fields + config) in one transaction-like operation.
3. Add admin listing endpoint with required grid columns (ID, Name, Shortcode, Status, Created Date).
4. Add submissions endpoints for dynamic form submissions: list by form, details, mark read, delete.
5. Add API normalization/validation guards so invalid field schema cannot be persisted.
6. Add explicit public runtime API contracts:
7. `GET /api/public/forms/[formId]` for resolved schema/config render payload.
8. `POST /api/public/forms/[formId]/submit` for validated submission payload.
9. `POST /api/public/forms/[formId]/upload` (multipart) for file-field pre-submit or inline submit upload.
10. `GET /api/public/forms/resolve?shortcode=...` to resolve manual shortcode safely.
11. Add admin detail APIs for submission files and secure download links.
12. Define immediate reflection behavior after save:
13. Admin create/update/delete APIs return fresh saved document payload.
14. Admin form listing/detail fetches use `cache: "no-store"` and explicit post-save refetch.
15. UI applies optimistic update where safe, then reconciles with server response without full page reload.

## 4. Admin Sidebar + Form Builder Module

1. Add new sidebar item: **Form Builder**.
2. Build `/admin/form-builder` listing page with columns: Form ID, Form Name, Shortcode, Status, Created Date, Actions.
3. Add actions: Edit, View, Delete, Copy Shortcode.
4. Add **Add Form** flow (create form, generate immutable ID + shortcode, open builder editor).
5. In create/edit UI, show:
6. `Form ID` as read-only/non-editable field.
7. `Form Name` as editable field at all times.
8. Shortcode variants as read-only with copy buttons.
9. Ensure rename/status updates never mutate existing `formId` or shortcode values.
10. Define **View** action as read-only form preview (no mutation controls).

## 5. Drag-and-Drop Builder UI

1. Build field palette with all requested types: text, email, number, mobile, password, textarea, select, radio group, checkbox group, date, file, URL, hidden, section heading, divider.
2. Implement drag-drop add, reorder, duplicate, remove.
3. Implement field settings editor for label, name, placeholder, default value, help text, required, read-only, hidden, width/layout.
4. Implement validation settings editor: required, email format, number/mobile constraints, min/max length/value, regex, file type/size, custom messages.
5. Persist exact field order and all settings.

## 6. Frontend Runtime + Submission Handling

1. Build reusable frontend `FormRenderer` that renders form from saved schema.
2. Implement client-side validation from schema rules.
3. Implement backend validation from same schema (authoritative).
4. Support file uploads with size/type validation; store file metadata and link files to submission.
5. Persist submissions to new submission collections and return structured success/error responses.
6. Enforce form status at runtime (`draft`/`archived` blocked with clear frontend + API error).
7. Preserve backward readability:
8. If a field is removed from active schema, still show old value in submission detail from `fieldSnapshot`.
9. If label/name changed, list columns follow latest schema while detail view can show submitted snapshot and current mapping.
10. Submission detail view must display file-field values with preview (where possible), filename, size, type, and secure download/open action.

## 7. Submissions Module Integration

1. Add a new Submissions section/page for Form Builder submissions (auto-populated from saved forms).
2. Generate submission table columns dynamically from current form schema.
3. Ensure label/name edits reflect automatically in column headers by resolving through `fieldKey`.
4. Preserve all historical submission records even after field updates/removals.
5. Define fallback column behavior:
6. Unknown/removed field values appear under a grouped "Legacy Fields" area in details.
7. Add server-side pagination/filter/search on dynamic submissions listing.
8. When a form is created and saved, it must automatically appear in Submissions module without manual setup or code changes.
9. For multiple forms, provide form selector/tabs in submissions UI with stable deep-linking per form.

## 8. Shortcode + Page Builder Integration

1. Add a **Form Embed** component in Page Builder.
2. In Form Embed editor, support both:
3. Select form from Form Builder list.
4. Paste shortcode manually (`[form ...]` or `[form_builder ...]`).
5. Parse shortcode safely and resolve to `formId`.
6. Render selected form automatically on frontend.
7. Integrate with existing component architecture explicitly:
8. Register `FormEmbed` as a system component schema (`lib/systemComponents.js`) and seed route support.
9. Add renderer mapping in `components/cms/ComponentRenderer.js`.
10. Add page-builder schema/edit drawer support (same pattern as existing blocks).
11. Ensure embed block stores only `formId`/shortcode reference, not duplicated schema.

## 9. Notification Integration

1. Extend admin notification polling to include unread Form Builder submissions.
2. Keep behavior consistent with existing notification bell (count, list item, deep-link to relevant submissions view).
3. Mark-as-read behavior on submission view/open.
4. Include event naming for immediate UI refresh (`new-form-submission`) aligned with existing window event pattern.
5. Define notification detail parity acceptance:
6. Each notification includes form name/form ID, submission timestamp, and deep-link target.
7. Clicking a notification opens the relevant submissions module/detail and marks the record read.
8. Badge count and popover list update immediately after mark-read/delete actions.

## 10. Security, Permissions, and Compatibility

1. Use existing auth guards (`requireAuth`) for all admin APIs.
2. Respect role restrictions consistent with current admin behavior.
3. Keep existing Contacts/Donations/Subscribers/Event Registrations flows unchanged.
4. Keep same-origin protections and rate limiting patterns for public submission endpoints.
5. Define role matrix and enforce in middleware + APIs + sidebar:
6. `Admin`: full CRUD forms/submissions/settings.
7. `Editor`: create/edit/publish forms and view submissions, no destructive global settings if restricted.
8. `Author`: no Form Builder or Form Submissions access (unless explicitly enabled later).
9. Update middleware allow/deny lists for new routes and APIs.

## 11. Regression and Release Validation

1. Run `npm run lint` and `npm run build`.
2. Manual smoke tests: admin sidebar, form CRUD, builder operations, shortcode copy/use, page builder embed, frontend submit, file upload, submissions listing, notification bell.
3. Responsive checks on desktop/tablet/mobile for admin builder and frontend forms.
4. Update docs (`API.md`, `TECHNICAL_DESIGN.md`, admin manual section for new Form Builder/Submissions flow).
5. Explicit no-regression checks for existing modules:
6. Contact Us submissions flow + admin inbox.
7. Volunteer submissions flow + admin inbox.
8. Event registration form + admin event registrations module.
9. Donation callback + donation inbox + receipt notification flow.
10. Subscriber public subscribe + admin subscribers module.
11. Existing admin notification bell count/list correctness across old and new sources.
12. Convert regression into release gates:
13. Maintain a checklist with `Pass/Fail/Blocked` status per critical flow.
14. Block release if any critical flow is not `Pass`.
15. Capture evidence for each gate (API checks, UI screenshots, and command outputs for lint/build).

## 12. Explicit Acceptance Checklist (Request Mapping)

1. Form ID is auto-generated, unique, and immutable after creation.
2. Form Name is editable at any time.
3. Shortcode is auto-generated, read-only, copyable, and unchanged when form name changes.
4. Form listing contains required columns and actions: Edit, View, Delete, Copy Shortcode.
5. Drag-and-drop builder supports all requested field types and reorder/duplicate/remove/edit flows.
6. Field configuration and validation options match requested scope, including file constraints and custom messages.
7. Full schema/config is saved and editable with immediate post-save reflection.
8. New/updated forms appear in Submissions module automatically; submission columns track latest field labels/names.
9. Existing submission records remain intact after field updates/removals, with legacy fallback rendering.
10. Page Builder `Form Embed` supports form selection and manual shortcode paste, and renders on frontend.
11. Frontend submissions are validated client-side and server-side, stored in DB, and include file handling.
12. Admin notifications for form submissions match existing notification behavior (count/list/details/deep-link/read state).
13. Backward compatibility with existing submissions modules and notifications is preserved.
14. Responsive behavior is validated for admin + frontend.
15. Release is blocked unless all defined regression gates pass.
