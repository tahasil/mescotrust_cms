# 2. Manage Pages

Pages are the building blocks of the website — Home, About, Contact, Schemes, Careers, and every individual CMS page is managed here.

## Where to find it

Sidebar → **Pages**

## What you see

A table listing every page in the system, with columns for:

- **Title** — click to edit
- **Slug** — the URL portion (e.g. `about/our-team`, `education/scholarships`)
- **Status** — `draft` (not visible publicly) or `published`
- **Updated** — the last time the page was changed
- **Actions** — Edit, Preview, Delete

You can search by title and filter by status.

---

## Create a new page

1. Click **+ New Page** at the top right.
2. Fill in the basic fields:
   - **Title** — what readers will see (e.g. "Education Support Schemes")
   - **Slug** — auto-generated from the title (e.g. `education/scholarships`). You can edit it. For nested URLs use slashes: `about/our-story`.
   - **Status** — keep as `draft` while you build, change to `published` when ready.
   - **Locale** — language code (default `en`).
3. Click **Create** — you will be taken to the Page Builder.

> **Reserved slugs** — these names cannot be used because the system already owns them: `admin`, `blog`, `contact`, `search`, `api`, `preview`, `donation`, `sitemap.xml`, `robots.txt`.

---

## The Page Builder

Each page is built by stacking **reusable site blocks** and **CMS components**. Blocks include text, images, hero banners, galleries, testimonials, donation forms, custom forms, and more.

### Adding a block

1. Click **+ Add Component** in the page builder canvas.
2. Search or filter through the available site components (e.g., `HomeHero`, `OverviewOfOurWork`, `FormEmbed`, `VideoPlaying`, `Marquee`, `Testimonials`, `CommitteeMembers`, `ManagingCommittee`).
3. Click on the component to append it to the page canvas.
4. Drag blocks using the handle icon (⋮⋮) to arrange them in your desired order.

### Editing block properties

Click the **Edit** button on any block to open the configuration drawer. You can customize:

- **Manage Section**: Padding (top/bottom/left/right), margins, custom section background (default, custom color, background image).
- **Manage Container**: Container-level padding, background colors, and max width constraints.
- **Title & Colors**: Main title, highlighted title keywords (surround with `*word*`), subtitle, custom color keys.
- **Manage Items**: Add, reorder, or edit individual slides, cards, member items, or partners.

### Resetting a block to defaults

If you made experiments with block configuration and want to restore the clean baseline:
1. Open the block's **Edit** drawer.
2. In the drawer header, click the **Reset to Defaults** button.
3. Confirm the action in the popup.
4. All properties and items will be reset to their canonical template values.

---

## Embedding Dynamic Forms & Standalone Forms

You can embed interactive application and feedback forms directly into any page:

1. In the Page Builder, add the **FormEmbed** component.
2. Open its Edit drawer and select your created form from the **Select Form** dropdown, or provide its **Shortcode** (e.g. `[shortcode="volunteer-application"]`).
3. Alternatively, every form created in **Form Builder** (`/admin/form-builder`) is immediately accessible at its own dedicated public standalone page at `/forms/[shortcode]` (e.g. `/forms/scholarship-2026`). You can copy this link directly from the Form Builder table.

---

## SEO settings (per page)

Scroll to the **SEO** section in the page editor:

- **Meta Title** — the title that appears in Google search results (keep under 60 characters)
- **Meta Description** — the snippet shown in search results (keep under 160 characters)
- **OG Image / Share Image** — select a 1200x630px social media preview image.

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
