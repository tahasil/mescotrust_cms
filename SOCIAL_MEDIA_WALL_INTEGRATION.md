# Social Media Wall Integration

**Goal:** Add a real-time social media wall on the In Media page (or any page via PageBuilder). Allow users to view posts, images, and captions directly within embedded feeds. Include a "Follow Us" button linking to MESCO's official social media profiles.

**Reference:** Existing MESCO site ([Headlines page](https://www.mescotrust.org/Headlines.aspx?id=3)) links to Instagram, Facebook, LinkedIn, YouTube, WhatsApp, X (Twitter), Google Maps.

---

## 1. CSP & Security Prerequisites

**Current state:** `next.config.js` sets `frame-src` to only allow `youtube.com`, `google.com`, `maps.google.com`. Instagram, Facebook, and Twitter iframe domains are **blocked by CSP**. The existing `SafeHtml` component (DOMPurify) does **not** allow `<iframe>` tags.

- [ ] **Update CSP `frame-src`** in `next.config.js` — add required domains:
  ```
  frame-src 'self'
    https://www.youtube.com https://youtube.com
    https://www.youtube-nocookie.com
    https://www.google.com https://maps.google.com
    https://www.instagram.com https://instagram.com
    https://www.facebook.com https://web.facebook.com
    https://platform.twitter.com https://syndication.twitter.com
  ```
- [ ] **Update CSP `script-src`** — add platform embed script origins:
  ```
  script-src 'self' 'unsafe-eval' 'unsafe-inline'
    https://www.instagram.com
    https://platform.twitter.com
    https://connect.facebook.net
  ```
- [ ] **YouTube privacy** — use `youtube-nocookie.com` for embeds (matches existing `Embed.js` and `Video.js` pattern in this codebase)

---

## 2. New `SocialMediaWall` Site Component

- [ ] **Barrel export** — `components/site/SocialMediaWall/index.js`

- [ ] **Display component** — `components/site/SocialMediaWall/SocialMediaWall.js`
  - Embedded social feeds using official platform embed widgets
  - Helper `platformToIframeSrc(platform, url)` auto-converts known URL patterns:
    - Instagram: `instagram.com/p/ABC/` → `instagram.com/p/ABC/embed/`
    - Facebook: page URL → `facebook.com/plugins/page.php?href=...&tabs=timeline`
    - YouTube: video/playlist URL → `youtube-nocookie.com/embed/...` (privacy-enhanced)
    - Twitter/X: no iframe conversion (uses script-based embed only)
  - **Embed code support**: if admin pastes raw HTML embed code, render directly (admin-only input, no public user input — acceptable trust level)
  - **"Follow Us" section** reusing existing `SocialLinksBlock` component
  - **Loading state**: skeleton placeholder per embed card while iframe loads (`onLoad` handler)
  - **Error fallback**: if embed fails, show platform icon + "View on [Platform]" link instead of blank space
  - **Lazy loading**: all iframes use `loading="lazy"` + `Intersection Observer` to defer off-screen embeds
  - **Accessibility**: each iframe gets `title` attribute (e.g. "Instagram post by MESCO Trust")
  - **Max embeds**: cap at 12 items to prevent performance degradation
  - **Platform script management**: `useEffect` loads `instagram.com/embed.js` and `platform.twitter.com/widgets.js` only when needed, checks for existing globals before injecting, calls `.process()` / `.load()` on re-renders
  - Responsive grid: `<Row gutter={[24,24]}>` with `<Col xs={24} sm={12} md={colSpan}>`

- [ ] **Admin EditForm** — `components/site/SocialMediaWall/EditForm.js`
  - 4 Collapse panels: Manage Section, Title & Colors, Manage Embeds, Follow Us
  - **Manage Embeds**: `SortableFormList` with:
    - Platform select (Instagram / Facebook / YouTube / X Twitter / Custom)
    - Title input
    - Embed URL input with helper text per platform (e.g. "Paste Instagram post URL")
    - Embed code textarea (optional — overrides URL if provided)
    - Aspect ratio select: Square 1:1 / Landscape 16:9 / Standard 4:3 / Portrait 9:16
    - Column span select: 1/3 width (8) / 1/2 width (12) / Full width (24)
    - Enabled switch (toggle without deleting)
    - **URL validation**: basic pattern check for known platforms (must contain `instagram.com`, `facebook.com`, etc.)
  - **Follow Us**: enable switch, title, variant/size/align selects, sortable links with platform/url/color
  - **7 platforms supported**: Instagram, Facebook, LinkedIn, YouTube, WhatsApp, X (Twitter), Google Maps
  - **Button style**: gradient card buttons (icon + label) matching MESCO portal design, not just small circle icons

---

## 3. Embed Strategy per Platform

| Platform | Admin Provides | Rendered As | CSP Domain Required |
|----------|---------------|-------------|---------------------|
| Instagram | Post/reel URL or `<blockquote>` embed | iframe via `instagram.com/p/.../embed/`, or raw HTML + `embed.js` | `www.instagram.com` |
| Facebook | Page URL or Page Plugin `<iframe>` code | iframe via `facebook.com/plugins/page.php?href=...&tabs=timeline` | `www.facebook.com` |
| YouTube | Video/playlist URL | iframe via `youtube-nocookie.com/embed/...` (privacy-enhanced) | `www.youtube-nocookie.com` |
| X/Twitter | `<a class="twitter-timeline">` embed code | Raw HTML + `platform.twitter.com/widgets.js` script | `platform.twitter.com`, `syndication.twitter.com` |
| Custom | Any iframe URL or embed HTML | iframe with `sandbox` attribute | Depends on source |

**Important notes:**
- Twitter/X does **not** support simple URL → iframe conversion. Admin must paste the official embed code from Twitter's "Embed Timeline" tool.
- Custom embeds use stricter `sandbox="allow-scripts allow-same-origin allow-popups"` for isolation.
- All iframes include `referrerpolicy="no-referrer-when-downgrade"`.

---

## 4. Props Structure

**Prefix:** `socialMediaWall`

```
── ManageSection fields (bg, padding, margins — auto via prefix) ──

mainTitle: "Social Media Wall"
subTitle: ""
socialMediaWallTitleEnabled: true
socialMediaWallSubTitleEnabled: true
titleColorKey: ""
socialMediaWallSubTitleColorKey: ""

── Embeds ──

socialMediaWallEmbeds: [
  {
    platform: "instagram" | "facebook" | "youtube" | "twitter" | "custom",
    title: "Instagram Feed",
    embedUrl: "",           // URL — auto-converted to iframe src
    embedCode: "",          // raw HTML embed code (overrides URL if present)
    aspectRatio: "1:1",     // "1:1" | "16:9" | "4:3" | "9:16"
    colSpan: 8,             // 8 = 1/3, 12 = 1/2, 24 = full
    enabled: true
  }
]

── Follow Us ──

socialMediaWallFollowEnabled: true
socialMediaWallFollowTitle: "Follow Us"
socialMediaWallFollowTitleColorKey: ""
socialMediaWallFollowVariant: "filled"    // "filled" | "outline" | "rounded"
socialMediaWallFollowSize: 40
socialMediaWallFollowAlign: "center"
socialMediaWallFollowLinks: [
  { platform: "instagram",  url: "", color: "#E4405F" },
  { platform: "facebook",   url: "", color: "#1877F2" },
  { platform: "linkedin",   url: "", color: "#0A66C2" },
  { platform: "youtube",    url: "", color: "#FF0000" },
  { platform: "whatsapp",   url: "", color: "#25D366" },
  { platform: "twitter",    url: "", color: "#000000" },
  { platform: "googlemaps", url: "", color: "#4285F4" }
]
```

---

## 5. Registration (existing files to modify)

- [ ] **`lib/siteComponentRegistry.js`** — Add `"SocialMediaWall"` to `SITE_COMPONENT_IDS`
- [ ] **`components/site/index.js`** — Add export + `EDITABLE_SITE_EDIT_FORMS` entry
- [ ] **`lib/titleAndColorsConfig.js`** — Add `SocialMediaWall` title/color config

No new API route needed — the existing dynamic route at `app/api/theme/[componentId]/route.js` handles it.

---

## 6. Files Summary

| Action | Path | Purpose |
|--------|------|---------|
| **Modify** | `next.config.js` | Add Instagram, Facebook, Twitter to CSP `frame-src` and `script-src` |
| Create | `components/site/SocialMediaWall/index.js` | Barrel export |
| Create | `components/site/SocialMediaWall/SocialMediaWall.js` | Public display (embeds + follow us) |
| Create | `components/site/SocialMediaWall/EditForm.js` | Admin edit form (4 panels) |
| Modify | `lib/siteComponentRegistry.js` | Add to `SITE_COMPONENT_IDS` |
| Modify | `components/site/index.js` | Add exports + `EDITABLE_SITE_EDIT_FORMS` |
| Modify | `lib/titleAndColorsConfig.js` | Add title/color config |

---

## 7. Responsive Layout

| Breakpoint | Embeds Grid | Follow Us |
|-----------|-------------|-----------|
| Desktop (md+) | Per `colSpan` (e.g. 3 x 1/3 width) | Flexbox row, centered |
| Tablet (sm) | 2 columns (span=12 each) | Flexbox row, wraps |
| Mobile (xs) | Single column (span=24) | Flexbox row, wraps |

---

## 8. Existing Code to Reuse

| What | File | Usage |
|------|------|-------|
| `SocialLinksBlock` | `components/cms/blocks/SocialLinks.js` | Reference for platform icons (Follow Us will use custom gradient card buttons instead) |
| `ManageSectionFields` | `components/admin/ManageSectionFields.js` | Section bg/padding/margins |
| `SortableFormList` | `components/admin/SortableFormList.js` | Drag-reorderable embed & link lists |
| `TitleAndColorsSection` | `components/admin/TitleAndColorsSection.js` | Title & color picker UI |
| `getManageSectionInitialValues/Payload` | `lib/manageSectionFields.js` | Section field serialization |
| `getTitleAndColorsConfig` | `lib/titleAndColorsConfig.js` | Component-specific config |
| `FullWidthBackground, PageContainer, MainTitle, SubTitle, getColor` | `styles/Theme.js` | Themed layout wrappers |
| `youtube-nocookie.com` pattern | `components/cms/blocks/Embed.js`, `Video.js` | Privacy-enhanced YouTube |

---

## 9. Edge Cases & Known Risks

1. **Ad-blockers** — May block social media iframes/scripts. Error fallback UI ensures the section doesn't appear broken (shows "View on [Platform]" link instead).
2. **Platform API changes** — Embed URL patterns may change. `platformToIframeSrc()` has a generic passthrough fallback.
3. **Multiple script loads** — Instagram `embed.js` and Twitter `widgets.js` are loaded once globally, with `.process()` / `.load()` called on re-renders to handle dynamically added content.
4. **Hydration** — Component is `"use client"`, so embed HTML only renders client-side, avoiding SSR mismatches with injected platform scripts.
5. **Facebook width** — Facebook Page Plugin requires a `width` param. Pass `width=340` (auto-adjusts within container).

---

## Done When

- [ ] CSP headers updated — Instagram, Facebook, Twitter embeds not blocked by browser
- [ ] SocialMediaWall component available in PageBuilder block picker
- [ ] Admin can configure embeds (Instagram, Facebook, YouTube, X/Twitter, custom) with URL or embed code
- [ ] Admin can configure Follow Us links with platform icons
- [ ] Public page renders embedded feeds responsively (3-col desktop, 2-col tablet, 1-col mobile)
- [ ] Loading skeleton shown while embeds load; error fallback if embed fails
- [ ] Follow Us icons link to MESCO's official social profiles
- [ ] YouTube uses `youtube-nocookie.com` (privacy-enhanced, matching existing codebase pattern)
