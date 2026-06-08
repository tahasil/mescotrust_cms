# FAQ Chatbot Implementation Checklist

Reference plan: `docs/FAQ_CHATBOT_MODULE_PLAN.md`

## Compatibility Guardrails (Must Hold Through All Phases)

- [x] Keep chatbot disabled by default (`enabled=false`) so current frontend behavior is unchanged until configured.
- [x] Add only additive routes/models/components; do not alter existing endpoint contracts.
- [x] Verify no regression with `npm run lint`.
- [x] Verify no regression with `npm run build`.
- [x] Smoke-check existing high-risk paths (public rendering, admin save flows, media upload, contact/subscribe).

## Phase 1: Data and API Foundation

### 1.1 Models and Indexes

- [x] Add `FAQChatbotConfig` model (`faq_chatbot_configs`) with singleton `settingsKey`.
- [x] Add `FAQChatbotNode` model (`faq_chatbot_nodes`) with hierarchy fields and required indexes.
- [x] Add `FAQChatbotSearchIndex` model (`faq_chatbot_search_index`) for searchable denormalized rows.
- [x] Add shared default/normalization/serialization helpers in `lib/faqChatbot.js`.
- [x] Add search-index rebuild helper in `lib/faqChatbotIndex.js`.

### 1.2 Admin APIs

- [x] Add `GET /api/admin/faq-chatbot` to return config + flat nodes + tree payload.
- [x] Add `PUT /api/admin/faq-chatbot` with:
- [x] admin auth guard (`requireAuth` + `isAdmin`),
- [x] optimistic concurrency token (`treeVersion`) handling with `409`,
- [x] config validation + node hierarchy validation,
- [x] tree replace + index rebuild flow.
- [x] Add `POST /api/admin/faq-chatbot/rebuild-search-index`.
- [x] Add granular mutation endpoints for node-level operations (optional split API for Phase 2 UX).

### 1.3 Public APIs

- [x] Add `GET /api/public/faq-chatbot/config`.
- [x] Add `GET /api/public/faq-chatbot/root-options`.
- [x] Add `GET /api/public/faq-chatbot/node/[id]`.
- [x] Add `GET /api/public/faq-chatbot/search` with:
- [x] min query length guard,
- [x] question-only result output,
- [x] pagination contract,
- [x] no-results message contract.
- [x] Add stricter indexed ranking tuning and metrics hooks.

## Phase 2: Admin Management UI

- [x] Add admin sidebar entry: `FAQ Chatbot` (admin-only visibility).
- [x] Add page: `app/admin/(authenticated)/faq-chatbot/page.js`.
- [x] Move all chatbot settings to a dedicated right-side Drawer UI (no inline settings on tree page).
- [x] Add settings form component with validation and save.
- [x] Add avatar/logo picker in settings Drawer.
- [x] Add color management controls in settings Drawer and persist values to config.
- [x] Add Ant `Tree`-based editor for hierarchy CRUD.
- [x] Keep main FAQ page focused on hierarchy CRUD (add/edit/delete question/answer).
- [x] Add delete confirmation + subtree delete behavior.
- [x] Add conflict retry UX for `409` responses.
- [x] Add manual `Rebuild Search Index` action and status panel.

## Phase 3: Public Widget

- [x] Add `components/layout/FAQChatbotWidget.js`.
- [x] Mount widget in `components/layout/PublicShell.js`.
- [x] Implement launcher/open/close/expand state model.
- [x] Implement welcome + root question options.
- [x] Implement question flow (answers + child options).
- [x] Implement search box with debounce and suggestion selection.
- [x] Implement timestamp formatting from config preferences.
- [x] Implement typing/thinking state timing contract.
- [x] Implement responsive layout behavior and tap targets.
- [x] Apply admin-managed color settings in widget UI (launcher/header/messages/chips).

## Phase 4: Hardening

- [x] Add index health checks and auto-repair telemetry.
- [x] Optimize ranking weights using real content samples (scoring tuned + `npm run faq-chatbot-search-eval` harness added for live sample validation).
- [x] Optional drag-and-drop reorder support.
- [x] Screenshot-based QA vs `docs/references/faq-chatbot/*` (automated via `npm run faq-chatbot-visual-qa`; report in `artifacts/faq-chatbot-qa/visual-report.json`).
- [x] Update `docs/API.md` with final endpoint contracts.
- [x] Add operator runbook notes (`rebuild`, troubleshooting, rollback).
