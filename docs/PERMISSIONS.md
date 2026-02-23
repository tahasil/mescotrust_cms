# Permission Matrix

## Roles

| Role     | Description |
|----------|-------------|
| **Admin**  | Full access to all admin routes and APIs. Can manage users, theme, settings, and all content. |
| **Editor** | Can create and edit pages, blog posts, components, media, contacts, and menus. Cannot access user management, theme settings, or system settings. |

## Route Permissions

| Route / Action                  | Admin | Editor |
|---------------------------------|:-----:|:------:|
| `/admin` (dashboard)            | ✅    | ✅     |
| `/admin/pages` (CRUD)           | ✅    | ✅     |
| `/admin/blogs` (CRUD)           | ✅    | ✅     |
| `/admin/blog-categories` (CRUD) | ✅    | ✅     |
| `/admin/components` (CRUD)      | ✅    | ✅     |
| `/admin/media` (upload/delete)  | ✅    | ✅     |
| `/admin/menus` (CRUD)           | ✅    | ✅     |
| `/admin/contacts` (read/delete) | ✅    | ✅     |
| `/admin/users` (CRUD)           | ✅    | ❌     |
| `/admin/theme` (edit)           | ✅    | ❌     |
| Draft preview (`/preview/[id]`) | ✅    | ✅     |

## API Permissions

| API Route                       | Admin | Editor | Public |
|---------------------------------|:-----:|:------:|:------:|
| `GET /api/health`               | ✅    | ✅     | ✅     |
| `GET /api/theme`                | ✅    | ✅     | ✅     |
| `PUT /api/theme`                | ✅    | ❌     | ❌     |
| `POST /api/contact`             | ✅    | ✅     | ✅     |
| `GET /api/public/*`             | ✅    | ✅     | ✅     |
| `GET/POST /api/admin/pages`     | ✅    | ✅     | ❌     |
| `GET/POST /api/admin/blogs`     | ✅    | ✅     | ❌     |
| `GET/POST /api/admin/components`| ✅    | ✅     | ❌     |
| `GET/POST /api/admin/media`     | ✅    | ✅     | ❌     |
| `GET/POST /api/admin/menus`     | ✅    | ✅     | ❌     |
| `GET /api/admin/contacts`       | ✅    | ✅     | ❌     |
| `GET/POST /api/admin/users`     | ✅    | ❌     | ❌     |

## Enforcement

- **Middleware** (`middleware.js`): Blocks unauthenticated access to `/admin/*` and `/api/admin/*`. Blocks Editor role from `/admin/users`, `/admin/theme`, `/api/admin/users`.
- **API-level** (`lib/apiAuth.js`): Each admin API calls `requireAuth()`. Admin-only APIs (users, theme PUT) additionally check `session.role === "Admin"` via `isAdmin()`.
- **Permission helper** (`lib/permissions.js`): Exports `isAdmin(session)` and `isEditor(session)` for role checks in route handlers and components.

## Editor Content Scope

Currently, Editors can edit **all** pages and blog posts (not limited to own content). To restrict to own content, add `createdBy` field to Page/Blog models and filter queries by `session.id` for Editors.

## Password Reset

Password reset for admin users is **not implemented**. Admins are managed via the seed script (`npm run seed`) or by another Admin through `/admin/users`. For production, consider implementing a forgot-password flow (Phase 6 optional).
