# Social Media Wall User Guide

This guide explains how to use the Social Media Wall module in the CMS from setup to publishing on pages.

## 1. What This Module Does

The Social Media Wall module lets you:

- Connect social platforms.
- Fetch posts into a unified feed.
- Moderate posts (approve/reject/feature).
- Track sync and configuration logs.
- Add a reusable Social Wall block in Page Builder.

Supported platform policy in this release:

- Live mode available: Instagram, Facebook, YouTube, X (Twitter)
- Manual-only mode: LinkedIn, Pinterest, Snapchat

## 2. Access and Permissions

Use these roles:

- Admin:
  - Full access to settings, platform credentials, sync jobs, logs, and cron-related operations.
- Editor:
  - Can view dashboard, posts, moderation, logs.
  - Cannot update admin-only credentials/settings endpoints.

Module location in admin sidebar:

- `Admin -> Social Wall`
- Route: `/admin/social-wall`

## 3. First-Time Setup (Recommended Order)

### Step 1: Open Social Wall module

1. Login to admin panel.
2. Open `Social Wall` from sidebar.
3. Start with `Settings` tab.

### Step 2: Configure global settings

In `Settings` tab, configure:

- `Module enabled`
- `Default layout` (grid, masonry, carousel)
- `Default post limit`
- `Default sort by` (latest, platform-priority, engagement)
- `Default sort order` (desc, asc)
- `Filters enabled`
- `Moderation mode`:
  - `Manual` = new fetched posts start as `pending`
  - `Auto` = new fetched posts auto-approve
- `Card style preset` (clean, outlined, elevated)

Click `Save Settings`.

### Step 3: Configure platforms and credentials

Open `Platforms` tab and configure per platform:

- `Active` toggle
- `Mode`:
  - `live` for live-capable platforms
  - `manual-only` for restricted platforms
- `Display Order`
- `Post Limit`
- `Fetch Interval (min)`
- Credentials:
  - `ACCESS_TOKEN`
  - `ACCOUNT_ID`
  - `API_KEY` (YouTube, where applicable)

Credential security behavior:

- Secrets are encrypted at rest.
- Returned values are masked in UI/API responses.

Click `Save Platforms`.

## 4. Sync and Jobs

Open `Sync` tab.

### Run manual sync

1. Optionally choose platforms.
2. Click `Run Manual Sync`.

Manual sync guardrail:

- Per-platform cooldown is enforced.
- If cooldown is active for all selected platforms, API returns `429` with `retryAfterSeconds`.

### Run scheduled sync job (on-demand trigger)

Click `Run Scheduled Sync Job`.

Scheduled behavior includes:

- Platform interval checks
- Platform lock/lease
- Idempotency window control
- Per-platform timeout and retry handling

### Refresh tokens

Click `Refresh Tokens` to run token refresh job for applicable platforms.

### Cleanup logs

Click `Cleanup Old Logs` to purge older sync logs.

## 5. Post Management and Moderation

## Posts tab

Use `Posts` tab to manage all imported posts.

Available filters:

- Platform
- Status
- Featured
- Date range
- Search (caption, hashtag, author)

Available actions:

- `Approve`
- `Reject`
- `Feature` toggle

Post table includes:

- Platform
- Thumbnail
- Caption
- Published date
- Status
- Featured
- Actions

## Moderation tab

Use `Moderation` tab for pending queue review.

Allowed status transitions:

- `pending -> approved`
- `pending -> rejected`
- `approved -> rejected`
- `rejected -> approved`

Each moderation action is recorded in audit history with:

- action
- performedBy
- performedAt
- reason (if provided)

## 6. Logs and Audit

Open `Logs` tab.

You can view two log types:

- `Sync Logs`
- `Config Audit Logs`

Sync logs include:

- platform
- trigger
- status
- started/ended time
- duration
- fetched/new/updated counts
- error code/message

Config audit logs include:

- entity type/key
- action
- performedBy
- payload snapshot
- timestamp

## 7. Add Social Wall in Page Builder

This module is reusable in Page Builder as `Social Wall` component (component id `SocialWallFeed`).

### Step-by-step

1. Open `Admin -> Pages`.
2. Create a new page or edit an existing page.
3. In Page Builder, add component `Social Wall`.
4. Open block settings (Edit).
5. Configure block-level options.
6. Save page.
7. Publish/update page.

### Block-level options (per page instance)

- `Enable component`
- `Platforms to display` (selected subset)
- `Layout mode` (grid, masonry, carousel)
- `Post limit`
- `Enable filters`
- `Card style`
- `Sort by`
- `Sort order`
- `Show platform icon`
- `Show engagement`
- `Show date`
- `Enable infinite scroll` (optional)
- Title/subtitle and section style controls

Resolution order:

1. Block-level values (page instance)
2. Module defaults (Social Wall settings)
3. System defaults

## 8. Public Feed Behavior

Public feed APIs used by the component:

- `GET/POST /api/public/social-wall/feed`
- `GET /api/public/social-wall/platforms`

Feed behavior:

- Only approved and visible posts are shown publicly.
- Keyset pagination (`cursor`, `nextCursor`) is used for stable load-more.
- Supports platform filters and search.
- Uses short-lived cache with stale fallback for reliability.

## 9. Cron Usage (Production)

For automation, use:

- `GET /api/cron/social-wall`

Required secret:

- Set `SOCIAL_WALL_CRON_SECRET` in environment.
- Send as Bearer token or `?secret=...`.

Cron actions:

- Default or `action=scheduled-sync`
- `action=refresh-tokens`
- `action=cleanup-logs`

Useful query params:

- `platforms=instagram,facebook`
- `force=1` (for token refresh)
- `olderThanDays=45` (for cleanup)

## 10. Environment Variables

Common module variables:

- `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID`
- `FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`
- `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`
- `TWITTER_BEARER_TOKEN`, `TWITTER_USER_ID`
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` (if approved)
- `PINTEREST_ACCESS_TOKEN`, `PINTEREST_BOARD_ID`
- `SNAPCHAT_ACCESS_TOKEN`, `SNAPCHAT_PUBLIC_PROFILE_ID`
- `SOCIAL_WALL_DEFAULT_FETCH_INTERVAL`
- `SOCIAL_WALL_CRON_SECRET`

## 11. Database Collections (Module-Owned)

- `social_wall_settings`
- `social_platform_configs`
- `social_posts`
- `social_fetch_logs`
- `social_config_audit_logs`

## 12. Troubleshooting

### No posts appearing on website

Check:

1. Module is enabled in Settings.
2. Platform is active and in correct mode.
3. Sync completed successfully (check Sync Logs).
4. Posts are approved (if moderation mode is manual).
5. Page block is enabled and configured correctly.

### Manual sync returns cooldown error

This is expected guardrail behavior.

- Wait for `retryAfterSeconds`.
- Retry after cooldown window.

### Platform fetch fails

Check:

1. Credential validity (token/key/account id)
2. Platform API permissions/scopes
3. Rate-limit/quota status
4. Error code in logs:
   - `TOKEN_EXPIRED`
   - `RATE_LIMITED`
   - `QUOTA_EXCEEDED`
   - `NETWORK_ERROR`
   - `PLATFORM_API_ERROR`
   - `VALIDATION_ERROR`

### Page Builder block shows empty state

Check:

1. Block-level filters are not too restrictive.
2. Selected platforms have approved content.
3. `postLimit` is greater than zero.

## 13. Recommended Operating Routine

Daily:

- Review moderation queue.
- Check sync failures in logs.

Weekly:

- Verify platform credentials and token expiry.
- Review featured posts.

Monthly:

- Clean old logs.
- Review default settings and layout quality across pages.

