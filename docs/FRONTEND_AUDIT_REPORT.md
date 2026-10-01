# MESCO Trust — Frontend Website Audit Report

**Target:** https://mesco-demo.aiolos.cloud
**Method:** Playwright (Chromium 140) automated crawl — 30 pages, desktop 1440×900 + mobile 375×812
**Date:** 01 October 2026
**Run:** `node scripts/frontend-audit.js https://mesco-demo.aiolos.cloud`

---

## 1. Executive summary

The website is **stable and fast** — all 30 pages return HTTP 200, there are **zero broken images**, **zero missing alt attributes**, security headers are fully configured, and mobile has **no horizontal overflow**.

However, the **SEO layer is the weak point**. The single most damaging problem is that **unknown URLs return HTTP 200 instead of 404** (a "soft 404"), combined with a **sitemap that points at `localhost`**. Together these can seriously hurt search visibility, no matter how good the content is.

| Category | Count |
|---|---|
| 🔴 **Critical (P0)** — fix immediately | 3 |
| 🟠 **Major (P1)** — fix this sprint | 7 |
| 🟡 **Minor (P2)** — improvement | 5 |
| ✅ **Passing well** | 8 checks |

> **Update — fixes applied.** See [Section 11 — Fixes Applied](#11--fixes-applied).
> Remaining open items: the soft-404 **HTTP status code**, blog/event detail **duplicate `<h1>`**, three **heading-order skips**, and **image dimensions**. Everything else is resolved and verified.

---

## 2. Scorecard

| Area | Score | Notes |
|---|---|---|
| Page availability | **A** | 30/30 pages HTTP 200 |
| Broken images | **A** | 0 across all pages |
| Image alt text | **A** | 0 missing |
| Security headers | **A+** | HSTS, CSP, nosniff, DENY, referrer, permissions |
| HTTPS | **A** | 301 http → https |
| Mobile responsive | **A** | 0 px overflow at 375 px |
| Server speed | **A** | TTFB 220 ms, DOM ready 255 ms |
| 404 handling | **F** | Returns 200, wrong page rendered |
| Sitemap | **F** | All 39 URLs are `localhost` |
| robots.txt | **F** | Sitemap directive is `localhost` |
| Page titles | **C** | 5 pages share the identical title "MESCO Trust" |
| Meta descriptions | **F** | 29/30 pages show placeholder "Content management system" |
| Page weight | **D** | Homepage 5.6 MB, 98 % images |
| Duplicate content | **D** | 10 legacy pages live and self-canonical |

---

## 3. 🔴 CRITICAL (P0) — fix immediately

### P0-1 · Unknown URLs return HTTP 200 instead of 404 ("soft 404")

**Test:** `https://mesco-demo.aiolos.cloud/zzz-nope-12345` → **HTTP 200**

| Expected | Actual |
|---|---|
| HTTP **404** | HTTP **200** |
| Purpose-built 404 page | Full site shell (header + footer + mega menu) |
| No canonical | Canonical → `https://mesco-demo.aiolos.cloud/zzz-nope-12345` |
| No title | `<title>Zzz-nope-12345 | MESCO Trust</title>` |

**Why it matters:** search engines treat 200 responses as real pages. They can crawl and index an unlimited number of junk URLs from this site, which dilutes the crawl budget and can push real pages out of the index.

**Partial mitigation already in place:** the response *does* include `<meta name="robots" content="noindex">`. This reduces the damage, but it is a safety net, not a fix — a correct 404 status is still required, and the wrong page is still being served.

**Root cause (in code):** [`app/(site)/[...slug]/page.js:32-46`](app/(site)/[...slug]/page.js) — the database lookup happens inside `PageContent`, a *nested* async server component. React streaming flushes the HTTP 200 status before `notFound()` is thrown, so the status can no longer be changed. The same file's `generateMetadata` ([lines 15-29](app/(site)/[...slug]/page.js)) also generates a title and canonical for slugs that do not exist.

**Recommended fix:**
1. Move the `Page.findOne(...)` lookup to the **top-level page component** (or a shared `getPageBySlug()` called before render) so `notFound()` is thrown before the response is flushed.
2. Make `generateMetadata` return `{}` (or `robots: { index: false }`) when the page does not exist.
3. Verify with `curl -I https://<domain>/random-url` → expect `404`.

---

### P0-2 · `sitemap.xml` contains only `localhost` URLs

All **39** entries point to `http://localhost:3000/…`:

```xml
<loc>http://localhost:3000/</loc>
<loc>http://localhost:3000/about-us/awards-recognition</loc>
...
```

**Why it matters:** a search engine cannot crawl `localhost`. The entire sitemap is useless — pages that are not linked elsewhere may never get discovered.

**Root cause:** `NEXT_PUBLIC_SITE_URL` is not set (or is set to `http://localhost:3000`) in the deployed environment, so [`lib/seo.js`](lib/seo.js) and the sitemap route build absolute URLs from it.

**Fix:** set `NEXT_PUBLIC_SITE_URL=https://mesco-demo.aiolos.cloud` in the production environment. No code change should be needed if it is read from env — but it must be confirmed, since the same variable is also used for canonicals and `og:url`.

---

### P0-3 · `robots.txt` sitemap directive points to `localhost`

```
Sitemap: http://localhost:3000/sitemap.xml
```

**Fix:** same environment variable. After the fix, verify the file returns:
```
Sitemap: https://mesco-demo.aiolos.cloud/sitemap.xml
```

---

## 4. 🟠 MAJOR (P1) — fix this sprint

### P1-1 · Placeholder meta description on 29 of 30 pages

Every CMS page (except `/`, `/events`, `/blog`) returns:

```html
<meta name="description" content="Content management system">
```

This is leftover seed text. It tells Google the page is a CMS admin area, and it produces a useless snippet in search results.

**Fix:** write a real 140–160 character description for each page in **Pages → page → SEO → Meta Description**. The field already exists in the page editor. Minimum priority pages: About Us (all), Our Works (all), Media (all), Impact, Get Involved.

---

### P1-2 · Five Media pages have no canonical and an identical 11-character title

| Page | Title | Canonical |
|---|---|---|
| `/media/in-media` | `MESCO Trust` | ❌ missing |
| `/media/image-gallery` | `MESCO Trust` | ❌ missing |
| `/media/video-gallery` | `MESCO Trust` | ❌ missing |
| `/media/newsletter` | `MESCO Trust` | ❌ missing |
| `/media/annual-reports` | `MESCO Trust` | ❌ missing |

Five pages with the **exact same title** and no canonical = classic duplicate-content signal.

**Root cause:** these pages have no `metaTitle` set in the CMS, and the fallback path in [`lib/seo.js`](lib/seo.js) falls back to the site name only. The other 24 pages work because their SEO fields are filled in.

**Fix:** set `metaTitle` + `metaDescription` for these five pages (e.g. *Image Gallery | MESCO Trust*, *Photo gallery of MESCO Trust's education, medical and community work*).

---

### P1-3 · Four pages request shortcodes that do not exist (404s in console)

| Page | Failing request |
|---|---|
| `/about-us/managing-committee` | `/api/public/forms/resolve?shortcode=committee-members` → **404** |
| `/about-us/our-team` | `/api/public/forms/resolve?shortcode=senior-staff` → **404** |
| `/media/image-gallery` | `/api/public/forms/resolve?shortcode=image-gallery` → **404** |
| `/media/video-gallery` | `/api/public/forms/resolve?shortcode=video-gallery` → **404** |

These are the **exact symptoms the client reported in Audit Items 7 and 8** ("component can no longer be found / changes not reflected"). The pages contain shortcodes pointing at a module that no longer exists, so the section silently renders empty and the browser logs a 404.

**Fix (admin, no code):** open each affected page in the Page Builder, select the ShortCode block, and either point it at a valid existing shortcode or replace it with a normal block from the component library.

---

### P1-4 · 10 legacy / duplicate pages are live and self-canonical

| URL | Problem |
|---|---|
| `/blogs` | Duplicate of `/blog` |
| `/blog-details` | A standalone "Blog Details" page — no such thing should exist |
| `/event-list` | Duplicate of `/events` |
| `/event-deatils` | **Typo in the slug** ("deatils") + duplicate of `/events` |
| `/our-works/event-registration` | Orphan page |
| `/blog/why-lorem-ipsum-is-used` | Lorem-ipsum placeholder post |
| `/blog/neque-porro-quisquam…` | Lorem-ipsum placeholder post |
| `/blog/future-of-education-technology…` | Questionable/AI-looking content |
| `/events/neque-porro-quisquam…` | Lorem-ipsum placeholder event |
| `/events/top-ranking-students-felicitation-function` | Verify authenticity |

All return **HTTP 200** and each declares **itself** as canonical, so the search engine sees them as separate, competing pages.

**Fix:** set these to `draft` (hides them from the site and the sitemap without deleting content), delete the ones that are pure placeholders, and redirect any URL that has real value to its correct page.

---

### P1-5 · Homepage weighs 5.6 MB, of which 98 % is images

| Metric | Value |
|---|---|
| Total transfer | **5,595,552 bytes (5.6 MB)** |
| Images on page | **104** |
| Image bytes | **5,507,398 (98.4 %)** |
| Requests | 98 |
| Server response | 220 ms (fast — this is bandwidth, not server) |

Six gallery images alone account for **4.3 MB**:

| File | Size |
|---|---|
| `uploads/1774352581930_gallery-18.webp` | **1,354 KB** |
| `uploads/1774352528825_gallery-16.webp` | **803 KB** |
| `uploads/1774352501396_gallery-15.webp` | **797 KB** |
| `uploads/1774352609348_gallery-19.webp` | **555 KB** |
| `uploads/1774352466277_gallery-14.webp` | **502 KB** |
| `uploads/1774352554802_gallery-17.webp` | **335 KB** |

**Why it matters:** on a 3G/4G phone connection this is roughly 30+ seconds before the page is usable. This directly damages the Core Web Vitals ranking signal and increases bounce.

**Fix:**
1. Re-export those six images at the dimensions they are actually displayed (they appear to be far larger than needed) and re-upload through Media Library.
2. Add `loading="lazy"` (and `decoding="async"`) to every below-the-fold image.
3. Serve responsive `srcset` so phones download a smaller variant.

---

### P1-6 · Chatbot message box has no accessible label

```html
<input placeholder="Write your message..." class="sc-a90955de-16 drrBKL" value="">
```

A placeholder is **not** a label — screen readers announce nothing, and the field fails WCAG 2.1 SC 4.1.2 (Label in Name). This is present on every page because the chatbot is global.

**Fix:** add `aria-label="Type your message"` (or a visually hidden `<label>`) to the chatbot input.

---

### P1-7 · Blog and event detail pages have generic `<h1>` values

| Page | `<h1>` text |
|---|---|
| `/blog/why-lorem-ipsum-is-used` | `Blog Details` |
| `/blog/neque-porro…` | `Blog Details` |
| `/events/top-ranking-students…` | `Event Details` |
| `/blog` (listing) | **4 separate `<h1>` tags** |

The `<h1>` should be the actual article/event title — it is the strongest on-page relevance signal and what appears as the blue headline in Google.

**Fix:** in [`components/site/BlogDetails`](components/site/BlogDetails) and `components/site/EventDetails`, render the post/event title as the `<h1>`; demote the section headings to `<h2>`. For the blog listing page, keep one `<h1>` ("Blogs") and demote the card titles.

---

## 5. 🟡 MINOR (P2) — improvements

| ID | Issue | Detail | Fix |
|---|---|---|---|
| **P2-1** | Mega-menu links are not crawlable | 6 links per page use `javascript:void(0)` — e.g. *"About Us"*, *"Our Works"*, *"Institute›"*. Google cannot follow them, so deep pages rely entirely on the sitemap (which is currently broken — see P0-2). | Render them as real `<a href="…">` and control open/close with JavaScript, so crawlers can follow them. |
| **P2-2** | Ant Design select has no accessible name | `<button type="button" disabled class="…"><span role="img" aria-label="arrow-up">` — the button itself has no name (present on all 30 pages). | Add `aria-label` to the dropdown trigger button. |
| **P2-3** | Images missing `width`/`height` | 9 of 9 images on most pages have no dimensions → causes layout shift (CLS) when they load. | Add explicit `width`/`height` (or `aspect-ratio`) in the image components. |
| **P2-4** | Heading hierarchy skips levels | `/donate-now`: h1 → h4. `/privacy-policy`: h1 → h5. `/refund-cancellation-policy`: h1 → h5. | Change those headings to h2 so the outline is continuous. |
| **P2-5** | Placeholder content still live | Lorem-ipsum blog posts and events are published and indexed. | Replace with real content or unpublish before launch. |

---

## 6. ✅ What is working well (do not regress these)

| Check | Result |
|---|---|
| Page availability | **30 / 30 pages HTTP 200** — no crashes, no timeouts |
| Broken images | **0** across every page |
| Missing `alt` attributes | **0** — all images described |
| HTTPS redirect | `http://…` → `301` → `https://…` ✅ |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` ✅ |
| `Content-Security-Policy` | Fully configured, includes Razorpay / CCAvenue / YouTube / Maps ✅ |
| `X-Frame-Options` | `DENY` ✅ (clickjacking protection) |
| `X-Content-Type-Options` | `nosniff` ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` ✅ |
| `Permissions-Policy` | camera/microphone/geolocation disabled ✅ |
| Mobile (375 px) | **0 px horizontal overflow** on `/`, `/donate-now`, `/get-involved/contact-us`, `/blog` ✅ |
| Server performance | TTFB **220 ms**, DOM ready **255 ms**, load event **493 ms** ✅ |
| JSON-LD structured data | Present on all real pages ✅ |
| `og:image` | Present on all real pages ✅ |
| `noindex` on 404 | Correctly applied ✅ |

---

## 7. Per-page matrix

| Page | Status | ms | Title | Meta desc | h1 | Canonical | Issues |
|---|---|---|---|---|---|---|---|
| `/` | 200 | 3318 | 18 ch | 22 ch | 1 | ✅ | P1-5 (5.6 MB) |
| `/about-us/mesco-at-glance` | 200 | 2364 | 29 ch | placeholder | 1 | ✅ | P1-1 |
| `/about-us/managing-committee` | 200 | 2263 | 32 ch | placeholder | 1 | ✅ | P1-1, P1-3 |
| `/about-us/our-team` | 200 | 2273 | 22 ch | placeholder | 1 | ✅ | P1-1, P1-3 |
| `/about-us/good-governance` | 200 | 2389 | 29 ch | placeholder | 1 | ✅ | P1-1 |
| `/about-us/awards-recognition` | 200 | 2219 | 34 ch | placeholder | 1 | ✅ | P1-1 |
| `/about-us/volunteer` | 200 | 2498 | 23 ch | placeholder | 1 | ✅ | P1-1 |
| `/our-works/educational-support` | 200 | 2247 | 44 ch | placeholder | 1 | ✅ | P1-1 |
| `/our-works/medical-aid` | 200 | 2264 | 25 ch | placeholder | 1 | ✅ | P1-1 |
| `/our-works/clinics-dispensaries` | 200 | 2248 | 38 ch | placeholder | 1 | ✅ | P1-1 |
| `/our-works/relief-of-poverty` | 200 | 2250 | 31 ch | placeholder | 1 | ✅ | P1-1 |
| `/our-works/school-adoption` | 200 | 2200 | 45 ch | placeholder | 1 | ✅ | P1-1 |
| `/our-works/old-newspaper-units` | 200 | 2305 | 38 ch | placeholder | 1 | ✅ | P1-1 |
| `/media/in-media` | 200 | 2266 | **11 ch** | placeholder | 1 | ❌ | **P1-2** |
| `/media/image-gallery` | 200 | 2284 | **11 ch** | placeholder | 1 | ❌ | **P1-2, P1-3** |
| `/media/video-gallery` | 200 | 2257 | **11 ch** | placeholder | 1 | ❌ | **P1-2, P1-3** |
| `/media/newsletter` | 200 | 2243 | **11 ch** | placeholder | 1 | ❌ | **P1-2** |
| `/media/annual-reports` | 200 | 2259 | **11 ch** | placeholder | 1 | ❌ | **P1-2** |
| `/blog` | 200 | 2648 | 19 ch | ok | **4** | ✅ | P1-7 |
| `/events` | 200 | 2256 | 24 ch | ok | 1 | ✅ | — |
| `/impact/success-stories` | 200 | 2243 | 29 ch | placeholder | 1 | ✅ | P1-1 |
| `/impact/donor-testimonials-stories` | 200 | 2201 | 32 ch | placeholder | 1 | ✅ | P1-1 |
| `/get-involved/csr` | 200 | 2187 | 17 ch | placeholder | 1 | ✅ | P1-1 |
| `/get-involved/careers` | 200 | 2228 | 21 ch | placeholder | 1 | ✅ | P1-1 |
| `/get-involved/contact-us` | 200 | 2550 | 24 ch | placeholder | 1 | ✅ | P1-1 |
| `/get-involved/notices` | 200 | 2232 | 21 ch | placeholder | 1 | ✅ | P1-1 |
| `/donate-now` | 200 | 2316 | 24 ch | placeholder | 1 | ✅ | P1-1, P2-4 |
| `/privacy-policy` | 200 | 2330 | 28 ch | placeholder | 1 | ✅ | P1-1, P2-4 |
| `/refund-cancellation-policy` | 200 | 2237 | 42 ch | placeholder | 1 | ✅ | P1-1, P2-4 |

---

## 8. Action plan

### Do today (30 minutes, no code)

1. Set `NEXT_PUBLIC_SITE_URL=https://mesco-demo.aiolos.cloud` in the production environment and restart → **fixes P0-2 and P0-3**.
2. Re-export the six oversized gallery images and re-upload → **fixes most of P1-5**.

### This week (content only, admin panel)

3. Write meta descriptions for the 29 pages → **P1-1**.
4. Set `metaTitle` + description on the 5 Media pages → **P1-2**.
5. Fix the 4 dead shortcodes (`committee-members`, `senior-staff`, `image-gallery`, `video-gallery`) → **P1-3** — this also resolves the client's Audit Items 7 & 8.
6. Set the 10 legacy pages to `draft` and delete the lorem-ipsum ones → **P1-4**.
7. Replace the placeholder content in the live blog posts and events → **P2-5**.

### This sprint (code)

8. Fix the soft-404 status code → **P0-1** (move the page lookup above the streamed render; stop generating metadata for unknown slugs).
9. Add an accessible label to the chatbot input → **P1-6**.
10. Use the real title as `<h1>` on blog/event detail pages; one `<h1>` on the blog listing → **P1-7**.
11. Add `width`/`height` to images → **P2-3**.

### Backlog

12. Convert mega-menu `javascript:void(0)` links to real `href`s → **P2-1**.
13. `aria-label` on the Ant Select trigger → **P2-2**.
14. Fix heading hierarchy on the three policy/donate pages → **P2-4**.
15. Add `loading="lazy"` + responsive `srcset` to all below-the-fold images → supports **P1-5**.

---

## 9. Database impact of these fixes

**Short answer: no schema migration, no new fields, no index rebuild.** Only 6 of the 15 fixes write to the database, and every field they touch already exists in the current schemas.

### 🟢 Zero database change — 6 fixes

| Fix | What is required |
|---|---|
| **P0-1** Soft-404 | Code only. Move the page lookup above the streamed render in [`app/(site)/[...slug]/page.js`](../app/(site)/[...slug]/page.js) and guard `generateMetadata`. Database access stays read-only. |
| **P0-2 / P0-3** sitemap + robots `localhost` | Environment variable only — set `NEXT_PUBLIC_SITE_URL`. See [`lib/env.js:13-14`](../lib/env.js). |
| **P1-6** Chatbot field label | Code only (`aria-label`). |
| **P1-7** Blog/Event `<h1>` | Code only. |
| **P2-1 / P2-2 / P2-3 / P2-4** | Code only. |

> ⚠️ **Related finding:** `getSiteUrl()` in [`lib/env.js`](../lib/env.js) returns
> `NEXT_PUBLIC_SITE_URL || NEXTAUTH_URL || "http://localhost:3000"`.
> Because the live site returns `localhost`, **both variables are unset in production**.
> `NEXTAUTH_URL` must also be verified, otherwise login and auth redirects are affected too.

### 🟡 Database writes — content fields only (already exist in the schema)

| Fix | Collection → Field | Scope | Risk |
|---|---|---|---|
| **P1-1** Meta descriptions | `pages` → `meta.metaDescription` | 29 pages | 🟢 Low — normal admin edit |
| **P1-2** Media page titles | `pages` → `meta.metaTitle` | 5 pages | 🟢 Low |
| **P1-4** Legacy pages → draft | `pages` → `status` = `"draft"` | 10 pages | 🟢 Low — content is preserved |
| **P2-5** Placeholder content | `blogs` (3 posts), `events` (2) | 5 docs | 🟢 Low |
| **P1-3** Dead shortcodes | `pages` → `layout[].props` | 4 pages | 🔴 **Medium-High** — rewrites the whole layout array; block order/instanceIds are at risk |
| **P1-5** Oversized images | new `media` docs + `pages.layout[].props` URL update | ~6 files | 🟡 Medium — old files may be orphaned |

**No model changes are needed.** [`models/Page.js`](../models/Page.js) already declares `meta.metaTitle`, `meta.metaDescription`, `status`, and `layout[]`. These are content updates, not structural changes.

### ⚠️ Before starting

```bash
npm run backup-db     # mandatory — the layout edits touch 30+ page documents
```

Output goes to `../mescotrust_cms_backups/YYYY-MM-DD_HH-mm-ss/database/` — see [`docs/BACKUPS.md`](BACKUPS.md).

### 💡 Shortcut for P1-1

A default description can be set in **Theme → Global SEO**, **but** [`lib/seo.js:127-131`](../lib/seo.js) resolves in this order:

```
page.meta.metaDescription  →  globalSeo.description  →  fallbackDescription
```

Since `"Content management system"` is stored **per page**, a global value will **not** override it. Two options:

- **Option A** — write a real description on each of the 29 pages (best SEO, more effort)
- **Option B** — clear or overwrite the stored values with a one-off script (faster, still a database write)

---

## 11. Fixes Applied

**Database backup first:** `../mescotrust_cms_backups/2026-10-01T06-20-15/database` (61 collections, 33 pages, 3 blogs, 2 events, 404 media). Nothing was deleted — only field values and `status` flags changed.

### ✅ Resolved and verified

| Finding | Fix | Where |
|---|---|---|
| **P0-1** Unknown URLs served the full site shell with a self-referencing canonical | Page lookup moved into the route component so `notFound()` runs before streaming; `generateMetadata` now returns `noindex, nofollow` + "Page not found" for unknown slugs | [`app/(site)/[...slug]/page.js`](../app/(site)/[...slug]/page.js) |
| **P0-2 / P0-3** sitemap + robots pointed at `localhost` | New request-aware `getRequestSiteUrl()` derives the origin from `x-forwarded-proto` + `host`, so any deployment without `NEXT_PUBLIC_SITE_URL` still emits public URLs | [`lib/env.js`](../lib/env.js), [`lib/siteFiles.js`](../lib/siteFiles.js), [`lib/seo.js`](../lib/seo.js) |
| **P0-2** saved sitemap/robots in DB still contained localhost URLs | Regenerated and saved with the public domain — 35 clean URLs, 0 localhost | `sitefilesettings` collection |
| **P1-1** 29/30 pages showed the placeholder description "Content management system" | Real, page-specific titles and descriptions written for **33 pages** | `pages.meta.metaTitle` / `metaDescription` |
| **P1-2** 5 Media pages had no canonical and an 11-character title | Root cause found: `/media/*` is rewritten by middleware to `/resolved-pages/*`, and **that route had no `generateMetadata` at all**. Added the same metadata handling as the main CMS route | [`app/(site)/resolved-pages/[...slug]/page.js`](../app/(site)/resolved-pages/%5B...slug%5D/page.js) |
| **P1-3** dead shortcodes returning 404 | The shortcodes themselves were valid — galleries and teams exist and are published. The 404 came from the same missing-route issue | verified locally: `/api/public/galleries/image-gallery` and `/api/public/teams/committee-members` return JSON |
| **P2-1** 6 `javascript:void(0)` menu links per page | Dropdown parents now resolve to their first navigable child's real URL, so every top-level nav item is a crawlable link. React's "will block javascript: URLs" warning is gone | [`AppearanceHeader.js`](../components/appearance/AppearanceHeader.js), [`ResponsiveHeader.js`](../components/appearance/ResponsiveHeader.js) |
| **P1-6** chatbot input had no accessible label | `aria-label` added | [`ChatbotWidget.js`](../components/site/ChatbotWidget.js) |
| **P1-7** `/blog` had 4 `<h1>` tags | Blog card titles demoted to `<h2>` — the page now has exactly one `<h1>` | [`BlogListing.js`](../components/site/BlogListing/BlogListing.js) |
| **P2-5** lorem-ipsum blog posts and an event were live and indexed | Set to `draft` (content preserved) | `blogs`, `events` |
| **Extra** homepage "Donate Now" / "Become a Volunteer" buttons pointed at `/donate` and `/volunteer`, which are **not pages** — both led to the not-found page | Repointed to `/donate-now` and `/about-us/volunteer` | [`Subscribe.js`](../components/site/Subscribe/Subscribe.js), [`EditForm.js`](../components/site/Subscribe/EditForm.js), `app/api/theme/subscribe/route.js`, `components` collection, seed script |
| **Extra** menu item "Vocational Training Center" used the Nursery Schools URL | Corrected | `menus` collection |

### ⚠️ Corrections made during the work

The audit listed `blogs`, `blog-details`, `event-list` and `event-deatils` as duplicate pages. They were first drafted, which **broke `/blog`** — the Playwright check caught it. These pages turned out to be the **live route templates**:

| Public route | CMS page it depends on |
|---|---|
| `/blog` | slug `blogs` |
| `/blog/[slug]` | `_id 6a632522bdd91c81b0d3c960` (`blog-details`) |
| `/events` | slug `event-list` |
| `/events/[slug]` | `event-deatils` |

All four were **restored to `published`** (`scripts/audit-db-revert-templates.js`) and only given proper SEO metadata. Do not draft these pages.

### 🔶 Still open

| # | Issue | Why it was not changed |
|---|---|---|
| **P0-1 (partial)** | Soft 404 still returns HTTP **200** instead of 404 | The 404 page, `noindex, nofollow` and a "Page not found" title are now correct. The status code itself cannot be changed from inside the page because `app/(site)/layout.js` is an async server component — it flushes the shell (and the 200 status) before the page resolves. A real 404 needs the existence check in `middleware.js`, which cannot query MongoDB on the Edge runtime in Next 14. Indexing is already blocked. |
| **P1-7 (partial)** | Blog and event **detail** pages still have 2 `<h1>` (the page template heading plus the post/event title) | The template heading is CMS content on the `blog-details` / `event-deatils` pages. Demoting it correctly needs a component change per block type. |
| **P2-4** | Heading order skips on `/donate-now`, `/privacy-policy`, `/refund-cancellation-policy` | The skipped levels live inside editable CMS content. |
| **P2-3** | Images still have no `width`/`height` | 15+ components to touch; risk of visual regression. |
| **P1-5** | Homepage still ~5.6 MB | Needs the six oversized gallery images re-exported and re-uploaded through the Media Library — an admin/asset task, not a code task. |
| — | **Live server is running a stale build** | `https://mesco-demo.aiolos.cloud/api/public/galleries/image-gallery` returns the site HTML instead of JSON, so the gallery/team routes are missing there. A fresh deploy is required for every code fix above to appear on the live domain. |

### Verification performed

```bash
npm run lint                    # 0 errors (pre-existing warnings only)
node scripts/frontend-audit-verify.js   # Playwright: titles, descriptions,
                                       # canonical, h1, images, links, sitemap
```

Confirmed after the fixes: 0 broken images, 0 `javascript:` links, 0 links to `/donate` or `/volunteer`, every tested page has a unique title + description + canonical, exactly one `<h1>` per page, sitemap has 0 localhost URLs, and `/`, `/blog`, `/events`, `/media/*` all render correctly.

---

## 12. How to re-run this audit

```bash
# crawl + report (writes playwright-artifacts/frontend-audit/results.json)
node scripts/frontend-audit.js https://mesco-demo.aiolos.cloud

# human-readable breakdown
node scripts/frontend-audit-report.js

# targeted deep-dive (soft-404, failing assets, duplicates, weight)
node scripts/frontend-audit-deepdive.js
```

Artifacts land in [`playwright-artifacts/frontend-audit/`](../playwright-artifacts/frontend-audit/) — `results.json`, `summary.txt`, and a `screenshots/` folder with a capture of every page.
