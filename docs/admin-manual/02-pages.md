# 2. Manage Pages

Pages are the building blocks of the website — Home, About, Contact, every individual page is managed here.

## Where to find it

Sidebar → **Pages**

## What you see

A table listing every page in the system, with columns for:

- **Title** — click to edit
- **Slug** — the URL portion (e.g. `about/our-team`)
- **Status** — `draft` (not visible publicly) or `published`
- **Updated** — the last time the page was changed
- **Actions** — Edit, Preview, Delete

You can search by title and filter by status.

---

## Create a new page

1. Click **+ New Page** at the top right.
2. Fill in the basic fields:
   - **Title** — what readers will see (e.g. "Our Story")
   - **Slug** — auto-generated from the title (e.g. `our-story`). You can edit it. For nested URLs use slashes: `about/our-story`.
   - **Status** — keep as `draft` while you build, change to `published` when ready.
   - **Locale** — language code (default `en`).
3. Click **Create** — you will be taken to the Page Builder.

> **Reserved slugs** — these names cannot be used because the system already owns them: `admin`, `blog`, `contact`, `search`, `api`, `preview`, `donation`, `sitemap.xml`, `robots.txt`.

---

## The Page Builder

Each page is built by stacking **blocks**. Blocks include text, images, hero banners, galleries, testimonials, donation forms, and more.

### Adding a block

1. Click **+ Add Block** (bottom or top of the canvas).
2. Pick a block category (Layout, Text, Media, Interactive, etc.).
3. Choose the specific block (e.g. "Heading", "Image", "Hero Banner").
4. The block is added to the bottom of the page. Drag it to reorder.

### Editing a block

Click any block to open its **edit panel** on the right. Common fields:

- **Text content** — rich text editor for paragraphs and headings
- **Image** — pick from the Media library or paste a URL
- **Background colour / Padding** — section styling
- **Buttons / Links** — set label and target URL

Click **Save** at the bottom of the edit panel to apply.

### Reordering blocks

Hover over a block, then drag the **drag handle** (the dotted icon) up or down. The order is saved automatically when you click **Save Page**.

> Reordering is **not** applied until you click **Save Page** — this is the most common reason a change "doesn't show up".

### Deleting a block

Click the block, then click the **trash icon** in its toolbar. Confirm.

### Saving the page

Click **Save Page** (top right). You will see a green "Saved" confirmation.

> The button is labelled **Save Page** on this screen; on some screens it simply reads **Save**. Both do the same thing — they save the page and its `Status`.
>
> **How do I publish it?** Changing `Status` from `Draft` to `Published` and clicking Save *is* the publish action. Full walkthrough: [Page Publishing (Draft to Live)](12-page-publishing.md)

---

## SEO settings (per page)

Scroll to the **SEO** section in the page editor:

- **Meta Title** — the title that appears in Google search results (keep under 60 characters)
- **Meta Description** — the snippet shown in search results (keep under 160 characters)

If left blank, the page title and an excerpt will be used automatically.

---

## Preview before publishing

Click **Preview** to open the page in a new tab as a draft preview. Only logged-in admins can see drafts; the public cannot.

When you are ready, change **Status** to **published** and click **Save Page**.

---

## Edit an existing page

1. **Pages** → click the page title (or the Edit icon).
2. Make your changes in the Page Builder.
3. Click **Save Page**.

---

## Delete a page

1. **Pages** → click the **trash icon** next to the page row.
2. Confirm the deletion.

> Be careful — deleted pages **cannot be recovered** through the admin. Only delete pages you are sure are no longer needed. Consider switching the page to `draft` instead, which removes it from the website without losing the content.

---

## Common scenarios

### Edit the Home page

1. **Pages** → search for **home** → click the title.
2. Edit blocks in the page builder.
3. **Save Page**.

### Create a new "About" sub-page

1. **+ New Page**
2. Title: "Our Story"
3. Slug: `about/our-story`
4. Build the layout, set Status to `published`, save.
5. (Optional) Add the new page to the header menu — see [Key Settings → Menus](08-key-settings.md).

### Hide a page temporarily

Set its **Status** to `draft` and save. The URL will return a 404 to public visitors until you publish again.
