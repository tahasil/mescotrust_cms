# Next.js CMS Platform with Ant Design (antd)

## Complete Architecture & Implementation Plan

**Table of contents** — 1 Overview & Goals | 2 Tech Stack | 3 Folder Structure | 4 Database | 5 User & Role | 6 Page Management | 7 Menu | 8 Header & Footer | 9 Component System | 10 Visual Builder | 11 JSON Rendering | 12 Theme | 13 Media | 14 SEO | 15 404 & Preview | 16 Data Flow & API | 17 Version History | 18 Scheduling | 19 Caching | 20 Bootstrap & Env | 21 Blogs | 22 Contact | 23 Error & Loading | 24 Security | 25 Redirects | 26 Dashboard | 27 Roadmap | 28 Architecture Flow | 29 Checklist | 30 API Reference

------------------------------------------------------------------------

# 1. Project Overview

This project is a dynamic CMS platform built inside a Next.js App Router
application.

## Goals

**Content & pages**

-   `/` → Public frontend renderer (home page or slug-based pages)
-   Admin-managed pages: create, set slug, publish or drop (draft)
-   One designated home page served at `/` (or optional slug e.g. `/home`)
-   JSON-based dynamic page rendering
-   **Blogs** — posts with slug, title, content (rich text), excerpt, featuredImage, author, category, tags, status; categories/tags CRUD; public `/blog` and `/blog/[slug]`; sitemap includes blog
-   **Slug rules** — reserved slugs, validation, uniqueness; frontend data flow: page by slug via API or server query; reserved: `admin`, `blog`, `contact`, `search`, `api`, `preview` (and app routes)

**Builder & components**

-   **Full drag–drop page builder** — all elements (sections, blocks, nested items) have drag–drop behaviour; add from library, reorder, move anywhere on the canvas
-   Theme management system; component registry system
-   **Components folder** — admin layout in `admin/`, system in `system/`, page-builder in `builder/`. Admin can **generate new component code** from schema (e.g. propsSchema); generated components added to components folder and registered. Admin layout and component code not editable in UI.
-   **Header and footer** — components under components folder; admin updates only **config** (logo, menu, text) via site settings
-   **Modals and overlays per page** — modals, dialogs, announcement bars, floating CTAs (with trigger and styles)
-   **Contact** — **embeddable form component** (place on any CMS page via builder); optional dedicated `/contact` page

**Users & security**

-   **User and role management** — users and roles; access control; **last-admin guard**; optional invite flow; permission matrix in README or docs
-   **Security and rate limiting** — rate limiting on contact POST and public search; same-origin/CSRF; security headers (CSP, X-Frame-Options, X-Content-Type-Options)

**SEO, performance & operations**

-   **SEO** — per-page/post meta, Open Graph, Twitter card, canonical; sitemap (pages + blog); robots.txt
-   **404 and preview** — 404 for unknown/dropped slugs (optional custom 404 page); draft preview for admin
-   **Version history** — revisions per page; list, compare, restore
-   **Scheduling** (optional) — publish/unpublish at date/time; scheduler job documented
-   **Caching and performance** — cache page JSON (ISR); media delivery; invalidate on publish/drop
-   **Media Manager** — upload (local or S3), folders/tags, resize, alt text; **validation**: formats, max size, max dimensions; media picker by id/URL
-   **Bootstrap, health, env** — initial admin via seed or env (ADMIN_EMAIL, ADMIN_PASSWORD); `GET /api/health` (200/503); validate required env at startup (fail-fast); **MONGODB_URI** and NEXTAUTH_*; document in README
-   **Reserved paths and API convention** — public API e.g. `/api/public/pages`, `/api/public/blogs`; document
-   **Theme and fonts** — font sources (import e.g. Google Fonts, custom upload .woff2); typography; optional RTL
-   **Error and loading UX** — `error.js`, `loading.js`; 5xx page
-   **Redirects** — 301 when slug changes or page removed; admin list; redirect precedence documented
-   **Admin dashboard** — `/admin` shows summary counts (pages, posts, contacts) and links to sections
-   Scalable enterprise-ready architecture

------------------------------------------------------------------------

# 2. Tech Stack

-   Next.js (App Router)
-   TypeScript
-   Mongoose (MongoDB ODM)
-   MongoDB
-   **NextAuth** — authentication for admin (login, session); protects `/admin` and admin APIs; use with App Router.
-   **Ant Design (antd)** — UI component library for **all** admin and builder elements: admin layout (Layout, Header, Sider), forms, tables, modals, buttons, inputs, and builder UI (component library panel, properties panel, etc.). Use antd consistently across the admin area; public frontend can use antd or custom/Tailwind components.
-   Tailwind CSS
-   Radix UI (optional; can rely on antd for most components)
-   dnd-kit (Drag & Drop)
-   **slugify** — URL slug generation and validation
-   **Email** — Resend or nodemailer for contact form and optional password reset; configure via env (e.g. RESEND_API_KEY, or SMTP_*)

**Environment variables** — Document in README and `.env.example`. **Required (validate at startup, fail-fast if missing):** **`MONGODB_URI`** (MongoDB connection), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. **Contact/email:** `EMAIL_FROM`, `EMAIL_TO`, and either `RESEND_API_KEY` or SMTP vars. **Optional:** `NEXT_PUBLIC_SITE_URL` (sitemap, canonicals), reCAPTCHA keys. Bootstrap: `ADMIN_EMAIL`, `ADMIN_PASSWORD` for seed/first-run. Use **MONGODB_URI** consistently (not DATABASE_URL) in plan and config.

------------------------------------------------------------------------

# 3. Folder Structure

    src/
     ├── app/
     │   ├── (frontend)/
     │   │   ├── layout.tsx
     │   │   ├── page.tsx
     │   │   ├── [slug]/page.tsx
     │   │   ├── blog/
     │   │   │   ├── page.tsx
     │   │   │   └── [slug]/page.tsx
     │   │   └── contact/   (optional dedicated /contact page; primary: embeddable form component on any CMS page)
     │   │
     │   │
     │   ├── (admin)/admin/
     │   │   ├── layout.tsx
     │   │   ├── page.tsx
     │   │   ├── pages/
     │   │   ├── components/   (admin UI: component registry for page builder + header/footer config only; layout/code not editable)
     │   │   ├── theme/
     │   │   ├── menu/
     │   │   ├── media/
     │   │   ├── users/
     │   │   ├── roles/
     │   │   ├── blogs/
     │   │   ├── contacts/   (contact submissions list)
     │   │   └── redirects/  (optional)
     │   │
     │   └── api/
     │
     ├── components/           (all components live here)
     │   ├── ui/               (antd components and any shared primitives)
     │   ├── system/           (Header, Footer, MegaMenu — frontend layout; not editable from admin)
     │   ├── builder/          (frontend page-builder components; when admin creates new component for page builder, add here)
     │   ├── admin/            (admin layout components — sidebar, shell, etc.; not editable from admin)
     │   └── renderer/
     │
     ├── lib/
     ├── services/
     ├── schemas/
     ├── types/
     └── utils/

------------------------------------------------------------------------

# 4. Database Design (MongoDB)

Data is stored in MongoDB. Mongoose is used as the ODM. Core collections (document shapes):

## Users

-   id
-   name
-   email
-   password (hashed)
-   roleId (FK → Role)
-   status (`active` | `inactive` | `suspended`)
-   createdAt
-   updatedAt

## Roles

-   id
-   name (e.g. `super_admin`, `editor`, `author`, `viewer`)
-   slug (unique)
-   description (optional)
-   permissions (array of permission keys, e.g. `pages:write`, `media:read`, `users:manage`)
-   createdAt
-   updatedAt

## Pages

-   id
-   title
-   slug (unique, admin-managed; e.g. `home`, `about`, `contact`)
-   status (`draft` | `published` | dropped/unpublished)
-   isHomePage (boolean) — when true, this page is served at `/` on frontend
-   seoTitle
-   seoDescription
-   seoOpenGraphImage (optional URL or mediaId)
-   seoCanonicalUrl (optional)
-   publishedAt (optional) — for scheduling: when to publish
-   unpublishedAt (optional) — when to drop/unpublish

**Slug & routing rules**

-   Admin defines slug per page (e.g. home → `home`, about → `about`). Slugs are **validated**: lowercase, hyphens, no spaces; **unique** per page.
-   **Reserved slugs** cannot be used: `admin`, `blog`, `contact`, `search`, `api`, `preview`, `_next`, `login`, `auth`, and any app route. Use explicit routes for these (e.g. `app/blog/...`, `app/contact/...`) so `[slug]` only handles non-reserved paths. Validate on create/update.
-   The page with `isHomePage = true` is rendered at **`/`** on the frontend (single home page).
-   Other published pages are rendered at **`/[slug]`** (e.g. `/about`, `/contact`).
-   Optional: allow home page to also be reachable at `/home` via slug; root `/` still shows the same content.
-   Only **published** pages are visible on the frontend; **draft** or **dropped** pages are admin-only. Unknown or dropped slug → frontend shows **404** (see Section 15).

## PageContent

-   id
-   pageId (FK)
-   contentJSON
-   version (increment on save; used for version history)

## Revisions (optional; for version history)

-   id
-   pageId (FK)
-   contentJSON (snapshot)
-   version (number)
-   createdAt
-   createdBy (userId, optional)

Save a revision on each save (or on "Save revision"); admin can list, compare, and restore to a revision.

## Components

-   id
-   name
-   slug
-   category
-   schemaJSON (includes optional style/className fields for admin-editable styles and reusable classes)
-   isSystemComponent (true for Header, Footer, MegaMenu; false for builder components)

Component **code** lives in **`src/components/`** — system in `system/`, builder in `builder/`, **admin layout** in `admin/`. **Admin layout** and **component code** are **not editable from admin** (fixed in code). When admin creates a new component for the **frontend page builder**, a new file is added under the components folder (e.g. `builder/`) and registered in the DB.

## ThemeSettings

-   id
-   primaryColor
-   secondaryColor
-   headingFont
-   bodyFont
-   borderRadius
-   **Font sources** — (1) import font families (e.g. Google Fonts catalog — pick, load via link or npm), (2) custom upload fonts (upload .woff2/.woff/.ttf; store in media/fonts; register as font-family)
-   **Typography** — sizes for body/headings, line height, letter spacing, font weights (optional)

## SiteSettings (or extend ThemeSettings)

-   **Header** — logoUrl, menuId (which menu to show), optional tagline/cta text, sticky (boolean)
-   **Footer** — menuId (optional footer menu), copyright text, social links (optional), columns/links (optional JSON)
-   **SEO / site** — robots.txt content or config (allow/deny); optional default og image
-   **404** — custom404PageId (optional; CMS page to show as 404) or use default 404 component

## Menus

-   id
-   name
-   location (e.g. `header`, `footer`)
-   type (`normal` | `mega`) — normal = dropdown with nested submenus; mega = mega menu panel with columns/links

## MenuItems

-   id
-   menuId
-   label
-   url (or page slug / external link)
-   openInNewTab (boolean, optional)
-   parentId (null = top-level; set to another item id for nested submenu)
-   order (sort order within same level)
-   type (`normal` | `mega`) — only relevant when menu type is mega (e.g. column header vs link)
-   children — resolved from parentId for nested submenu (normal menu) or mega columns (mega menu)

## Media

-   id
-   fileName
-   fileUrl (local path or S3/cloud URL)
-   fileType
-   altText
-   folder (optional) or tags (optional array) — for organization in Media Manager
-   size (optional), width/height (optional for images) — for listing and resize/optimization
-   uploadedAt, uploadedBy (optional)

**Validation rules** — Allowed image formats: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`. Max file size (e.g. 5MB); max dimensions (reject or auto-resize oversize uploads). Enforce on upload.

## BlogPost

-   id
-   slug (unique among posts)
-   title
-   content (rich text / HTML or structured)
-   excerpt (optional)
-   featuredImageId (FK → Media, optional)
-   authorId (FK → User, optional) or author (string)
-   categoryId (FK → Category, optional)
-   tags (array of strings, or FK to Tag model)
-   status (`draft` | `published`)
-   publishedAt (optional)
-   metaTitle, metaDescription (SEO)
-   createdAt, updatedAt

## Category (blog)

-   id
-   name
-   slug (unique)
-   description (optional)
-   order (optional)

## ContactSubmission

-   id
-   payload (e.g. name, email, message; or JSON)
-   formId or source (optional)
-   isRead (boolean)
-   createdAt

## Redirect (301)

-   id
-   fromPath (e.g. old slug or full path)
-   toPath (new URL or slug)
-   statusCode (301)
-   createdAt

------------------------------------------------------------------------

# 5. User and Role Management

## Overview

Admins can create and manage users and assign roles. Access to the admin area is restricted to authenticated users; actions can be limited by role and permissions.

## User management

-   **List users** — view all users (name, email, role, status)
-   **Create user** — invite or create user (name, email, password); assign role
-   **Edit user** — change name, email, role, status (active/inactive/suspended)
-   **Delete or deactivate user** — remove or disable access
-   **Password reset** — admin-triggered or self-service (optional)

## Role management

-   **List roles** — view all roles and their permissions
-   **Create role** — define name, slug, description; set permissions (e.g. `pages:read`, `pages:write`, `media:read`, `media:write`, `users:read`, `users:manage`, `theme:manage`, `menu:manage`)
-   **Edit role** — change name, description, or permission set
-   **Delete role** — remove role (users with that role must be reassigned or blocked)

## Permissions (examples)

-   `pages:read` / `pages:write` — view or edit pages
-   `media:read` / `media:write` — view or upload/delete media
-   `users:read` / `users:manage` — view users or create/edit/delete users and roles
-   `theme:manage` — change theme settings
-   `menu:manage` — edit menus
-   `header_footer:manage` — update header and footer settings
-   `components:manage` — manage component registry (optional)

## Access control

-   **Admin routes** (`/admin/*`) — require authentication; optionally check role or permissions per route or action
-   **API routes** — protect CMS APIs with session/auth and permission checks
-   **Super admin** — one role (e.g. `super_admin`) has all permissions and can manage roles and users
-   **Last-admin guard** — prevent removing or demoting the last Admin (block delete/demote if only one admin remains)
-   **Invite flow** (optional) — invite user by email with link to set password; token validation
-   **Permission matrix** — document in README or `docs/PERMISSIONS.md`: route/action → required role or permission

------------------------------------------------------------------------

# 6. Admin Page Management (Create, Slug, Publish / Drop)

## Page lifecycle

1. **Create** — Admin creates a page (title, slug, content via builder). When creating or editing a page, admin can add:
    - **Sections** — main content (Hero, Card, etc.) in the page flow.
    - **Modals / dialogs** — overlay popups for that page (e.g. newsletter signup, promo, cookie notice); each modal has content, trigger (on load, on click, exit intent), and styles.
    - **Other page-level elements** — e.g. floating CTA, sticky bar, announcement banner, lightbox; same drag–drop and config as sections.
2. **Slug** — Admin sets a URL slug (e.g. `home`, `about`, `contact`). Slugs are unique and used for frontend routes.
3. **Publish or drop** — Admin can:
    - **Publish** — Page is visible on the frontend at its route.
    - **Drop** — Page is taken off the frontend (draft/unpublished); still editable in admin.
4. **Home page** — Admin can mark one page as the frontend home. That page is served at **`/`**. Other pages use **`/[slug]`** (e.g. `/about`).

## Frontend routing summary

| Admin slug | isHomePage | Frontend URL      |
|------------|------------|-------------------|
| `home`     | true       | `/` (and optionally `/home`) |
| `about`    | false      | `/about`          |
| `contact`  | false      | `/contact`        |

Only **published** pages are rendered on the frontend; draft/dropped pages are admin-only.

------------------------------------------------------------------------

# 7. Menu Management (Normal Menu & Mega Menu, Nested Submenu)

## Overview

Admin can create and manage **multiple menus** (e.g. header, footer). Each menu is either a **normal menu** (with nested submenus) or a **mega menu** (large dropdown panel with columns/links). Both support drag-and-drop for reordering and nesting.

## Normal menu (with nested submenu)

-   **Top-level items** — links at the root (e.g. Home, About, Services).
-   **Nested submenu** — any item can have children via `parentId`; admin adds sub-items and optionally deeper levels (multi-level dropdown).
-   **Reorder** — drag items to change order; drag onto another item to make it a child (nested submenu).
-   **Edit** — label, url (or page slug), **open in new tab** (openInNewTab, optional).

## Mega menu

-   **Mega menu panel** — one top-level item opens a large panel (e.g. "Products") with multiple columns or blocks.
-   **Columns / groups** — admin defines column headers and links inside each column; structure is still stored as menu items with `parentId` and `order`.
-   **Reorder** — drag columns and links; same drag–drop behaviour as normal menu for consistency.

## Admin UI (menu management)

-   **List menus** — by location (e.g. header, footer); show type (normal vs mega).
-   **Create / edit menu** — set name, location, type (normal | mega).
-   **Manage items** — add, edit, delete items; set label, url, parent (for nesting); reorder by drag–drop; for mega menu, organize items into columns/groups.
-   **Preview** — optional preview of how the menu renders on the frontend.

## Summary

| Menu type   | Behaviour |
|------------|-----------|
| **Normal** | Dropdown with nested submenu (multi-level); `parentId` + `order` for hierarchy. |
| **Mega**   | Large panel with columns/links; same item model, different frontend rendering. |

------------------------------------------------------------------------

# 8. Header & Footer Management

## Overview

**Header** and **Footer** are **components** under **`src/components/system/`**. They are **not editable from admin** (component code is fixed). Admin can update only their **configuration** (logo, menu, text, etc.) via site settings; the frontend layout imports these components and passes config from SiteSettings.

## Header (admin can update)

-   **Logo** — upload or set logo URL; optional second logo for dark/light
-   **Menu** — choose which menu to display in the header (e.g. main nav from Menu management)
-   **Tagline / CTA** — optional text or button (e.g. "Contact us")
-   **Sticky** — option to keep header fixed on scroll (boolean)
-   **Style** — optional link to theme or reusable class for header bar

## Footer (admin can update)

-   **Logo** — optional logo in footer
-   **Menu** — optional footer menu (from Menu management)
-   **Copyright text** — e.g. "© 2025 Company Name"
-   **Social links** — optional links (icons + URLs)
-   **Columns / blocks** — optional footer columns or link groups (e.g. "Products", "Support", "Company"); stored as structured data or simple HTML/JSON

## Admin UI

-   Header and Footer are **components** under **`src/components/system/`**; they are **not editable from admin** (code is in the components folder). They read **config** from **SiteSettings**.
-   Admin edits **header/footer config only** via a site-settings (or "Header & Footer") section in admin — form or panel to edit logo, menu, text, etc.; preview. No UI to edit the component code or structure.
-   Data stored in **SiteSettings**; frontend layout imports Header and Footer from the components folder and passes that config.

------------------------------------------------------------------------

# 9. Component System Architecture

## Two Types of Components

### System Components (live under `src/components/system/`)

-   **Header** — component in the components folder; config (logo, menu, tagline, sticky) stored in SiteSettings; component reads it. **Component itself is not editable from admin** (code lives in components folder).
-   **Footer** — component in the components folder; config (logo, menu, copyright, social links) in SiteSettings. **Component itself is not editable from admin**.
-   **MegaMenu** — component in the components folder; rendered from menu data. **Not editable from admin** (structure/code is fixed).

**Admin layout** (sidebar, shell, nav) lives under **`src/components/admin/`**. Admin layout and these system components are **not editable from admin** — no UI to change their structure or code; only config (e.g. header/footer settings) is editable where exposed.

**Per-page modals and overlays** — When building a page, admin can add **modals** (Dialog), **popups**, **announcement bars**, **floating CTAs**, and similar overlay elements. These are configured per page (content, trigger, styles) and rendered on the frontend for that page only.

### Builder Components (live under `src/components/builder/`)

**Component creation:** Admin can **generate new component code** from schema (e.g. define propsSchema and defaultProps in admin; system generates or scaffolds a component file and adds it to the components folder, e.g. `src/components/builder/MyComponent.tsx`). Generated components are then registered in the DB. **Component code is not hand-editable from admin UI** — only usage (add to page, props, styles) is configurable in the builder; schema-driven generation produces the code.

-   Hero
-   Card
-   Accordion
-   Tabs
-   Alert
-   Badge
-   Tooltip
-   Dialog
-   Carousel
-   Datepicker
-   Combobox
-   Drawer
-   Progress
-   Skeleton
-   Dropdown
-   Breadcrumb

Admin can: - Add components (via drag from library) — including **modals**, **dialogs**, **announcement bars**, **floating CTAs**, and other overlay elements to any page - **Drag & drop every element** — reorder sections, move blocks, nest components; add and reorder modals/overlays per page - Edit content - Duplicate sections - **Change styles** (colors, spacing, typography) - **Assign reusable CSS classes** per component or element

Admin cannot: - **Edit admin layout or component code** — admin layout (components under `components/admin/`) and system/builder component code are not editable from admin; they live in the components folder and are fixed in code. - Change the fact that header is at top and footer at bottom (layout structure) - Modify core system layout logic

**Drag–drop everywhere** — All elements in the builder have drag-and-drop behaviour: sections, blocks, and (where supported) inner elements. Admins drag from the component library onto the canvas and reorder or move any element by dragging within the canvas.

**Styled preview in admin** — Components in the builder are rendered as real UI elements with styles (not wireframes or placeholders), so admins see exactly how they look and can edit styles or reusable classes in context.

------------------------------------------------------------------------

# 10. Visual Builder Architecture

Layout:

| Component Library \| Live Canvas \| Properties Panel \|

### Component Library

-   Search
-   Categories
-   **Drag items** — every component is draggable into the canvas (source for drop)

### Live Canvas

-   **All elements are drag–drop** — Every section, block, and (where applicable) nested element is draggable and has a drop target. Admins can: drag components from the library onto the page; reorder by dragging elements up/down; move elements between containers; drop into explicit drop zones.
-   **Sections + modals/overlays** — Page content includes main **sections** (flow) and a separate area or list for **modals** and **overlays** (Dialog, AnnouncementBar, floating CTA, etc.). Admin adds/edits/reorders both; modals have trigger options (e.g. on load, delay, exit intent, button click).
-   **Styled UI preview** — Components render with full styles (same as frontend) so admin sees real look and feel
-   Real-time preview when editing content, styles, or classes
-   Duplicate/Delete (with drag–drop for repositioning)

### Properties Panel

-   Auto-generated form based on schemaJSON
-   **Style controls** — colors, spacing, typography, borders (per component or per element)
-   **Reusable class** — pick or type a CSS class name (e.g. from a shared design system); applied to the component wrapper or inner elements
-   Media picker
-   Color picker
-   Text editor

------------------------------------------------------------------------

# 11. JSON Rendering Structure

Example:

``` json
{
  "sections": [
    {
      "component": "Hero",
      "props": { "title": "Welcome", "subtitle": "Next CMS", "className": "my-hero-variant", "styles": {} }
    }
  ],
  "modals": [
    {
      "id": "newsletter-1",
      "component": "Dialog",
      "props": { "title": "Subscribe", "content": "...", "trigger": "onLoad", "delaySeconds": 2 },
      "className": "",
      "styles": {}
    }
  ],
  "overlays": [
    { "component": "AnnouncementBar", "props": { "text": "Free shipping today!", "dismissible": true }, "order": 0 }
  ]
}
```

-   **sections** — main page content (flow); each block has a unique **instance id** (for keying, duplicate, and edit); component reference (componentId or name), **props** object, **order**; drag–drop order.
-   **modals** — page-level modals/dialogs; each has id, component, props (content, trigger: `onLoad` | `onClick` | `exitIntent`, delay, etc.), className, styles.
-   **overlays** (optional) — other page-level elements; same structure as sections but rendered as overlays.
-   **className** / **styles** — optional per section/component/modal.

**Props schema format** — Schema (schemaJSON / propsSchema) supports **field types**: text, richtext, image, url, number, select, boolean (and optional repeaters). Per-field **validation**: required, maxLength, min/max for numbers, allowed values for select. defaultProps must conform to this schema. Document the format in API docs and use it for builder forms and **validation on save**.

**Validation on save** — When saving a page, validate each block’s props against its component’s schemaJSON (or propsSchema); reject invalid payloads with clear errors (or sanitize where safe). Document whether layout stores a snapshot of props or validates against current schema; define migration or validation strategy for existing pages.

**Public page API contract** — Document one approach: GET page returns layout with only componentId (or name) + props (renderer resolves component from in-app map), or also embeds component metadata; state in API docs.

**Missing or deactivated component** — If a component is deactivated or removed, renderer shows a defined **fallback** (e.g. “Unavailable block” placeholder). Before deactivate/delete in admin: show **“X pages use this component”** and **require confirmation**.

Frontend Dynamic Renderer:

-   Render **sections** in order (main page flow).
-   Render **modals** and **overlays** from page JSON (same component registry); apply trigger logic (onLoad, exitIntent, etc.) and styles.
-   Map component name → load from registry → render with props.

------------------------------------------------------------------------

# 12. Theme Management & Styling in Admin

Theme settings stored in DB.

Admin can manage: - Primary color - Secondary color - **Fonts** — **font sources:** (1) **import font families** (e.g. Google Fonts catalog — pick from catalog, load via link or npm), (2) **custom upload fonts** (upload .woff2/.woff/.ttf; store in media/fonts; register as font-family). - **Typography** — sizes for body/headings, line height, letter spacing, font weights; font styling (headings vs body, links, buttons). - Text sizes - Border radius - **RTL support** (optional) — global or per-locale direction (LTR/RTL); set `dir="rtl"` on document or container; layout and components RTL-aware (logical CSS, flex/grid direction). Optional toggle in theme or derived from locale.

Applied using CSS variables (and font-face for custom uploads).

**Styled components in admin** — When building pages, every component is rendered as a real UI element with styles (not a wireframe). Admin can:
-   **Change styles** — Use the properties panel to set colors, spacing, typography, etc., and see the result immediately in the live canvas.
-   **Reusable classes** — Assign one or more CSS class names to a component (e.g. from a shared design system or custom utility classes). Same classes are used on the frontend so styling is consistent.
-   Optional: maintain a list of allowed/reusable class names in admin (e.g. in Theme or a "Design tokens" table) so admins can pick from a dropdown instead of typing.

------------------------------------------------------------------------

# 13. Media Manager

-   **Upload** — local storage or S3/cloud; store fileUrl, fileType, size, optional width/height for images.
-   **Validation** — Allowed image formats: **.png, .jpg, .jpeg, .webp, .gif**. Max file size (e.g. 5MB); max dimensions (reject or auto-resize oversize uploads). Enforce on upload.
-   **Organization** — folders or tags (Media.folder / Media.tags); list and filter in admin.
-   **Image resize/optimization** — optional: generate thumbnails or responsive sizes; store variants or single optimized URL; use next/image with sizes and lazy load on frontend.
-   **Alt text** — required or optional per asset for accessibility and SEO.
-   **Media picker in builder** — components reference media by **id** or **URL**; picker shows Media Manager library.
-   **Permissions** — `media:read` / `media:write`; only published/uploaded media available in picker.

------------------------------------------------------------------------

# 14. SEO

-   **Per-page / per-post** — seoTitle, seoDescription (Pages and BlogPost); seoOpenGraphImage, seoCanonicalUrl (optional).
-   **Open Graph / Twitter** — use seoTitle, seoDescription, seoOpenGraphImage for meta tags and Twitter card.
-   **Sitemap** — auto-generate (e.g. `/sitemap.xml`); include home, all published `/[slug]` pages, and **blog** post URLs (`/blog/[slug]`).
-   **robots.txt** — config in SiteSettings or static file; allow/deny crawlers as needed.

------------------------------------------------------------------------

# 15. 404 and draft preview

-   **404** — Frontend: when slug is unknown or page is dropped/unpublished, show **404 page**. Optional: SiteSettings.custom404PageId points to a CMS page used as 404; otherwise use a default 404 component.
-   **Draft preview** — Admin can open a **preview link** for a draft page (e.g. `/preview?token=...` or `/p/[id]/preview`). Only authenticated admin can access; frontend renders page content without requiring publish.

------------------------------------------------------------------------

# 16. Frontend data flow, API convention, and slug validation

-   **Data flow** — Frontend gets page by slug via **API route** or **server component** query. Only **published** pages are returned; home page when slug is `/` or isHomePage is true. Page content (contentJSON) is rendered by the dynamic renderer.
-   **Public API convention** — Document and use a consistent path convention, e.g. `GET /api/public/pages` (list or by slug), `GET /api/public/blogs`, `GET /api/public/blogs/[slug]`, `GET /api/public/menus`, `GET /api/public/theme`. **API versioning:** Optional version prefix (e.g. `/api/v1/public/...`). If unversioned at launch, document that breaking changes will be announced and a version prefix may be introduced later. Unauthenticated GET only for published content.
-   **API reference** — Maintain a single **API reference** subsection or appendix listing all public and admin routes and methods so the plan is the single source of truth (see Section 30).
-   **Slug validation** — On create/update: lowercase, hyphens only, no spaces; unique (per content type); not in reserved list (`admin`, `blog`, `contact`, `search`, `api`, `preview`, `_next`, `login`, `auth`, and app routes). Return 400 with clear message (and optional suggestion) on duplicate or invalid slug.

------------------------------------------------------------------------

# 17. Version history

-   **Save revision** — On each save (or on "Save revision" action), store a snapshot in **Revisions** (or append to PageContent history): contentJSON, version number, createdAt, createdBy.
-   **List revisions** — Admin sees list of revisions per page (date, author if available).
-   **Compare** — Optional: diff between two revisions or current vs revision.
-   **Restore** — Restore page content to a selected revision; creates new revision.

------------------------------------------------------------------------

# 18. Scheduling (optional)

-   **Publish at** — Page has `publishedAt` (optional date/time). If set, page is not visible until that time; a **cron or background job** sets status to `published` when `publishedAt <= now`.
-   **Unpublish at** — Page has `unpublishedAt` (optional). After that time, job sets status to dropped/unpublished so the page returns 404.
-   **Job execution** — Define **where** the scheduler runs: e.g. Next.js API route called by external cron (Vercel Cron, GitHub Actions, or system cron), or a queue (Bull, etc.). Document in README or ops doc; scheduling is only active when this job is running.

------------------------------------------------------------------------

# 19. Caching and performance

-   **Page JSON** — Cache published page content (e.g. Next.js ISR or short TTL); invalidate cache when page is published or dropped.
-   **Media** — Serve media via CDN or optimized URL; optional image optimization (next/image or similar).
-   **List pages / sitemap** — Cache list of published slugs or sitemap for fast 404 and sitemap generation.

------------------------------------------------------------------------

# 20. Bootstrap, health, and environment

-   **Initial admin user** — After fresh deploy, at least one admin must exist. Create via **seed script** or **env-based bootstrap** (e.g. `ADMIN_EMAIL`, `ADMIN_PASSWORD`); document in README. Optional: seed default theme, one menu, one home page.
-   **Health endpoint** — **`GET /api/health`** checks DB connectivity and returns 200 or 503. When DB is unavailable: public site shows friendly error (e.g. 503 or static error page); admin shows clear message; APIs return 5xx with consistent shape.
-   **Environment** — Validate **required** env at startup (e.g. **`MONGODB_URI`**, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`); **fail-fast** with clear message if missing. Document full list in README and `.env.example`.

------------------------------------------------------------------------

# 21. Blogs

-   **Model** — BlogPost (slug, title, content, excerpt, featuredImage, author, category, tags, status, publishedAt, meta); Category (name, slug, description, order); tags as array on post or separate Tag model.
-   **Admin** — CRUD at `/admin/blogs`; categories at `/admin/blogs/categories` (or nested). Form: title, slug, content (WYSIWYG/rich text), excerpt, featured image picker, category select, tags, meta, status. List with filters (status, category, search).
-   **Public** — Listing page `/blog`; single post `/blog/[slug]`. Public APIs: `GET /api/public/blogs` (list published, paginate, filter by category, search), `GET /api/public/blogs/[slug]`, `GET /api/public/blog-categories`. Sitemap includes blog slugs.
-   **Rich text** — Blog body and any richtext field in components: structured or HTML output; store and render safely (sanitised).
-   **Blog revisions** (optional) — If version history is required for posts, extend Revisions to support BlogPost (e.g. `postId` in Revisions or separate BlogRevisions collection); list, compare, restore per post.

------------------------------------------------------------------------

# 22. Contact forms and email

-   **Primary: embeddable form component** — Contact form is an **embeddable component** that can be placed on any CMS page via the page builder (e.g. "ContactForm" block). Optional: dedicated `/contact` route for a full-page contact experience.
-   **Model** — ContactSubmission (payload, formId/source, isRead, createdAt). Payload: e.g. name, email, message.
-   **Public POST** — Validate; save to DB; send email to admin and/or auto-reply to submitter (Resend, SendGrid, or nodemailer). **Rate limit** `POST /api/contact` (e.g. by IP or identifier); document or configure limit values (e.g. per IP per minute) and tune in production. Optional reCAPTCHA.
-   **Env** — `EMAIL_FROM`, `EMAIL_TO`, and either `RESEND_API_KEY` or SMTP vars; document in README.
-   **Admin** — List submissions at `/admin/contacts`; mark read, delete.

------------------------------------------------------------------------

# 23. Error and loading UX

-   **error.js** — Root and/or route-level `error.js` for public and admin so uncaught errors show a controlled UI.
-   **loading.js** — Use `loading.js` (or skeletons) for dynamic public routes (e.g. `[slug]`, blog) and key admin pages.
-   **404** — Public site returns 404 for missing or draft content (already in Section 15).
-   **5xx** — Consistent server-error page for 500/503.

------------------------------------------------------------------------

# 24. Security and rate limiting

-   **Rate limiting** — Apply to abuse-prone public endpoints: **contact form POST** (e.g. by IP or identifier); **public search** if implemented. Document or implement in Phase 4 (contact) and when search is added.
-   **Security** — State-changing operations (contact POST, admin mutations) protected: same-origin only and/or CSRF tokens if cross-origin. **Security headers** (e.g. Content-Security-Policy, X-Frame-Options, X-Content-Type-Options) in middleware or server config; document.

------------------------------------------------------------------------

# 25. Redirects

-   **When slug changes or page removed** — Support optional **301 redirects** (from old URL to new). **Redirect** model: fromPath, toPath, statusCode (301).
-   **Admin** — List of redirect rules (from → to); add, edit, delete.
-   **Redirect precedence** — Redirect rules are evaluated **first** (e.g. in middleware or before slug lookup). If a request matches a Redirect fromPath, return 301 to toPath; if no match, resolve page by slug. Document so implementers apply redirects before page resolution.

------------------------------------------------------------------------

# 26. Admin dashboard

-   **`/admin`** — Shows **summary counts** (e.g. pages, posts, contact submissions) and **links to main sections** (pages, blogs, menu, media, theme, contacts, users, roles). Optional: recent activity or quick actions.

------------------------------------------------------------------------

# 27. Implementation Roadmap

## Phase 1 -- Foundation

-   Setup Next.js
-   Setup Mongoose + MongoDB (use **MONGODB_URI** in env)
-   **Bootstrap and env** — Seed or env-based initial admin (ADMIN_EMAIL, ADMIN_PASSWORD); validate required env at startup (fail-fast); document in README. **GET /api/health** (DB check, 200/503); define behavior when DB is down.
-   Setup Authentication (**NextAuth**; login, session, protect `/admin` and admin APIs)
-   **User and role management** — Users & Roles models; create/list/edit users; create/list/edit roles and assign permissions; assign role to user; **last-admin guard**; document permission matrix (README or docs/PERMISSIONS.md)
-   Pages CRUD (create, edit, admin-managed slug, publish/drop, set home page)
-   **Reserved paths and API convention** — Enforce reserved slugs; public API convention (e.g. /api/public/pages); **Admin dashboard** — /admin shows summary counts (pages, posts, contacts) and links to sections
-   **Error and loading** — error.js, loading.js for public and admin; 404 for missing/draft; 5xx page

**Phase 1 acceptance criteria** — Anonymous user cannot access /admin; health returns 503 when DB is down; at least one page can be created, published, and viewed at /[slug]; env validation fails fast on missing MONGODB_URI or NEXTAUTH_SECRET.

## Phase 2 -- Component Registry

-   Create components table (registry in DB)
-   **Components folder** — admin layout under `components/admin/`, system under `system/`, page-builder under `builder/`. New page-builder component → new file in components folder + register. Admin layout and component code not editable from admin.
-   **Page builder detail** — Each block has unique **instance id**; **validate** block props against component schema on save (reject or sanitize with clear errors); **fallback** for missing/deactivated component (e.g. "Unavailable block"); before deactivate/delete show **"X pages use this component"** and require confirmation; document **public page API contract** (layout returns componentId + props; renderer resolves from map).
-   **Default component set** — Ship with a minimal default set so the builder is usable out of the box (e.g. Hero, Card, Text/Paragraph, Image, Buttons, Spacer), or seed on first run; register in DB and map in code.
-   Build dynamic renderer
-   Create schema-based forms

**Phase 2 acceptance criteria** — At least one component can be registered; page layout saves with instance ids; validation rejects invalid props; fallback shows for unknown component; default component set available in builder.

## Phase 3 -- Visual Builder, theme fonts, menu


-   **Drag & drop for all elements** (dnd-kit) — component library items draggable; every element on the canvas draggable/droppable for reorder and move; consistent drag–drop behaviour across sections and nested blocks
-   Save JSON layouts (sections + **modals** + **overlays**); support adding modals/dialogs, announcement bars, floating CTAs per page with trigger options (onLoad, exitIntent, etc.)
-   **Live styled preview** — render components with full UI styles in admin (not wireframes)
-   **Style controls & reusable class** — properties panel for styles and className; admin can change styles or assign reusable classes per component

**Phase 3 acceptance criteria** — Drag–drop reorder and add sections/modals; live styled preview; theme fonts configurable; menu items editable with openInNewTab.

## Phase 4 -- CMS Features

-   **Menu management** — normal menu with nested submenu and mega menu; drag–drop; **openInNewTab** per menu item
-   **Header & footer** — admin updates config (logo, menu, tagline, sticky, copyright, social links, columns)
-   **Media Manager** — upload (local or S3), folders/tags, alt text, resize/optimization; **validation**: allowed formats (.png, .jpg, .jpeg, .webp, .gif), max size, max dimensions (reject or resize); media picker by id/URL
-   **SEO** — per-page (title, description, OG image, canonical); sitemap (pages + blog); robots.txt
-   **404 and preview** — 404 for unknown/dropped slug (optional custom 404 page); draft preview for admin
-   **Blogs** — BlogPost, Category; admin CRUD (/admin/blogs, /admin/blogs/categories); public /blog, /blog/[slug]; public APIs; rich text for post body; sitemap includes blog
-   **Contact forms and email** — **Embeddable ContactForm component** for page builder; ContactSubmission model; public POST; send email (Resend/nodemailer); **rate limit** (document limit values, e.g. per IP per minute); admin list at /admin/contacts
-   **Redirects** — Redirect model (fromPath, toPath, 301); admin list; apply **before** page resolve (redirect precedence); optional to move to Phase 5 if Phase 4 is overloaded
-   **Security** — Rate limiting (contact, optional search); security headers (CSP, X-Frame-Options, X-Content-Type-Options); same-origin/CSRF for mutations; optional to move headers to Phase 5
-   Theme Panel (with font sources, typography, optional RTL)

**Phase 4 acceptance criteria** — Blog list and single post render; contact form submits and appears in admin; rate limit and security headers documented or applied.

## Phase 5 -- Enterprise Features

-   **Version history** — save revision on save; list, compare, restore revisions per page (and optionally blog posts per Section 21)
-   **Scheduling** (optional) — publishAt / unpublishedAt; **scheduler job** runs via cron or queue (document where: e.g. Vercel Cron, API route + cron, or queue)
-   **Role permissions** — fine-grained permission checks in admin UI and API (e.g. hide/disable actions by permission)
-   **Caching and performance** — cache published page JSON (ISR or TTL); invalidate on publish/drop; media CDN/optimization
-   **Multi-language** — Treat as **future phase** unless required for initial release: locale on Page/Post, URL strategy, locale switcher, RTL per locale; otherwise add a short subsection when scoped
-   Audit log (optional); admin search; **backup/export** — Document **who** is responsible (e.g. managed DB backups + content export); document in README or ops doc

**Phase 5 acceptance criteria** — Revisions list and restore work; scheduler job documented and runnable; backup/restore or export approach documented.

------------------------------------------------------------------------

# 28. Final Architecture Flow

Admin → Create Page → Set Slug (e.g. home, about) → Add Components → Save JSON → Publish or Drop →\
Frontend: resolve route (`/` = home page, `/[slug]` = other pages) → Fetch published page → Dynamic Render → Display Page

------------------------------------------------------------------------

# Result

-   WordPress-like flexibility
-   Fully controlled UI system
-   JSON-driven rendering
-   Production-ready CMS platform

------------------------------------------------------------------------

# Key points / Design decisions

1. **Pages** — Admin-managed slugs (validated, reserved list); publish or drop; one home page at `/` (or `/home`); optional scheduling (publishedAt/unpublishedAt).
2. **Builder** — Full drag–drop; styled UI; styles and reusable classes; modals/overlays per page (with triggers); **instance id** per block; **validate props on save**; **fallback** for missing component; "X pages use this" + confirm before delete; media picker by id/URL.
3. **Database** — MongoDB; Mongoose ODM; Revisions; Media (with validation rules); BlogPost, Category, ContactSubmission, Redirect; SiteSettings for 404, robots.
4. **Users & roles** — Manage users and roles; permissions; protect admin and API; **last-admin guard**; optional invite; **permission matrix** in README/docs.
5. **Menus** — Normal (nested submenu) and mega; drag–drop; **openInNewTab** per item.
6. **Header & footer** — Components in `components/system/`; only config editable (site settings); not editable from admin.
7. **Components folder** — Admin layout in `admin/`, system in `system/`, page-builder in `builder/`. New page-builder components in `builder/`. Admin layout and component code **not editable from admin**.
8. **Media Manager** — Upload (local/S3), folders/tags, alt text, resize; **validation**: formats (.png, .jpg, .jpeg, .webp, .gif), max size, max dimensions; picker in builder.
9. **SEO** — Per-page meta, OG, canonical; sitemap (pages + blog); robots.txt.
10. **404 and preview** — 404 for unknown/dropped slug (optional custom 404 page); draft preview for admin.
11. **Version history** — Revisions per page; list, compare, restore.
12. **Caching** — Cache page JSON; invalidate on publish/drop; media optimization.
13. **Blogs** — Posts (slug, title, content, excerpt, featuredImage, author, category, tags, status); categories CRUD; public `/blog`, `/blog/[slug]`; rich text; sitemap includes blog.
14. **Contact forms and email** — ContactSubmission; public POST; email (Resend/nodemailer); **rate limit**; admin list.
15. **Bootstrap, health, env** — Seed or env initial admin; **GET /api/health** (200/503); validate required env at startup (fail-fast); document env in README.
16. **Reserved paths and API** — Reserved: admin, blog, contact, search, api, preview (+ app routes). Public API convention: e.g. /api/public/pages, /api/public/blogs; document.
17. **Theme and fonts** — Font sources (import e.g. Google Fonts, custom upload .woff2); typography (line height, letter spacing); optional **RTL**.
18. **Error and loading** — error.js, loading.js; 5xx page.
19. **Security and rate limiting** — Rate limit contact (and search); CSRF/same-origin; security headers.
20. **Redirects** — 301 when slug changes or page removed; admin list (from → to).
21. **Admin dashboard** — /admin shows summary counts (pages, posts, contacts) and links to sections.

------------------------------------------------------------------------

# 29. CMS checklist (integrated above)

The following are now part of the plan: **Media Manager** (13), **SEO** (14), **404 and draft preview** (15), **Frontend data flow and API convention** (16), **Version history** (17), **Scheduling** (18), **Caching** (19), **Bootstrap, health, env** (20), **Blogs** (21), **Contact forms and email** (22), **Error and loading UX** (23), **Security and rate limiting** (24), **Redirects** (25), **Admin dashboard** (26). DB, roadmap, and Key points updated. Document env vars in README or .env.example.

------------------------------------------------------------------------

# 30. API Reference (single source of truth)

Use this section as the canonical list of API routes. Update when adding or changing endpoints.

**Public (unauthenticated GET only; published content)**

-   `GET /api/health` — DB health; 200 or 503
-   `GET /api/public/pages` — list published pages (or by slug)
-   `GET /api/public/pages/[slug]` — single published page (or home when slug is `/`)
-   `GET /api/public/blogs` — list published posts (paginate, filter by category, search)
-   `GET /api/public/blogs/[slug]` — single published post
-   `GET /api/public/blog-categories` — list categories
-   `GET /api/public/menus` — menus (e.g. by location)
-   `GET /api/public/theme` — theme/site settings (for header/footer, etc.)

**Public (unauthenticated POST)**

-   `POST /api/contact` — contact form submission; rate limited

**Admin (protected; require auth)**

-   `GET/POST/PUT/DELETE /api/admin/pages` (and by id)
-   `GET/POST/PUT/DELETE /api/admin/blogs` (and by id)
-   `GET/POST/PUT/DELETE /api/admin/blog-categories`
-   `GET/POST/PUT/DELETE /api/admin/menus`, `/api/admin/menu-items`
-   `GET/POST/PUT/DELETE /api/admin/media`
-   `GET/POST/PUT /api/admin/theme`, `/api/admin/site-settings`
-   `GET/POST/PUT/DELETE /api/admin/users`, `/api/admin/roles`
-   `GET/POST/PUT/DELETE /api/admin/components`
-   `GET/POST/PUT/DELETE /api/admin/contacts` (submissions)
-   `GET/POST/PUT/DELETE /api/admin/redirects`

Optional version prefix: `/api/v1/public/...`, `/api/v1/admin/...` (document if introduced).
