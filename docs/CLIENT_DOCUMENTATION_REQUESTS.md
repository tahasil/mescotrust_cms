# MESCO Trust CMS — Client Documentation / Flow Requests

Source: `MESCO_QA_Full_Audit_Report_17-23.pdf` (QA audit, 17–23 Sep 2026)
Purpose: list of **flow documents / SOPs** the client needs from the development team,
mapped to the audit items that triggered them.

Legend:
- **A** = Write now (client is already blocked / asked "how do I do this?")
- **B** = Write after the fix/feature ships (documentation must match delivered behaviour)

---

## Category A — Write now (documentation gaps)

| # | Document to deliver | Audit item(s) | What it must cover | Existing coverage |
|---|---|---|---|---|
| 1 | ✅ **Page Publishing SOP** — "Draft → Preview → Publish → Unpublish" | **Item 21** (CMS/Documentation Question: *How to publish a page*), Item 15 | Exact click-path to publish, Draft vs Published behaviour, Preview link (who can see it), "Saved" vs "Published" states, why a page returns 404 to visitors, how to unpublish/hide without deleting, who is allowed to publish | **DELIVERED** — [`docs/admin-manual/12-page-publishing.md`](docs/admin-manual/12-page-publishing.md) written and linked from [`docs/admin-manual/README.md`](docs/admin-manual/README.md) and [`docs/admin-manual/02-pages.md`](docs/admin-manual/02-pages.md) |
| 2 | **"My Changes Are Not Showing" Troubleshooting Guide** | **Item 15** (Components/CMS Bug: changes in Components not reflected in page view), Item 3, Item 6, Item 16 | The #1 support ticket generator. Must explain: (a) Save Page is required after block edits, (b) reusable/global components saved once update **every** page, (c) draft vs published cache, (d) hard refresh, (e) how to take a screenshot/report properly | **Missing entirely** |
| 3 | **Reusable Components & Shortcodes Guide** | **Item 7** (Process Note: slider was edited via a shortcode), **Item 8** (Bug: after the shortcode edit, "Homeslider" no longer found in Components), Item 15 | What is a reusable/global component vs a per-page block; the 3 ways to edit the same content (Components module, page block, shortcode); **why a component disappears from the Components list once embedded via shortcode**; shortcode copy/paste rules; which component types are global | **Missing** for the client — only [`docs/admin-manual/09-reusable-components.md`](docs/admin-manual/09-reusable-components.md) exists |
| 4 | **Photo / Video Gallery User Guide** | **Item 14** (Bug/Question: *Unclear whether the gallery page updates on image upload — panel has no image add/remove option*) | Create gallery → choose Image/Video type → add/remove/reorder albums & images → set ★ Feature (homepage feed) → publish → embed on a page via shortcode → how to delete/reorder. Must state explicitly: **yes, the public gallery updates on save**. | **Missing** — [`docs/GALLERY_MANAGEMENT_PLAN.md`](docs/GALLERY_MANAGEMENT_PLAN.md) is a dev/architecture plan, not a client guide |
| 5 | **Media Upload & Image Size Reference Sheet** | **Item 1** (Bug: auto-crop dialog *doesn't give the exact size the post needed*), **Item 17** (Bug: forced dimensions/crop, needs compress/fit option) | One printable table: **section name → exact required pixel size (desktop + mobile)**, crop vs fit explanation, accepted formats, max file size, "why your image was cropped" | Data exists in [`docs/DYNAMIC_IMAGE_CROP_AND_VALIDATION_GUIDE.md`](docs/DYNAMIC_IMAGE_CROP_AND_VALIDATION_GUIDE.md) but is written for developers — needs a client-facing distilled version |
| 6 | **Newsletter & Annual Reports Publishing Guide** | **Item 22** (Bug: Newsletter page is not showing), **Item 17** (Newsletter image cropping) | How to add a newsletter/report card (title, date, tag, cover image, PDF link), how to make the `/media/newsletter` listing page appear in the menu, how to archive an old issue, PDF upload rules | **Missing** |
| 7 | **Donation Flow & Donor Verification SOP** | **Items 18, 19, 20** (Donation amount increment; auto-open Zakat/Interest Money/Purpose after phone lookup; keep only Email & Mobile in "Verify Identity to Unlock Full Details") | Donor lookup by phone/email, which fields are auto-filled vs editable, exactly when identity verification is mandatory, Zakat / Interest Money / Purpose of Donation field rules, amount increment behaviour, admin-side reconciliation & receipt handling | Only internal flow exists in [`docs/TECHNICAL_DESIGN.md`](docs/TECHNICAL_DESIGN.md) §4 — no client SOP |
| 8 | **Managing Committee / Team Management Guide** | **Item 13** (Bug: Team Section sidebar shows only 4 members), **Item 12** (Verified Working) | Where committee members live, add/edit/remove, the **sidebar 4-member display rule** (why only 4 show), how to split Trustees / Committee / Leadership / Advisors, which page/block renders which list | Partially in [`docs/admin-manual/09-reusable-components.md`](docs/admin-manual/09-reusable-components.md); sidebar limit rule is undocumented |
| 9 | **Roles & Permissions Guide** | **Part 1 §1** — audit tested **Editor vs Author** | Full role matrix (Admin / Editor / Author) — who sees which menu, who can publish, who can delete, who can manage users/theme/media. Note: the current admin manual documents **only Admin + Editor**, so the **Author** role is undocumented | **Outdated** — [`docs/admin-manual/README.md`](docs/admin-manual/README.md) + [`docs/admin-manual/08-key-settings.md`](docs/admin-manual/08-key-settings.md) list 2 roles only |
| 10 | **Menu / Navigation Quick Guide** | **Items 9, 10** (Process Note + Verified Working — client added a navbar item manually) | Add/rename/reorder/delete menu items, dropdown sub-menus, internal vs external links, open-in-new-tab, header vs footer menu, "I added an item but it doesn't show" | Partial — [`docs/admin-manual/08-key-settings.md`](docs/admin-manual/08-key-settings.md); needs a standalone one-pager |
| 11 | **Known Issues & First-Level Support FAQ** | **Items 3, 6, 16, 23, 25** (Slider behind navbar; "Be someone's tomorrow" glitch; page auto-scrolling up/down; 404 page UX; scroll-to-top) | For each open item: what the client sees, whether a fix is in progress, and a **workaround** the client can apply today. Also: how to log a bug (URL, admin page, screenshot, exact steps) | **Missing entirely** |

---

## Category B — Write after the fix / feature is delivered

| # | Document to deliver | Audit item(s) | Notes |
|---|---|---|---|
| 12 | **Careers & CV Submission Guide** | **Item 24** (Feature Request: Careers page with CV upload + admin submissions review) | Document only after the module ships. Must cover: create job, applicant CV upload, admin review/approve/reject inbox, notification flow. Note [`docs/admin-manual/09-reusable-components.md`](docs/admin-manual/09-reusable-components.md) currently states CV upload **does not exist** — that line must be updated. |
| 13 | **Form Builder & Public Sharing Guide** | **Item 11** (Feature Request: public link copy option so forms can be shareable) | Document after the public-link/share feature lands: create form → get public link → share → track submissions in the inbox. |
| 14 | **Image Fit/Compress (No-Crop) Option Guide** | **Item 17** (Feature Request: compress/fit full image instead of force-cropping) | Document the new "Fit" vs "Crop" toggle and when to use each, once implemented. |
| 15 | **Video Section / Autoplay Guide** | **Item 5** (Feature Request: autoplay video on scroll into view), Item 4 (CSR partner logos always full-colour & larger) | Small addendum to the components reference rather than a standalone document. |
| 16 | **Accessibility & Contrast Statement** | **Part 1 §4** — 9 pages / 109 elements with WCAG AA contrast failures, 2 pages missing accessible labels | Not a "how-to" doc, but a client-facing **statement of what was fixed** (Donate Now button ratio, donation amount text colour, form field labels, heading order) so the client can re-verify. |

---

## Items that need **no documentation** (pure development work)

These are defects/enhancements to be fixed in code and need only a release note:

- **Item 1, 3, 6, 16** — Homepage slider positioning, "Be someone's tomorrow" glitch, auto-scroll animation glitch
- **Item 2, 10, 12** — Verified Working (already proven, nothing to document)
- **Item 4, 5, 18, 19, 20, 23, 25** — Feature/UI requests to be implemented; documented only after delivery

---

## Recommended delivery order

1. ✅ **Page Publishing SOP** (Item 21 — the client's explicit question) — **DONE**
2. **"My Changes Are Not Showing" guide** (Item 15 — highest ticket volume risk)
3. **Reusable Components & Shortcodes Guide** (Items 7, 8)
4. **Photo/Video Gallery User Guide** (Item 14)
5. **Media Upload & Image Size Reference Sheet** (Items 1, 17)
6. **Roles & Permissions Guide** (Part 1 §1 — refresh existing docs)
7. **Newsletter & Annual Reports Guide** (Items 17, 22)
8. **Donation Flow & Donor Verification SOP** (Items 18, 19, 20)
9. **Menu/Navigation + Committee guides** (Items 9, 10, 13)
10. **Known Issues & Support FAQ** (continuous — update with every release)
