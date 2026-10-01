# MESCO Trust CMS — Audit Point Verification Report

Source: `MESCO_QA_Full_Audit_Report_17-23.pdf`
Verified against: current codebase (`main`, HEAD = `28be729 documents`)
Method: code inspection + git history (commits made after the 17–23 Sep audit window)

---

## Summary

| Status | Count | Items |
|---|---|---|
| ✅ **DONE** | 17 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 17, 18, 19, 20, 21, 23, 24, 25 |
| 🟡 **NEEDS LIVE RE-TEST** | 3 | 13, 15, 22 |
| ❌ **STILL PENDING** | 2 | 11, 16 |
| 🚫 **IGNORED BY CLIENT** | 1 | 14 |
| ⚪ **Already working at audit time** | 3 | 2, 10, 12 |

---

## ✅ DONE — 17 items

| # | Audit point | Evidence in codebase | Commit |
|---|---|---|---|
| **1** | Media crop dialog doesn't give exact size | [`components/admin/media/RasterCropConfirmModal.js`](components/admin/media/RasterCropConfirmModal.js) now renders `allowedSizes` as clickable preset buttons (`1240 × 480`) and a *"Reset to required (W × H)"* link | `b71e928` |
| **2** | Popup editing | [`components/admin/Popups/PopupEditorPage.js`](components/admin/Popups/PopupEditorPage.js) — working at audit time | — |
| **3** | Slider appears behind navbar | Header/slider z-index + layout fix in [`components/site/HomeSlider/HomeSlider.js`](components/site/HomeSlider/HomeSlider.js) | `2f65787`, `1bc7fff` |
| **4** | CSR partner logos bigger + full colour always | [`components/site/Marquee/Marquee.js:81-89`](components/site/Marquee/Marquee.js) — `filter: grayscale(1)` and `opacity: 0.72` are now **commented out**, `max-width: 190px` | `9cd2497` |
| **5** | Video autoplay on scroll into view | [`components/site/VideoPlaying/VideoPlaying.js:154-160`](components/site/VideoPlaying/VideoPlaying.js) — `IntersectionObserver` sets `setVideoPlaying(true)` | `6467386` |
| **6** | Glitch in "Be someone's tomorrow" | [`components/site/Subscribe/Subscribe.js`](components/site/Subscribe/Subscribe.js) clip-path animation fixed | `0b2e76c` |
| **7** | Slider edited via shortcode | Documented — [`docs/admin-manual/13-home-slider.md`](docs/admin-manual/13-home-slider.md) | `eb5ac8d` |
| **8** | Homeslider not found in Components | [`app/admin/(authenticated)/sliders/page.js:9`](app/admin/(authenticated)/sliders/page.js) hardcodes `SLIDER_COMPONENT_IDS` incl. `HomeSlider`, so it always appears | `eb5ac8d` |
| **9** | Navbar add-item flow | Documented — [`docs/admin-manual/14-navigation-menu.md`](docs/admin-manual/14-navigation-menu.md) | — |
| **10** | New navbar item added | [`app/admin/(authenticated)/menus/page.js`](app/admin/(authenticated)/menus/page.js) — working at audit time | — |
| **12** | Committee list displays correctly | Team + Committee modules built ([`models/Team.js`](models/Team.js)) | `2a6e4ce`, `b7eaf08`, `6c8a80a` |
| **17** | Newsletter image forced crop → fit option | Newsletter fit-to-image implemented | `5bd619a` |
| **18** | Donation amount increment option | [`components/site/DonateNow/DonateNow.js:781`](components/site/DonateNow/DonateNow.js) — `handleQuickAddAmount(increment)` | `31c458b` |
| **19** | Auto-open Zakat/Interest/Purpose without verification | [`DonateNow.js:422`](components/site/DonateNow/DonateNow.js) — `canUseDonationFields = isDonorTypeSelected && (!isExistingDonor \|\| lookupState.found)`. Verification is only required to **edit** profile fields (`canEditProfileFields` requires `lookupState.verified`) | `ce9c922` |
| **20** | Verify panel — only Email & Mobile | [`DonateNow.js:1740-1800`](components/site/DonateNow/DonateNow.js) — `VerificationPanel` contains only `verifyEmail` + `verifyMobile`, heading *"Verify Identity to Edit Personal Details"* | `596f434` |
| **21** | How to publish a page | [`docs/admin-manual/12-page-publishing.md`](docs/admin-manual/12-page-publishing.md) + PDF | `0769e63`, `28be729` |
| **23** | 404 page UX | [`app/not-found.js`](app/not-found.js) — fully redesigned 380-line page (animated orbs, search, quick links) | `9c7f91d` |
| **24** | Careers CV upload + admin review | [`components/site/CareersUpload/CareersUpload.js:505`](components/site/CareersUpload/CareersUpload.js) (resume required), [`app/api/public/careers-upload/route.js`](app/api/public/careers-upload/route.js) (5 MB limit), [`app/api/admin/career-submissions/route.js`](app/api/admin/career-submissions/route.js) (list/review/delete), [`models/CareerSubmission.js`](models/CareerSubmission.js) | `36706ce`, `7025688` |
| **25** | Scroll to top | [`components/site/ScrollToTop.js`](components/site/ScrollToTop.js) — floating button, appears on scroll | `32f12af` |

---

## ❌ STILL PENDING — 2 items

### Item 11 — Forms: public link copy option
**Audit text:** *"Add a public link copy option so forms can be shared."*

**Finding:** Only a **shortcode** copy button exists — there is **no standalone public form URL or page**.

| Checked | Result |
|---|---|
| [`app/admin/(authenticated)/form-builder/page.js:160`](app/admin/(authenticated)/form-builder/page.js) | `CopyOutlined` → *"Copy shortcode"* only |
| [`app/admin/(authenticated)/form-builder/[formId]/edit/page.js:557`](app/admin/(authenticated)/form-builder/[formId]/edit/page.js) | `copyShortcode()` → `navigator.clipboard.writeText(snippet)` |
| Public form page route (e.g. `/form/[shortcode]`) | ❌ **Does not exist** |
| `GET /api/public/forms/[formId]` | ✅ Exists (API only — not a shareable page for visitors) |

**Status: PENDING** — needs a public form page route + a "Copy public link" button in the admin.

---

### Item 16 — Page auto-scrolls up and down repeatedly
**Audit text:** *"An animation glitch causes the page to auto-scroll up and down repeatedly every few seconds."*

**Finding:** No dedicated fix commit exists. The most likely culprit is still present:

| Suspect | Detail |
|---|---|
| [`components/site/Subscribe/Subscribe.js:30`](components/site/Subscribe/Subscribe.js) | `gsap ScrollTrigger` with `scrub: 1` on `.finaleFill` clip-path animation |
| [`components/site/HomeSlider/HomeSlider.js:126`](components/site/HomeSlider/HomeSlider.js) | `setInterval` autoplay (`homeSliderAutoplay`) |

Both already respect `prefers-reduced-motion`, but no scroll-jump guard (`ScrollTrigger.config({ ignoreMobileResize })`, scroll-lock, or animation pause on manual scroll) is present.

**Status: PENDING** — needs live reproduction to confirm, then a fix.

---

## 🟡 NEEDS LIVE RE-TEST — 3 items (cannot be confirmed from code alone)

| # | Audit point | Why code can't confirm | Related commits |
|---|---|---|---|
| **13** | Team Section sidebar shows only 4 members | Team is DB-driven ([`models/Team.js`](models/Team.js)); the "4" is a **page-block display limit / config value**, not hardcoded in a component | `2a6e4ce`, `b7eaf08`, `6c8a80a` |
| **15** | Changes in Components not reflected in page view | Caching / refresh behaviour — depends on browser + CDN + `no-store` headers at runtime | `091db76` (loader), `a754178` (search + admin back) |
| **22** | Newsletter page is not showing | `/media/newsletter` is a **CMS page** resolved by [`app/(site)/[...slug]/page.js`](app/(site)/[...slug]/page.js) — depends on DB record + menu link, not code | `5bd619a` |

---

## 🚫 IGNORED BY CLIENT — 1 item

| # | Audit point | Note |
|---|---|---|
| **14** | Gallery — unclear whether it updates on image upload | Client explicitly asked to ignore. Gallery work was done anyway ([`docs/GALLERY_MANAGEMENT_PLAN.md`](docs/GALLERY_MANAGEMENT_PLAN.md), commits `77cfa18`, `1c76579`, `e1b5470`) |

---

## Bonus — Part 1 accessibility (contrast) fixes

| Audit finding | Commit |
|---|---|
| Donate Now button 4.31:1 (one shade short of AA) | `86a01e6` (header button colours) |
| Donation amount text 3.34:1 on scheme cards | `058eca5` (donate card hover/active colours) |

Form-field accessible labels and heading order (Part 1 §4) — **no matching commit found; still pending.**

---

## Recommended next actions

1. **Item 11** — build a public form page route + "Copy public link" button (only clearly unimplemented feature request).
2. **Item 16** — reproduce on live site, then guard the GSAP ScrollTrigger scrub / slider autoplay against scroll-jumping.
3. **Item 13, 15, 22** — run a live re-test pass with the client to confirm or reject.
4. **Part 1 §4** — remaining accessibility fixes (form labels, heading order, re-verify contrast ratios).
