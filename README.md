# Mesco Trust CMS

Next.js 14 CMS with MongoDB, NextAuth, and Ant Design admin.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** MongoDB (Mongoose)
- **Auth:** NextAuth (Credentials)
- **Admin UI:** Ant Design 5.x
- **Other:** bcryptjs, slugify

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment**

   Configure the single project environment file, `.env`, with:

   - `MONGODB_URI` — MongoDB connection string
   - `NEXTAUTH_SECRET` — long random string (e.g. `openssl rand -base64 32`)
   - `NEXTAUTH_URL` — app URL (e.g. `http://localhost:3000`)
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` — for the initial admin user (used by seed)

3. **Seed initial admin**

   ```bash
   npm run seed
   ```

   Creates one Admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Run once after DB is available.

4. **Run**

   ```bash
   npm run dev
   ```

   - Public: http://localhost:3000  
   - Admin: http://localhost:3000/admin  
   - Health: http://localhost:3000/api/health  

## Reserved paths

These slugs cannot be used for CMS pages: `admin`, `blog`, `contact`, `search`, `api`, `preview`, `sitemap.xml`, `robots.txt`. Enforced in admin when saving page slug.

## API overview

- **Health:** `GET /api/health` — 200 if DB connected, 503 otherwise.
- **Public (no auth):**  
  `GET /api/public/pages/[slug]`, `GET /api/public/blogs`, `GET /api/public/blogs/[slug]`, `GET /api/public/blog-categories`, `GET /api/theme`
- **Admin (session required):**  
  `GET/POST /api/admin/pages`, `GET/PUT/DELETE /api/admin/pages/[id]`,  
  `GET/POST /api/admin/blogs`, `GET/PUT/DELETE /api/admin/blogs/[id]`,  
  `GET/POST /api/admin/blog-categories`, `GET/PUT/DELETE /api/admin/blog-categories/[id]`

New block types (components) require implementing the React component and registering it in the component map (code deploy). See [docs/NEW_SITE_COMPONENT_CHECKLIST.md](docs/NEW_SITE_COMPONENT_CHECKLIST.md).

## How to edit, add, or remove components

### Blocks on a page (page builder)

When **editing a page** (Admin → Pages → click a page):

- **Add a block:** In the "Page builder" section, choose a component (e.g. Paragraph, Heading, Image) from the **Add block** dropdown and click **Add block**.
- **Edit a block:** Click the **Edit** (pencil) button on the block → change the fields in the drawer (e.g. text, level, image URL) → click **Save** in the drawer.
- **Remove a block:** Click the **Delete** (trash) button on the block.
- **Reorder blocks:** Use the **Up** / **Down** arrows on each block.
- **Duplicate a block:** Click the **Copy** button to add a copy of the block below.
- Click **Save** at the top of the page to save the whole page (including the layout).

### Component definitions (Components library)

In **Admin → Components** you can manage block *types* (Paragraph, Heading, Image, or custom):

- **Add:** Click **Add component**, fill name, display name, base component (must match a type that exists in code: e.g. `Paragraph`, `Heading`, `Image`), and category. Save.
- **Edit:** Click **Edit** on a row to change display name, category, or active status.
- **Remove:** Click **Delete**. You can only delete a component that is not used on any page; otherwise deactivate it instead.

New block *types* (e.g. a new "Button" component) require adding the React component under `components/cms/blocks/` and registering it in `components/cms/ComponentRenderer.js` (code change), then you can add a component definition in the admin that uses that `baseComponent` name.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run seed` — create initial admin user (set ADMIN_EMAIL, ADMIN_PASSWORD)
- `npm run lint` — ESLint
