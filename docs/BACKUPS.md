# Backup and Restore

## MongoDB Backup

### Using mongodump (self-hosted)

```bash
# Backup
mongodump --uri="mongodb://..." --out=/backups/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb://..." /backups/20260220
```

### MongoDB Atlas (managed)

If using MongoDB Atlas:
- **Continuous backup**: Enabled by default on M10+ clusters.
- **Snapshots**: Available in Atlas UI under Backup → Snapshots.
- **Point-in-time restore**: Available on dedicated clusters.

For free/shared clusters (M0/M2/M5), use `mongodump` manually or schedule via cron.

## Media Backup

Uploaded media is stored in `public/uploads/`. Back up this directory alongside your database.

```bash
# Tar the uploads folder
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz public/uploads/
```

### Production: S3 or External Storage

For production, consider migrating media uploads to S3, Cloudflare R2, or similar:

1. Update `app/api/admin/media/route.js` to upload to S3 instead of local filesystem.
2. Serve media via CDN or signed URLs.
3. S3 provides built-in versioning and cross-region replication.

Update the `Media` model's `url` field to store the full S3 URL.

## Automated Backups

### Cron Job (Linux/macOS)

```bash
# Add to crontab: daily at 2 AM
0 2 * * * /path/to/backup-script.sh
```

### Vercel Cron (if deployed on Vercel)

Use Vercel Cron Jobs to trigger a backup API route that exports the database.

## Content Export/Import (Optional)

For JSON-based content backup/migration, create admin APIs:
- `GET /api/admin/export` — exports pages, blogs, menus, components as JSON.
- `POST /api/admin/import` — imports JSON backup.

This is useful for staging → production content migration.
