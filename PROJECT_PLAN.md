# Mesco Trust CMS — Project Plan

## Overview

**Project:** Mesco Trust CMS  
**Stack:** Next.js 14, MongoDB (Mongoose), NextAuth, Ant Design  
**Purpose:** Content management system with admin panel and public site driven by CMS content.

---

## Goals

- [ ] **Foundation (from gap analysis):** Reserved paths enforced; initial admin user (seed/bootstrap); DB connection + `GET /api/health`; required env validated at startup; error/loading UX (`error.js`, `loading.js`, 404/5xx); slug rules (uniqueness, validation, reserved-path rejection); admin dashboard (counts + links); API path convention documented.
- [ ] Public site: visitors see CMS pages and blog posts (published only); dynamic routes (non-reserved slugs only), metadata for SEO.
- [ ] Component library and page builder: reusable blocks, renderer on public site, default components.
- [ ] Menus, theme (fonts, RTL), responsive layout: editable menus and theme; public layout applies both.
- [ ] Contact form and email: public submit, store submissions, send email, **rate limit** contact POST; admin list.
- [ ] SEO, media, rich text: sitemap/robots/OG, image validation, WYSIWYG and safe render.
- [ ] Governance and discovery: draft preview, roles, search (with **rate limit**), optional password reset, i18n (optional).
- [ ] Operations: **security** (CSRF, headers), documented analytics and backup/restore; production media storage (e.g. S3) where needed.

---

## Phases and backlog

Backlog items are the gaps between the plan and current codebase (see [PROJECT_PLAN_GAPS.md](PROJECT_PLAN_GAPS.md)). Check off tasks in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) as you complete them.

| Phase | Focus / backlog |
|-------|------------------|
| **1** | **Reserved paths** (admin, blog, contact, search, api, preview); **initial admin user** (seed or env bootstrap); **DB** connection strategy + **`GET /api/health`** + behavior when DB down; **env validation** at startup; **admin dashboard** (counts, links). Public read APIs (`/api/public/pages/[slug]`, blogs, blog-categories); middleware allow `/api/public/*` and theme; dynamic `app/[slug]` (non-reserved only), blog list/single; **slug rules** (uniqueness, validation, 400 on duplicate/invalid); ComponentRenderer + default blocks; **error/loading** (`error.js`, `loading.js`, 404/5xx); `generateMetadata`; home from CMS (e.g. slug `home`). Document API path convention (optional versioning). |
| **2** | Default component set in DB/seed; component map sync doc; page builder UX (optional). |
| **3** | Menu model and APIs (admin + public); admin menus UI; public layout with theme + menu + RTL; responsive nav (e.g. hamburger); theme: font sources (Google + custom upload), `direction` (LTR/RTL). |
| **4** | `POST /api/contact`; **rate limit** contact POST; email service (`lib/email.js`); contact form component; admin submissions (already exists). |
| **5** | Sitemap, robots, canonical/OG in metadata; media upload validation (format, size, optional dimensions); rich text editor + safe render. |
| **6** | Draft preview URL; role docs; public (and optional admin) search; **rate limit** public search; **optional password reset** (or out of scope); i18n (locale, switcher, RTL per locale). |
| **7** | **Security** (CSRF, security headers); analytics doc; backup/restore doc; media storage (S3) doc/code. |

---

## References

- **Scope and must-haves:** [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md)
- **Task checklist (file paths, steps):** [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- **Gap vs codebase (update as phases complete):** [PROJECT_PLAN_GAPS.md](PROJECT_PLAN_GAPS.md)
- **Gap analysis (critical/must-have items now in feature plan):** Cursor plan "CMS Feature Plan Gap Analysis" — reserved paths, initial admin user, DB/health, env, error/loading, slug rules, rate limiting, security, dashboard, optional password reset, API versioning.
