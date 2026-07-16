# Social Media Wall Module (Standalone Plan)

## 1. Module Overview
The `Social Media Wall` is an independent, reusable module designed for a single project deployment. It aggregates posts from platforms such as Facebook, Instagram, YouTube, LinkedIn, X (Twitter), Pinterest, and Snapchat, then displays them in a unified card-based UI.

Core flow:
`Platform APIs -> Fetch Services -> Scheduler -> Database -> Moderation -> Public Feed API -> Frontend Widget`

---

## 2. Scope

### In Scope
- Single-project module ownership and data boundaries
- Dedicated admin sidebar module: `Social Wall`
- Multi-platform post ingestion
- Unified post normalization and storage
- Optional moderation workflow
- Public read API for website consumption
- Admin module for platform setup, posts, and moderation
- Reusable Page Builder block that can be added to any page
- Caching, logging, error handling, and token lifecycle support

### Out of Scope (Phase 1)
- AI caption rewriting
- Automatic translation
- Sentiment analysis
- Advanced recommendation ranking

### Platform Support Policy (Phase 1)
- `Instagram`, `Facebook`, `YouTube`, and `X (Twitter)` are eligible for live ingestion.
- `LinkedIn`, `Pinterest`, and `Snapchat` are `manual-only` until API access and approval requirements are verified.
- Each platform must expose an explicit mode: `live` or `manual-only`.

---

## 3. Module Boundaries
This should be maintained as a separate domain module.

### Module Subsystems
1. `Platform Config Service`
2. `Platform Fetch Adapters`
3. `Scheduler & Jobs`
4. `Post Repository`
5. `Moderation Service`
6. `Public Feed API`
7. `Admin API + Admin UI (Sidebar Module)`
8. `Page Builder Integration Layer`
9. `Analytics & Observability`

---

## 4. Functional Requirements
1. Admin users can create and update platform credentials.
2. A scheduler fetches new posts at fixed intervals.
3. Duplicate storage is prevented by a unique `platform + postId` key.
4. In moderation mode, new posts enter the `pending` state.
5. Public APIs return only approved and visible posts.
6. The Social Wall appears as a dedicated item in the admin sidebar.
7. Admin users can manage settings, platforms, sync, posts, moderation, and logs from the module.
8. The frontend wall block is fully responsive.
9. The Page Builder exposes Social Wall as a reusable block for any page.
10. Page-level configuration supports platform selection, layout, post count, filters, card style, and sorting.
11. Failures (token expiry, rate limits, quota issues) are logged with clear error categories.

---

## 5. Data Model (Module-Owned)

## 5.0 `social_wall_settings`
- `moduleEnabled` (boolean)
- `defaultLayout` (`grid` | `masonry` | `carousel`)
- `defaultPostLimit` (number)
- `defaultSortBy` (`latest` | `platform-priority` | `engagement`)
- `defaultSortOrder` (`asc` | `desc`)
- `filtersEnabled` (boolean)
- `moderationMode` (`auto` | `manual`)
- `cardStylePreset` (`clean` | `outlined` | `elevated`)
- `updatedBy`
- `createdAt`, `updatedAt`

Indexes:
- Single document pattern (or unique key: `moduleName`)

## 5.1 `social_platform_configs`
- `platform` (`instagram`, `facebook`, `youtube`, `linkedin`, `twitter`, `pinterest`, `snapchat`)
- `active` (boolean)
- `displayOrder` (number)
- `accessTokenEnc`
- `refreshTokenEnc`
- `accountIdEnc`
- `apiKeyEnc`
- `fetchIntervalMinutes`
- `lastSyncAt`
- `lastSyncStatus` (`success` | `failed`)
- `lastSyncError`
- `updatedBy`
- `createdAt`, `updatedAt`

Indexes:
- Unique: `platform`
- Composite: `active, displayOrder`

## 5.2 `social_posts`
- `platform`
- `postId`
- `authorName`
- `authorHandle`
- `authorImage`
- `caption`
- `mediaType` (`image` | `video` | `text`)
- `mediaUrl`
- `thumbnailUrl`
- `videoUrl`
- `postUrl`
- `publishedAt`
- `likesCount`
- `commentsCount`
- `sharesCount`
- `hashtags[]`
- `source` (`live` | `manual`)
- `status` (`pending` | `approved` | `rejected`)
- `featured` (boolean)
- `visibility` (`all` | `desktop` | `mobile` | `none`)
- `rawPayload` (optional)
- `createdAt`, `updatedAt`

Indexes:
- Unique: `platform + postId`
- Composite: `status + publishedAt + _id`
- Composite: `platform + publishedAt`
- Composite: `featured + status`

## 5.3 `social_fetch_logs`
- `platform`
- `runId`
- `startedAt`, `endedAt`
- `fetchedCount`
- `newCount`
- `updatedCount`
- `failedCount`
- `status`
- `errorCode`
- `errorMessage`

Indexes:
- Composite: `platform + startedAt`

---

## 6. Platform Adapter Contract
All platform adapters should follow the same interface:

```ts
interface SocialPlatformAdapter {
  platform: string;
  fetchLatestPosts(config, options): Promise<NormalizedPost[]>;
  refreshAccessToken?(config): Promise<TokenRefreshResult>;
  validateConfig(config): Promise<ValidationResult>;
}
```

Required normalized fields:
- `platform`
- `postId`
- `caption`
- `mediaType`
- `postUrl`
- `publishedAt`

---

## 7. Scheduler and Jobs

## 7.1 Jobs
1. `social.fetch.platform.<platform>`
2. `social.token.refresh.<platform>`
3. `social.cleanup.logs`

## 7.2 Frequency
- Default fetch interval: every 30 minutes
- Token refresh checks: daily + pre-expiry refresh
- Log cleanup: daily

## 7.3 Execution Rules
- Use `Promise.allSettled` for platform-level fault tolerance
- Enforce per-platform timeout (for example, 20s)
- Retry only transient failures (`5xx`, timeout)
- Apply rate-limit aware backoff
- Use platform-level lock/lease controls to prevent overlapping runs.
- Use idempotency keys per run window (`platform + runWindow`) to avoid duplicate writes.

---

## 8. Moderation Workflow

### Modes
1. `Auto Publish`
2. `Manual Approval`

### State Transitions
- `pending -> approved`
- `pending -> rejected`
- `approved -> rejected` (admin action)
- `rejected -> approved` (admin action)

Moderation audit fields:
- action
- performedBy
- performedAt
- reason (optional)

---

## 9. API Design

## 9.1 Public APIs
1. `GET /api/public/social-wall`
2. `GET /api/public/social-wall/platforms`

Query parameters:
- `platform`
- `limit`
- `cursor`
- `featured`
- `search`

Pagination and ordering contract:
- Use strict keyset pagination only (no offset pagination).
- Sort order: `publishedAt DESC, _id DESC`.
- `cursor` must encode `{ publishedAt, id }` from the last item (for example, base64url JSON).
- Next page condition: `publishedAt < lastPublishedAt` OR (`publishedAt == lastPublishedAt` AND `_id < lastId`).
- Return `nextCursor` only when additional rows exist.

Response example:
```json
{
  "items": [
    {
      "platform": "instagram",
      "caption": "New Event",
      "thumbnailUrl": "https://...",
      "likesCount": 120,
      "commentsCount": 12,
      "postUrl": "https://...",
      "publishedAt": "2026-07-16T08:00:00.000Z"
    }
  ],
  "nextCursor": "..."
}
```

## 9.2 Admin APIs
1. `GET /api/admin/social-wall/settings`
2. `PUT /api/admin/social-wall/settings`
3. `GET /api/admin/social-wall/platforms`
4. `PUT /api/admin/social-wall/platforms`
5. `POST /api/admin/social-wall/sync`
6. `GET /api/admin/social-wall/posts`
7. `PATCH /api/admin/social-wall/posts/:id/status`
8. `PATCH /api/admin/social-wall/posts/:id/feature`
9. `GET /api/admin/social-wall/logs`

Authorization:
- Admin-only for credentials and configuration endpoints
- Admin/Editor for moderation endpoints, based on policy

`fetch-now` guardrails:
- Rate limit: maximum 1 manual fetch per platform per 5 minutes.
- If cooldown is active, return `429 Too Many Requests`.
- The response must include `retryAfterSeconds`.
- Manual fetches must respect the same lock/idempotency rules as scheduled jobs.

## 9.3 Page Builder Block Contract
The Social Wall must be available in Page Builder as a regular block/component.

Block fields (page-level, per instance):
- `enabled`
- `platforms[]` (selected subset to render)
- `layoutMode` (`grid` | `masonry` | `carousel`)
- `postLimit`
- `filtersEnabled`
- `sortBy`, `sortOrder`
- `cardStylePreset`
- `showPlatformIcon`
- `showEngagement`
- `showDate`
- `title/subtitle` and section styling

Resolution order:
1. Block-level overrides (from page layout)
2. Module defaults (`social_wall_settings`)
3. System defaults

Behavior:
- The block does not store credentials.
- The block reads published data via public Social Wall APIs.
- Multiple Social Wall blocks can be added across different pages.

---

## 10. Admin Module UI
Menu: `Social Wall`

Sub-pages:
1. `Dashboard`
2. `Posts`
3. `Platforms`
4. `Moderation`
5. `Settings`
6. `Logs`

Admin sidebar requirement:
- Add dedicated route entry: `/admin/social-wall`
- This module must be separate from page content editing routes.

### Posts Table Columns
- Platform
- Thumbnail
- Caption
- Published Date
- Status
- Featured
- Actions

### Filters
- Platform
- Date range
- Status
- Featured
- Search (caption, hashtag, author)

---

## 11. Frontend Widget Specification

### Card Elements
- Platform icon
- Author
- Date
- Media
- Caption (line-clamped)
- Engagement row (when available)
- `Open Post` CTA

### Responsive Layout
- Desktop: 4 columns
- Tablet: 2 columns
- Mobile: 1 column

### UX Features
- Platform tabs: All / Instagram / Facebook / YouTube / LinkedIn / X / Pinterest / Snapchat
- Load more pagination (default)
- Optional infinite scroll
- Image lazy loading
- Video thumbnail-first rendering

Reusable component requirement:
- The Social Wall block must behave like existing reusable Page Builder blocks (Slider, Accordion, Blogs, Events).
- Admin can insert the block on any page and configure per-page rendering options without changing module credentials/settings.

---

## 12. Security Requirements
1. Encrypt tokens at rest.
2. Mask secrets in API responses.
3. Enforce RBAC on admin APIs.
4. Apply same-origin checks for write APIs.
5. Validate all input fields (URLs, captions, platform keys).
6. Maintain an audit trail for configuration and moderation changes.

---

## 13. Performance Requirements
1. Do not call platform APIs directly from the browser.
2. Public feed target: `p95 < 500ms` (cache/DB-backed responses).
3. Maximum page size: 60 items.
4. Required database indexes must exist before release.
5. Use short-lived cache with stale fallback for reliability.

---

## 14. Error Handling
Standard error categories:
- `TOKEN_EXPIRED`
- `RATE_LIMITED`
- `QUOTA_EXCEEDED`
- `NETWORK_ERROR`
- `PLATFORM_API_ERROR`
- `VALIDATION_ERROR`

Policy:
- Failure in one platform must not block other platforms.
- Serve the last successful data where possible.

---

## 15. Environment Variables
- `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID`
- `FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`
- `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`
- `TWITTER_BEARER_TOKEN`, `TWITTER_USER_ID`
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` (if approved)
- `PINTEREST_ACCESS_TOKEN`, `PINTEREST_BOARD_ID`
- `SNAPCHAT_ACCESS_TOKEN`, `SNAPCHAT_PUBLIC_PROFILE_ID`
- `SOCIAL_WALL_DEFAULT_FETCH_INTERVAL`

---

## 16. Rollout Plan

### Phase 1
- Dedicated admin sidebar module shell (`/admin/social-wall`)
- Platform configuration + adapters + runtime feed API
- Admin settings/platforms/sync/pages for module management
- Reusable Page Builder block registration and editor form
- Frontend cards and filters

### Phase 2
- Scheduler + persisted `social_posts`
- Moderation module
- Logs dashboard

### Phase 3
- Analytics (views, clicks, platform CTR)
- Advanced ranking and featured strategies

---

## 17. Mandatory Test Checklist
The following checklist is required before each release:

1. Adapter Unit Tests
- Normalization mapping per platform
- Error category mapping (`TOKEN_EXPIRED`, `RATE_LIMITED`, etc.)
- Token refresh behavior where applicable

2. API Contract Tests
- Public feed schema validation
- Keyset pagination correctness (`cursor`, `nextCursor`, stable ordering)
- Admin endpoint auth/validation behavior

3. Scheduler and Job Tests
- Cron execution path
- Lock/lease behavior under parallel workers
- Idempotent upsert verification
- `fetch-now` cooldown and `429` verification

4. Moderation Workflow Tests
- Status transition validation
- Role-based permission checks
- Feature/unfeature actions

5. Frontend Integration Tests
- Platform filter behavior
- Load more / infinite scroll behavior
- Responsive rendering checks

Release gate:
- No blocker or high-severity defects open.
- All mandatory tests pass in CI.
- Production configuration and credentials validated.

---

## 18. Acceptance Criteria
1. Admin users can configure platforms with secure credential handling.
2. Scheduler ingests posts without duplicates.
3. Moderation mode correctly enforces `pending -> approved/rejected`.
4. Public API is stable and performs within target bounds.
5. Admin sidebar includes a dedicated `Social Wall` module with settings, platforms, sync, posts, moderation, and logs.
6. Page Builder can add Social Wall as a reusable block on any page.
7. Page-level block configuration supports platform selection, layout, post limit, filters, card style, and sorting.
8. Frontend wall is responsive and filterable.
9. Error logs are available in an actionable format.
