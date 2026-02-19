# Mesco Trust CMS — Project Plan

## Overview

**Project:** Mesco Trust CMS  
**Stack:** Next.js 14, MongoDB (Mongoose), NextAuth, Ant Design  
**Purpose:** Content management system with admin panel and public site driven by CMS content.

---

## Goals

- [ ] Public site: visitors see CMS pages and blog posts (published only); dynamic routes, metadata for SEO.
- [ ] Component library and page builder: reusable blocks, renderer on public site, default components.
- [ ] Menus, theme (fonts, RTL), responsive layout: editable menus and theme; public layout applies both.
- [ ] Contact form and email: public submit, store submissions, send email; admin list.
- [ ] SEO, media, rich text: sitemap/robots/OG, image validation, WYSIWYG and safe render.
- [ ] Governance and discovery: draft preview, roles, search, i18n (optional).
- [ ] Operations: documented analytics and backup/restore; production media storage (e.g. S3) where needed.

---

## Phases and backlog

Backlog items are the gaps between the plan and current codebase (see [PROJECT_PLAN_GAPS.md](PROJECT_PLAN_GAPS.md)). Check off tasks in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) as you complete them.

| Phase | Focus / backlog |
|-------|------------------|
| **1** | Public read APIs (`/api/public/pages/[slug]`, blogs, blog-categories); middleware allow `/api/public/*` and theme; dynamic `app/[slug]`, blog list/single; ComponentRenderer + default blocks (Paragraph, Heading, Image); `generateMetadata`; home from CMS (e.g. slug `home`). |
| **2** | Default component set in DB/seed; component map sync doc; page builder UX (optional). |
| **3** | Menu model and APIs (admin + public); admin menus UI; public layout with theme + menu + RTL; responsive nav (e.g. hamburger); theme: font sources (Google + custom upload), `direction` (LTR/RTL). |
| **4** | `POST /api/contact`; email service (`lib/email.js`); contact form component; admin submissions (already exists). |
| **5** | Sitemap, robots, canonical/OG in metadata; media upload validation (format, size, optional dimensions); rich text editor + safe render. |
| **6** | Draft preview URL; role docs; public (and optional admin) search; i18n (locale, switcher, RTL per locale). |
| **7** | Analytics doc; backup/restore doc; media storage (S3) doc/code. |

---

## References

- **Scope and must-haves:** [CMS_FEATURE_PLAN.md](CMS_FEATURE_PLAN.md)
- **Task checklist (file paths, steps):** [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- **Gap vs codebase (update as phases complete):** [PROJECT_PLAN_GAPS.md](PROJECT_PLAN_GAPS.md)
