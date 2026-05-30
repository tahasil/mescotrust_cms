# API Reference

For low-level details (data models, database schemas, full endpoint list), see [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md).

## Path Convention

All API routes live under `/api/`. The convention is:

| Prefix | Auth | Purpose |
|--------|------|---------|
| `/api/public/*` | None (public) | Read-only endpoints for published content |
| `/api/admin/*` | JWT (NextAuth) | Protected CRUD endpoints for admin panel |
| `/api/theme` | GET: public, PUT: Admin | Theme configuration |
| `/api/contact` | None (rate-limited) | Contact form submission |
| `/api/health` | None | Health check (DB connectivity) |
| `/api/auth/*` | NextAuth internal | Authentication (login/session) |

## Public Read APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/pages/[slug]` | Single published page by slug |
| GET | `/api/public/blogs?page=1&limit=12&category=slug` | Published blog posts (paginated, filterable) |
| GET | `/api/public/blogs/[slug]` | Single published blog post by slug |
| GET | `/api/public/blog-categories` | All blog categories |
| GET | `/api/public/menus?name=header` | Menu by name (e.g. header, footer) |
| GET | `/api/public/search?q=term` | Search pages and posts by title/slug/excerpt |
| GET | `/api/public/forms/[formId]` | Public form schema/config payload (published/allowed archived only) |
| GET | `/api/public/forms/resolve?shortcode=[form id="FORM_001"]` | Resolve shortcode to immutable form ID |
| POST | `/api/public/forms/[formId]/upload` | Upload file(s) for file fields before submit |
| POST | `/api/public/forms/[formId]/submit` | Submit dynamic form payload with server-side validation |
| GET | `/api/theme` | Active theme configuration |
| GET | `/media/[id]?size=desktop&format=auto` | Stable media delivery endpoint (AVIF/WebP/fallback) |
| GET | `/api/health` | Database connectivity check (200 or 503) |

## Admin APIs

All admin APIs require authentication via JWT (enforced by middleware and `requireAuth`).

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET/POST | `/api/admin/pages` | Admin, Editor | List/create pages |
| GET/PUT/DELETE | `/api/admin/pages/[id]` | Admin, Editor | Read/update/delete page |
| GET/POST | `/api/admin/blogs` | Admin, Editor | List/create blog posts |
| GET/PUT/DELETE | `/api/admin/blogs/[id]` | Admin, Editor | Read/update/delete post |
| GET/POST | `/api/admin/blog-categories` | Admin, Editor | List/create categories |
| GET/PUT/DELETE | `/api/admin/blog-categories/[id]` | Admin, Editor | Read/update/delete category |
| GET/POST | `/api/admin/components` | Admin, Editor | List/create components |
| GET/PUT/DELETE | `/api/admin/components/[id]` | Admin, Editor | Read/update/delete component |
| GET/POST | `/api/admin/form-builder` | Admin, Editor | List/create dynamic forms |
| GET/PUT/DELETE | `/api/admin/form-builder/[formId]` | Admin, Editor (DELETE: Admin) | Form details and metadata update/delete |
| PUT | `/api/admin/form-builder/[formId]/schema` | Admin, Editor | Save full builder schema + configuration (versioned) |
| GET | `/api/admin/form-builder/[formId]/submissions` | Admin, Editor | List submissions for one form (dynamic columns source) |
| GET/PATCH/DELETE | `/api/admin/form-builder/[formId]/submissions/[submissionId]` | Admin, Editor (DELETE: Admin) | Submission detail, mark-read, delete |
| GET | `/api/admin/form-builder/submissions` | Admin, Editor | Cross-form submissions feed (used by notification polling) |
| GET | `/api/admin/form-builder/files/[fileId]/download` | Admin, Editor | Secure file download/open for submission file |
| GET | `/api/admin/components/[id]/usage` | Admin, Editor | Count pages using component |
| GET/POST | `/api/admin/media` | Admin, Editor | List/upload media |
| GET/PUT/DELETE | `/api/admin/media/[id]` | Admin, Editor | Read/update/delete media |
| POST | `/api/admin/media/[id]/replace` | Admin, Editor | Replace file in-place for same media record |
| GET | `/api/admin/media/usage?mediaId=<id>` | Admin, Editor | Where-used references for media |
| GET | `/api/admin/media/settings` | Admin, Editor | Read media optimization settings |
| PUT | `/api/admin/media/settings` | Admin only | Update media optimization settings |
| GET | `/api/admin/media/jobs` | Admin, Editor | List media optimization jobs |
| POST | `/api/admin/media/jobs` | Admin only | Start media optimization job |
| GET | `/api/admin/media/jobs/[jobId]` | Admin, Editor | Job progress/details |
| POST | `/api/admin/media/jobs/[jobId]/cancel` | Admin only | Cancel running media job |
| GET/POST | `/api/admin/menus` | Admin, Editor | List/create menus |
| GET/PUT | `/api/admin/menus/[name]` | Admin, Editor | Read/update menu by name |
| GET | `/api/admin/contacts` | Admin, Editor | List contact submissions |
| DELETE | `/api/admin/contacts/[id]` | Admin, Editor | Delete contact submission |
| GET/POST | `/api/admin/users` | Admin only | List/create users |
| GET/PUT/DELETE | `/api/admin/users/[id]` | Admin only | Read/update/delete user |
| PUT | `/api/theme` | Admin only | Update theme configuration |
| GET/POST/DELETE | `/api/admin/fonts` | Admin, Editor | List/upload/delete custom fonts |

## Component Props Schema Format

Each component definition includes a `propsSchema` array that describes the editable fields for that component. The page builder and layout validation use this schema.

### Field object

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `key` | string | yes | Property name in the `props` object (e.g. `"text"`, `"src"`) |
| `type` | string | yes | One of: `text`, `richtext`, `image`, `url`, `number`, `select`, `boolean`, `json` |
| `label` | string | yes | Human-readable label shown in the page builder |
| `required` | boolean | no | If `true`, validation rejects empty/missing values |
| `maxLength` | number | no | Max string length (validated on page save) |
| `options` | string[] | no | Choices for `select` type fields |

### Example

```json
[
  { "key": "text", "type": "richtext", "label": "Body text", "required": true },
  { "key": "align", "type": "select", "label": "Alignment", "options": ["left", "center", "right"] },
  { "key": "showBorder", "type": "boolean", "label": "Show border" }
]
```

### defaultProps

The `defaultProps` object must conform to the `propsSchema`. The API validates this on component create/update — any `required` field must be present and `maxLength` constraints apply. When a new block is added in the page builder, `defaultProps` are copied into the block instance.

## Page Layout Data Structure

A page's `layout` is a **flat array** of blocks (no nesting). Each block has:

| Key | Type | Description |
|-----|------|-------------|
| `instanceId` | string | Unique ID for this block instance (generated client-side) |
| `componentId` | ObjectId \| null | Reference to `Component` document in DB (null for core-only blocks) |
| `baseComponent` | string | Name that maps to a React component in `COMPONENT_MAP` (e.g. `"Paragraph"`, `"Heading"`) |
| `props` | object | Instance-specific props (conforms to the component's `propsSchema`) |
| `order` | number | Sort order (0-based) |

**Flat-only design:** The layout array is strictly flat — there is no nested block structure. Components like `Columns` accept a `content` prop (array of column data) but this is a regular prop value, not nested layout blocks. No max-depth or child-block handling is needed.

## Public Page API Layout Contract

`GET /api/public/pages/[slug]` returns a published page with its `layout` array. Each block in the array includes:

- `baseComponent` — resolved from the block itself or from the populated `componentId.baseComponent`
- `componentId` — populated with the full component document (includes `propsSchema`, `defaultProps`, metadata)
- `props` — the instance props
- `instanceId`, `order` — as stored

The **public renderer** (`ComponentRenderer`) uses `baseComponent` to look up the React component from the in-app `COMPONENT_MAP`. It does **not** use the populated component metadata at render time — that data is available for external/headless consumers who may need schema information.

## Schema Change Handling

The layout stores **props values directly** (not a snapshot of the schema). When a component's `propsSchema` is updated:

1. **Existing pages are not automatically migrated.** Old prop values remain as-is in each page's layout.
2. **On next page save**, `validateLayoutProps` checks every block's props against the component's **current** schema. If a newly required field is missing, the save is rejected with a clear 400 error listing the violations.
3. **On render**, the component receives whatever props are stored. Extra/obsolete props are harmlessly ignored; missing props fall through to the component's own defaults or produce empty output.

**Recommended workflow when changing a schema:** Update the component definition first, then edit and re-save affected pages (the admin usage count endpoint `GET /api/admin/components/[id]/usage` helps identify them). No automated migration tooling exists in v1.

## Versioning

The API is currently **unversioned** (no `/v1/` prefix). This is intentional for simplicity in the initial release.

**Breaking change policy:** Breaking changes to the public read APIs (`/api/public/*`) will be announced in the repository's release notes before deployment. Admin APIs may change between releases as the admin panel is always deployed alongside the API.

If versioning becomes necessary (e.g. for third-party integrations), the recommended migration path is to introduce a `/api/v2/public/*` prefix for new endpoints while keeping `/api/public/*` as an alias for v1.

## Data Access in Server Components

Public-facing Next.js pages (home, `[slug]`, blog) are implemented as **Server Components** that query the database directly. This is the [recommended Next.js App Router pattern](https://nextjs.org/docs/app/building-your-application/data-fetching) — Server Components run on the server and do not need to go through HTTP API endpoints.

The public read APIs exist for:
- External or headless consumers
- Client Components that need to fetch data (e.g. search)
- Third-party integrations

Both patterns (direct DB in Server Components, public APIs for client/external use) return the same data shape and filter by `status: "published"`.
