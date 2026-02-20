# Mesco Trust CMS

Next.js CMS platform with Ant Design admin. Built from [PROJECT-PLAN.md](PROJECT-PLAN.md) and [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Auth:** NextAuth (Credentials)
- **Admin UI:** Ant Design 5.x
- **Styling:** Tailwind CSS

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and set:

   - `MONGODB_URI` — MongoDB connection string (required)
   - `NEXTAUTH_SECRET` — Long random string (e.g. `openssl rand -base64 32`)
   - `NEXTAUTH_URL` — App URL (e.g. `http://localhost:3000`)
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` — For the initial admin user (seed)

   The app validates these at startup and fails fast if missing.

3. **Database**

   Ensure MongoDB is running and `MONGODB_URI` is set, then run the seed:

   ```bash
   npm run db:seed
   ```

   Seed creates a `super_admin` role and one admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, plus default builder components.

4. **Run**

   ```bash
   npm run dev
   ```

   - Public: http://localhost:3000  
   - Admin: http://localhost:3000/admin  
   - Health: http://localhost:3000/api/health  

## Reserved paths

These slugs cannot be used for CMS pages: `admin`, `blog`, `contact`, `search`, `api`, `preview`, `_next`, `login`, `auth`, `sitemap.xml`, `robots.txt`.

## API overview

- **Health:** `GET /api/health` — 200 if DB connected, 503 otherwise.
- **Public (no auth):**  
  `GET /api/public/pages`, `GET /api/public/pages/[slug]`
- **Admin (session required):**  
  `GET/POST /api/admin/pages`, `GET/PUT/DELETE /api/admin/pages/[id]`,  
  `GET/POST /api/admin/users`, `GET/PUT/DELETE /api/admin/users/[id]`,  
  `GET/POST /api/admin/roles`, `GET/PUT/DELETE /api/admin/roles/[id]`

See [PROJECT-PLAN.md](PROJECT-PLAN.md) Section 30 for the full API reference.

## Permissions

See [docs/PERMISSIONS.md](docs/PERMISSIONS.md).

## Scheduling (optional)

Pages support `publishedAt` and `unpublishedAt`. To flip status at those times, run a cron job that calls an internal API (e.g. `POST /api/cron/schedule`) or a script that updates the database (Mongoose). Example: Vercel Cron, GitHub Actions, or system cron. Document your chosen method in ops.

## Backup and export

- **Database:** Use your MongoDB provider’s backup (e.g. Atlas backups, self-hosted dump).
- **Content export:** Use Mongoose or custom scripts to export pages, posts, and media metadata to JSON/files. No built-in export UI; add one if required.

## Scripts

- `npm run dev` — Development server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run db:seed` — Create initial admin user and default components (requires MongoDB and .env)
- `npm run lint` — ESLint
