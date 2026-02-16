# MESCO Trust CMS (Admin)

Admin panel copied from `mescotrust` (branch `tahasil_cms`). Includes dashboard, pages, components, blogs, media, contacts, theme, and users.

## Setup

1. **Environment**
   - Copy `.env.example` to `.env.local`
   - Set `MONGODB_URI` and `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`)

2. **Install & run**
   ```bash
   npm install
   npm run dev
   ```
   - App: http://localhost:3000 → redirects to `/admin`
   - Login: http://localhost:3000/admin/login

3. **Seed (optional)**  
   Creates default admin user and theme/components:
   ```bash
   npm run seed
   ```
   Default admin: `admin@mescotrust.org` / `Admin@123` (override with `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env.local`).

## Structure

- `src/app/admin/` – Admin UI (layout, login, dashboard, pages, components, blogs, media, contacts, theme, users)
- `src/app/api/admin/` – Admin API routes
- `src/app/api/auth/` – NextAuth
- `src/lib/` – db, auth, apiAuth, seed
- `src/models/` – Mongoose models (Page, User, Blog, Component, Media, etc.)
- `src/middleware.js` – Protects `/admin` and `/api/admin`
