# Common Media Plan (Single Source of Truth)

Last Rechecked: 2026-06-18
Status: Implementation complete for Phases 0-8. Release gate passed with automated and scripted smoke checks.

This is the only active media planning document in the repo and supersedes older guidance that required responsive size variants (`thumb`, `medium`, `large`, `mobile`, `desktop`).

## Scope Update (Approved Requirements)

1. Generated sizes section keeps only `Original`.
2. New uploads must not create multiple size variants.
3. Supported output formats for each cropped image:
   - `Original`
   - `JPG`
   - `WebP`
   - `AVIF`
4. `WebP` is the default optimized format.
5. Frontend rendering from all admin-managed modules must use original dimensions only and must not use size-based selection logic.
6. Upload is blocked until pre-upload crop flow is completed and confirmed.

## Scope Clarifications (Locked)

1. Crop-before-upload requirement applies to raster images only:
   - `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/avif`
2. Non-raster files are out of crop scope and keep existing behavior:
   - `image/svg+xml`, `application/pdf`
3. Legacy `size` query compatibility policy:
   - old requests like `?size=thumbnail|medium|large|mobile|desktop` must not 404.
   - all legacy size values resolve to original-dimension asset selection.
4. `format=auto` policy is locked to: `webp -> avif -> original/jpg`.
5. Format generation policy for raster uploads:
   - store `Original`, `JPG`, `WebP`, `AVIF`.
   - if source has alpha, JPG is still generated using deterministic flattening (document the chosen background rule in API/technical docs).

## Pre-Upload Crop Workflow Plan

Reference: https://valentinh.github.io/react-easy-crop/docs/examples/upload

1. Select image file.
2. Open cropper modal before any upload request.
3. Allow drag + zoom crop controls.
4. Allow optional width and height inputs.
5. Lock crop aspect ratio when width and height are provided.
6. Show cropped preview.
7. Show final output dimensions in preview.
8. Confirm crop.
9. Upload cropped result only after confirmation.
10. Generate/store supported formats (Original/JPG/WebP/AVIF) from the confirmed cropped output.

## Validation Rules

1. Width and height fields are optional.
2. If both are entered:
   - final output uses those exact dimensions.
   - entered values must be less than or equal to original image dimensions.
   - values must be positive integers.
3. If not entered:
   - final output dimensions come from selected crop area.
4. If only one field is entered (width-only or height-only), validation fails.
5. Invalid dimensions block confirmation and upload.

## Data Model and API Planning Changes

1. `generatedSizes` becomes single-key (`original`) for all new media records.
2. Contracts for admin upload/update must carry crop metadata and final dimensions.
3. Media response payloads must expose:
   - original uploaded dimensions
   - crop rectangle metadata
   - final output dimensions
   - URLs for `original`, `jpg`, `webp`, `avif`

### API Payload Examples (Contract Freeze Inputs)

1. Raster upload request (`multipart/form-data`):
   - `file`: binary
   - `crop`: JSON string with `{ x, y, width, height }` in source-image pixels
   - `width`: optional integer
   - `height`: optional integer
   - `title`: optional string
   - `altText`: optional string
2. Replace request uses the same payload shape as upload.
3. Contracted error responses:
   - `400 INVALID_CROP_PAYLOAD`
   - `400 INVALID_DIMENSIONS`
   - `400 DIMENSIONS_EXCEED_SOURCE`
   - `400 WIDTH_HEIGHT_BOTH_REQUIRED`
   - `400 CROP_CONFIRMATION_REQUIRED`
4. SVG/PDF upload does not require crop payload and follows existing non-image flow.

## Frontend Integration Planning Changes

1. Remove all size-driven media URL selection branches.
2. Update shared media helpers and consuming modules to request original-dimension assets only.
3. Keep format selection independent from size logic (no responsive-size mapping).

## Migration and Backward Compatibility Plan

1. Legacy media with old generated sizes remains readable.
2. New uploads stop generating old size variants.
3. Rendering logic ignores legacy size variants and uses original dimensions only.
4. Optional cleanup/backfill of old variant files is tracked as a separate storage-maintenance task.

## Implemented Work Packages

1. Freeze updated API/schema contracts.
2. Implement cropper modal UX + validation states (library, picker, replace flow).
3. Implement processor changes for single-size + multi-format output.
4. Implement frontend resolver cleanup to remove size branching.
5. Prepare migration and QA checklist follow-ups.

## Phase-Wise Implementation Checklist (Gap-Driven)

Use this checklist as the execution order after implementation approval.

### Phase 0: Contract Freeze and Guardrails

- [x] Lock `generatedSizes` policy to `original` only for new writes.
- [x] Freeze accepted format set for image outputs: `original`, `jpg`, `webp`, `avif`.
- [x] Freeze delivery default policy: prefer `webp` for `format=auto` when available.
- [x] Freeze crop API payload shape (`crop`, optional `width`, optional `height`).
- [x] Mark old size names (`thumbnail`, `medium`, `large`, `mobile`, `desktop`) as legacy-read-only.
- [x] Freeze non-raster scope: SVG/PDF bypass crop flow.

### Phase 1: Schema and Settings Realignment

- [x] Update `Media` schema contract docs so new records only persist `generatedSizes.original`.
- [x] Add crop metadata fields plan (`cropX`, `cropY`, `cropWidth`, `cropHeight`, `finalWidth`, `finalHeight`).
- [x] Remove width preset dependency from settings plan (`thumbnail/medium/large/mobile/desktop`).
- [x] Keep only format/process settings needed in new model (`enableWebP`, `enableAVIF`, quality/effort, max upload size).
- [x] Define legacy read strategy for existing records with old generated sizes.
- [x] Define alpha-handling strategy for JPG generation from transparent sources.

### Phase 2: Upload and Replace API Contract Changes

- [x] Update upload contract so crop confirmation data is required before persistence.
- [x] Update replace contract with same crop-first requirement.
- [x] Add dimension validation rules:
  - [x] width/height are optional but must be provided together if one is set.
  - [x] if provided, both must be positive integers.
  - [x] values must be `<=` original image dimensions.
- [x] Reject any server path that accepts direct image upload without crop metadata.
- [x] Update API docs for request/response and error codes.
- [x] Keep explicit bypass contract for SVG/PDF.

### Phase 3: Cropper UX (Admin Library + Picker)

- [x] Add pre-upload crop modal workflow for library upload.
- [x] Add same pre-upload crop modal workflow for picker inline upload.
- [x] Add drag + zoom crop controls.
- [x] Add optional width and height controls.
- [x] Lock crop aspect ratio when both width and height are entered.
- [x] Show preview and final output dimensions before confirm.
- [x] Block upload action until user confirms crop.
- [x] Add clear validation and inline error messaging for invalid dimensions.

### Phase 4: Processing Pipeline and Delivery Logic

- [x] Remove generation loop for `thumbnail/medium/large/mobile/desktop`.
- [x] Keep one cropped master output and generate only format variants from that output.
- [x] Ensure persisted URLs map to `original`, `jpg`, `webp`, `avif` only.
- [x] Update `/media/[id]` and resolver utilities to stop size-key branching.
- [x] Change `format=auto` fallback order to `webp -> avif -> original/jpg`.
- [x] Remove any hard dependency on `generatedSizes.desktop` in optimize/regenerate filters.

### Phase 5: Admin Surface Cleanup

- [x] Remove "Generated sizes" UI entries except `Original`.
- [x] Remove size selectors from media picker (`Desktop/Large/Medium/Mobile/Thumb`).
- [x] Keep only format selector where required (or force `auto` if product decides).
- [x] Remove "Regenerate sizes" action from details drawer/bulk actions/jobs.
- [x] Update media settings page labels to remove responsive width terminology.

### Phase 6: Frontend Consumer Cleanup

- [x] Remove `variant` / `mobileVariant` usage for old size keys in site modules.
- [x] Replace size-based image calls with original-dimension flow.
- [x] Update shared `MediaImage` helper to avoid responsive size srcset generation by size keys.
- [x] Confirm Blog, Events, Sidebar, and site components no longer request `thumbnail|medium|large|mobile|desktop`.
- [x] Validate rendering behavior for both media-route URLs and legacy `/uploads/...` URLs.

### Phase 7: Jobs, Bulk, and Migration

- [x] Remove/rename `regenerate_sizes` job type to new contract (format-only maintenance if needed).
- [x] Update bulk actions to avoid size-regeneration semantics.
- [x] Keep legacy files readable but stop writing new variant-size files.
- [x] Prepare optional cleanup job spec for old variant files (separate, non-blocking).
- [x] Add migration note for existing content references and rollback plan.
- [x] Add compatibility behavior note for legacy `?size=` requests mapping to original.

### Phase 8: QA and Release Gate

- [x] Unit/integration checks for crop validation and upload blocking.
- [x] Automated QA note recorded in `docs/MEDIA_PHASE8_QA_2026-06-18.md`.
- [x] Smoke test library upload, picker upload, replace flow, and delete flow.
- [x] Verify preview always shows final dimensions before upload.
- [x] Verify no new media item contains old size variant outputs.
- [x] Verify frontend pages render correctly with original-only logic.
- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Execute targeted media delivery test script and update expected cases.

## AGENTS.md Compliance Gate (Must Pass Before Build Start)

- [x] All admin media routes call `requireAuth(req)` first.
- [x] All media routes use `connectDB()` from `lib/db.js`.
- [x] Role policy lock:
  - [x] Admin + Editor allowed for non-destructive media operations.
  - [x] Admin-only for settings updates, force delete, and job control.
- [x] Docs sync lock:
  - [x] `docs/API.md` updated with final request/response contracts.
  - [x] `docs/TECHNICAL_DESIGN.md` updated with final schema fields.
- [x] Release lock:
  - [x] `npm run lint` and `npm run build` required.
  - [x] Scripted smoke verification for `/admin/media` APIs, upload/replace/delete, and major public image surfaces via `npm run qa:media-phase8`.

## Current Gap Status (As Of 2026-06-18)

- [x] Multi-size generation removed for new writes; single-size original-only flow is active.
- [x] Upload path blocks raster upload without crop confirmation.
- [x] Crop metadata contract is enforced by admin media APIs.
- [x] Admin UI no longer exposes old size variants.
- [x] Frontend media helpers and primary consumers no longer request legacy size keys.
- [x] Jobs and bulk actions no longer expose regenerate-size behavior.
- [x] Auto format priority is WebP-first.
- [x] `react-easy-crop` dependency is installed and used.

## Migration Note and Rollback Plan

1. Existing content references that use `/media/:id` continue to work with original-only output selection.
2. Existing direct `/uploads/...` references remain readable; the new flow only changes new writes.
3. Legacy `?size=` requests (`thumbnail|medium|large|mobile|desktop`) map to original output selection and do not 404.
4. Rollback path:
   - Deploy previous app build if required.
   - Existing media records remain backward-compatible because legacy URLs are not removed.
   - New records written with `generatedSizes.original` remain readable by both old and new delivery fallback logic.

## Optional Legacy Variant Cleanup Job Spec (Separate Task)

1. Scope: remove orphaned old variant files (`thumbnail|medium|large|mobile|desktop`) only when they are not referenced by any media record field.
2. Safety checks:
   - dry-run mode with output manifest,
   - file-exists verification,
   - storage-key allowlist restricted to media upload roots,
   - batch size and retry limits.
3. Execution:
   - generate candidate list from storage and media DB diff,
   - delete in small batches,
   - log deleted keys and bytes reclaimed.
4. Rollback support:
   - keep a manifest for restore tooling,
   - run after backup snapshot window only.

## Exit Criteria for Future Implementation Phase

1. No upload completes before crop confirmation.
2. No new media item includes `thumb/medium/large/mobile/desktop` outputs.
3. Final preview always shows output dimensions.
4. All image-consuming modules use original dimensions only.
5. WebP is default optimized format while keeping Original/JPG/AVIF available.

