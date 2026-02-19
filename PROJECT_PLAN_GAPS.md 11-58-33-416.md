# Project Plan — Gap Analysis

This document compares **CMS_FEATURE_PLAN.md** and **IMPLEMENTATION_PLAN.md** with the **current codebase** to list what is planned but missing, and where the plan and implementation are out of sync.

**References:** [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md) · [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) · [PROJECT_PLAN.md](PROJECT_PLAN.md) (entry point: goals and phase backlog).

Use this document to track remaining gaps; when a phase is implemented, update Section 4 (summary table) and the relevant Section 2.x subsection so the doc stays accurate.

---

## 1. Planning documents

| Document | Status | Note |
|----------|--------|------|
| **PROJECT_PLAN.md** | Present | Entry point: goals, phase backlog, links to other plan docs. |
| **CMS_FEATURE_PLAN.md** | Present | Full feature scope and phases. |
| **IMPLEMENTATION_PLAN.md** | Present | Task-level checklist; aligns with feature plan. |
| **PROJECT_PLAN_GAPS.md** | This doc | Gap vs codebase; update as phases complete. |

**Gap:** There is no single “project plan” file that ties goals, dates, and ownership to the feature/implementation plans. PROJECT_PLAN.md now exists; see entry point above.

---

## 2. Gaps: planned but not implemented

### 2.1 Public site and APIs (Phase 1)

| Planned | Current state | Gap |
|--------|----------------|-----|
| Public read APIs | All content APIs require auth. | No `/api/public/*` routes. |
| `GET` page by slug (public) | `GET /api/pages` requires session; no slug endpoint. | Need `GET /api/public/pages/[slug]` (or equivalent) returning only published page. |
| `GET` blogs list (public) | `GET /api/blogs` requires auth. | Need public blogs list (published only, optional category/search). |
| `GET` blog by slug (public) | No public blog-by-slug. | Need `GET /api/public/blogs/[slug]`. |
| Public blog categories | `GET /api/blog-categories` requires auth. | Need public categories (or unauthenticated GET with active-only filter). |
| Dynamic page route `app/[slug]` | Only `app/page.js` (static “Welcome”). | No CMS-driven page by slug. |
| Blog list page `app/blog/page.js` | Missing. | No `/blog` listing. |
| Blog single `app/blog/[slug]/page.js` | Missing. | No `/blog/[slug]` post page. |
| Component renderer | Not present. | No `ComponentRenderer.js` or component map to render page layout. |
| Default/placeholder components | Not present. | No Paragraph, Heading, Image (or similar) blocks for the renderer. |
| `generateMetadata` for page/post | Not implemented. | No dynamic meta title/description from CMS. |
| Home page from CMS | Home is static. | Plan: home from slug `home` or redirect; not done. |

**Summary:** Phase 1 (public site foundation) is largely **not implemented**: no public APIs, no dynamic pages, no blog routes, no component renderer, no metadata from CMS.

---

### 2.2 Menus (Phase 3)

| Planned | Current state | Gap |
|--------|----------------|-----|
| Menu model | No Menu model. | Need `src/models/Menu.js` (name, items: label, url, order, openInNewTab). |
| Menu admin API | Missing. | Need GET/PUT for menus (protected). |
| Menu public API | Missing. | Need `GET /api/public/menus` (or similar). |
| Admin menus UI | Missing. | No `admin/menus/page.js`. |
| Public layout: render menu | No public layout with nav. | No header/footer with menu from API. |
| Responsive/hamburger nav | N/A. | Depends on menu and public layout. |

**Summary:** Menu management (model, APIs, admin UI, public render) is **fully missing**.

---

### 2.3 Contact form and email (Phase 4)

| Planned | Current state | Gap |
|--------|----------------|-----|
| Public contact POST | Middleware allows `/api/contact` but **no route exists**. Only `GET/POST /api/contacts` (admin, auth required). | Need `POST /api/contact` (or `/api/public/contact`): validate, save to `ContactSubmission`, call email. |
| Email service | No email sending. | No `lib/email.js` (or similar); no Resend/SendGrid/nodemailer integration. |
| Contact form component | Missing. | No public React form that POSTs to contact API. |
| Admin submissions list | Exists. | `admin/contacts` and `GET /api/contacts` are in place. |

**Summary:** Contact **storage and admin** exist; **public submit endpoint** and **email** are missing. Middleware already allows `/api/contact` but the route was never added.

---

### 2.4 SEO (Phase 5)

| Planned | Current state | Gap |
|--------|----------------|-----|
| Sitemap | Not present. | No `app/sitemap.js` (pages + blog slugs). |
| Robots | Not present. | No `app/robots.js` (or `public/robots.txt`) with sitemap reference. |
| Canonical URLs | Not in metadata. | Not in `generateMetadata` (which is also not implemented). |
| Open Graph | Not in metadata. | Same as above. |

**Summary:** All of Phase 5 SEO (sitemap, robots, canonical, OG) depends on public routes and `generateMetadata`; **none of it is implemented**.

---

### 2.5 Media (Phase 5)

| Planned | Current state | Gap |
|--------|----------------|-----|
| Image validation on upload | Media POST accepts any file. | No whitelist (e.g. .png, .jpg, .jpeg, .webp, .gif), no max file size, no max dimensions/resize. |

**Summary:** Media upload works but **validation** (format, size, optional dimensions) is **not implemented**.

---

### 2.6 Rich text / WYSIWYG (Phase 5)

| Planned | Current state | Gap |
|--------|----------------|-----|
| Rich text editor in admin | Component schema has `richtext` type; blog `content` is plain string. | No WYSIWYG library (TipTap, Lexical, etc.); blog body is not rich text. |
| Safe render on public | N/A (no public render yet). | Plan: sanitize (e.g. DOMPurify) when rendering blog/richtext; not done. |

**Summary:** **Richtext** is in the schema and UI labels, but there is **no real WYSIWYG** for blog or component fields, and **no safe HTML render** on the public side.

---

### 2.7 Theme editor (Phase 3)

| Planned | Current state | Gap |
|--------|----------------|-----|
| Font sources (Google + custom upload) | ThemeConfig has `fontFamily` string only. | No `googleFonts` / `customFonts`; no font upload or catalog. |
| Direction (LTR/RTL) | Not in theme. | No `direction` field; no RTL in layout. |
| Public site: apply theme | Theme GET is public; no public layout. | Once public layout exists, apply CSS variables and `dir` from theme. |

**Summary:** Basic theme (colors, font name, layout width) exists; **font sources** and **RTL/direction** are **not** in model or admin.

---

### 2.8 Draft preview, roles, search, i18n (Phase 6)

| Planned | Current state | Gap |
|--------|----------------|-----|
| Draft preview URL | Not implemented. | No preview token or role-gated preview route. |
| Role-based access | Partially done. | Theme, users, components: admin-only. Blogs: editor can edit own. Not documented which routes are admin-only. |
| Public search | Missing. | No `GET /api/public/search?q=...`. |
| Admin search | List filters exist. | No global admin search bar (optional). |
| i18n (locale, RTL per locale) | Not implemented. | No `locale` on Page/Blog/Menu; no locale in APIs or switcher. |

**Summary:** **Roles** are partly enforced; **draft preview**, **search**, and **i18n** are **not implemented**.

---

### 2.9 Analytics and backups (Phase 7)

| Planned | Current state | Gap |
|--------|----------------|-----|
| Analytics doc / integration | Not present. | No README or docs on adding GA/Plausible or server-side events. |
| Backup/restore doc | Not present. | No documented backup for DB and media. |
| Media storage (e.g. S3) | Local `public/uploads`. | No doc or code for production storage (S3, CDN). |

**Summary:** Phase 7 is **documentation and ops**; **not done**.

---

## 3. Implemented but not fully aligned with plan

| Area | Plan expectation | Current state |
|------|------------------|----------------|
| API path convention | Plan suggests `/api/public/*` for public read. | No `/api/public/*`; existing APIs are auth-only. |
| Middleware | Plan: allow `/api/public/*` and `/api/contact`. | Middleware allows `/api/contact` and `/api/pages/` but contact route is missing; pages API still requires auth. |
| Theme GET | Public. | Implemented and public; no change needed. |

---

## 4. Summary table

| Phase | Description | Status | Main gaps |
|-------|--------------|--------|-----------|
| 1 | Public site foundation | Not done | Public APIs, `[slug]`, blog routes, ComponentRenderer, metadata |
| 2 | Default components, page builder | Partial | Default component set; renderer missing so builder not usable on public |
| 3 | Menus, theme (fonts, RTL), responsive | Partial | No menus; theme has no fonts/RTL; no public layout |
| 4 | Contact + email | Partial | No POST /api/contact, no email service |
| 5 | SEO, media validation, rich text | Not done | No sitemap/robots/OG; no media validation; no WYSIWYG |
| 6 | Preview, roles, search, i18n | Partial | Roles partly done; no preview, search, i18n |
| 7 | Analytics, backups | Not done | No documentation |

---

## 5. Recommended next steps

1. **Use [PROJECT_PLAN.md](PROJECT_PLAN.md)** for goals, phase backlog, and links to all plan docs.
2. **Check off tasks in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** as you complete them.
3. **Implement Phase 1** — Public read APIs, `app/[slug]`, blog list/single, ComponentRenderer, and `generateMetadata` so the site can serve CMS content publicly.
4. **Add `POST /api/contact`** and **email integration** — Middleware already allows it; implement route and `lib/email.js`.
5. **Add Menu** — Model, admin API, public API, admin UI, then render in public layout when it exists.
6. **Refresh this gap doc** when phases are done — Update Section 4 and the relevant 2.x subsection so the gap list reflects the new state.
