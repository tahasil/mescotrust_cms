# Media Optimization System Plan

Last Rechecked: 2026-04-16

## Scope

Build a custom media management + optimization module for a Next.js + MongoDB CMS (not WordPress plugin) with admin pages:

- Media > Library
- Media > Bulk Optimize
- Media > Settings

---

## 1. Audit + Design Freeze

1. Review current upload flow, `/admin/media` pages, upload APIs, and all image render points (blogs, events, sliders, builder, hero, featured images).
2. Finalize storage approach: originals + generated variants on disk (`/public/uploads/...`) and metadata in MongoDB.
3. Define compatibility plan for existing image URLs.

## 2. Data Layer

1. Add `Media` schema with:
   - `title`
   - `altText`
   - `fileName`
   - `originalUrl`
   - `webpUrl`
   - `avifUrl`
   - `width`
   - `height`
   - `originalSize`
   - `optimizedSize`
   - `savingsPercentage`
   - `generatedSizes`
   - `usedIn` (blog/event/page/slider references)
   - `createdAt`
2. Add `MediaSettings` schema for:
   - compression mode (`lossless`, `glossy`, `lossy`)
   - quality (60/75/85)
   - enable webp/avif/lazy load
   - widths and thumbnail size config
3. Add indexes for list/search/filter.

## 3. Image Processing Engine (Sharp)

1. Build server media service module around Sharp.
2. On upload:
   - save original
   - compress
   - generate WebP + AVIF
   - keep JPG/PNG fallback
   - compute size savings
3. Generate responsive sizes:
   - thumbnail
   - medium
   - large
   - mobile
   - desktop
4. Add replace pipeline to keep stable media reference.

## 4. API Endpoints

1. Media APIs:
   - upload
   - list/search/filter
   - details
   - replace
   - delete
2. Settings APIs:
   - get/update optimization settings
3. Bulk Optimize APIs:
   - optimize old images
   - generate missing formats/sizes
   - progress/status reporting
4. Usage validation API before delete.

## 5. Admin UI

1. Sidebar menu:
   - Media > Library
   - Media > Bulk Optimize
   - Media > Settings
2. Library UI:
   - grid/list
   - preview
   - search/filter
   - dimensions + file size
   - optimized badge
   - actions (copy URL, replace, delete)
3. Bulk Optimize UI:
   - run optimize
   - progress bar
   - success/error/skipped stats
4. Settings UI:
   - compression mode
   - quality
   - enable webp/avif
   - lazy load
   - mobile/desktop widths
   - thumbnail sizes

## 6. Frontend Delivery Layer

1. Add shared image helper/component for optimized rendering strategy.
2. Prefer modern formats with fallback order:
   - AVIF
   - WebP
   - original fallback
3. Integrate with `next/image` where possible:
   - lazy loading
   - responsive sizes
   - blur placeholder
4. Apply to:
   - blogs
   - events
   - events slider
   - page builder sections
   - hero banners
   - featured images

## 7. Usage Tracking

1. Track image usage in blog/event/page-builder/slider entities.
2. Show usage locations in media library.
3. Prevent delete if image is in use (or gate behind force option, if approved).

## 8. Migration + Backfill

1. Add script/job to index existing images into `Media` collection.
2. Bulk-generate missing formats/sizes for old assets.
3. Keep existing URLs working while switching rendering logic.

## 9. Performance + QA

1. Validate improvements on blog/events pages.
2. Check Core Web Vitals and mobile performance impact.
3. Test all flows:
   - upload
   - replace
   - delete
   - bulk optimize
   - settings persistence
4. Ensure resilient error handling and fallback behavior.

## 10. Rollout Phases

1. Phase 1: schema + media service + APIs
2. Phase 2: admin pages (library/settings/bulk optimize)
3. Phase 3: frontend integration + usage tracking
4. Phase 4: migration/backfill + QA + performance tuning

---

## Decision Status

All architecture decisions are finalized and approved.

---

## Confirmed Decisions (Approved)

1. Storage: cloud-storage abstraction now (local first).
2. Replace strategy: stable media URL by Media ID.
3. Bulk optimize execution: background job style.
4. Delete behavior: strict block + force delete override.

---

## Best MongoDB Media Schema Plan

### `Media` collection

- `_id: ObjectId`
- `title: String`
- `altText: String`
- `fileName: String`
- `mimeType: String`
- `ext: String`
- `storageProvider: String` (`local`, `s3`, `r2`, etc.)
- `storageKey: String` (provider file key/path)
- `publicUrl: String` (stable media URL route, e.g. `/media/:id`)
- `originalUrl: String`
- `webpUrl: String`
- `avifUrl: String`
- `width: Number`
- `height: Number`
- `originalSize: Number`
- `optimizedSize: Number`
- `savingsPercentage: Number`
- `hash: String` (dedupe/checksum optional)
- `status: String` (`ready`, `processing`, `failed`)
- `generatedSizes: Object`:
  - `thumbnail: { width, height, jpgUrl, webpUrl, avifUrl, size }`
  - `medium: { ... }`
  - `large: { ... }`
  - `mobile: { ... }`
  - `desktop: { ... }`
- `usedIn: Array<Object>`:
  - `{ type: "blog" | "event" | "page" | "slider" | "component", refId: ObjectId/String, field: String, label: String }`
- `createdBy: ObjectId`
- `updatedBy: ObjectId`
- `createdAt: Date`
- `updatedAt: Date`

Indexes:

- `{ createdAt: -1 }`
- `{ title: "text", fileName: "text", altText: "text" }`
- `{ status: 1 }`
- `{ "usedIn.refId": 1, "usedIn.type": 1 }`

### `MediaSettings` collection (single doc by key)

- `settingsKey: "default"`
- `compressionMode: "lossless" | "glossy" | "lossy"`
- `quality: Number` (60/75/85)
- `enableWebP: Boolean`
- `enableAVIF: Boolean`
- `enableLazyLoad: Boolean`
- `cropMode: "none" | "cover" | "contain"`
- `widths: { thumbnail, medium, large, mobile, desktop }`
- `avifEffort: Number`
- `webpEffort: Number`
- `maxUploadMB: Number`
- `createdAt: Date`
- `updatedAt: Date`

### `MediaJobs` collection (background queue state)

- `jobType: "bulk_optimize" | "regenerate_sizes" | "convert_formats"`
- `status: "queued" | "running" | "completed" | "failed" | "cancelled"`
- `total: Number`
- `processed: Number`
- `success: Number`
- `failed: Number`
- `skipped: Number`
- `errors: Array<{ mediaId, reason }>`
- `startedAt: Date`
- `endedAt: Date`
- `createdBy: ObjectId`
- `createdAt: Date`
- `updatedAt: Date`

---

## Recommended Folder Structure Plan

```txt
app/
  admin/
    (authenticated)/
      media/
        page.js                    # Library
        bulk-optimize/
          page.js
        settings/
          page.js
  api/
    admin/
      media/
        route.js                   # GET(list), POST(upload)
      media/[id]/
        route.js                   # GET(one), PATCH(meta), DELETE
      media/[id]/replace/
        route.js                   # replace media binary but keep stable id/url
      media/usage/
        route.js                   # where-used lookup
      media/settings/
        route.js                   # GET/PUT
      media/jobs/
        route.js                   # create/list jobs
      media/jobs/[jobId]/
        route.js                   # job progress/status
  media/[id]/
    route.js                       # stable delivery endpoint

components/
  admin/
    media/
      MediaLibraryTable.js
      MediaLibraryGrid.js
      MediaUploadDrawer.js
      MediaPreviewModal.js
      MediaReplaceModal.js
      MediaUsageList.js
      BulkOptimizePanel.js
      MediaSettingsForm.js
  shared/
    MediaImage.js                  # unified frontend image rendering helper

lib/
  media/
    processor.js                   # sharp processing pipeline
    variants.js                    # size/format generation helpers
    blur.js                        # blur placeholder generator
    usageTracker.js                # update usedIn refs
    queue.js                       # persistent job queue abstraction
    jobsRunner.js                  # worker logic
  storage/
    index.js                       # adapter selector
    localStorage.js
    s3Storage.js                   # stub-ready

models/
  Media.js
  MediaSettings.js
  MediaJob.js
```

---

## API Plan (Detailed)

### Admin Media APIs

1. `GET /api/admin/media`

- Query: `q`, `page`, `limit`, `status`, `type`, `sort`
- Returns paginated media list with optimization stats.

2. `POST /api/admin/media`

- Multipart upload.
- Creates media record + queues optimization or does immediate first-pass processing.

3. `GET /api/admin/media/[id]`

- Returns single media detail including `usedIn`.

4. `PATCH /api/admin/media/[id]`

- Update metadata: title, altText, tags, etc.

5. `DELETE /api/admin/media/[id]`

- Default strict block if used.
- Optional `force=true` for override delete.

6. `POST /api/admin/media/[id]/replace`

- Replaces source image for same media ID.
- Regenerates variants and updates sizes/savings.

7. `GET /api/admin/media/usage?mediaId=...`

- Returns list of places where media is used.

### Settings APIs

8. `GET /api/admin/media/settings`

- Get optimization settings.

9. `PUT /api/admin/media/settings`

- Update optimization settings.

### Jobs / Bulk Optimize APIs

10. `POST /api/admin/media/jobs`

- Create job: bulk optimize / regenerate / missing format conversion.

11. `GET /api/admin/media/jobs`

- Job history list.

12. `GET /api/admin/media/jobs/[jobId]`

- Live progress and result stats.

13. `POST /api/admin/media/jobs/[jobId]/cancel`

- Cancel running job (best-effort).

### Stable Media Delivery API

14. `GET /media/[id]?size=medium&format=auto`

- Resolves best variant.
- Format priority: AVIF > WebP > fallback.
- Supports responsive size keys.

---

## Pre-Implementation Checkpoints (Must Pass Before Coding)

### A. Product and Scope Sign-off

- [ ] Confirm menu structure:
  - [ ] Media > Library
  - [ ] Media > Bulk Optimize
  - [ ] Media > Settings
- [ ] Confirm rollout mode: phased delivery (Phase 1 to 4).
- [ ] Confirm strict delete block + force delete override UX copy.

### B. Technical Architecture Sign-off

- [x] Confirm storage adapter pattern (local active, cloud-ready abstraction).
- [x] Confirm stable media URL approach (`/media/:id`).
- [x] Confirm background job approach for bulk optimization.
- [x] Confirm Sharp as image processing engine for all variants.

### C. Data and Migration Readiness

- [x] Approve `Media`, `MediaSettings`, `MediaJobs` schemas and indexes.
- [x] Approve backward compatibility strategy for existing URLs.
- [x] Approve migration/backfill plan for old uploads.
- [ ] Confirm dedupe behavior (hash-based optional).

### D. API Contract Freeze

- [x] Approve all admin media endpoints.
- [x] Approve settings endpoints.
- [x] Approve jobs/progress endpoints.
- [x] Approve stable delivery endpoint behavior (AVIF > WebP > fallback).

### E. UI/UX Sign-off

- [ ] Approve media library layout (grid/list + actions).
- [ ] Approve bulk optimize progress and stats UI.
- [ ] Approve settings form controls and defaults.
- [ ] Approve usage warning modal and force delete flow.

### F. Performance and Safety Baseline

- [ ] Define max upload file size.
- [ ] Define allowed mime types.
- [ ] Define quality presets mapping for lossless/glossy/lossy.
- [ ] Define timeout/retry policy for processing failures.
- [ ] Define fallback behavior when optimization fails.

### G. Implementation Gate

- [ ] Dev server restart once before schema work (avoid model cache mismatch).
- [ ] Branch/state check completed.
- [ ] Backup gate ready (`npm run backup-db` + `public/uploads` backup plan confirmed).
- [ ] Baseline capture plan ready (current blog/events payload + load snapshots).
- [ ] Final "Go to implementation" approval from stakeholder.

### H. AGENTS.md Compliance Gate

- [ ] Admin API pattern lock: every admin media route will use `requireAuth(req)` + `connectDB()`.
- [ ] Role matrix lock:
  - [ ] Admin + Editor allowed for media library CRUD (non-destructive).
  - [ ] Admin-only for settings updates, bulk optimize control, and force delete.
- [ ] Documentation sync lock:
  - [ ] `docs/API.md` update included in implementation checklist.
  - [ ] `docs/TECHNICAL_DESIGN.md` schema updates included.
- [ ] Release gate lock:
  - [ ] `npm run lint` and `npm run build` mandatory before completion.
  - [ ] Manual smoke checks mandatory for blog/events/admin media paths.

### Start Implementation Gate (Hard Stop)

- [ ] All required items in sections G + H are marked `[x]`.
- [ ] Stakeholder has explicitly approved implementation start.

---

## Current Implementation Status (As-Is Recheck)

### Completed Already

- Admin `Media` page exists (`/admin/media`) with:
  - upload
  - list/search/pagination
  - edit alt text
  - copy URL
  - delete
- Media APIs exist:
  - `GET/POST /api/admin/media`
  - `GET/PUT/DELETE /api/admin/media/[id]`
- Basic `Media` model exists.

### Partially Done

- Sidebar has top-level `Media` menu, but required sub-routes are not added yet.
- Upload validation exists, but format support and optimization pipeline are not aligned with final architecture.

### Not Started

- Sharp-based optimization service.
- Variant generation (thumbnail/medium/large/mobile/desktop).
- `MediaSettings` and `MediaJobs` models.
- Bulk optimize admin page + job progress APIs.
- Stable media delivery endpoint `/media/[id]`.
- Replace-by-media-id flow.
- Usage tracking + safe delete block/force flow.
- Shared `MediaImage` integration across blogs/events/page-builder.

### Checklist Recheck Summary

- Decision/Architecture checklist: approved where marked `[x]`.
- Pre-implementation gate: pending (dev restart + branch check + final go-ahead).
- Execution checkpoints: all pending (implementation not started yet).

---

## Execution Checkpoints During Implementation

### Checkpoint 1: Foundation

- [ ] Schemas created and validated.
- [ ] Storage adapter wired (local default).
- [ ] Sharp media service basic pipeline working.
- [ ] Model docs updated (`docs/TECHNICAL_DESIGN.md` draft update prepared).

### Checkpoint 2: Admin API

- [ ] Upload/list/detail/update/delete APIs working.
- [ ] Replace API keeps stable media URL.
- [ ] Usage tracking API returns real references.
- [ ] Each admin API route validated for `requireAuth(req)` + `connectDB()` usage.
- [ ] Role restrictions validated (Admin vs Editor paths).

### Checkpoint 3: Admin UI

- [ ] Library page complete with search/filter/actions.
- [ ] Settings page persists and reloads correctly.
- [ ] Bulk optimize page shows live progress.
- [ ] Sidebar submenu structure complete (`Library`, `Bulk Optimize`, `Settings`).
- [ ] Pages exist under `app/admin/(authenticated)/media/...`.

### Checkpoint 4: Delivery Integration

- [ ] `/media/:id` endpoint serving optimized variants.
- [ ] Shared `MediaImage` integrated in blogs/events/sliders/builder.
- [ ] Lazy loading and responsive sizes verified.
- [ ] Backward compatibility for legacy `/uploads/...` references verified.

### Checkpoint 5: Migration and Hardening

- [ ] Old media backfill completed.
- [ ] Missing formats/sizes regenerated.
- [ ] Delete block/force flow validated.
- [ ] Backup/rollback test completed on migration flow.

### Checkpoint 6: QA and Perf

- [ ] No broken image references.
- [ ] Core pages tested on desktop/mobile.
- [ ] Performance benchmark recorded before/after.
- [ ] `npm run lint` passed.
- [ ] `npm run build` passed.
- [ ] `docs/API.md` updated with final endpoint contracts.
- [ ] `docs/TECHNICAL_DESIGN.md` updated with final schemas.

---

## Current Admin Flow Audit and Gap Analysis (Before Implementation)

## What Exists Today (Verified)

1. Admin has a single `Media` page:
   - `app/admin/(authenticated)/media/page.js`
2. Media APIs exist:
   - `app/api/admin/media/route.js`
   - `app/api/admin/media/[id]/route.js`
3. Basic media model exists:
   - `models/Media.js`
4. Current media features:
   - upload
   - list/search/pagination
   - edit alt text
   - copy URL
   - delete
5. Current admin sidebar has only one media item (`/admin/media`), no submenus.

## Major Gaps vs Required ShortPixel-Style System

### 1) Navigation and Admin IA Gaps

- Missing submenu structure:
  - `Media > Library`
  - `Media > Bulk Optimize`
  - `Media > Settings`
- Current has only one route (`/admin/media`).

### 2) Upload and Format Support Gaps

- Current upload only allows:
  - `.webp`
  - `.pdf`
- Missing support for source uploads:
  - JPG/JPEG
  - PNG
  - AVIF (optional input)
- No automatic conversion pipeline on upload.

### 3) Optimization Engine Gaps

- No `sharp` processing in current media API.
- No compression mode (lossless/glossy/lossy).
- No quality setting usage.
- No WebP/AVIF generation from original.
- No fallback variant generation logic.

### 4) Responsive Sizes Gaps

- No generated variants for:
  - thumbnail
  - medium
  - large
  - mobile
  - desktop
- No settings-driven width map.

### 5) Schema/Data Model Gaps

Current `Media` schema is minimal (`filename`, `url`, `size`, `alt`, etc.).

Missing critical fields:

- `title`
- `altText` normalized strategy
- `fileName` normalized strategy
- `originalUrl`
- `webpUrl`
- `avifUrl`
- `originalSize` / `optimizedSize`
- `savingsPercentage`
- `generatedSizes`
- `usedIn`
- `status` / processing states
- provider/key fields for storage abstraction

### 6) Storage Architecture Gaps

- Current implementation is local-only direct write to `/public/uploads`.
- No storage adapter layer.
- No cloud-ready abstraction (`local/s3/r2` switch path).

### 7) Stable URL / Replace Strategy Gaps

- Current usage relies on raw file path URLs (`/uploads/...`).
- No stable media URL endpoint (`/media/:id`).
- No replace endpoint keeping stable reference.

### 8) Usage Tracking and Safe Delete Gaps

- No `usedIn` tracking currently.
- Delete endpoint deletes directly without usage guard.
- No strict block + force delete workflow.

### 9) Bulk Optimization Gaps

- No `/admin/media/bulk-optimize` page.
- No background queue/job system.
- No progress API/job state.
- No regenerate-missing-format/sizes flow.

### 10) Settings Management Gaps

- No `/admin/media/settings` page.
- No persisted media optimization settings model.
- No runtime settings consumed by upload pipeline.

### 11) Frontend Delivery Gaps

- Many frontend surfaces still render raw `<img>` URLs directly.
- No unified media helper for AVIF/WebP/fallback selection.
- `next/image` used only in limited CMS blocks, not across site components.
- No standardized blur placeholder pipeline from media service.

### 12) Content Integration Gaps (Blogs/Events/Builder)

- Blog and Event admin forms mostly use manual URL input fields.
- No media picker/select modal integrated across forms.
- Page-builder "image" props are URL text-driven, not media-entity-driven.

### 13) API/Auth/Validation Hardening Gaps

- Media upload validation currently tied to limited mime/extensions only.
- No optimization failure state tracking per media.
- No background retry policy.
- No API contracts yet for jobs/settings/usage endpoints.

### 14) Performance/Observability Gaps

- No benchmark baseline for image payload savings.
- No metrics for optimization success/failure rates.
- No Core Web Vitals comparison workflow before/after.

---

## Pre-Implementation Risk Notes

1. Existing content references file paths directly (`/uploads/...`), so migration must preserve compatibility.
2. Schema evolution in dev may require server restart to avoid mongoose model cache mismatch.
3. Bulk optimize should be implemented with resumable job states to avoid long-running request failures.

---

## Gap Fix Plan (To Close All Current Gaps Before Main Build)

This section converts each gap into a concrete fix track with clear output and validation.

### Gap Track 1: Admin Navigation IA

Problem:
- Only `/admin/media` exists.

Fix:
- Update sidebar to nested menu:
  - `/admin/media` (Library)
  - `/admin/media/bulk-optimize`
  - `/admin/media/settings`

Definition of Done:
- All three routes accessible from sidebar.
- Active menu highlighting works.
- No duplicate loaders on navigation.

### Gap Track 2: Upload Capability Expansion

Problem:
- Upload currently accepts only `.webp` and `.pdf`.

Fix:
- Expand accepted image inputs: `jpg/jpeg/png/webp/avif`.
- Keep PDF support only if needed for non-image library; otherwise split media types.
- Add mime + extension whitelist centrally.

Definition of Done:
- Admin can upload jpg/png and see processed output.
- Validation errors are clear and consistent.

### Gap Track 3: Sharp Optimization Pipeline

Problem:
- No compression/conversion pipeline.

Fix:
- Build `lib/media/processor.js` using Sharp:
  - read original
  - compress
  - generate webp/avif/fallback
  - compute size savings

Definition of Done:
- New uploads produce optimized variants.
- Metadata stores original vs optimized sizes.

### Gap Track 4: Responsive Variant Generation

Problem:
- No thumbnail/medium/large/mobile/desktop variants.

Fix:
- Add variant generator (`lib/media/variants.js`) based on settings widths.
- Store outputs in `generatedSizes`.

Definition of Done:
- Every uploaded image has configured variant set.
- Missing variants can be regenerated later.

### Gap Track 5: Media Schema Upgrade

Problem:
- Current schema too minimal for optimization system.

Fix:
- Extend `models/Media.js` to full schema (urls, sizes, savings, status, usedIn, provider fields).
- Add indexes for search/status/usage lookups.

Definition of Done:
- New media docs persist all required fields.
- List/search remains performant.

### Gap Track 6: Storage Adapter Layer

Problem:
- Direct local writes, no abstraction.

Fix:
- Introduce `lib/storage/` adapter interface:
  - `localStorage.js` (active)
  - `s3Storage.js` (stub-ready)
  - `index.js` selector

Definition of Done:
- Upload pipeline uses adapter, not direct fs path coupling.
- Provider switch requires config change, not refactor.

### Gap Track 7: Stable Media URL + Replace Strategy

Problem:
- File path URLs are unstable for replacement workflows.

Fix:
- Add stable endpoint `GET /media/[id]`.
- Add replace endpoint `POST /api/admin/media/[id]/replace`.
- Keep old path compatibility during migration.

Definition of Done:
- Replacing file does not break references.
- Existing pages continue rendering.

### Gap Track 8: Usage Tracking + Safe Delete

Problem:
- No usage awareness; delete is unsafe.

Fix:
- Add `usedIn` tracking service (`lib/media/usageTracker.js`).
- Update blog/event/page-builder save flows to sync usage.
- Delete API:
  - default block if used
  - `force=true` override

Definition of Done:
- Library shows usage references.
- Unsafe delete blocked by default.

### Gap Track 9: Bulk Optimize System

Problem:
- No background optimization for legacy images.

Fix:
- Add jobs model + runner:
  - `MediaJob` schema
  - `POST /api/admin/media/jobs`
  - `GET /api/admin/media/jobs/[jobId]`
- Add admin page with progress stats.

Definition of Done:
- Old images can be optimized without request timeout.
- Progress and result counts visible in UI.

### Gap Track 10: Media Settings Module

Problem:
- No persisted optimization settings.

Fix:
- Add `MediaSettings` schema and APIs.
- Build settings page:
  - compression mode
  - quality
  - webp/avif toggles
  - lazy load
  - width presets

Definition of Done:
- Settings save/reload correctly.
- Upload pipeline uses latest settings.

### Gap Track 11: Frontend Rendering Standardization

Problem:
- Many raw `<img>` usages and inconsistent optimization behavior.

Fix:
- Add shared `MediaImage` helper.
- Integrate gradually in:
  - blog list/detail
  - event list/detail/slider
  - hero/featured sections
  - builder components where feasible

Definition of Done:
- Core pages use unified image rendering logic.
- AVIF/WebP fallback chain works.

### Gap Track 12: Admin Form Integration (Picker)

Problem:
- Blog/event/builder image fields are mostly manual URL text boxes.

Fix:
- Add reusable media picker modal for admin forms.
- Support:
  - select existing image
  - upload inline
  - replace
  - copy URL/reference

Definition of Done:
- Editors can choose media without manual URL paste.
- Existing text URL fields remain backward compatible.

### Gap Track 13: API and Validation Hardening

Problem:
- No centralized quality/mode constraints and limited processing error states.

Fix:
- Add central validation utilities:
  - allowed mimes
  - max file size
  - quality bounds
- Add media status transitions:
  - `processing` -> `ready` or `failed`
- Add retry-safe job updates.

Definition of Done:
- Failed processing is visible and recoverable.
- API errors are deterministic and user-readable.

### Gap Track 14: Performance Baseline + Verification

Problem:
- No formal before/after measurement.

Fix:
- Capture baseline for:
  - blog listing/detail payload and render
  - events listing/detail payload and render
- Re-run after integration and store summary.

Definition of Done:
- Documented measurable improvement in image payload/perf.

---

## Priority Order to Implement Gap Fixes

1. Track 5, 6, 3, 4 (data + storage + processor foundation)
2. Track 2, 7, 10 (upload path + stable URL + settings)
3. Track 9, 8 (jobs + usage-safe delete)
4. Track 1, 12 (admin UX flow completion)
5. Track 11, 14, 13 (frontend rollout + perf + hardening)

---

## AGENTS.md Compliance Addendum (Gap Fix)

This addendum aligns implementation with project operating rules from `AGENTS.md`.

### 1. API Security and Permission Policy

- All admin media APIs must:
  - call `requireAuth(req)` first
  - call `connectDB()` via `lib/db.js`
- Role policy:
  - Admin + Editor: media library read/upload/update/replace
  - Admin only: media settings update, bulk optimize run/cancel, force delete
- Middleware-protected admin routes remain under:
  - `app/admin/(authenticated)/...`
  - `app/api/admin/...`

### 2. Route and File Placement Policy

- Admin UI pages will live in:
  - `app/admin/(authenticated)/media/page.js`
  - `app/admin/(authenticated)/media/bulk-optimize/page.js`
  - `app/admin/(authenticated)/media/settings/page.js`
- APIs will follow existing module pattern:
  - `app/api/admin/<resource>/route.js`
  - `app/api/admin/<resource>/[id]/route.js`
- Shared logic must live in `lib/` (not inside route handlers).

### 3. Data Model and Documentation Sync Policy

- New models to add in `models/`:
  - `Media` (extended)
  - `MediaSettings`
  - `MediaJob`
- After model changes, update docs:
  - `docs/TECHNICAL_DESIGN.md` (schema inventory/details)
  - `docs/API.md` (endpoint contracts)

### 4. Backup and Migration Safety Policy

- Before migration/backfill or destructive media operations:
  - run `npm run backup-db`
  - back up `public/uploads/`
- Backfill scripts should live under `scripts/` and be idempotent.

### 5. Validation and Release Gates

- Mandatory checks before merge/release:
  - `npm run lint`
  - `npm run build`
  - manual smoke tests:
    - admin media upload/edit/delete/replace
    - bulk optimize lifecycle
    - blog/events rendering and detail pages
    - page builder image rendering

### 6. Implementation Pattern Constraints

- Reuse existing app conventions:
  - no bypass of `requireAuth`
  - no direct DB connection logic outside `connectDB()`
  - keep admin CRUD patterns similar to other modules
- Keep backward compatibility for existing `/uploads/...` references during rollout.

### 7. Completion Criteria Update

Media optimization feature is considered complete only when:
- functional checklist is complete
- AGENTS compliance checks above are complete
- docs (`TECHNICAL_DESIGN`, `API`, `media-optimization-plan`) are updated together
- sanity checks (`lint`, `build`, smoke tests) pass
