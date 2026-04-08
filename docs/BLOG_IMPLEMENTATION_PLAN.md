# Blog System — Implementation Plan

## Current State (What's Working)

| Feature | Status | Details |
|---------|--------|---------|
| Blog Model | ✅ Done | title, slug, content, excerpt, featuredImage, author, status, category, tags, meta, locale |
| BlogCategory Model | ✅ Done | name, slug, description, order |
| Admin CRUD APIs | ✅ Done | POST/GET/PUT/DELETE for blogs and categories |
| Public APIs | ✅ Done | Published blogs listing, single blog by slug, categories |
| Blog Listing Page | ✅ Done | Pagination (12/page), category filter, featured images |
| Blog Detail Page | ✅ Done | Full content, featured image, JSON-LD, OG tags, SafeHtml |
| Admin Blog List | ✅ Done | Table with search, status filter, category filter, create/edit modal |
| Admin Blog Edit | ✅ Done | Dedicated page with RichTextEditor, SEO fields, preview |
| Admin Categories | ✅ Done | CRUD with slug validation, cascade delete |
| Roles | ✅ Partial | Admin (full access), Editor (no users/theme) — no Author role |

---

## Gaps Identified

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| 1 | No slug redirect history | SEO break — old URLs return 404 | 🔴 HIGH |
| 2 | No revision history | No way to restore if content mistakenly edited | 🔴 HIGH |
| 3 | No image optimization | Large images slow page load, no WebP conversion | 🔴 HIGH |
| 4 | No Author role | No multi-user workflow (writer → editor → publish) | 🟡 MEDIUM |
| 5 | No related posts | Missed engagement opportunity | 🟡 MEDIUM |
| 6 | No tag pages | Tags exist in model but not navigable | 🟡 MEDIUM |
| 7 | No server-side blog search | Listing page has no search input | 🟡 MEDIUM |
| 8 | No TOC / reading time | Missing blog UX features | 🟢 LOW |
| 9 | No caching/ISR | Every request hits DB | 🟢 LOW |
| 10 | No analytics/view count | No blog performance tracking | 🟢 LOW |

---

## Phase 1: Slug Redirects (SEO Fix)

### Goal
When a blog slug changes, old URLs automatically 301 redirect to the new slug.

### Changes

**1. Model: `models/Blog.js`**
- Add field: `slugHistory: [{ type: String, trim: true }]`
- Default: `[]`
- No index needed (searched only on 404 fallback)

**2. API: `app/api/admin/blogs/[id]/route.js` (PUT)**
```
Before saving:
  if (newSlug !== oldSlug) {
    push oldSlug into blog.slugHistory (avoid duplicates)
  }
```

**3. Public Page: `app/(site)/blog/[slug]/page.js`**
```
Current: Blog.findOne({ slug, status: "published" })
  → If not found: notFound()

New: Blog.findOne({ slug, status: "published" })
  → If not found: Blog.findOne({ slugHistory: slug, status: "published" })
    → If found: redirect("/blog/" + blog.slug, 301)
    → If not found: notFound()
```

### No Breaking Changes
- Existing blogs work as-is
- History builds over time as slugs change
- Old data unaffected (empty slugHistory array)

---

## Phase 2: Revision History

### Goal
Every blog edit saves a snapshot. Admins can view history and restore any version.

### Changes

**1. New Model: `models/BlogRevision.js`**
```javascript
{
  blogId: ObjectId (ref Blog, required, indexed),
  version: Number (auto-incremented),
  title: String,
  slug: String,
  content: String,
  excerpt: String,
  featuredImage: String,
  editedBy: String,
  createdAt: Date (auto)
}
```
- Index: `{ blogId: 1, version: -1 }`
- Max 50 revisions per blog (auto-cleanup oldest)

**2. API Changes:**

`PUT /api/admin/blogs/[id]` — Before saving updates:
```
1. Read current blog state
2. Create BlogRevision with current state
3. Auto-increment version number
4. Then apply the updates to blog
5. If revisions > 50 for this blog, delete oldest
```

New endpoints:
- `GET /api/admin/blogs/[id]/revisions` — List revisions (version, editedBy, createdAt)
- `POST /api/admin/blogs/[id]/revisions/[revisionId]/restore` — Copy revision data back to blog (creates new revision for safety)

**3. Admin UI: `app/admin/(authenticated)/blogs/[id]/page.js`**
- Add "History" button in toolbar (next to Save/Preview)
- Opens Drawer with list of revisions:
  - Version # | Date (formatted) | Edited by
  - "Preview" button (shows diff or full content)
  - "Restore" button (with confirmation modal)
- Restore creates a new revision of current state before overwriting

---

## Phase 3: Image Optimization

### Goal
Auto-optimize uploaded images — convert to WebP, generate responsive sizes.

### Changes

**1. Install: `npm install sharp`**

**2. API: `app/api/admin/media/route.js` (POST)**
```
After receiving image file:
  if (mimeType is image/webp, image/jpeg, image/png, image/gif):
    Use sharp to:
      1. Convert to WebP (if not already)
      2. Generate 3 variants:
         - thumb:  300px wide
         - medium: 800px wide
         - large:  1600px wide
      3. Save orignal + 3 variants to /uploads/
      4. Filenames: {timestamp}_{name}.webp, {timestamp}_{name}-thumb.webp, etc.
```

**3. Model: `models/Media.js`**
- Add field:
```javascript
variants: {
  thumb:  { url: String, width: Number, height: Number },
  medium: { url: String, width: Number, height: Number },
  large:  { url: String, width: Number, height: Number },
}
```

**4. Frontend (blog pages):**
- Use `<img srcset="...">` with variants for responsive loading
- Already has `loading="lazy"` — keep that
- Admin media library shows variant URLs for copying

### Backward Compatible
- Existing images unaffected (no variants field = use original)
- Only new uploads get optimized
- PDF uploads skip optimization

---

## Phase 4: RBAC (Author Role)

### Goal
Add "Author" role — can create/edit own posts as draft, cannot publish.

### Role Matrix

| Action | Admin | Editor | Author |
|--------|-------|--------|--------|
| Create blog (draft) | ✅ | ✅ | ✅ |
| Create blog (published) | ✅ | ✅ | ❌ |
| Edit any blog | ✅ | ✅ | ❌ |
| Edit own blog | ✅ | ✅ | ✅ |
| Publish blog | ✅ | ✅ | ❌ |
| Delete any blog | ✅ | ✅ | ❌ |
| Delete own blog | ✅ | ✅ | ✅ |
| Manage categories | ✅ | ✅ | ❌ |
| Upload media | ✅ | ✅ | ✅ |
| Manage users | ✅ | ❌ | ❌ |
| Manage theme | ✅ | ❌ | ❌ |
| View contacts/donations | ✅ | ✅ | ❌ |

### Changes

**1. Model: `models/User.js`**
- Change role enum: `["Admin", "Editor", "Author"]`

**2. Middleware: `middleware.js`**
- Author restricted from: `/admin/users`, `/admin/theme`, `/admin/contacts`, `/admin/donations`, `/admin/subscribers`
- Author allowed: `/admin/blogs`, `/admin/media`, `/admin/blog-categories` (read-only)

**3. API: `app/api/admin/blogs/route.js`**
- GET: Authors see only `{ createdBy: session.email }`
- POST: Authors forced to `status: "draft"`

**4. API: `app/api/admin/blogs/[id]/route.js`**
- PUT: Authors can only edit `{ createdBy: session.email }`, cannot set `status: "published"`
- DELETE: Authors can only delete own posts

**5. Admin UI:**
- Author sees filtered blog list (own posts only)
- "Publish" button hidden for Authors → shows "Submit for Review"
- Blog status adds "pending" state for Author submissions
- Admin/Editor see "Pending Review" filter to find Author submissions

---

## Phase 5: Growth Features

### 5a. Related Posts
- On blog detail page, after content
- Query: same category OR overlapping tags, exclude current, limit 3
- Display: card grid with image, title, date

### 5b. Tag Pages
- Route: `app/(site)/blog/tag/[tag]/page.js`
- Query: `Blog.find({ tags: tag, status: "published" })`
- Same listing UI as `/blog`
- Tags on blog detail page become clickable links

### 5c. Server-side Blog Search
- Add search input on `/blog` listing page
- Query param: `?q=search+term`
- MongoDB: `$or` regex on title, excerpt, content
- Debounced input on client, server-side query

### 5d. TOC + Reading Time
- Extract `<h2>`, `<h3>` from HTML content via regex
- Build table of contents with anchor links
- Reading time: `Math.ceil(plainTextWordCount / 200)` minutes
- Display on blog detail page sidebar or top

### 5e. Caching
- Blog listing: `revalidate: 60` (ISR — regenerate every 60s)
- Blog detail: `revalidate: 60`
- API responses: `Cache-Control: public, s-maxage=60, stale-while-revalidate`

### 5f. View Count / Analytics
- Add `viewCount: Number` to Blog model
- Increment on each public page view (debounced, not on bot/crawler)
- Admin blog list shows view count column
- Dashboard shows "Popular Posts" widget

---

## Execution Order

```
Phase 1: Slug Redirects        → 1 hour  (smallest change, biggest SEO impact)
Phase 2: Revision History       → 2 hours (data safety, new model + UI)
Phase 3: Image Optimization     → 2 hours (sharp integration, variant generation)
Phase 4: RBAC                   → 3 hours (role matrix, middleware, API guards, UI changes)
Phase 5: Growth Features        → 4 hours (related posts, tags, search, TOC, caching)
```

---

## Files That Will Change

### Phase 1
- `models/Blog.js` (add slugHistory)
- `app/api/admin/blogs/[id]/route.js` (push old slug)
- `app/(site)/blog/[slug]/page.js` (fallback redirect)

### Phase 2
- `models/BlogRevision.js` (new)
- `app/api/admin/blogs/[id]/route.js` (create revision on save)
- `app/api/admin/blogs/[id]/revisions/route.js` (new — list revisions)
- `app/api/admin/blogs/[id]/revisions/[revisionId]/restore/route.js` (new)
- `app/admin/(authenticated)/blogs/[id]/page.js` (History button + drawer)

### Phase 3
- `package.json` (add sharp)
- `app/api/admin/media/route.js` (sharp processing)
- `models/Media.js` (add variants field)
- Blog pages (srcset usage)

### Phase 4
- `models/User.js` (add Author enum)
- `middleware.js` (Author restrictions)
- `app/api/admin/blogs/route.js` (Author filtering)
- `app/api/admin/blogs/[id]/route.js` (Author guards)
- `app/admin/(authenticated)/blogs/page.js` (UI changes)
- `app/admin/(authenticated)/blogs/[id]/page.js` (UI changes)

### Phase 5
- `app/(site)/blog/[slug]/page.js` (related posts, TOC, reading time)
- `app/(site)/blog/tag/[tag]/page.js` (new)
- `app/(site)/blog/page.js` (search input)
- `models/Blog.js` (viewCount)

---

*Last updated: 2026-04-09*
