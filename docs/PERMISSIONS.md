# Permissions (Phase 6)

## Roles

- **Admin** — Full access: pages, blogs, components, menus, theme, contacts, **users**.
- **Editor** — Content only: pages, blogs, components, contacts. No access to **users**, **theme**, or **menus** (or read-only per product decision).

## Enforcement

- **API:** `/api/admin/users` and `/api/admin/users/[id]` (GET/POST/PUT/DELETE) require **Admin**; return 403 for Editor.
- **API:** `/api/admin/theme` (GET/PUT) require **Admin**; return 403 for Editor.
- **Admin UI:** `/admin/users` and `/admin/theme` show "Admin only" or redirect when session.role is not Admin. Other admin routes are available to both Admin and Editor.

## Rules

- Cannot delete or demote the **last Admin** (enforced in user API).
- Email uniqueness enforced on create/update.
- Password minimum 6 characters on create; optional on update (leave blank to keep current).

## Session

Role is stored in the NextAuth JWT (`session.user.role`). Middleware can restrict routes by role; currently admin routes are protected by session presence only, and users/theme APIs enforce Admin in the route handler.
