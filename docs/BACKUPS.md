# Backups (Phase 7)

## MongoDB

- **Atlas:** Use Atlas backup (automated snapshots).  
- **Self-hosted:** Run `mongodump` on a schedule (cron):
  ```bash
  mongodump --uri="$MONGODB_URI" --out=./backup-$(date +%Y%m%d)
  ```
- Restore with `mongorestore`.

## Uploaded media

- If media is under `public/uploads` (or similar), back up that directory (e.g. tarball or sync to S3).
- For production, consider storing uploads in S3 or similar and using the provider’s backup/versioning.

## Env and config

- Keep `.env.example` in the repo; never commit `.env` or `.env.local`.  
- Document required env in README; store secrets in a vault or CI env.
