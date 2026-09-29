# Gallery Management Module — Architecture & Implementation Plan

---

## 1. Executive Summary & Core Requirements

The **Gallery Management Module** (`/admin/gallery`) is a dedicated CMS subsystem for creating and managing multiple independent **Image Galleries** and **Video Galleries**, each with its own unique **Shortcode** for embedding across any CMS page via the Page Builder (`ShortCode` component).

### Key Functional Requirements:
1. **Strictly Independent Gallery Types**:
   - Galleries are separated into two distinct types:
     - **Image Gallery** (powered by `PhotoGallery` engine)
     - **Video Gallery** (powered by `Videogallery` engine)
2. **Type-First Creation Flow**:
   - Clicking **"+ Create Gallery"** in Admin opens a modal where the user **must explicitly choose** the **Gallery Type** (`Image Gallery` or `Video Gallery`) alongside Gallery Name and unique Shortcode slug.
   - The selected type determines the data structure, validation, and routes the user directly to the corresponding dedicated editor.
3. **Unique Shortcodes with 1-Click Copy**:
   - Every gallery gets a dedicated shortcode (e.g., `[shortcode="annual-meet-2025"]` or `[shortcode="gallery:annual-meet-2025"]`).
   - The listing table includes a 1-click **Copy Shortcode** button for seamless integration into Page Builder blocks.
4. **Zero Workflow Regression**:
   - Image Gallery editor matches the exact UI and features of `PhotoGallery` (Albums, Category cover photos, multi-image upload, LightGallery lightbox).
   - Video Gallery editor matches the exact UI and features of `Videogallery` (Category tabs, YouTube/embed video IDs, responsive modal video player).
5. **100% Backward Compatibility**:
   - Existing live pages (`/media/image-gallery`, `/media/video-gallery`) and existing page blocks continue to function with zero breaking changes.

---

## 2. Complete Gaps Analysis & Technical Solutions

Following a deep audit of the rendering engine, styled-components layout wrappers, and shortcode parser, the following gaps have been identified and resolved in the architecture:

| # | Identified Gap | Technical Solution & Plan |
|---|---|---|
| **1** | **Double Wrapper / Double Padding in `ShortCode.js`** *(Critical)* | `PhotoGallery` and `Videogallery` already include outer `<FullWidthBackground>` and `<PageContainer>` wrappers. In `ShortCode.js`, galleries are marked as **Passthrough Embeds** (like `Team` and `Subscribe`) so `ShortCode.js` will NOT wrap them in a second container or nested card, preventing broken margins or double padding. |
| **2** | **Shortcode Collision & Precedence** | • Supports both `[shortcode="gallery:<slug>"]` and direct `[shortcode="<slug>"]`.<br>• Explicit resolution hierarchy in `ShortCode.js`: (1) Static Components → (2) Dynamic Gallery → (3) Dynamic Team → (4) Forms.<br>• Uniqueness validation on create/edit. |
| **3** | **Shortcode Rename / Mutation Breaking Live Pages** | When editing an existing gallery, the Shortcode field is locked by default with an "Unlock / Edit Shortcode" toggle and warning prompt ("Changing this shortcode will break pages where this shortcode is currently embedded"). |
| **4** | **Form Field Prefix Mismatch** | • `PhotoGallery` uses `photoGallery*` prefixes; `Videogallery` uses `videogallery*` prefixes.<br>• Implemented bidirectional **Adapter Layer** in the Gallery Editor to seamlessly transform and preserve all configuration tokens, color keys, section styles, items, and tabs. |
| **5** | **Video Link Parsing (URL vs Video ID)** | Added regex-based YouTube auto-parser that normalizes standard links (`youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/embed/...`) as well as raw Video IDs into clean embed IDs automatically on blur. |
| **6** | **Draft / Deleted Fallback & Async Skeletons** | • Loading skeleton during async shortcode fetch to avoid layout shift.<br>• If a gallery is set to `draft` or deleted, public pages handle it silently/gracefully without throwing errors or breaking page layout. |
| **7** | **Legacy Page Invariant** | Retains `components/site/PhotoGallery` and `components/site/Videogallery` in the component registry so existing pages remain 100% functional. |

---

## 3. Creation Workflow & Type Distinction

```
                               ┌─────────────────────────────┐
                               │     Admin Clicks            │
                               │   "+ Create Gallery"        │
                               └──────────────┬──────────────┘
                                              │
                                              ▼
                ┌───────────────────────────────────────────────────────────┐
                │             Create Gallery Modal (Step 1)                 │
                │                                                           │
                │  1. Select Gallery Type: (Mandatory)                     │
                │     ┌──────────────────────┐  ┌────────────────────────┐  │
                │     │  🖼️ Image Gallery     │  │  🎬 Video Gallery       │  │
                │     │  Photo albums with   │  │  Videos with category   │  │
                │     │  covers & lightbox   │  │  tabs & modal player    │  │
                │     └──────────────────────┘  └────────────────────────┘  │
                │                                                           │
                │  2. Gallery Name: [ e.g., Annual Sports Meet 2025 ]       │
                │  3. Unique Shortcode: [shortcode="annual-sports-2025"]    │
                │  4. Description (optional)                                │
                └─────────────────────────────┬─────────────────────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
        [ Chosen: Image Gallery ]                          [ Chosen: Video Gallery ]
                     │                                                 │
                     ▼                                                 ▼
   ┌───────────────────────────────────┐             ┌───────────────────────────────────┐
   │ Routes to Image Editor            │             │ Routes to Video Editor            │
   │ (/admin/gallery/[id]/edit)        │             │ (/admin/gallery/[id]/edit)        │
   │                                   │             │                                   │
   │ • PhotoGallery Form Adapter       │             │ • Videogallery Form Adapter       │
   │ • Category tabs                   │             │ • Category tabs                   │
   │ • Albums with Cover Images        │             │ • Video Items (URL / Video ID)    │
   │ • Multi-photo LightGallery popup  │             │ • Video Modal Player settings     │
   │ • Color & Layout Tokens           │             │ • Color & Layout Tokens           │
   └───────────────────────────────────┘             └───────────────────────────────────┘
```

---

## 4. Gallery Types Comparison & Detailed Specs

| Feature | 1. Image Gallery (`PhotoGallery`) | 2. Video Gallery (`Videogallery`) |
|---|---|---|
| **Public Route Reference** | `http://localhost:3000/media/image-gallery` | `http://localhost:3000/media/video-gallery` |
| **Admin Edit Reference** | `http://localhost:3000/admin/pages/69c3676fae84be222402e2f6` | `http://localhost:3000/admin/pages/69c368aeae84be222402e496` |
| **Component Core** | `components/site/PhotoGallery/PhotoGallery.js` | `components/site/Videogallery/Videogallery.js` |
| **Edit Form Core** | `components/site/PhotoGallery/EditForm.js` | `components/site/Videogallery/EditForm.js` |
| **Item Structure** | Album Cards containing **Cover Image**, Title, Date, Description, and an array of inner photos (`urlDesktop`, `urlMobile`, `alt`). | Video Cards containing Video Title, Category tags, and **Video ID** (YouTube / Embed URL). |
| **Category Representation** | Category tabs with albums having designated cover images. | Category tabs with direct video cards (no separate album cover needed). |
| **Interaction / Viewer** | Clicking an album opens **LightGallery** lightbox (zoom, thumbnails, fullscreen, navigation). | Clicking a video opens the **ThemeModal Video Player** with autoplaying embed. |
| **Shortcode Example** | `[shortcode="alumni-meet-photos"]` | `[shortcode="chairperson-interviews"]` |

---

## 5. Data Model Design (`models/Gallery.js`)

```javascript
import mongoose from "mongoose";

const GalleryImageSchema = new mongoose.Schema({
  urlDesktop: { type: String, default: "" },
  urlMobile: { type: String, default: "" },
  url: { type: String, default: "" },
  alt: { type: String, default: "" },
}, { _id: false });

const GalleryItemSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  date: { type: String, default: "" },
  
  // Image Gallery fields (Album style)
  imageDesktop: { type: String, default: "" },
  imageMobile: { type: String, default: "" },
  image: { type: String, default: "" },
  images: [GalleryImageSchema],
  type: { type: String, enum: ["album", "link"], default: "album" },
  linkType: { type: String, enum: ["internal", "external"], default: "internal" },
  linkUrl: { type: String, default: "" },

  // Video Gallery fields (Video card style)
  videoId: { type: String, default: "" },

  // Categorization (Shared)
  categories: [{ type: String }],
}, { _id: false });

const GallerySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  shortcode: { type: String, required: true, unique: true, lowercase: true, trim: true },
  type: { type: String, enum: ["image", "video"], required: true }, // Chosen during creation
  status: { type: String, enum: ["published", "draft", "archived"], default: "published" },
  description: { type: String, default: "" },

  // Filter tabs configured for this gallery
  tabs: [{ type: String }],

  // Gallery items (Albums for Image Gallery, Videos for Video Gallery)
  items: [GalleryItemSchema],

  // Full props payload storing section styling, typography, colors, limits, view-more links
  config: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, {
  timestamps: true,
  collection: "galleries",
});

GallerySchema.index({ slug: 1 });
GallerySchema.index({ shortcode: 1 });
GallerySchema.index({ type: 1, status: 1 });

export default mongoose.models.Gallery || mongoose.model("Gallery", GallerySchema);
```

---

## 6. Shortcode Resolution & Embedding Architecture

```
┌────────────────────────────────────────────────────────┐
│ Page Builder (Page with ShortCode block)              │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
          [shortcode="gallery-slug"] / [shortcode="gallery:gallery-slug"]
                           │
                           ▼
          Resolution Precedence in ShortCode.js:
          1. Static Site Components
          2. Dynamic Gallery (/api/public/galleries/[slug])
          3. Dynamic Team (/api/public/teams/[slug])
          4. Dynamic Forms (/api/public/forms/...)
                           │
                           ▼
          API: /api/public/galleries/[slug]
                           │
          ┌────────────────┴────────────────┐
          ▼                                 ▼
   Type: "image"                     Type: "video"
   (Passthrough Embed)               (Passthrough Embed)
          ▼                                 ▼
<PhotoGallery {...props} />        <Videogallery {...props} />
```

### Video URL Auto-Extractor Helper
When adding videos in Video Gallery, both raw IDs and full links are accepted and sanitized:
```javascript
export function extractYouTubeVideoId(input) {
  if (!input) return "";
  const trimmed = String(input).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : trimmed;
}
```

---

## 7. Form Field Adapter Specification

To ensure exact parity with existing EditForms without modifying core component contracts:

### Image Gallery Adapter (`photoGallery*` prefixes):
```javascript
function adaptToPhotoGalleryForm(gallery) {
  return {
    photoGallerySubTitle: gallery.config?.photoGallerySubTitle ?? gallery.description ?? "",
    photoGalleryMainTitle: gallery.config?.photoGalleryMainTitle ?? gallery.name ?? "",
    photoGalleryTabs: gallery.tabs?.length ? gallery.tabs : ["All", "Education", "Medical", "Events", "Community"],
    photoGalleryItems: gallery.items?.length ? gallery.items : [],
    ...gallery.config,
  };
}
```

### Video Gallery Adapter (`videogallery*` prefixes):
```javascript
function adaptToVideoGalleryForm(gallery) {
  return {
    videogallerySubTitle: gallery.config?.videogallerySubTitle ?? gallery.description ?? "",
    videogalleryMainTitle: gallery.config?.videogalleryMainTitle ?? gallery.name ?? "",
    videogalleryTabs: gallery.tabs?.length ? gallery.tabs : ["All", "Education", "Medical", "Events", "Community"],
    videogalleryItems: gallery.items?.length ? gallery.items : [],
    ...gallery.config,
  };
}
```

---

## 8. Admin Panel UI & UX Flow

### 1. Sidebar Integration (`components/admin/AdminLayoutClient.js`)
Add a top-level menu item in the Admin navigation:
```javascript
{
  key: "/admin/gallery",
  icon: <PictureOutlined />,
  label: <Link href="/admin/gallery">Gallery</Link>,
}
```

### 2. Gallery Listing Page (`/admin/gallery`)
- **Top Bar**:
  - Search bar (Filter by Name or Shortcode).
  - Type Filter Tabs/Dropdown (`All Galleries`, `Image Galleries`, `Video Galleries`).
  - **"+ Create Gallery"** Button (Primary CTA).
- **Table Columns**:
  1. `#` (Index)
  2. **Gallery Name** & Subtitle
  3. **Type**:
     - `🖼️ Image Gallery` (Blue Tag)
     - `🎬 Video Gallery` (Purple Tag)
  4. **Shortcode**:
     - Tag displaying `[shortcode="slug"]`
     - **Copy Button** (`<CopyOutlined />`) with 1-click clipboard copy and toast notification.
  5. **Items**: Count of items/albums.
  6. **Status**: Switch toggle (`published` / `draft`).
  7. **Last Updated**: Date/Time.
  8. **Actions**:
     - Edit button (`<EditOutlined />` -> `/admin/gallery/[id]/edit`)
     - Delete button (`<DeleteOutlined />` with confirm popconfirm)

### 3. "+ Create Gallery" Modal Dialog
When opened, the modal displays:
1. **Gallery Type (Mandatory)**:
   - Visual selectable cards:
     - Card A: **Image Gallery** (Photos & albums with covers and Lightbox)
     - Card B: **Video Gallery** (Videos with category tabs & modal player)
2. **Gallery Name (Required)**: e.g. `Medical Relief Camp 2025`
3. **Shortcode (Required)**: Auto-slugified from Name (e.g. `medical-relief-camp-2025`), editable.
4. **Description**: Optional text.
- **Action**: "Create & Configure" button -> saves basic record to `POST /api/admin/galleries` and redirects directly to `/admin/gallery/[id]/edit`.

### 4. Dedicated Edit Page (`/admin/gallery/[id]/edit`)
- **Main Canvas (Live Preview)**:
  - Renders the real-time visual preview of the gallery (`PhotoGalleryPreview` or `VideoGalleryPreview`).
  - Allows previewing categories, album cards, lightbox triggers, and modal video embeds directly on the page.
- **Slide-out Settings Drawer**:
  - Clicking **"Edit Gallery"** or **"Open Settings Drawer"** opens a slide-out drawer on the right.
  - Mounts the full configuration form (`PhotoGallery/EditForm.js` for Image Gallery, `Videogallery/EditForm.js` for Video Gallery).
  - Drawer footer includes Cancel and Save buttons.
- **Top Action Bar**:
  - Back to Galleries button, Gallery Name input, Type Tag, Shortcode badge with 1-click copy & unlock warning button, Status select (`published`/`draft`), and Save Changes CTA.
- Saves directly to `PUT /api/admin/galleries/[id]` and instantly refreshes the live preview.

---

## 9. API Architecture

### Admin Endpoints (Authenticated via `requireAuth`)
- `GET /api/admin/galleries` — List galleries (pagination, search, type filter).
- `POST /api/admin/galleries` — Create new gallery with type selection.
- `GET /api/admin/galleries/[id]` — Fetch gallery details and configuration.
- `PUT /api/admin/galleries/[id]` — Update gallery items, tabs, and config.
- `DELETE /api/admin/galleries/[id]` — Delete a gallery.

### Public Endpoint
- `GET /api/public/galleries/[slugOrShortcode]` — Public endpoint consumed by `ShortCode.js` to render galleries on live pages (only returns `published` status).

---

## 10. RBAC Permissions (`lib/rbac/catalog.js`)
Module name: `gallery`
- `admin.gallery.view` — View gallery list and preview.
- `admin.gallery.create` — Create Image/Video galleries.
- `admin.gallery.edit` — Modify gallery items, media, and styles.
- `admin.gallery.delete` — Delete galleries.

---

## 11. Step-by-Step Implementation Checklist (When Approved)

- [ ] **Step 1: Database Model & Indexes**
  - Create `models/Gallery.js` schema with type, unique slug/shortcode, and validation.
- [ ] **Step 2: Admin API Endpoints**
  - Create `/api/admin/galleries/route.js` (GET list, POST create with type selection).
  - Create `/api/admin/galleries/[id]/route.js` (GET detail, PUT update, DELETE).
- [ ] **Step 3: Public API Endpoint**
  - Create `/api/public/galleries/[slug]/route.js` with draft protection.
- [ ] **Step 4: ShortCode Component Integration**
  - Update `components/site/ShortCode/ShortCode.js` with passthrough embed handling (no double wrapper/padding), resolution precedence, and skeleton loader.
- [ ] **Step 5: Admin UI Pages**
  - Build listing page `app/admin/(authenticated)/gallery/page.js` with type filters, create modal, and copyable shortcodes.
  - Build edit page `app/admin/(authenticated)/gallery/[id]/edit/page.js` with Adapter Layer and shortcode rename guard.
- [ ] **Step 6: Sidebar & RBAC Registration**
  - Add Gallery navigation item to `components/admin/AdminLayoutClient.js`.
  - Register permissions in `lib/rbac/catalog.js`.
- [ ] **Step 7: Quality Assurance & Testing**
  - Test creating an Image Gallery (Albums, Cover Images, LightGallery popup).
  - Test creating a Video Gallery (Video IDs, YouTube URLs, Modal Player).
  - Test Page Builder shortcode embedding on live pages (confirming no double padding).
  - Validate draft/delete fallbacks and mobile responsiveness.
