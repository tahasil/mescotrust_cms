# Media Phase 8 QA (2026-06-18)

## Scope

Validation for media optimization rollout:
- original-only size flow
- legacy `size` compatibility mapping
- WebP-first auto delivery policy
- crop-before-upload contract (raster only)

## Automated Checks Executed

1. `npm run lint`  
Result: pass (warnings only, no blocking errors).

2. `npm run build`  
Result: pass.

3. `npm run test:media-delivery`  
Result: pass (6/6 tests).

4. `npm run test:media-crop-contract`  
Result: pass (8/8 tests).

5. `npm run test:media-phase8`  
Result: pass (runs both media test suites together).

6. `npm run qa:media-phase8` (against local `next dev -p 4010`)  
Result: pass.

7. `npm run test:media-ui-contracts`  
Result: pass (3/3 source-level UI contract checks).

## Media Delivery Test Coverage

Validated via `scripts/test-media-delivery.js`:
- legacy size names (`thumbnail|medium|large|mobile|desktop`) resolve to original selection
- explicit `webp/avif` normalization behavior
- `format=auto` fallback order (`webp -> avif -> original/jpg`)
- explicit format fallback stays in original output set

## Crop Contract Test Coverage

Validated via `scripts/test-media-crop-contract.js`:
- raster crop confirmation required
- width/height both-required rule
- invalid dimensions rejection
- valid crop payload parsing
- source-bound crop rectangle validation
- target dimension upper-bound validation
- non-raster bypass for SVG/PDF contract path

## API Smoke Coverage (`qa:media-phase8`)

- Admin-authenticated media upload contract checks:
  - raster upload without crop rejected (`CROP_CONFIRMATION_REQUIRED`)
  - width-only payload rejected (`WIDTH_HEIGHT_BOTH_REQUIRED`)
  - oversize target dims rejected (`DIMENSIONS_EXCEED_SOURCE`)
  - valid raster upload persists original-only generated size metadata
- Raster replace contract checks:
  - replace without crop rejected
  - replace with crop succeeds and final dimensions update
- SVG upload without crop succeeds (non-raster bypass behavior)
- Legacy compatibility check:
  - `/api/media/:id?size=desktop&format=auto` resolves without 404
- Public render smoke:
  - `/`, `/blog`, `/events` return 200 and rendered HTML contains no legacy media size query usage
- API delete flow for created QA media records succeeds (cleanup path)

## UI Contract Coverage (`test:media-ui-contracts`)

- `AdminMediaLibrary` keeps raster crop-before-upload and replace crop prompts wired
- `MediaPickerInput` keeps raster crop modal gating before inline upload
- `RasterCropConfirmModal` keeps final-output dimension rendering and confirm-disable-on-validation-error

## Manual Smoke Checks Pending

1. Optional visual spot-check in browser (non-blocking):
- cropper interaction ergonomics (drag/zoom) in admin library and picker
- visual preview fidelity before confirm
- public page visual rendering quality checks on representative content
