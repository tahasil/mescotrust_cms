# Permission matrix

| Permission       | Description                    |
|------------------|--------------------------------|
| `pages:read`     | View pages                     |
| `pages:write`    | Create, edit, delete pages     |
| `media:read`     | View media library             |
| `media:write`    | Upload, delete media           |
| `users:read`     | View users                     |
| `users:manage`   | Create, edit, delete users and roles |
| `theme:manage`   | Change theme settings          |
| `menu:manage`    | Edit menus                     |
| `header_footer:manage` | Update header/footer config |
| `components:manage`   | Manage component registry  |

**Super admin** role has all permissions. Other roles get a subset assigned in admin → Roles.

**Last-admin guard:** You cannot delete or demote the last user with `super_admin` role.
