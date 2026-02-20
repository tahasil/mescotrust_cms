# Implementation Plan — Next.js CMS with Ant Design (antd)

This document is the **implementation plan** derived from [PROJECT-PLAN.md](PROJECT-PLAN.md). Use it for task order, checklists, and delivery. For architecture, database design, and feature detail, see PROJECT-PLAN.md.

---

## 1. Source and scope

- **Source:** [PROJECT-PLAN.md](PROJECT-PLAN.md) (Complete Architecture & Implementation Plan)
- **Stack:** Next.js (App Router), TypeScript, Mongoose, MongoDB, NextAuth, Ant Design (antd), Tailwind, dnd-kit, slugify, Resend/nodemailer
- **Env:** `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (required); `EMAIL_*`, `RESEND_API_KEY` or SMTP; `ADMIN_EMAIL`, `ADMIN_PASSWORD` for seed

---

## 2. Folder structure (from PROJECT-PLAN)

```
src/
├── app/
│   ├── (frontend)/          # page.tsx, [slug]/page.tsx, blog/, contact/
│   ├── (admin)/admin/       # layout, page, pages/, components/, theme/, menu/, media/, users/, roles/, blogs/, contacts/, redirects/
│   └── api/                 # health, public/*, admin/*, contact
├── components/
│   ├── ui/                  # antd + shared primitives
│   ├── system/              # Header, Footer, MegaMenu
│   ├── builder/             # page-builder components (Hero, Card, etc.)
│   ├── admin/               # admin layout (Layout, Header, Sider)
│   └── renderer/
├── lib/, services/, schemas/, types/, utils/
```

---

## 3. Phase 1 — Foundation

**Goal:** App runs, DB connected, one admin, pages CRUD, public page view, 404/5xx.

| # | Task | Done |
|---|------|------|
| 1.1 | Init Next.js (App Router), TypeScript, Tailwind | [ ] |
| 1.2 | Add Mongoose, MongoDB (MONGODB_URI); define models: User, Role, Page, PageContent | [ ] |
| 1.3 | Env validation at startup (fail-fast if MONGODB_URI, NEXTAUTH_SECRET, NEXTAUTH_URL missing) | [ ] |
| 1.4 | Implement `GET /api/health` (DB check → 200 or 503) | [ ] |
| 1.5 | Seed or bootstrap: create initial admin (ADMIN_EMAIL, ADMIN_PASSWORD); document in README | [ ] |
| 1.6 | NextAuth: login, session; protect `/admin` and `/api/admin/*` | [ ] |
| 1.7 | Ant Design: admin layout (Layout, Header, Sider) at `/admin` | [ ] |
| 1.8 | User & Role models; CRUD APIs; last-admin guard; document permission matrix (README or docs/PERMISSIONS.md) | [ ] |
| 1.9 | Pages: Mongoose model (title, slug, status, isHomePage, seo*, publishedAt, unpublishedAt); reserved slug validation | [ ] |
| 1.10 | Admin pages CRUD: list, create, edit, delete; slug uniqueness and reserved list (admin, blog, contact, search, api, preview, etc.) | [ ] |
| 1.11 | Public API: `GET /api/public/pages`, `GET /api/public/pages/[slug]` (published only; home by isHomePage) | [ ] |
| 1.12 | Frontend: `app/page.tsx` (home), `app/[slug]/page.tsx` (resolve by slug); 404 if missing/draft | [ ] |
| 1.13 | Admin dashboard: `/admin` with summary counts (pages, posts, contacts) and links to sections | [ ] |
| 1.14 | error.js, loading.js for public and admin; 5xx page | [ ] |
| 1.15 | README + .env.example with full env list | [ ] |

**Phase 1 acceptance:** Anonymous cannot access /admin; health returns 503 when DB down; one page can be created, published, and viewed at /[slug]; env fail-fast on missing required vars.

---

## 4. Phase 2 — Component registry and page content

**Goal:** Component registry in DB; page layout as JSON (sections with instance id); renderer; schema-based forms; default component set.

| # | Task | Done |
|---|------|------|
| 2.1 | Components table (name, slug, category, schemaJSON, isSystemComponent) | [ ] |
| 2.2 | PageContent / contentJSON linked to Page; layout = { sections[], modals[], overlays[] }; each block: instance id, component, props, order | [ ] |
| 2.3 | Default component set: seed or ship (e.g. Hero, Card, Text, Image, Buttons, Spacer); register in DB and map in code | [ ] |
| 2.4 | Component map in code: componentId/name → React component (from `components/builder/`, `components/system/`) | [ ] |
| 2.5 | On page save: validate each block props against component schemaJSON; reject or sanitize with clear errors | [ ] |
| 2.6 | Renderer: missing/deactivated component → fallback ("Unavailable block") | [ ] |
| 2.7 | Before deactivate/delete component: show "X pages use this" and require confirmation | [ ] |
| 2.8 | Document public page API contract (layout returns componentId + props; renderer resolves from map) | [ ] |
| 2.9 | Schema-based form generator from schemaJSON (field types: text, richtext, image, url, number, select, boolean) | [ ] |
| 2.10 | Admin: component library CRUD (list, create, edit; schema + defaultProps); optional: generate component code from schema | [ ] |

**Phase 2 acceptance:** At least one component registered; page layout saves with instance ids; validation rejects invalid props; fallback for unknown component; default set in builder.

---

## 5. Phase 3 — Visual builder, theme, menu

**Goal:** Drag-and-drop builder; live styled preview; theme (fonts, colors); menu management.

| # | Task | Done |
|---|------|------|
| 3.1 | dnd-kit: component library draggable onto canvas; canvas blocks draggable for reorder/move | [ ] |
| 3.2 | Page builder UI: sections + modals/overlays; add, reorder, duplicate, delete; properties panel per block | [ ] |
| 3.3 | Save layout to PageContent (sections, modals, overlays with trigger options) | [ ] |
| 3.4 | Live styled preview in admin (components render with real styles, not wireframes) | [ ] |
| 3.5 | Style controls and reusable class (className) in properties panel | [ ] |
| 3.6 | ThemeSettings + SiteSettings: primaryColor, fonts, font sources (Google Fonts, custom upload .woff2); typography (line height, letter spacing); optional RTL | [ ] |
| 3.7 | Theme Panel in admin; apply via CSS variables (and font-face for uploads) | [ ] |
| 3.8 | Menus + MenuItems (menuId, label, url, openInNewTab, parentId, order, type); CRUD and public API | [ ] |
| 3.9 | Menu management UI: list menus; add/edit items; drag–drop reorder and nesting (normal + mega) | [ ] |

**Phase 3 acceptance:** Drag–drop reorder and add sections/modals; live styled preview; theme fonts configurable; menu items with openInNewTab.

---

## 6. Phase 4 — CMS features

**Goal:** Menu, header/footer config, media, SEO, 404/preview, blogs, contact, redirects, security.

| # | Task | Done |
|---|------|------|
| 4.1 | Header & Footer: SiteSettings (logoUrl, menuId, tagline, sticky, copyright, social links, columns); admin UI to edit; system components read config | [ ] |
| 4.2 | Media model + upload (local or S3); validation: .png, .jpg, .jpeg, .webp, .gif; max size; max dimensions (reject or resize) | [ ] |
| 4.3 | Media Manager admin: list, upload, folders/tags, alt text; media picker in builder (by id/URL) | [ ] |
| 4.4 | SEO: per-page/post meta (title, description, OG image, canonical); generateMetadata; sitemap (pages + blog); robots.txt | [ ] |
| 4.5 | 404: default 404 component; optional SiteSettings.custom404PageId for CMS 404 page | [ ] |
| 4.6 | Draft preview: e.g. /preview?token=... or /p/[id]/preview; auth-only | [ ] |
| 4.7 | BlogPost + Category models; admin CRUD (/admin/blogs, /admin/blogs/categories); rich text for body | [ ] |
| 4.8 | Public /blog, /blog/[slug]; GET /api/public/blogs, /api/public/blogs/[slug], /api/public/blog-categories; sitemap includes blog | [ ] |
| 4.9 | ContactSubmission model; embeddable ContactForm component for page builder; POST /api/contact; rate limit (document e.g. per IP per minute) | [ ] |
| 4.10 | Email: Resend or nodemailer; EMAIL_FROM, EMAIL_TO, RESEND_API_KEY or SMTP; admin list at /admin/contacts | [ ] |
| 4.11 | Redirect model (fromPath, toPath, 301); admin list; middleware or pre-route: redirects evaluated before page resolve | [ ] |
| 4.12 | Security: rate limit contact (and search if added); security headers (CSP, X-Frame-Options, X-Content-Type-Options); same-origin/CSRF for mutations | [ ] |

**Phase 4 acceptance:** Blog list and single post render; contact form submits and appears in admin; rate limit and security headers documented or applied.

---

## 7. Phase 5 — Enterprise features

**Goal:** Revisions, scheduling, permissions, caching, backup doc; optional i18n, audit, search.

| # | Task | Done |
|---|------|------|
| 5.1 | Revisions model (pageId, contentJSON, version, createdAt, createdBy); save revision on save; list, compare, restore in admin | [ ] |
| 5.2 | Optional: blog post revisions (postId in Revisions or separate collection) | [ ] |
| 5.3 | Scheduling: publishAt/unpublishedAt; cron or queue job to flip status; document where job runs (e.g. Vercel Cron, API route + cron) | [ ] |
| 5.4 | Fine-grained permissions: check permissions in admin UI and API; hide/disable by permission | [ ] |
| 5.5 | Caching: cache published page JSON (ISR or TTL); invalidate on publish/drop; media CDN/optimization | [ ] |
| 5.6 | Document backup/export: who is responsible (e.g. managed DB + content export); README or ops doc | [ ] |
| 5.7 | Optional: multi-language (future phase); audit log; admin search | [ ] |

**Phase 5 acceptance:** Revisions list and restore work; scheduler job documented and runnable; backup/restore or export documented.

---

## 8. API checklist (from PROJECT-PLAN Section 30)

**Public**

- [ ] GET /api/health
- [ ] GET /api/public/pages, /api/public/pages/[slug]
- [ ] GET /api/public/blogs, /api/public/blogs/[slug], /api/public/blog-categories
- [ ] GET /api/public/menus, /api/public/theme
- [ ] POST /api/contact (rate limited)

**Admin (protected)**

- [ ] GET/POST/PUT/DELETE /api/admin/pages, /blogs, /blog-categories, /menus, /menu-items, /media, /theme, /site-settings, /users, /roles, /components, /contacts, /redirects

---

## 9. Reference

- **Full architecture and design:** [PROJECT-PLAN.md](PROJECT-PLAN.md)
- **Env and API details:** PROJECT-PLAN.md Sections 2, 20, 30
