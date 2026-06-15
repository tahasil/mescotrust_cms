# Media Crop + Manual Resolution Plan

## Goal
Add Shopify/WordPress-style image controls to Mesco Trust CMS with:
1. Admin crop controls
2. Manual width/height controls
3. Dynamic media delivery via `/media/:id` transformations
4. Backward compatibility for existing media URLs

## Baseline (Already Present)
The project already has:
1. `Media` model and media metadata
2. Stable delivery route `/media/[id]`
3. Sharp-based optimization pipeline
4. Admin media library + picker + settings + bulk jobs
5. Shared frontend image helper `components/shared/MediaImage.js`

This plan extends current architecture, not a full rewrite.

## Core Decisions
1. Use meta-storage strategy: keep original file unchanged, store crop/resolution metadata in DB.
2. Apply transform order on delivery: crop first, then resize, then format conversion.
3. Keep old links working (`/uploads/...` and existing `/media/:id?...` URLs).
4. Enforce strict guardrails for width/height and crop bounds to avoid abuse.

## Phase 1 (2-3 Days): Data + API Contract
Focus: schema and admin metadata APIs.

### Work Items
1. Extend `models/Media.js` with crop and manual resolution fields.
2. Update `PUT /api/admin/media/[id]` to accept and validate:
   - crop coordinates
   - aspect ratio metadata
   - manual width/height
3. Add normalization and bounds validation utilities for crop/size payloads.
4. Update docs contracts:
   - `docs/TECHNICAL_DESIGN.md`
   - `docs/API.md`

### Deliverables
1. Schema fields finalized and backward compatible.
2. Admin metadata update API accepts crop/size settings safely.
3. Documentation reflects new request/response contracts.

### Exit Criteria
1. API rejects invalid crop bounds and invalid dimensions.
2. Existing media flows continue working unchanged.
3. Lint passes for touched files.

## Phase 2 (3-4 Days): Dynamic Delivery Engine
Focus: runtime image transformations on `/media/[id]`.

### Work Items
1. Upgrade `app/api/media/[id]/route.js` to support query params:
   - `w`, `h`
   - crop-aware delivery from stored metadata
   - existing format behavior (`auto`, `webp`, `avif`, `jpg`)
2. Update media URL helpers in:
   - `lib/media/url.js`
   - `lib/media/delivery.js`
3. Add hard limits for transform sizes and safe fallbacks.
4. Extend `scripts/test-media-delivery.js` with crop/resize scenarios.

### Deliverables
1. On-the-fly transform pipeline with stable output behavior.
2. URL builder support for new transform parameters.
3. Test coverage for key delivery paths and fallbacks.

### Exit Criteria
1. `/media/:id` serves expected output for crop + size + format combinations.
2. No regression in existing size variant behavior.
3. Test script for media delivery passes locally.

## Phase 3 (4-5 Days): Admin UX + Picker + Frontend Integration + QA
Focus: editor usability and rollout to rendering surfaces.

### Work Items
1. Add crop + manual size UI in media details drawer:
   - `components/admin/media/MediaDetailsDrawer.js`
   - `components/admin/media/AdminMediaLibrary.js`
2. Add crop/size controls in picker selection flow:
   - `components/admin/media/MediaPickerInput.js`
3. Integrate cropper dependency (for admin-only UX).
4. Ensure `components/shared/MediaImage.js` handles new URL patterns.
5. Roll out to prioritized components using media picker/image URLs.
6. Run validation gates:
   - `npm run lint`
   - `npm run build`
   - smoke tests for admin + public pages

### Deliverables
1. Admin can crop visually and set manual dimensions.
2. Picker can emit transformed media URLs consistently.
3. Public rendering consumes transformed URLs without regressions.

### Exit Criteria
1. End-to-end flow works:
   - upload/select image
   - crop/save
   - render on site with expected dimensions/format fallback
2. No broken image regressions on key pages.
3. Build and lint succeed.

## Overall Timeline
1. Phase 1: 2-3 days
2. Phase 2: 3-4 days
3. Phase 3: 4-5 days

Estimated total: 9-12 working days.

## Risks and Controls
1. Risk: image transform abuse via large dimensions.
   Control: strict max width/height and invalid param rejection.
2. Risk: crop metadata conflicts with old URLs.
   Control: default behavior remains unchanged when crop params are absent.
3. Risk: editor confusion between global media crop and per-use crop.
   Control: define one policy explicitly before implementation and document it.

## Pre-Implementation Gate
1. Confirm policy: global crop metadata vs per-usage override metadata.
2. Confirm max dimension limits and default resize fit behavior.
3. Run backup gate before rollout:
   - `npm run backup-db`
   - backup `public/uploads/`
