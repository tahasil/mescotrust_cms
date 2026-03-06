# Technical Design Document

Low-level reference for **data models**, **API endpoints**, and **database** usage in the Mesco Trust CMS. For high-level API usage and conventions, see [API.md](./API.md).

---

## 1. Database

- **Engine:** MongoDB
- **Driver / ODM:** Mongoose
- **Connection:** Cached singleton via `lib/db.js`; `connectDB()` used in API routes and server code. URI from `MONGODB_URI` (validated by `lib/env.js`).
- **Collections:** One collection per model (Mongoose default; names are pluralized, e.g. `pages`, `blogs`, `users`).

---

## 2. Data Models (Mongoose Schemas)

All models live under `models/`. Each exports a Mongoose model (reused via `mongoose.models` when present).

### 2.1 Page

**File:** `models/Page.js`  
**Collection:** `pages`

| Field       | Type     | Required | Description |
|------------|----------|----------|-------------|
| title      | String   | yes      | Page title |
| slug       | String   | yes      | Unique, lowercase URL slug |
| status     | String   | no       | `"draft"` \| `"published"` (default: `"draft"`) |
| layout     | [Block]  | no       | Array of layout blocks (see Layout block schema below) |
| meta       | Object   | no       | `metaTitle`, `metaDescription` |
| locale     | String   | no       | Default `"en"`, indexed |
| createdBy  | String   | no       | User identifier |
| updatedBy  | String   | no       | User identifier |
| createdAt  | Date     | auto     | Timestamps |
| updatedAt  | Date     | auto     | Timestamps |

**Indexes:** `{ status: 1 }`

**Layout block (embedded, no `_id`):**

| Field           | Type    | Description |
|----------------|---------|-------------|
| instanceId     | String  | Unique block instance ID |
| componentId    | Mixed   | ObjectId (Component ref) or string (site component ID e.g. `"HeroBanner"`) |
| baseComponent  | String  | Component key in renderer (e.g. `"Paragraph"`, `"Section"`) |
| props          | Mixed   | Instance props (validated against component propsSchema) |
| order          | Number  | Sort order (default 0) |

---

### 2.2 Component

**File:** `models/Component.js`  
**Collection:** `components`

Reusable block definitions used in the page builder (paragraph, heading, section, etc.).

| Field         | Type    | Required | Description |
|--------------|---------|----------|-------------|
| name         | String  | yes      | Internal name |
| displayName  | String  | no       | Label in UI |
| type         | String  | no       | `"system"` \| `"custom"` (default: `"custom"`) |
| category     | String  | no       | Grouping in picker |
| baseComponent| String  | yes      | Key in COMPONENT_MAP (e.g. `"Paragraph"`, `"Section"`) |
| propsSchema  | Mixed   | no       | Array of field descriptors (see API.md Component Props Schema) |
| defaultProps | Mixed   | no       | Default props for new instances |
| layout       | Mixed   | no       | Optional visual-editor layout (same shape as page layout) |
| container    | String  | no       | `"container"` \| `"container-fluid"` (default: `"container"`) |
| active       | Boolean | no       | Default true |
| createdAt    | Date    | auto     | Timestamps |
| updatedAt    | Date    | auto     | Timestamps |

**Indexes:** `{ baseComponent: 1 }`

---

### 2.3 SiteComponentMeta

**File:** `models/SiteComponentMeta.js`  
**Collection:** `sitecomponentmetas`

Metadata for site-level components (Header, Footer, HomeHero, etc.). Component IDs are also listed in `lib/siteComponentRegistry.js` (`SITE_COMPONENT_IDS`).

| Field       | Type   | Required | Description |
|------------|--------|----------|-------------|
| componentId| String | yes      | Unique; matches component file name (e.g. `Header`, `Footer`) |
| displayName| String | no       | Label in admin |
| global     | Boolean| no       | If true, rendered on every page (e.g. header/footer) |
| order      | Number | no       | Render order (lower = first) |
| position   | String | no       | `"before"` \| `"after"` (above/below main content) |
| enabled    | Boolean| no       | If false, hidden from “Add Component” and lists |
| createdAt  | Date   | auto     | Timestamps |
| updatedAt  | Date   | auto     | Timestamps |

**Indexes:** `{ global: 1, position: 1, order: 1 }`

**Where `sitecomponentmetas` is used:**
- **Admin:** `GET/POST /api/admin/site-components` (list/create), `GET/PUT/DELETE /api/admin/site-components/[id]` (get/update/delete meta and files).
- **Public API:** `GET /api/public/site-components` returns `{ before, after }` from this collection (global components in render order).
- **Server (SSR):** `lib/layoutData.js` → `getLayoutData()` reads `SiteComponentMeta` for `globalBefore` / `globalAfter`; the public layout uses this to render global components (no client-side call to the public API).

---

### 2.4 User

**File:** `models/User.js`  
**Collection:** `users`

| Field     | Type   | Required | Description |
|----------|--------|----------|-------------|
| name     | String | yes      | Display name |
| email    | String | yes      | Unique, lowercase |
| password | String | yes      | Hashed; `select: false` by default |
| role     | String | no       | `"Admin"` \| `"Editor"` (default: `"Editor"`) |
| status   | String | no       | `"active"` \| `"inactive"` (default: `"active"`) |
| createdAt| Date   | auto     | Timestamps |
| updatedAt| Date   | auto     | Timestamps |

---

### 2.5 Blog

**File:** `models/Blog.js`  
**Collection:** `blogs`

| Field        | Type     | Required | Description |
|-------------|----------|----------|-------------|
| title       | String   | yes      | Post title |
| slug        | String   | yes      | Unique, lowercase URL slug |
| content     | String   | no       | Body (e.g. HTML/markdown) |
| excerpt     | String   | no       | Short summary |
| featuredImage| String  | no       | Image URL |
| author      | String   | no       | Author name |
| status      | String   | no       | `"draft"` \| `"published"` (default: `"draft"`) |
| publishedAt | Date     | no       | Publication time |
| category    | ObjectId | no       | Ref `BlogCategory` |
| tags        | [String] | no       | Tag strings |
| meta        | Object   | no       | `metaTitle`, `metaDescription` |
| locale      | String   | no       | Default `"en"`, indexed |
| createdBy   | String   | no       | User identifier |
| updatedBy   | String   | no       | User identifier |
| createdAt   | Date     | auto     | Timestamps |
| updatedAt   | Date     | auto     | Timestamps |

**Indexes:** `{ status: 1 }`, `{ publishedAt: -1 }`

---

### 2.6 BlogCategory

**File:** `models/BlogCategory.js`  
**Collection:** `blogcategories`

| Field       | Type   | Required | Description |
|------------|--------|----------|-------------|
| name       | String | yes      | Category name |
| slug       | String | yes      | Unique, lowercase slug |
| description| String | no       | Optional description |
| order      | Number | no       | Sort order (default 0) |
| createdAt  | Date   | auto     | Timestamps |
| updatedAt  | Date   | auto     | Timestamps |

**Indexes:** `{ order: 1 }`

---

### 2.7 Menu

**File:** `models/Menu.js`  
**Collection:** `menus`

| Field   | Type        | Required | Description |
|--------|-------------|----------|-------------|
| name   | String      | yes      | Unique menu name (e.g. `header`, `footer`) |
| items  | [MenuItem]  | no       | Nested menu items (recursive) |
| locale | String      | no       | Default `"en"` |
| createdAt | Date     | auto     | Timestamps |
| updatedAt | Date     | auto     | Timestamps |

**MenuItem (embedded, with `_id`):**

| Field         | Type    | Description |
|--------------|---------|-------------|
| label        | String  | Link text |
| url          | String  | URL or path |
| order        | Number  | Sort order (default 0) |
| openInNewTab | Boolean | Default false |
| type         | String  | `"custom_link"` \| `"page"` |
| pageSlug     | String  | For type `"page"` |
| children     | [MenuItem] | Nested items (recursive) |

---

### 2.8 Media

**File:** `models/Media.js`  
**Collection:** `media`

| Field       | Type   | Required | Description |
|------------|--------|----------|-------------|
| filename   | String | yes      | Stored filename |
| originalName| String| yes      | Original upload name |
| mimeType   | String | yes      | MIME type |
| size       | Number | yes      | Size in bytes |
| url        | String | yes      | Public URL path |
| alt        | String | no       | Alt text |
| width      | Number | no       | Image width (0 if N/A) |
| height     | Number | no       | Image height (0 if N/A) |
| uploadedBy | String | no       | User identifier |
| createdAt  | Date   | auto     | Timestamps |
| updatedAt  | Date   | auto     | Timestamps |

**Indexes:** `{ createdAt: -1 }`

---

### 2.9 ContactSubmission

**File:** `models/ContactSubmission.js`  
**Collection:** `contactsubmissions`

| Field     | Type   | Required | Description |
|----------|--------|----------|-------------|
| payload  | Object | yes      | `name`, `email`, `message` (all required strings) |
| page     | String | no       | Source page |
| source   | String | no       | Source identifier |
| isRead   | Boolean| no       | Default false (admin read state) |
| createdAt| Date   | auto     | Timestamps |
| updatedAt| Date   | auto     | Timestamps |

---

### 2.10 ThemeConfig

**File:** `models/ThemeConfig.js`  
**Collection:** `themeconfigs`

Single-document (or keyed) theme; typically queried by `themeKey: "default"`.

**Sections:**

- **Identity:** `themeKey`, `siteTitle`, `tagline`, `logoType`, `logoLightUrl`, `logoMobileUrl`, `logoDarkUrl`, `logoImageUrl`, `faviconUrl`, `footerCopyrightText`
- **Colors:** `primaryColor`, `secondaryColor`, `bodyBackground`, `sectionBackground`, `cardBackground`, `headerBackground`, `footerBackground`, `headingColor`, `paragraphColor`, `linkColor`, `hoverColor`, `mutedTextColor`, `borderColor`, `dividerColor`, `inputBorderColor`, `colors[]` (name/value), `themePalette` (Mixed)
- **Typography:** `headingFont`, `bodyFont`, `buttonFont`, `baseFontSize`, `h1Size`–`h6Size`, `lineHeight`, `letterSpacing`, font weights, `googleFonts[]` (family + weights), `customFontUrl`; legacy: `fontFamily`, `fontSize`, `headingFontFamily`, etc.
- **Border/Shadow:** `buttonRadius`, `cardRadius`, `inputRadius`, `cardShadow`, `buttonShadow`
- **Header:** `headerLayout` (default/center/split), `headerSticky`, `headerTransparent`, volunteer/donate labels and hrefs, icon URLs, color keys, `megaMenu`, `dropdownStyle`, `mobileMenuStyle`
- **Footer:** `footerLogoUrl`, address/email/phone, column links, `footerBgColorKey`, `footerBackgroundImageUrl`, `footerTextColorKey`, `footerCopyrightBarColorKey`, `footerColumnsCount`, `footerLayoutStyle`, `footerSocialIcons`
- **Hero/Hero banner:** `heroBanner*`, `homeHeroSlides[]` (bgImageUrl, title, description, buttonText, buttonLink, showButton), `homeHeroSlider*`, `homeHeroBackgroundContainer`, `homeHeroContentContainer`
- **Marquee:** `marqueeTitle`, `marqueeItems[]` (url, alt)
- **Subscribe:** `subscribeSubtitle`, `subscribeTitle`, `subscribePlaceholder`, `subscribeButtonText`, `subscribeBgUrl`
- **Buttons:** `buttonBackground`, `buttonTextColor`, `buttonHoverBackground`, `buttonHoverTextColor`, `buttonPadding`
- **Component styles:** `cardStyle`, `alertStyle`, `badgeStyle`, `tableStyle`, `formStyle`, `inputStyle` (enum values)
- **Responsive:** `mobileFontSize`, `mobileSectionSpacing`, `hideSectionOnMobile`
- **Blog theme:** `blogLayout`, `blogSidebarPosition`, `blogFeaturedImageRatio`, `blogMetaStyle`
- **Advanced:** `customCss`, `customJs`, `headScripts`, `footerScripts`, `googleAnalyticsId`
- **Layout/locale:** `layoutWidth`, `defaultLocale`, `direction` (ltr/rtl)

All fields have defaults in the schema; full field list is in `models/ThemeConfig.js`.

---

## 3. API Endpoints Summary

Base URL: `/api`. Auth: public (no auth), admin (JWT via NextAuth + `requireAuth`). See [API.md](./API.md) for path convention and roles.

### 3.1 Public (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/public/pages/[slug]` | Published page by slug |
| GET | `/api/public/blogs` | Published blogs (paginated, filterable) |
| GET | `/api/public/blogs/[slug]` | Published blog by slug |
| GET | `/api/public/blog-categories` | Blog categories |
| GET | `/api/public/menus` | Menu by `name` (e.g. header, footer) |
| GET | `/api/public/search` | Search pages/posts (`q`) |
| GET | `/api/public/site-components` | Global site component IDs (before/after) |
| GET | `/api/theme` | Full theme config |
| GET | `/api/theme/header` | Theme header slice |
| GET | `/api/theme/footer` | Theme footer slice |
| GET | `/api/theme/subscribe` | Theme subscribe slice |
| GET | `/api/theme/home-hero` | Theme home-hero slice |
| GET | `/api/theme/marquee` | Theme marquee slice |
| POST | `/api/contact` | Submit contact form (rate-limited) |
| GET | `/api/health` | Health check (DB) |

### 3.2 Admin (auth required)

| Method | Path | Description |
|--------|------|-------------|
| GET, POST | `/api/admin/pages` | List, create pages |
| GET, PUT, DELETE | `/api/admin/pages/[id]` | Get, update, delete page |
| GET, POST | `/api/admin/blogs` | List, create blogs |
| GET, PUT, DELETE | `/api/admin/blogs/[id]` | Get, update, delete blog |
| GET, POST | `/api/admin/blog-categories` | List, create categories |
| GET, PUT, DELETE | `/api/admin/blog-categories/[id]` | Get, update, delete category |
| GET, POST | `/api/admin/components` | List, create components |
| GET, PUT, DELETE | `/api/admin/components/[id]` | Get, update, delete component |
| GET | `/api/admin/components/[id]/usage` | Count pages using component |
| GET | `/api/admin/components/seed` | POST: seed default components |
| GET | `/api/admin/components/ensure/[base]` | Ensure component exists by baseComponent |
| GET, POST | `/api/admin/site-components` | List, create site components (meta + file/registry) |
| GET, PUT, DELETE | `/api/admin/site-components/[id]` | Get, update, delete site component meta (DELETE also removes file and registry entry) |
| GET, POST | `/api/admin/media` | List, upload media |
| GET, PUT, DELETE | `/api/admin/media/[id]` | Get, update, delete media |
| GET, POST | `/api/admin/menus` | List, create menus |
| GET, PUT, DELETE | `/api/admin/menus/[name]` | Get, update, delete menu by name |
| GET | `/api/admin/contacts` | List contact submissions |
| PATCH, DELETE | `/api/admin/contacts/[id]` | Mark read/update, delete submission |
| GET, POST | `/api/admin/users` | List, create users (Admin only) |
| GET, PUT, DELETE | `/api/admin/users/[id]` | Get, update, delete user (Admin only) |
| GET, POST, DELETE | `/api/admin/fonts` | List, upload, delete custom fonts |
| PUT | `/api/theme` | Update full theme (Admin only) |
| PUT | `/api/theme/header` | Update theme header slice |
| PUT | `/api/theme/footer` | Update theme footer slice |
| PUT | `/api/theme/subscribe` | Update theme subscribe slice |
| PUT | `/api/theme/home-hero` | Update theme home-hero slice |
| PUT | `/api/theme/marquee` | Update theme marquee slice |

### 3.3 Auth

| Path | Description |
|------|-------------|
| `/api/auth/[...nextauth]` | NextAuth handlers (login, session, etc.) |

---

## 4. Key Conventions

- **Layout:** Pages use a **flat** array of blocks; no nested layout tree. Section blocks can store a `props.layout` array for inner blocks; structure is defined in the Component’s schema and validated on save.
- **componentId in layout:** Can be a MongoDB ObjectId (reference to `Component`) or a string site component ID (e.g. `"Header"`, `"HomeHero"`). Resolved at read time for `baseComponent` and props.
- **Site components:** Implemented under `components/site/`; IDs in `lib/siteComponentRegistry.js` (`SITE_COMPONENT_IDS`). Metadata (global, order, position, enabled) in `SiteComponentMeta`. Creating/deleting via admin API also updates registry and component file.
- **Props schema:** Component and site-component edit forms use a shared schema format (see [API.md](./API.md) “Component Props Schema Format”). Site-specific drawer schemas (e.g. Header) live next to the component (e.g. `headerDrawerSchemas.js`).

---

## 5. Maintaining this document

Keep this doc in sync when you change low-level behaviour:

| Change | Update in this doc |
|--------|--------------------|
| **New or changed Mongoose model** | §1 (if DB/connection changes), §2 — add or edit the model table (fields, types, indexes). |
| **New or changed API route** | §3 — add/update the endpoint table (method, path, short description). If behaviour or contracts change, also update [API.md](./API.md). |
| **New collection or index** | §1 (collections list), §2 (model section and indexes). |
| **Layout block shape or validation** | §2.1 (Layout block table), §4 (Key conventions). |
| **Theme config fields** | §2.10 — add new ThemeConfig fields or document new slices. |
| **Site component registry / metadata** | §2.3, §4 (Site components bullet). |

After editing, bump the *Last updated* line at the end of the file.

---

## 6. Related Docs

- [API.md](./API.md) — Path convention, auth, public vs admin, props schema format, layout contract, schema change handling, versioning.
- [SITE_COMPONENTS_STORAGE.md](./SITE_COMPONENTS_STORAGE.md) — Site components storage and registry.
- [COMPONENT_PLATFORM.md](./COMPONENT_PLATFORM.md) — Page builder and component platform.
- [PERMISSIONS.md](./PERMISSIONS.md) — Roles and permissions.

---

*Last updated: 2025-03-06 — models, `app/api/**` routes, `lib/db.js`, `lib/siteComponentRegistry.js`. Update this line when you change the doc.*
