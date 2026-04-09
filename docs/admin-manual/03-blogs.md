# 3. Manage Blogs

The Blogs section is for news, articles, and updates that should appear in a chronological list at `/blog`.

## Where to find it

Sidebar → **Blogs**

The Blogs menu has three sub-items:

| Sub-item | Purpose |
|---|---|
| **All Posts** | Create and edit blog articles |
| **Categories** | Organise posts into groups (e.g. Education, Health, Events) |
| **Comments** | Moderate reader comments on blog posts |

---

## Create a new blog post

1. **Blogs → All Posts → + New Post**
2. Fill in:
   - **Title** — the headline
   - **Slug** — auto-generated; leave it unless you have a reason to change it
   - **Excerpt** — a 1–2 sentence summary used on the blog listing page
   - **Featured Image URL (Desktop)** — main image shown at the top of the post and in listings
   - **Featured Image URL (Mobile)** — *optional*. A separate, usually portrait-oriented image used on phones. Leave blank to fall back to the desktop image.
   - **Category** — pick one from the dropdown
   - **Tags** — type and press Enter to add multiple tags
   - **Content** — the full article body (rich text editor — see below)
   - **Status** — `draft` while writing, `published` to make it public
3. (SEO) **Meta Title** and **Meta Description** for search engines
4. Click **Save**.

> **Tip — How to fill the image fields**: open the **Media** library in another tab, find the file you want, click **Copy URL**, then paste it into the Featured Image field here. See [Media Library → Use a file in a page or blog](06-media.md#use-a-file-in-a-page-or-blog).

---

## The Rich Text Editor

The content editor lets you format text without writing HTML.

| Toolbar button | What it does |
|---|---|
| **B / I / U / S** | Bold, italic, underline, strikethrough |
| **H1 H2 H3** | Headings |
| **• / 1.** | Bulleted or numbered list |
| **❝** | Block quote |
| **`</>`** | Code block |
| **🔗** | Insert link |
| **🖼️** | Insert image (paste URL) |
| **↔ ↕** | Text alignment |
| **⌫** | Clear all formatting |

> **Tip**: You can paste from Word or Google Docs. Some formatting will be preserved automatically. If pasting causes weird styling, select all and press the "clear formatting" button.

---

## Manage Categories

1. **Blogs → Categories**
2. Click **+ New Category** to create one.
3. Provide:
   - **Name** — visible to readers (e.g. "Education")
   - **Slug** — URL portion (e.g. `education`)
   - **Description** — optional
4. **Save**.

You can edit or delete categories from the same page. Posts already assigned to a deleted category will lose the category tag.

---

## Publish a blog post

1. Open the post (**Blogs → All Posts → click title**).
2. Make sure all required fields are filled.
3. Set **Status** to **published**.
4. Click **Save**.

The published date is set automatically the first time you publish.

---

## Preview a draft

Click **Preview Draft** in the post editor. A new tab opens showing the post as it will look when published. Only admins can see draft previews.

---

## Edit or delete a post

- **Edit**: click the post title in the list.
- **Delete**: click the trash icon next to the post row, then confirm.

Deleted posts are not recoverable. To take a post offline temporarily, change its status to **draft** instead.

---

## Tips for good blog posts

- **Headlines under 70 characters** read best on social shares.
- **Featured image at least 1200 × 630 pixels** for clean Open Graph previews.
- **Add 2–4 tags** to help readers discover related content.
- **Write the excerpt manually** — it gives you control over how the post appears in listings.
- **Always upload images in WebP format** — this is the format the system accepts. (Convert at [squoosh.app](https://squoosh.app/) if needed.)
