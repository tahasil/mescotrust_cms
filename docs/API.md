# API Reference

For low-level details (data models, database schemas, full endpoint list), see [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md).

## Path Convention

All API routes live under `/api/`. The convention is:

| Prefix | Auth | Purpose |
|--------|------|---------|
| `/api/public/*` | None (public) | Read-only endpoints for published content |
| `/api/admin/*` | JWT (NextAuth) | Protected CRUD endpoints for admin panel |
| `/api/theme` | GET: public, PUT: Admin | Theme configuration |
| `/api/admin/appearance/[module]` | GET, PUT: Admin | Independent Appearance Header/Footer configuration (`module`: `header` or `footer`) |
| `/api/contact` | None (rate-limited) | Contact form submission |
| `/api/health` | None | Health check (DB connectivity) |
| `/api/auth/*` | NextAuth internal | Authentication (login/session) |

## Public Read APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/pages/[slug]` | Single published page by slug |
| GET | `/api/public/forms/[formId]` | Published Form Builder runtime schema by immutable `formId` |
| GET | `/api/public/forms/resolve?shortcode=...` | Published Form Builder runtime schema by immutable shortcode |
| GET | `/api/public/blogs?page=1&limit=12&category=slug` | Published blog posts (paginated, filterable) |
| GET | `/api/public/blogs/[slug]` | Single published blog post by slug |
| GET | `/api/public/blog-categories` | All blog categories |
| GET | `/api/public/menus?name=header` | Menu by name (e.g. header, footer) |
| GET | `/api/public/search?q=term` | Search pages and posts by title/slug/excerpt |
| GET | `/api/theme` | Active theme configuration |
| GET | `/media/[id]?size=original&format=auto` | Stable media delivery endpoint (`format=auto` prefers WebP, then AVIF, then original/JPG). Legacy size names are accepted and resolved to original. |
| GET | `/api/health` | Database connectivity check (200 or 503) |

## Admin APIs

All admin APIs require authentication via JWT and the operation-specific permission resolved by `requireAuth`. The role names below describe the default system-role grants; custom roles can receive the same permissions.

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
| GET | `/api/admin/components/[id]/usage` | Admin, Editor | Count pages using component |
| GET/POST | `/api/admin/media` | Admin, Editor | List/upload media |
| GET/PUT/DELETE | `/api/admin/media/[id]` | Admin, Editor | Read/update/delete media |
| POST | `/api/admin/media/[id]/replace` | Admin, Editor | Replace file in-place for same media record |
| GET | `/api/admin/media/usage?mediaId=<id>` | Admin, Editor | Where-used references for media |
| GET | `/api/admin/media/settings` | Admin, Editor | Read media optimization settings |
| PUT | `/api/admin/media/settings` | Admin only | Update media optimization settings |
| GET | `/api/admin/media/jobs` | Admin only | List media optimization jobs |
| POST | `/api/admin/media/jobs` | Admin only | Start media optimization job |
| GET | `/api/admin/media/jobs/[jobId]` | Admin only | Job progress/details |
| POST | `/api/admin/media/jobs/[jobId]/cancel` | Admin only | Cancel running media job |
| GET/POST | `/api/admin/menus` | Admin, Editor | List/create menus |
| GET/PUT | `/api/admin/menus/[name]` | Admin, Editor | Read/update menu by name |
| GET/POST | `/api/admin/forms` | Admin, Editor | List/create Form Builder forms |
| GET/PUT/DELETE | `/api/admin/forms/[formId]` | Admin, Editor | Read/update/delete form metadata |
| PUT | `/api/admin/forms/[formId]/schema` | Admin, Editor | Update canonical form schema (sections/questions) |
| POST | `/api/admin/forms/[formId]/publish` | Admin, Editor | Transition form status `draft -> published` |
| POST | `/api/admin/forms/[formId]/unpublish` | Admin, Editor | Transition form status `published|archived -> draft` |
| POST | `/api/admin/forms/[formId]/archive` | Admin, Editor | Transition form status `draft|published -> archived` |
| GET | `/api/admin/forms/[formId]/submissions` | Admin, Editor | List form submissions with filters (`page`, `limit`, `search`, `isRead`, `dateFrom`, `dateTo`, `sort`) |
| GET/PATCH/DELETE | `/api/admin/forms/[formId]/submissions/[submissionId]` | Admin, Editor | Read submission detail, mark `isRead`, or delete submission |
| GET | `/api/admin/forms/submissions/unread?limit=10` | Admin, Editor | Latest unread Form Builder submissions across forms |
| POST | `/api/admin/forms/[formId]/submissions/export` | Roles with `form_builder.export_data` | Export form submissions (`csv_filtered`, `xlsx_all`, `custom`) |
| GET | `/api/admin/contacts` | Admin, Editor | List contact submissions |
| DELETE | `/api/admin/contacts/[id]` | Admin, Editor | Delete contact submission |
| POST | `/api/admin/contacts/export` | Roles with `submissions.export_data` | Export contact/volunteer submissions |
| POST | `/api/admin/subscribers/export` | Roles with `submissions.export_data` | Export subscribers |
| POST | `/api/admin/event-registrations/export` | Roles with `submissions.export_data` | Export event registrations |
| POST | `/api/admin/volunteers-feedback/export` | Roles with `submissions.export_data` | Export volunteers feedback submissions |
| GET/POST | `/api/admin/donations/export` | Roles with `submissions.export_data` | Export donations/donate-now submissions |
| GET/POST | `/api/admin/users` | Admin only | List/create users |
| GET/PUT/DELETE | `/api/admin/users/[id]` | Admin only | Read/update/delete user |
| GET | `/api/admin/rbac/permissions` | Role Manager | List the active, current-project permission catalog |
| GET/POST | `/api/admin/rbac/roles` | User Manager / Role Manager | List assignable roles or create a custom role |
| GET/PUT/DELETE | `/api/admin/rbac/roles/[key]` | User Manager / Role Manager | Read, update, or safely delete a role |
| PUT | `/api/theme` | Admin only | Update theme configuration |
| GET/POST/DELETE | `/api/admin/fonts` | Admin, Editor | List/upload/delete custom fonts |

### Media Upload / Replace Contract

`POST /api/admin/media` and `POST /api/admin/media/[id]/replace` share the same contract for raster images.

Request (`multipart/form-data`):
- `file` (required)
- `crop` (required for raster images): JSON string `{ "x": number, "y": number, "width": number, "height": number }`
- `width`, `height` (optional; if one is sent, both are required)
- `title` (optional)
- `altText` (optional)

Raster MIME types requiring crop confirmation:
- `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/avif`

Non-raster bypass:
- `image/svg+xml`, `application/pdf` (crop payload not required)

Validation/error responses (`400`):
- `CROP_CONFIRMATION_REQUIRED`
- `INVALID_CROP_PAYLOAD`
- `WIDTH_HEIGHT_BOTH_REQUIRED`
- `INVALID_DIMENSIONS`
- `DIMENSIONS_EXCEED_SOURCE`

Processing contract for new raster uploads/replacements:
- Single-size only (`generatedSizes.original` is written for new records)
- Output formats are generated from confirmed crop result:
  - `original`
  - `jpg`
  - `webp`
  - `avif`
- JPG generation uses deterministic alpha flattening on white (`#ffffff`) for transparent inputs.

## Form Builder (Phase 1)

### Roles and protection

- UI paths under `/admin/form-builder*` are restricted to `Admin` and `Editor`.
- API paths under `/api/admin/forms*` are restricted to `Admin` and `Editor`.
- `Author` receives `403` for Form Builder API access.

### `GET /api/admin/forms`

Query params:
- `page` (default `1`)
- `limit` (default `20`, max `100`)
- `search` (matches `formId`, `name`, `shortcode`, `shortcodeAlt`)
- `status` (`draft|published|archived`)

Response:
- `{ items, total, page, totalPages, limit }`

### `POST /api/admin/forms`

Request body:
- `name` (optional, defaults to `"Untitled Form"`)
- `shortcode` (optional candidate; unique shortcode still enforced)
- `schema` or `formSchema` (optional, normalized and validated)

Behavior:
- Creates a blank draft form when schema is omitted.
- Generates immutable `formId` (`FORM_###`) from `FormCounter`.
- Generates immutable unique `shortcode`.
- Persists `shortcodeAlt` from `formId`.

### `GET /api/admin/forms/[formId]`

Response includes both keys for compatibility:
- `schema`
- `formSchema`

Both contain the canonical sections/questions structure.

### `PUT /api/admin/forms/[formId]`

Mutable fields:
- `name`

Rejected in this endpoint:
- `formId`, `shortcode`, `shortcodeAlt` (immutable)
- `status` (must use lifecycle endpoints)
- `schema`/`formSchema` (must use `/schema` endpoint)

### `DELETE /api/admin/forms/[formId]`

Delete policy:
- Returns `409` when one or more submissions exist.
- Hard delete allowed only when submission count is zero.

### `PUT /api/admin/forms/[formId]/schema`

Request body:
- `schema` or `formSchema` (required)

Behavior:
- Validates sections/questions linkage and field naming rules.
- Increments `schemaVersion` only when schema actually changes.

### Lifecycle endpoints

- `POST /api/admin/forms/[formId]/publish`
- `POST /api/admin/forms/[formId]/unpublish`
- `POST /api/admin/forms/[formId]/archive`

Invalid transitions return `400` with an actionable error.

### `GET /api/admin/forms/submissions/unread?limit=10`

Response:
- `{ items, limit }`
- `items[]` includes: `_id`, `formId`, `isRead`, `createdAt`, `payloadByFieldNameSnapshot`

## Form Builder (Phase 3 Runtime + Inbox)

### `GET /api/public/forms/[formId]`

Behavior:
- Resolves runtime schema only for `published` forms.
- Returns `404` for missing, draft, or archived forms.

Response:
- `{ formId, name, shortcode, schemaVersion, status, schema, formSchema, defaults }`

### `GET /api/public/forms/resolve?shortcode=...`

Behavior:
- Resolves published form by immutable `shortcode` or `shortcodeAlt`.
- Returns the same runtime payload shape as `/api/public/forms/[formId]`.

### `POST /api/public/forms/[formId]/upload`

Request:
- `multipart/form-data`
- required fields: `fieldKey`, `file`

Behavior:
- Form must be `published`.
- Field must exist in current schema and be type `file`.
- Server validates MIME type, extension, and size constraints.
- Stores a `SubmissionFile` in `pending` state until linked during submit.

Response:
- `{ submissionFileId, formId, fieldKey, filename, mimeType, size, url, status }`

### `POST /api/public/forms/[formId]/submit`

Request body supports:
- `answersByFieldKey` (preferred)
- `answers` / `payloadByFieldKey` aliases
- `answersByFieldName` / `payload` aliases

Behavior:
- Form must be `published`.
- Server-side validation is authoritative.
- Persists:
  - `fieldSnapshot`
  - `payloadByFieldKey`
  - `payloadByFieldNameSnapshot`
  - normalized `searchText`
- Links uploaded pending files to the created submission and marks them `linked`.

Validation error response:
- status `400`
- payload: `{ error: "Validation failed", errors: [{ fieldKey, error }] }`

Success response:
- status `201`
- payload: `{ success: true, formId, submissionId, message }`

### `GET /api/admin/forms/[formId]/submissions`

Query params:
- `page` (default `1`)
- `limit` (default `20`, max `100`)
- `search` (matches denormalized `searchText`)
- `isRead` (`true|false|all`, default `all`)
- `dateFrom`, `dateTo` (ISO date filters)
- `sort` (`createdAt_desc` default, `createdAt_asc`)

Response:
- `{ form, items, total, page, totalPages, limit }`
- `items[]` includes `_id`, `formId`, `isRead`, `createdAt`, `payloadByFieldNameSnapshot`, `source`, `pagePath`

### `GET /api/admin/forms/[formId]/submissions/[submissionId]`

Response:
- Full submission detail including:
  - `schemaVersion`
  - `fieldSnapshot`
  - `payloadByFieldKey`
  - `payloadByFieldNameSnapshot`
  - `isRead`, timestamps, metadata

### `PATCH /api/admin/forms/[formId]/submissions/[submissionId]`

Request:
- `{ "isRead": true|false }`

Behavior:
- Only `isRead` updates are allowed.

### `DELETE /api/admin/forms/[formId]/submissions/[submissionId]`

Behavior:
- Deletes submission record.
- Deletes linked `SubmissionFile` records.
- Attempts to remove linked stored files from disk.

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
