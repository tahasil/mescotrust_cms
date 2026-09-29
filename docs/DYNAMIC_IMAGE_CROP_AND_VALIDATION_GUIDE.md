# Dynamic Image Crop & Validation Guide

Guide for engineers working with media uploads, raster image cropping, dimension validations, and component edit forms in `mescotrust_cms`.

---

## 1. Overview & Problem Statement

In the CMS admin panel (Page Builder `/admin/pages/[id]`, Component Editor `/admin/components/[id]/edit`, Blogs, Events, Popups, etc.), each site component enforces specific pixel dimension requirements for its images (e.g., `OverviewOfOurWork` requires `700 × 550 px`, `VideoPlaying` requires `2164 × 1200 px`, `Cards` requires `210 × 170 px`, etc.).

Previously, when an admin clicked **"Replace / Choose"** and uploaded a new image, the **"Crop image before upload"** modal defaulted to an unconfigured 80% freeform crop box (e.g. `460 × 288 px`), resulting in failed form validations upon upload.

### The Solution

A dynamic crop configuration pipeline now connects each component's required image dimensions directly to the crop modal:
1. When uploading an image from any component or admin field, the **"Crop image before upload"** modal automatically pre-fills the **Output settings** (Width and Height) with the exact required dimensions.
2. The cropper aspect ratio is automatically locked to the required ratio.
3. The resulting cropped canvas is generated at the exact target dimensions before uploading to MongoDB/Server.
4. Form validation passes seamlessly without errors.

---

## 2. Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│ Component EditForm (e.g. OverviewOfOurWork/EditForm)  │
│  - cropWidth={700}                                     │
│  - cropHeight={550}                                    │
│  - hintText="Required size: 700 X 550 px"              │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ components/admin/media/MediaPickerInput.js             │
│  - Reads explicit cropWidth / cropHeight               │
│  - Fallback: extracts dimensions from hintText         │
│  - Enqueues crop with resolved dimensions              │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ components/admin/media/RasterCropConfirmModal.js       │
│  - Initializes widthInput & heightInput to target size │
│  - Sets Cropper aspect ratio (targetWidth/targetHeight)│
│  - Renders preset buttons for multi-size components    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Cropped Image Upload (Exact Target Resolution)         │
│  - Canvas rendered with imageSmoothingQuality: "high" │
│  - Pass form validation seamlessly ✅                  │
└────────────────────────────────────────────────────────┘
```

---

## 3. Core Media Components Reference

### A. `MediaPickerInput.js` (`components/admin/media/MediaPickerInput.js`)

Accepts dynamic crop configuration props and forwards them to the raster crop flow:

```jsx
<MediaPickerInput
  value={value}
  onChange={onChange}
  uiVariant="stacked"
  cropWidth={700}
  cropHeight={550}
  allowedSizes={[
    { width: 700, height: 550 },
    { width: 580, height: 704 },
  ]}
  minWidth={210}
  minHeight={170}
  hintText="Required size: 700 X 550 px"
/>
```

#### Supported Props for Cropping:
- `cropWidth` *(number)*: Target crop output width in pixels.
- `cropHeight` *(number)*: Target crop output height in pixels.
- `targetWidth` / `targetHeight` *(number)*: Alternative aliases for target dimensions.
- `aspectRatio` *(number)*: Optional aspect ratio constraint (defaults to `cropWidth / cropHeight`).
- `minWidth` / `minHeight` *(number)*: Optional minimum dimension constraints.
- `allowedSizes` *(Array<{width, height}>)*: List of permitted dimension presets (renders quick-select buttons in crop modal).
- `hintText` *(string)*: Informational text. **Smart Fallback**: If explicit `cropWidth`/`cropHeight` are omitted, `MediaPickerInput` automatically parses dimension patterns (e.g. `"700 X 550"`, `"2164 × 1200"`, `"Min Width 210 and Min Height 170"`) directly from `hintText`.

---

### B. `RasterCropConfirmModal.js` (`components/admin/media/RasterCropConfirmModal.js`)

Renders the interactive crop modal (`react-cropper`):
- Initializes `widthInput` and `heightInput` to `targetWidth` and `targetHeight`.
- Automatically locks cropper aspect ratio to `targetWidth / targetHeight`.
- Renders allowed size preset buttons when `allowedSizes` is provided.
- Allows user to click **"Use crop area size"** for freeform crop or **"Reset to required"** to restore target dimensions.
- Generates high-quality canvas blob at target dimensions on confirmation.

---

## 4. Complete Component & Field Inventory

| Component / Module | File Path | Field Name | Required / Recommended Size |
| :--- | :--- | :--- | :--- |
| **OverviewOfOurWork** | `components/site/OverviewOfOurWork/EditForm.js` | `bgImageUrlDesktop`<br>`icon` | **`700 × 550 px`** (Legacy: 580×704)<br>`48 × 48 px` (Min: 32×32) |
| **VideoPlaying** | `components/site/VideoPlaying/EditForm.js` | `coverImageDesktop` | **`2164 × 1200 px`** |
| **Cards** | `components/site/Cards/EditForm.js` | `imageDesktop`<br>`imageMobile` | **Min `210 × 170 px`** |
| **HomeHero** | `components/site/HomeHero/EditForm.js` | `bgImageUrlDesktop` (Slide) | **`2560 × 1200 px`** |
| **HomeHero2** | `components/site/HomeHero2/EditForm.js` | Section Background<br>`desktopSrc` (Slide) | **`1440 × 620 px`**<br>**`350 × 450 px`** |
| **StoriesSlider** | `components/site/StoriesSlider/EditForm.js` | `image` (Story Slide) | **`800 × 415 px`** |
| **VolunteerMesco** | `components/site/VolunteerMesco/EditForm.js` | `volunteerMescoImage` | **`1200 × 900 px`** |
| **ImpactShowcase** | `components/site/ImpactShowcase/EditForm.js` | `impactShowcaseImageDesktop` | **`1200 × 1400 px`** |
| **Helpingpeople** | `components/site/Helpingpeople/EditForm.js` | `helpingpeopleImageDesktop` | **`600 × 400 px`** or **`600 × 600 px`** |
| **ManagingCommittee** | `components/site/ManagingCommittee/EditForm.js` | `managingCommitteeImageDesktop` | **`600 × 400 px`** or **`600 × 650 px`** |
| **CommitteeMembers** | `components/site/CommitteeMembers/EditForm.js` | `imageDesktop` | **`290 × 400 px`** |
| **Accordion** | `components/site/Accordion/EditForm.js` | `imageDesktop`<br>`imageMobile` | **`600 × 400 px`** |
| **Vision** | `components/site/Vision/EditForm.js` | `visionImageDesktop` | **`550 × 450 px`** |
| **Mission** | `components/site/Mission/EditForm.js` | `missionImageDesktop` | **`550 × 450 px`** |
| **PhotoGallery** | `components/site/PhotoGallery/EditForm.js` | `imageDesktop` (Cover) | **`446 × 334 px`** (4:3 ratio) |
| **Images** | `components/site/Images/EditForm.js` | `imageUrlDesktop` | **`1240 × 480 px`** |
| **ImageSlider** | `components/site/ImageSlider/EditForm.js` | `desktopSrc` (Slide) | **`350 × 450 px`** |
| **OverlayCards** | `components/site/OverlayCards/EditForm.js` | `bgImageDesktop` | **`395 × 220 px`** |
| **Reports** | `components/site/Reports/EditForm.js` | `imageDesktop` | **`348 × 200 px`** |
| **Marquee** | `components/site/Marquee/EditForm.js` | `urlDesktop` | **`190 × 154 px`** |
| **WelcometoMESCO** | `components/site/WelcometoMESCO/EditForm.js` | Legacy Background | **`1042 × 1164 px`** |
| **ManageSectionFields** | `components/admin/ManageSectionFields.js` | `SectionBgImage` (Shared) | **`1440 × 620 px`** |
| **Popups** | `components/admin/Popups/PopupSettingsForm.js` | `imageUrl` | **`600 × 600 px`** |
| **Blogs** | `app/admin/(authenticated)/blogs/new` & `[id]` | `featuredImage` | **`1200 × 1000 px`** |
| **Events** | `app/admin/(authenticated)/events/new` & `[id]` | `featuredImageDesktop` | **`800 × 400 px`** |

---

## 5. Developer Guide: Adding Crop Validation to a New Component

When creating a new site component or adding an image field to an existing component:

1. **Define Dimension Constants**:
   ```javascript
   const REQUIRED_IMAGE_WIDTH = 800;
   const REQUIRED_IMAGE_HEIGHT = 500;
   const REQUIRED_IMAGE_TEXT = `${REQUIRED_IMAGE_WIDTH} × ${REQUIRED_IMAGE_HEIGHT} px`;
   ```

2. **Add Validation Function**:
   ```javascript
   async function validateImageDimensions(_, value) {
     const url = String(value || "").trim();
     if (!url) return Promise.resolve();
     const { width, height } = await getImageDimensions(url);
     if (width === REQUIRED_IMAGE_WIDTH && height === REQUIRED_IMAGE_HEIGHT) {
       return Promise.resolve();
     }
     return Promise.reject(new Error(`Image must be exactly ${REQUIRED_IMAGE_TEXT}. Selected: ${width} × ${height} px.`));
   }
   ```

3. **Pass Crop Props to `MediaPickerInput`**:
   ```jsx
   <Form.Item
     name="myImage"
     label="Desktop Image"
     validateTrigger={["onChange", "onBlur"]}
     rules={[{ validator: validateImageDimensions }]}
   >
     <MediaPickerInput
       uiVariant="stacked"
       cropWidth={REQUIRED_IMAGE_WIDTH}
       cropHeight={REQUIRED_IMAGE_HEIGHT}
       hintText={`Required size: ${REQUIRED_IMAGE_TEXT}`}
     />
   </Form.Item>
   ```

---

## 6. Verification & Contract Testing

To verify that all media picker and raster crop contracts remain compliant:

```bash
node scripts/test-media-ui-contracts.js
```

Expected output:
```
ok 1 - AdminMediaLibrary keeps raster crop-before-upload and replace contracts
ok 2 - MediaPickerInput enforces raster crop-before-upload with modal flow
ok 3 - RasterCropConfirmModal exposes final dimensions and blocks invalid confirm
ok 4 - MediaPickerInput supports dynamic crop dimensions and hintText parser
```
