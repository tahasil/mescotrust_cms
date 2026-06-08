# FAQ Chatbot Runbook

Operational guide for maintaining the FAQ chatbot module in production.

Reference:
- Plan: `docs/FAQ_CHATBOT_MODULE_PLAN.md`
- Checklist: `docs/FAQ_CHATBOT_IMPLEMENTATION_CHECKLIST.md`

## 1. Preconditions

- App env is valid (`MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`).
- You can log in as an `Admin`.
- Route protection is active for:
  - `/admin/faq-chatbot`
  - `/api/admin/faq-chatbot*`

## 2. Normal Admin Workflow

1. Open `/admin/faq-chatbot`.
2. Manage FAQ hierarchy in the tree view:
   - Add/Edit/Delete Question
   - Add/Edit/Delete Answer
3. Click `Save FAQ Tree` after hierarchy updates.
4. Open `Chatbot Settings` drawer for configuration changes.
5. Save settings from the drawer.

Notes:
- `treeVersion` is used for optimistic concurrency.
- On conflict, API returns `409`; reload latest state and retry.

## 3. Search Index Operations

### Manual rebuild

- UI: `Chatbot Settings` drawer -> `Rebuild Index`
- API: `POST /api/admin/faq-chatbot/rebuild-search-index`

Expected response fields:
- `scannedNodes`
- `indexedRows`
- `skippedRows`
- `durationMs`

### Auto-repair behavior

- Public search endpoint checks index coverage.
- If nodes exist but current-tree index rows are missing, system auto-rebuilds.
- Auto-repair telemetry is stored in config under `searchIndexStatus`.

### Search query telemetry

- Public search records best-effort query metrics into config under `searchMetricsStatus`.
- Metrics tracked:
  - total queries
  - no-result queries
  - indexed-search vs fallback-search usage
  - total/average/last latency (ms)
  - last query text, timestamp, result count, and source
- To evaluate ranking quality against live content samples, run:
  - `npm run faq-chatbot-search-eval`
  - Optional env overrides:
    - `FAQ_CHATBOT_BASE_URL` (default `http://127.0.0.1:3000`)
    - `FAQ_CHATBOT_EVAL_MAX_QUESTIONS`
    - `FAQ_CHATBOT_EVAL_PAGE_SIZE`

## 4. Health Checks

### Admin API read check

- `GET /api/admin/faq-chatbot`
- Verify:
  - `config.treeVersion` increments after mutations.
  - `nodes` is non-empty when tree exists.
  - `searchIndexStatus` updates after rebuilds.
  - `searchMetricsStatus` increments after public search traffic.

### Public API read checks

- `GET /api/public/faq-chatbot/config`
- `GET /api/public/faq-chatbot/root-options`
- `GET /api/public/faq-chatbot/search?q=test&page=1&pageSize=20`

Expected:
- No 5xx errors.
- Search response includes pagination object.
- No-results path returns configured `noResultsFoundMessage`.

## 5. Troubleshooting

### Symptom: search returns empty despite existing nodes

1. Verify tree exists:
   - `GET /api/admin/faq-chatbot` -> `nodes.length > 0`
2. Trigger manual rebuild.
3. Re-run public search query.
4. Check `searchIndexStatus.lastError` in admin payload.

### Symptom: frequent 409 conflicts while editing

Cause:
- Concurrent admin edits using stale `treeVersion`.

Action:
1. Reload page to fetch latest tree.
2. Reapply pending edits.
3. Save again.

### Symptom: widget not visible publicly

Checklist:
1. `enabled` is `true` in chatbot settings.
2. Public config endpoint returns `enabled: true`.
3. Site layout includes chatbot widget mount (`PublicShell`).

## 6. Rollback Strategy

### Configuration rollback (fast)

1. Disable chatbot in settings drawer (`enabled=false`).
2. Save settings.

Effect:
- Public widget stops rendering without deleting node data.

### Data rollback (content)

If bad FAQ tree changes were saved:
1. Restore MongoDB backup from pre-change snapshot.
2. Restart app if required by deployment environment.
3. Rebuild search index from admin UI once system is up.

Backup reference:
- `docs/BACKUPS.md`

## 7. Release Verification

Run before release:
1. `npm run lint`
2. `npm run build`
3. `npm run faq-chatbot-visual-qa`
4. Smoke-check:
   - admin tree CRUD
   - settings drawer save
   - public widget open/flow/search
   - manual rebuild button

## 8. Visual QA Workflow

Reference images:
- `docs/references/faq-chatbot/ui-open-state.png`
- `docs/references/faq-chatbot/ui-thinking-state-1.png`
- `docs/references/faq-chatbot/ui-thinking-state-2.png`

Commands:
- Compare current UI to references:
  - `npm run faq-chatbot-visual-qa`
- Update references from freshly captured UI states:
  - `node scripts/faq-chatbot-visual-qa.js --update-reference`

Outputs:
- Captures: `artifacts/faq-chatbot-qa/captures/`
- Visual diffs: `artifacts/faq-chatbot-qa/diffs/`
- JSON report: `artifacts/faq-chatbot-qa/visual-report.json`

Notes:
- Visual QA script seeds deterministic FAQ test data and restores previous FAQ config/nodes/index after completion.
- Script also validates public flow behavior (root options, node resolution, search/no-result behavior, and search metrics hooks).
