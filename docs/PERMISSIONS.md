# Roles and Permissions

The admin uses database-backed role-based access control (RBAC). The permission catalog is generated from the current Mesco Trust admin module manifest in `lib/rbac/catalog.js`; it is not shared with or copied from another CMS.

## System roles

| Role | Default scope |
|------|---------------|
| Super Admin | Every permission, including protected role management |
| Admin | All current admin modules except Roles & Permissions |
| Editor | Content and operations modules; excludes Admin-only settings/actions, Users, Theme, and Roles & Permissions |
| Author | Dashboard plus Blog/Event content actions; excludes category/comment management |

Custom roles can be created at `/admin/rbac/roles` and assigned from `/admin/users`. Permissions are attached to roles only; direct per-user permission assignment is rejected.

## Current module catalog

The catalog covers Dashboard, Pages, Components, Social Wall, Form Builder, Sliders, Popups, Team, Blogs, Events, Media, Menus, Chatbot, Theme, Submissions, Users, and Roles & Permissions.

Supported actions are generated per module from: `view`, `create`, `edit`, `delete`, `manage`, `publish`, `settings_access`, `user_management`, and `role_management`.

## Enforcement

- `middleware.js` checks the JWT permission snapshot before admin page/API routing.
- `app/admin/(authenticated)/layout.js` resolves current database permissions and blocks unauthorized pages.
- `lib/apiAuth.js` resolves the active user and role before every existing admin API operation.
- `components/admin/AdminLayoutClient.js` hides sidebar items the current role cannot access.
- Role or permission changes increment affected users' permission/session versions and require a fresh login.

The special configured Super Admin email remains protected. System roles cannot be deleted or deactivated, custom roles assigned to users cannot be deleted, and non-Super-Admins cannot grant protected permissions or roles at an equal/higher priority.

## Catalog synchronization

`ensureRbacBootstrap()` upserts current permission definitions, deactivates stale definitions, initializes system-role mappings once per catalog version, and migrates legacy users to `roleKey` plus permission/session versions. Existing content collections and public APIs are unchanged.
