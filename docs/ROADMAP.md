# Future Enhancements (Post-MVP Roadmap)

Items below are standard in production CMS platforms (e.g. WordPress) and should
be prioritised once the core feature set is stable.

## Content Revision History

Track every save as a revision with author and timestamp. Allow editors to view
diffs between revisions and restore a previous version.

**Suggested approach:** Add a `PageRevision` / `BlogRevision` model that stores
a snapshot of the document on each save. The page/blog PUT handler inserts a
revision before applying the update.

## Scheduled Publishing

Allow posts and pages to have a `scheduledAt` date. A background job (cron,
Vercel Cron, or external scheduler) promotes `status: "scheduled"` documents to
`published` when the time arrives.

## Soft-Delete / Trash

Move deleted content to a "trash" state instead of permanent deletion. Add a
`deletedAt` field; filter it out of normal queries; expose a trash view in admin
with restore and permanent-delete actions. Auto-purge after 30 days.

## Audit Log / Activity Log

Record who performed what action and when (e.g. "User X published page Y at
Z"). Store in an `AuditLog` collection. Surface in admin dashboard or a
dedicated log page for governance and compliance.

## Bulk Operations

Add checkboxes to admin list pages (pages, blogs, contacts, users) with bulk
actions: publish, unpublish, delete, change status. Reduces repetitive work for
editors managing large content libraries.

## Orphan Media Cleanup

When a blog post or page is deleted, optionally flag or remove media assets that
are no longer referenced by any content. Surface "unreferenced media" in the
media library for manual review.

## Tighter CSP in Production

Remove `'unsafe-eval'` and `'unsafe-inline'` from the Content-Security-Policy
header in production builds. Use nonce-based script loading instead.
