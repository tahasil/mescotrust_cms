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
| payload  | Object | yes      | `name` (req), `email` (req), `phone`, `subject`, `message` (req) |
| page     | String | no       | Source page |
| source   | String | no       | Source identifier |
| isRead   | Boolean| no       | Default false (admin read state) |
| createdAt| Date   | auto     | Timestamps |
| updatedAt| Date   | auto     | Timestamps |

---

### 2.11 Donation

**File:** `models/Donation.js`
**Collection:** `donations`

| Field          | Type   | Required | Description |
|---------------|--------|----------|-------------|
| orderId       | String | yes      | Unique order ID (generated: `DON_<timestamp>_<random>`) |
| amount        | Number | yes      | Donation amount in INR |
| currency      | String | no       | Default `"INR"` |
| purpose       | String | no       | Purpose of donation (from dropdown) |
| zakat         | String | no       | `"Yes"` \| `"No"` |
| note          | String | no       | Donor's note |
| donor         | Object | yes      | Donor details (see below) |
| payment       | Object | no       | Payment gateway response (see below) |
| status        | String | no       | `"pending"` \| `"success"` \| `"failed"` \| `"aborted"` (default: `"pending"`) |
| createdAt     | Date   | auto     | Timestamps |
| updatedAt     | Date   | auto     | Timestamps |

**donor (embedded):**

| Field    | Type   | Required | Description |
|---------|--------|----------|-------------|
| name    | String | yes      | Full name |
| email   | String | yes      | Email address |
| mobile  | String | yes      | Mobile number |
| pan     | String | no       | PAN number |
| address | String | no       | Address |
| city    | String | no       | City |
| state   | String | no       | State |
| country | String | no       | Country |
| pincode | String | no       | Pincode |

**payment (embedded):**

| Field       | Type   | Description |
|------------|--------|-------------|
| trackingId | String | CCAvenue tracking ID |
| bankRefNo  | String | Bank reference number |
| paymentMode| String | Card/NetBanking/Wallet/UPI |
| cardName   | String | Card type (VISA/MC etc.) |
| statusCode | String | CCAvenue status code |
| statusMsg  | String | CCAvenue status message |

**Indexes:** `{ orderId: 1 }`, `{ status: 1 }`, `{ "donor.email": 1 }`, `{ createdAt: -1 }`

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
| POST | `/api/payment/initiate` | Create donation order, encrypt & return CCAvenue form data |
| POST | `/api/payment/callback` | CCAvenue posts encrypted response here after payment |
| GET | `/api/payment/donor-lookup` | Auto-fill: lookup previous donor by email or mobile |
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
| GET | `/api/admin/donations` | List donations (paginated, filterable by status) |
| GET | `/api/admin/donations/[id]` | Get single donation details |
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

## 4. CCAvenue Donation Payment Flow

### 4.1 Environment Variables

```bash
CCAVENUE_MERCHANT_ID=        # From CCAvenue M.A.R.S → Settings → API Keys
CCAVENUE_ACCESS_CODE=        # Uppercase alphanumeric
CCAVENUE_WORKING_KEY=        # Uppercase alphanumeric (for AES encryption)
CCAVENUE_GATEWAY_URL=https://test.ccavenue.com/transaction/transaction.do  # Test
# CCAVENUE_GATEWAY_URL=https://secure.ccavenue.com/transaction/transaction.do  # Production
```

### 4.2 Payment Flow

```
1. USER FILLS FORM (DonateNow site component)
   ├─ Selects donation package OR enters custom amount
   ├─ Fills donor details (name, email, mobile, PAN, address, etc.)
   ├─ Selects Zakat (Yes/No) and Purpose of Donation
   └─ Clicks "Donate Now"

2. INITIATE (POST /api/payment/initiate)
   ├─ Validates required fields (amount, name, email, mobile)
   ├─ Generates unique orderId: DON_<timestamp>_<random>
   ├─ Saves Donation to DB with status: "pending"
   ├─ Builds CCAvenue request string (key=value pairs joined by &)
   ├─ Encrypts request using AES-128-CBC with MD5(working_key) as key
   └─ Returns { encRequest, accessCode, gatewayUrl } to frontend

3. REDIRECT TO CCAVENUE (Frontend)
   ├─ Creates hidden <form> with encRequest + access_code
   ├─ form.action = CCAVENUE_GATEWAY_URL (command=initiateTransaction)
   ├─ Auto-submits form → user lands on CCAvenue payment page
   └─ User completes payment (card/netbanking/wallet/UPI)

4. CALLBACK (POST /api/payment/callback)
   ├─ CCAvenue POSTs encrypted response (encResp)
   ├─ Decrypt response using AES-128-CBC with same working_key
   ├─ Parse key=value pairs from decrypted string
   ├─ Extract: order_id, order_status, tracking_id, bank_ref_no, payment_mode
   ├─ Find Donation by orderId, update:
   │   ├─ status: "success" | "failed" | "aborted"
   │   └─ payment: { trackingId, bankRefNo, paymentMode, cardName, statusCode, statusMsg }
   └─ Redirect user to /donation/success or /donation/failed

5. QR CODE OPTION ("Donate Now with QR")
   ├─ Shows UPI QR code image (uploaded via Media Library, URL in drawer)
   └─ User scans QR → pays via UPI app (manual reconciliation)
```

### 4.3 Encryption / Decryption

CCAvenue uses **AES-128-CBC** encryption:
- **Key**: MD5 hash of `CCAVENUE_WORKING_KEY` (produces 16 bytes)
- **IV**: First 16 bytes of the key (or provided by CCAvenue)
- **Encrypt**: `crypto.createCipheriv('aes-128-cbc', md5Key, iv)` → hex output
- **Decrypt**: `crypto.createDecipheriv('aes-128-cbc', md5Key, iv)` → plaintext

Utility file: `lib/ccavenue.js` — exports `encrypt(data, workingKey)` and `decrypt(data, workingKey)`.

### 4.4 Auto-fill Donor Lookup

`GET /api/payment/donor-lookup?q=<email_or_mobile>`
- Searches `donations` collection for latest successful donation matching email or mobile
- Returns donor details (name, email, mobile, PAN, address, city, state, country, pincode)
- Used by the "Email / Mobile No." field at top of form to pre-fill fields

### 4.5 Site Component: DonateNow

Managed from Page Builder drawer (same pattern as ContactUs):
- **Manage Section** — backgrounds, padding, margins
- **Title & Colors** — section title, subtitle, colors for headings, button bg/text
- **Donation Packages** — sortable list of { amount, description } items (left panel)
- **Form Settings** — Purpose of Donation options (comma-separated), QR code image URL
- **Contact/Address** — optional info displayed alongside form

### 4.6 Admin: /admin/donations

- Table view of all donations: orderId, donor name, email, amount, status, date
- Filter by status (pending/success/failed/aborted)
- Search by name/email
- View button → modal with full donation + payment details

---

## 5. Key Conventions

- **Layout:** Pages use a **flat** array of blocks; no nested layout tree. Section blocks can store a `props.layout` array for inner blocks; structure is defined in the Component’s schema and validated on save.
- **componentId in layout:** Can be a MongoDB ObjectId (reference to `Component`) or a string site component ID (e.g. `"Header"`, `"HomeHero"`). Resolved at read time for `baseComponent` and props.
- **Site components:** Implemented under `components/site/`; IDs in `lib/siteComponentRegistry.js` (`SITE_COMPONENT_IDS`). Metadata (global, order, position, enabled) in `SiteComponentMeta`. Creating/deleting via admin API also updates registry and component file.
- **New site components:** Jab bhi naya site component add karein, **exact same pattern** follow karein jaise LatestEvents1 / HomeHero / Subscribe — 3-file folder, EditForm (load/save API), `EDITABLE_SITE_EDIT_FORMS` entry, aur admin edit page me snapshot + preview + refetch. Full checklist: [NEW_SITE_COMPONENT_CHECKLIST.md](./NEW_SITE_COMPONENT_CHECKLIST.md).
- **Props schema:** Component and site-component edit forms use a shared schema format (see [API.md](./API.md) “Component Props Schema Format”). Site-specific drawer schemas (e.g. Header) live next to the component (e.g. `headerDrawerSchemas.js`).

---

## 6. Maintaining this document

Keep this doc in sync when you change low-level behaviour:

| Change | Update in this doc |
|--------|--------------------|
| **New or changed Mongoose model** | §1 (if DB/connection changes), §2 — add or edit the model table (fields, types, indexes). |
| **New or changed API route** | §3 — add/update the endpoint table (method, path, short description). If behaviour or contracts change, also update [API.md](./API.md). |
| **New collection or index** | §1 (collections list), §2 (model section and indexes). |
| **Layout block shape or validation** | §2.1 (Layout block table), §4 (Key conventions). |
| **Theme config fields** | §2.10 — add new ThemeConfig fields or document new slices. |
| **Site component registry / metadata** | §2.3, §4 (Site components bullet). |
| **New site component add karna** | [NEW_SITE_COMPONENT_CHECKLIST.md](./NEW_SITE_COMPONENT_CHECKLIST.md) follow karein; §4 (New site components bullet); edit page me snapshot + preview + refetch add karein. |

After editing, bump the *Last updated* line at the end of the file.

---

## 7. Related Docs

- [API.md](./API.md) — Path convention, auth, public vs admin, props schema format, layout contract, schema change handling, versioning.
- [SITE_COMPONENTS_STORAGE.md](./SITE_COMPONENTS_STORAGE.md) — Site components storage and registry.
- [NEW_SITE_COMPONENT_CHECKLIST.md](./NEW_SITE_COMPONENT_CHECKLIST.md) — **New site component create karte waqt follow karne wale steps** (LatestEvents1 jaisa structure + edit flow).
- [COMPONENT_PLATFORM.md](./COMPONENT_PLATFORM.md) — Page builder and component platform.
- [PERMISSIONS.md](./PERMISSIONS.md) — Roles and permissions.

---

*Last updated: 2026-03-30 — added Donation model (§2.11), CCAvenue payment flow (§4), payment API endpoints (§3), updated ContactSubmission payload fields (§2.9). Update this line when you change the doc.*
