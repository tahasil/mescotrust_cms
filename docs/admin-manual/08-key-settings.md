# 8. Key Settings

This page covers the smaller — but still important — admin sections: **Menus**, **Users**, **Components**, and a few global behaviours like **the cookie consent banner**.

---

## A. Menus (Navigation)

The website's header and footer navigation are managed in **Menus**.

### Where to find it

Sidebar → **Menus**

### How menus work

Each menu has a **name** (e.g. `Header Menu`, `footer`) and a list of **items**. Each item is either:

- A **link to a CMS page** — pick the page from the dropdown
- A **custom link** — paste any URL (internal or external)

Items can be **nested** to create dropdown submenus.

### Add a menu item

1. Open the menu you want to edit (e.g. `Header Menu`).
2. Click **+ Add Item**.
3. Fill in:
   - **Label** — the visible text (e.g. "Our Work")
   - **Type** — Page or Custom Link
   - **Page** (if Page) — pick from existing published pages
   - **URL** (if Custom) — paste the URL
   - **Open in new tab** — check for external links
4. Click **Save**.

### Reorder items

Drag the item rows to reorder. Save when done.

### Create a dropdown submenu

1. Open the parent item (e.g. "About Us").
2. Click **+ Add Child** within that item.
3. Add child items the same way.
4. Save.

### Delete an item

Click the trash icon next to the item, save the menu.

> **Tip**: keep your top-level header to **5–7 items max** — anything more becomes hard to navigate.

---

## B. Users

Manage the people who have access to the admin panel.

### Where to find it

Sidebar → **Users**

> Only **Admin** users can see and use this section.

### Add a new user

1. Click **+ New User**.
2. Fill in:
   - **Name**
   - **Email** — used to log in
   - **Password** — temporary password; the user can change it later (if they forget, an admin must reset it manually)
   - **Role** — `Admin` or `Editor`
   - **Status** — `active` (can log in) or `inactive` (cannot)
3. Click **Save**.

### Edit a user

Click the user row, change the fields, save.

### Reset a password

There is no self-serve reset. To reset:

1. Open the user.
2. Type a new password into the **Password** field.
3. Save.
4. Tell the user the new password (use a secure channel — not email).

### Deactivate a user

Set their **Status** to `inactive`. They can no longer log in but their record (including content they created) is preserved.

### Delete a user

Click the trash icon, confirm. **This is permanent.** Prefer **deactivate** unless you are sure.

### Role permissions

| Capability | Admin | Editor |
|---|---|---|
| Manage pages, blogs, comments | ✅ | ✅ |
| Manage media, menus, contacts | ✅ | ✅ |
| Manage donations, subscribers | ✅ | ✅ |
| Manage theme settings | ✅ | ❌ |
| Manage users | ✅ | ❌ |
| Delete content | ✅ | ✅ |

---

## C. Components (advanced)

The **Components** section shows reusable building blocks that the page builder uses internally — things like the Hero Banner, Card Grid, Footer block, etc.

### Where to find it

Sidebar → **Components**

### What you can do

- **View** the list of available components
- **Edit** the default props of a component (e.g. change the default colours of the Hero Banner system-wide)
- **Create custom components** — advanced feature, ask a developer

> **Most users never need to touch this section.** It exists for developers and power users who want to customise the building blocks themselves. Day-to-day editing happens in **Pages** and **Blogs**.

---

## D. Cookie Consent Banner (visitor side)

When a visitor first arrives on the website, they see a banner at the bottom of the screen asking them to accept cookies. There are no admin settings for this banner — it appears automatically.

**How it works:**

- New visitors see the banner on first visit.
- If they click **Accept All**, Google Analytics starts tracking them and the banner hides.
- If they click **Reject**, no tracking happens. The banner hides and won't reappear.
- The choice is remembered in their browser for future visits.
- A "Cookie Settings" link can be added to the footer to let visitors change their mind later (ask a developer to enable this).

> **Why it matters**: the banner ensures the website is compliant with privacy regulations (GDPR, India's DPDP Act). Without it, Google Analytics would collect data without permission, which can result in fines.

---

## E. SEO basics

The CMS automatically generates:

- **`/sitemap.xml`** — a list of every published page and blog post for Google to crawl
- **`/robots.txt`** — tells search engines which areas to ignore (e.g. `/admin`, `/api`)
- **Meta tags** — title and description for every page (set in the page or blog editor)
- **Open Graph tags** — for Facebook / WhatsApp / LinkedIn link previews
- **Organisation schema** — JSON-LD that tells Google about your organisation

There is nothing to configure for these — they work out of the box. You **do** need to fill in the **Meta Title** and **Meta Description** for each page and blog post for the best results.

---

## F. Backups

Backups are not yet self-serve from the admin. Your developer / IT runs them on a schedule.

If you need a one-off backup before making big changes (e.g. before redesigning the home page), ask the developer.

---

## Help & support

- **Forgot how something works?** → re-read the relevant section of this guide.
- **Something looks broken?** → don't keep clicking — take a screenshot, note what you were doing, and contact the developer.
- **Want a new feature?** → list what you need and discuss with your developer or admin lead. Many things can be added on a pay-per-use basis.
