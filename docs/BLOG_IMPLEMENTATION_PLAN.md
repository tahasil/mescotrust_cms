# Blog System — Implementation Plan (v2)

## Current State (Already Working)

| Feature | Status |
|---------|--------|
| Blog model (title, slug, content, excerpt, featuredImage, category, tags, meta) | ✅ |
| BlogCategory model | ✅ |
| Admin CRUD APIs (blogs + categories) | ✅ |
| Public APIs (listing + single by slug) | ✅ |
| Blog listing page (`/blog`) | ✅ (basic) |
| Blog detail page (`/blog/[slug]`) | ✅ (basic) |
| Admin blog list + edit pages | ✅ |
| RichTextEditor + SafeHtml | ✅ |
| SEO metadata + JSON-LD | ✅ |

---

## What We're Building

### URL Structure (clean, SEO-friendly)
```
/blog              → Blog listing page (two-column: posts + sidebar)
/blog/{slug}       → Blog detail page (full post + sidebar + comments)
```

**No `/impact/blog`. No query params. Direct Next.js routes.**

---

## Phase 1: Blog Listing Page (`/blog`)

### File: `app/(site)/blog/page.js` (update existing)

**Layout:**
- Two-column: Blog posts (left ~66%) + Sidebar (right ~33%)
- Responsive: sidebar below content on mobile

**Blog Cards (horizontal):**
- Image left (380px, rounded) + Content right
- Category label (uppercase, colored)
- Title (24px, bold, linked to `/blog/{slug}`)
- Excerpt (3-4 lines, truncated)
- Footer: "Leave a Comment" or "X COMMENTS" + Date

**Sidebar:**
- "Recent Posts" with accent left border
- Each item: thumbnail (80x70) + title (linked) + date

**Features:**
- Category tab filter (All + categories from DB)
- Pagination (server-side)
- Hover effects on images/titles

---

## Phase 2: Blog Detail Page (`/blog/[slug]`)

### File: `app/(site)/blog/[slug]/page.js` (update existing)

**Layout:**
- Two-column: Article (left ~66%) + Sidebar (right ~33%)
- Responsive: sidebar below content on mobile

**Article:**
- Category (uppercase, colored)
- Title (32px, bold)
- Meta: calendar icon + date, author name
- Featured image (full width, rounded)
- Excerpt (italic, muted)
- Full HTML content via SafeHtml
- Tags (pill badges)
- Comment section (below content)

**Sidebar:**
- "Recent Posts" (reusable component, same as listing)

**Comment Section (at bottom):**
- Approved comments list: avatar, name, time ago, comment text
- "Leave a Comment" form: name, email, comment + "Post Comment" button
- Submit → saved as `status: "pending"` → success message

---

## Phase 3: Comment System

### New Model: `models/BlogComment.js`
```
{
  blogId: ObjectId (ref Blog),
  name: String (required),
  email: String (required),
  comment: String (required),
  status: "pending" | "approved" | "rejected",
  createdAt, updatedAt
}
```

### New APIs:
- `GET /api/public/blogs/[slug]/comments` — approved comments for a post
- `POST /api/public/blogs/[slug]/comments` — submit new comment (pending)
- `GET /api/public/blog-comments` — comment counts per blog (for listing)
- `GET/PATCH/DELETE /api/admin/blog-comments` — admin manage comments

### Admin Page:
- `/admin/blog-comments` — table: blog, name, comment, status, date, actions
- Filter by status (pending/approved/rejected)
- Approve (✓), Reject (✗), Delete buttons
- Added as submenu under "Blogs" in admin sidebar

---

## Phase 4: Shared Components

### `components/blog/BlogSidebar.js` (client component)
- "Recent Posts" section
- Fetches latest 5 published posts
- Each: thumbnail + title (linked) + date
- Props: accentColor, currentSlug (to exclude current post)
- Reused on both listing and detail pages

### `components/blog/BlogComments.js` (client component)
- Approved comments list
- "Leave a Comment" form
- Props: slug
- Used on detail page only

---

## Files Summary

### Modified (existing):
| File | Change |
|------|--------|
| `app/(site)/blog/page.js` | Two-column layout, horizontal cards, sidebar, comments count |
| `app/(site)/blog/[slug]/page.js` | Two-column layout, sidebar, tags, comments section |
| `components/admin/AdminLayoutClient.js` | Add "Comments" submenu under Blogs |

### New files:
| File | Purpose |
|------|---------|
| `models/BlogComment.js` | Comment model |
| `components/blog/BlogSidebar.js` | Reusable sidebar component |
| `components/blog/BlogComments.js` | Comment list + form component |
| `app/api/public/blogs/[slug]/comments/route.js` | Public comment API |
| `app/api/public/blog-comments/route.js` | Comment counts API |
| `app/api/admin/blog-comments/route.js` | Admin comment management API |
| `app/admin/(authenticated)/blog-comments/page.js` | Admin comments page |

---

## What We're NOT Touching

- ❌ No Page Builder components (BlogListing/BlogDetail)
- ❌ No `/impact/blog` paths
- ❌ No query params (`?slug=`)
- ❌ No catch-all route (`[...slug]`) modifications
- ❌ No slug history / revision history / RBAC / image optimization

---

## Execution Order

```
Step 1: BlogComment model + APIs (comment system)
Step 2: BlogSidebar shared component
Step 3: BlogComments shared component
Step 4: Update /blog listing page
Step 5: Update /blog/[slug] detail page
Step 6: Admin comments page + sidebar link
```

---

## Navigation Flow

```
User visits /blog
  → Server renders listing with posts + sidebar
  → Clicks blog title or "Read More"
  → Navigates to /blog/{slug}
  → Server renders full post + sidebar + comments
  → User submits comment → saved as pending
  → Admin approves at /admin/blog-comments
  → Comment appears on public page
```

---

*Created: 2026-04-09*
