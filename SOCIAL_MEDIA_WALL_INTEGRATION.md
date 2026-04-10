# Social Media Wall Integration

**Goal:** Display a real-time social media wall on the In Media page (or any page via PageBuilder). Shows posts as a masonry card layout. Supports hybrid mode: manual posts + live auto-fetched posts from platform APIs.

**Reference:** MESCO Trust portal links to Instagram, Facebook, LinkedIn, YouTube, WhatsApp, X (Twitter), Google Maps.

---

## 1. Architecture (Hybrid)

```
Manual posts (admin DB)  ──┐
                           ├──► Merge + Display (masonry grid)
Live posts (platform APIs) ┘    Click card → modal with details
```

- **Manual posts**: admin adds posts via PageBuilder edit form (image, caption, username, date, postUrl)
- **Live posts**: server-side API route fetches from Instagram, Facebook, YouTube, X/Twitter using `.env` keys
- **Merge**: component fetches live posts on mount, combines with manual posts from props
- **Cache**: 30-minute in-memory TTL to avoid rate limits

---

## 2. Supported Platforms

| Platform | Live Fetch | Env Keys Required |
|----------|-----------|-------------------|
| Instagram | Yes | `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID` |
| Facebook | Yes | `FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID` |
| YouTube | Yes | `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` |
| X (Twitter) | Yes | `TWITTER_BEARER_TOKEN`, `TWITTER_USER_ID` |
| LinkedIn | Manual only | No public post API |
| WhatsApp | Manual only | No public post API |
| Google Maps | Manual only | No public post API |

All env keys are **optional**. No key = platform skipped silently. Manual posts always work.

---

## 3. Files

| Action | Path | Purpose |
|--------|------|---------|
| Created | `lib/socialMediaFetcher.js` | Server-side: fetch from platform APIs + 30min cache |
| Created | `app/api/public/social-wall/route.js` | Public GET endpoint: returns live posts |
| Created | `components/site/SocialMediaWall/index.js` | Barrel export |
| Created | `components/site/SocialMediaWall/SocialMediaWall.js` | Masonry display + modal |
| Created | `components/site/SocialMediaWall/EditForm.js` | Admin form (manual posts) |
| Created | `docs/admin-manual/11-social-media-wall.md` | Admin operations manual |
| Modified | `next.config.js` | CSP headers for platform domains |
| Modified | `lib/siteComponentRegistry.js` | Added to `SITE_COMPONENT_IDS` |
| Modified | `components/site/index.js` | Added export + `EDITABLE_SITE_EDIT_FORMS` |
| Modified | `lib/titleAndColorsConfig.js` | Added title/color config |
| Modified | `.env.example` | Added social media API key entries |

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

── Manual Posts ──

socialMediaWallPosts: [
  {
    platform: "instagram" | "facebook" | "linkedin" | "youtube" | "twitter" | ...,
    username: "@mescotrust",
    caption: "Post text...",
    image: "/uploads/post.webp",
    date: "14 Apr, 2025",
    postUrl: "https://...",
    enabled: true
  }
]
```

---

## 5. Display Component

- **Masonry layout** (CSS `column-count`): 5 cols desktop, 4 large tablet, 3 tablet, 2 small, 1 mobile
- **Card structure**: image (natural height) → platform SVG icon → username → caption → footer (badge + name + date)
- **Click card** → modal with full image, details, and "View on [Platform]" button
- **Live badge**: auto-fetched posts show red "LIVE" tag
- **SVG platform icons** for Instagram, Facebook, LinkedIn, YouTube, X/Twitter (proper brand icons, not emoji)

---

## 6. Live Fetch API

**`GET /api/public/social-wall`** (no auth)

Returns: `{ livePosts: [...], platforms: ["instagram", "youtube", ...] }`

Each live post normalized to:
```json
{
  "platform": "instagram",
  "username": "@mescotrust",
  "caption": "Post caption...",
  "image": "https://...",
  "date": "10 Apr, 2026",
  "postUrl": "https://instagram.com/p/...",
  "source": "live"
}
```

---

## 7. Cache Strategy

- In-memory Map in `lib/socialMediaFetcher.js`
- TTL: 30 minutes per platform
- If fetch fails → return stale cached data (never empty)
- `Promise.allSettled` — one platform failing doesn't block others

---

## 8. Edge Cases

1. **No API keys configured** → component works with manual posts only
2. **Token expired** → Instagram/Facebook tokens expire after 60 days. Console logs error, serves stale cache
3. **Rate limits** → YouTube gives 10,000 units/day (100 searches). Cache prevents excessive calls
4. **Ad-blockers** → may block API calls client-side, but fetching is server-side so unaffected
5. **API down** → stale cache served, manual posts always visible

---

## Done

- [x] CSP headers updated for social platform domains
- [x] SocialMediaWall component in PageBuilder
- [x] Manual posts: admin can add/edit/reorder posts with image, caption, platform, date, URL
- [x] Live posts: server-side fetching from Instagram, Facebook, YouTube, X/Twitter
- [x] Hybrid merge: manual + live posts displayed together in masonry grid
- [x] Click card → modal with full details + "View on Platform" link
- [x] LIVE badge on auto-fetched posts
- [x] 30-minute cache with stale fallback
- [x] All API keys optional via `.env`
- [x] Admin manual documentation
