# Common Media Plan (Single Source of Truth)

Last Rechecked: 2026-06-18
Status: Planning only. No implementation started.

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

## Planned Work Packages (No Code Yet)

1. Freeze updated API/schema contracts.
2. Design and approve cropper modal UX and validation states.
3. Design processor changes for single-size + multi-format output.
4. Design frontend resolver cleanup to remove size branching.
5. Prepare migration and QA checklist.

## Phase-Wise Implementation Checklist (Gap-Driven)

Use this checklist as the execution order after implementation approval.

### Phase 0: Contract Freeze and Guardrails

- [ ] Lock `generatedSizes` policy to `original` only for new writes.
- [ ] Freeze accepted format set for image outputs: `original`, `jpg`, `webp`, `avif`.
- [ ] Freeze delivery default policy: prefer `webp` for `format=auto` when available.
- [ ] Freeze crop API payload shape (`crop`, optional `width`, optional `height`).
- [ ] Mark old size names (`thumbnail`, `medium`, `large`, `mobile`, `desktop`) as legacy-read-only.
- [ ] Freeze non-raster scope: SVG/PDF bypass crop flow.

### Phase 1: Schema and Settings Realignment

- [ ] Update `Media` schema contract docs so new records only persist `generatedSizes.original`.
- [ ] Add crop metadata fields plan (`cropX`, `cropY`, `cropWidth`, `cropHeight`, `finalWidth`, `finalHeight`).
- [ ] Remove width preset dependency from settings plan (`thumbnail/medium/large/mobile/desktop`).
- [ ] Keep only format/process settings needed in new model (`enableWebP`, `enableAVIF`, quality/effort, max upload size).
- [ ] Define legacy read strategy for existing records with old generated sizes.
- [ ] Define alpha-handling strategy for JPG generation from transparent sources.

### Phase 2: Upload and Replace API Contract Changes

- [ ] Update upload contract so crop confirmation data is required before persistence.
- [ ] Update replace contract with same crop-first requirement.
- [ ] Add dimension validation rules:
  - [ ] width/height are optional but must be provided together if one is set.
  - [ ] if provided, both must be positive integers.
  - [ ] values must be `<=` original image dimensions.
- [ ] Reject any server path that accepts direct image upload without crop metadata.
- [ ] Update API docs for request/response and error codes.
- [ ] Keep explicit bypass contract for SVG/PDF.

### Phase 3: Cropper UX (Admin Library + Picker)

- [ ] Add pre-upload crop modal workflow for library upload.
- [ ] Add same pre-upload crop modal workflow for picker inline upload.
- [ ] Add drag + zoom crop controls.
- [ ] Add optional width and height controls.
- [ ] Lock crop aspect ratio when both width and height are entered.
- [ ] Show preview and final output dimensions before confirm.
- [ ] Block upload action until user confirms crop.
- [ ] Add clear validation and inline error messaging for invalid dimensions.

### Phase 4: Processing Pipeline and Delivery Logic

- [ ] Remove generation loop for `thumbnail/medium/large/mobile/desktop`.
- [ ] Keep one cropped master output and generate only format variants from that output.
- [ ] Ensure persisted URLs map to `original`, `jpg`, `webp`, `avif` only.
- [ ] Update `/media/[id]` and resolver utilities to stop size-key branching.
- [ ] Change `format=auto` fallback order to `webp -> avif -> original/jpg`.
- [ ] Remove any hard dependency on `generatedSizes.desktop` in optimize/regenerate filters.

### Phase 5: Admin Surface Cleanup

- [ ] Remove "Generated sizes" UI entries except `Original`.
- [ ] Remove size selectors from media picker (`Desktop/Large/Medium/Mobile/Thumb`).
- [ ] Keep only format selector where required (or force `auto` if product decides).
- [ ] Remove "Regenerate sizes" action from details drawer/bulk actions/jobs.
- [ ] Update media settings page labels to remove responsive width terminology.

### Phase 6: Frontend Consumer Cleanup

- [ ] Remove `variant` / `mobileVariant` usage for old size keys in site modules.
- [ ] Replace size-based image calls with original-dimension flow.
- [ ] Update shared `MediaImage` helper to avoid responsive size srcset generation by size keys.
- [ ] Confirm Blog, Events, Sidebar, and site components no longer request `thumbnail|medium|large|mobile|desktop`.
- [ ] Validate rendering behavior for both media-route URLs and legacy `/uploads/...` URLs.

### Phase 7: Jobs, Bulk, and Migration

- [ ] Remove/rename `regenerate_sizes` job type to new contract (format-only maintenance if needed).
- [ ] Update bulk actions to avoid size-regeneration semantics.
- [ ] Keep legacy files readable but stop writing new variant-size files.
- [ ] Prepare optional cleanup job spec for old variant files (separate, non-blocking).
- [ ] Add migration note for existing content references and rollback plan.
- [ ] Add compatibility behavior note for legacy `?size=` requests mapping to original.

### Phase 8: QA and Release Gate

- [ ] Unit/integration checks for crop validation and upload blocking.
- [ ] Smoke test library upload, picker upload, replace flow, and delete flow.
- [ ] Verify preview always shows final dimensions before upload.
- [ ] Verify no new media item contains old size variant outputs.
- [ ] Verify frontend pages render correctly with original-only logic.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Execute targeted media delivery test script and update expected cases.

## AGENTS.md Compliance Gate (Must Pass Before Build Start)

- [ ] All admin media routes call `requireAuth(req)` first.
- [ ] All media routes use `connectDB()` from `lib/db.js`.
- [ ] Role policy lock:
  - [ ] Admin + Editor allowed for non-destructive media operations.
  - [ ] Admin-only for settings updates, force delete, and job control.
- [ ] Docs sync lock:
  - [ ] `docs/API.md` updated with final request/response contracts.
  - [ ] `docs/TECHNICAL_DESIGN.md` updated with final schema fields.
- [ ] Release lock:
  - [ ] `npm run lint` and `npm run build` required.
  - [ ] Manual smoke verification for `/admin/media`, upload/replace, and major public image surfaces.

## Current Gap Status (As Of 2026-06-18)

- [ ] Multi-size generation still active in schema + processor + delivery.
- [ ] Upload path still allows direct upload without crop confirmation.
- [ ] Crop metadata contract is not enforced by admin media APIs.
- [ ] Admin UI still shows and uses old size variants.
- [ ] Frontend still requests old size variants in multiple routes/components.
- [ ] Jobs and bulk actions still include regenerate-size behavior.
- [ ] Auto format priority is AVIF-first, not WebP-first.
- [ ] `react-easy-crop` dependency is not yet added.

## Exit Criteria for Future Implementation Phase

1. No upload completes before crop confirmation.
2. No new media item includes `thumb/medium/large/mobile/desktop` outputs.
3. Final preview always shows output dimensions.
4. All image-consuming modules use original dimensions only.
5. WebP is default optimized format while keeping Original/JPG/AVIF available.
