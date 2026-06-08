# FAQ Chatbot Module Plan (Admin-Managed, Non-AI)

## Status
Planning only. No implementation included in this document.

## 1. Scope Lock (Final)

This module will provide a fully admin-managed FAQ chatbot that runs only on stored FAQ hierarchy data.

Locked constraints:
- No external AI providers.
- No ChatGPT or third-party chatbot services.
- All user-visible answers must come from configured FAQ data.
- Admin can manage chatbot settings and entire question/answer hierarchy.

Primary outcome:
- Admin defines FAQ tree and chatbot behavior.
- Public widget renders dynamic, navigable, searchable FAQ conversations.

---

## 2. Design Reference Lock (Attached Screenshots)

Design and interaction must follow the attached UI references shared in this thread (dated 08-06-2026):
- Chatbot open state with header, message bubbles, quick reply chips, and input area.
- Thinking/typing state screenshots showing interim response loading behavior.

Mandatory reference alignment:
- Chatbot panel style and layout should be visually similar to attached references.
- Header actions must include expand/collapse and close controls in header area.
- Thinking/typing visual state must appear before bot reply when processing user input.
- Acceptance testing must include screenshot-to-UI comparison against these references.

Reference asset registry (must be kept in repo for stable implementation/QA):
- `docs/references/faq-chatbot/ui-open-state.png`
- `docs/references/faq-chatbot/ui-thinking-state-1.png`
- `docs/references/faq-chatbot/ui-thinking-state-2.png`

If filenames change, update this section and keep a single source-of-truth mapping in:
- `docs/references/faq-chatbot/README.md`

---

## 3. Codebase-Aligned Baseline

This plan aligns with existing project architecture and patterns:
- Next.js 14 App Router (`app/`), admin routes under `app/admin/(authenticated)/...`.
- MongoDB with Mongoose models in `models/`.
- Admin API protection through `requireAuth(req)` and role helpers (`isAdmin`, `isEditor`) in `lib/`.
- Static admin sidebar configured in `components/admin/AdminLayoutClient.js`.
- Public global shell via `components/layout/PublicShell.js`.
- Ant Design-based admin UI patterns.

Implication for this module:
- Follow existing admin route/API conventions.
- Reuse existing auth/permission middleware.
- Reuse existing media picker/upload pattern for chatbot avatar.

---

## 4. Module Architecture (Proper DB Collections)

The FAQ chatbot must be implemented as a multi-collection module, not as a single oversized tree document.

## 4.1 Collection A: `faq_chatbot_configs` (`FAQChatbotConfig`)

Purpose:
- Singleton chatbot settings and module-level metadata.

Proposed fields:
- `settingsKey` (String, unique, default: `"default"`)
- `enabled` (Boolean, default: `false`)
- `headerTitle` (String, required)
- `welcomeMessage` (String, required)
- `noResultsFoundMessage` (String, required; default: `"Sorry, I couldn't find an answer to your question."`)
- `avatar`: `{ mediaId, url }`
- `position` (enum: `bottom-right`, `bottom-left`; default `bottom-right`)
- `uiPreferences`:
- `showTimestamps` (Boolean, default `true`)
- `timestampFormat` (enum: `12h`, `24h`; default `12h`)
- `timestampLocale` (String, default `en-US`)
- `timestampTimezoneStrategy` (enum: `client-local`, `fixed-timezone`; default `client-local`)
- `fixedTimezone` (String IANA timezone; used only when strategy is `fixed-timezone`)
- `showTypingState` (Boolean, default `true`)
- `typingMinMs` (Number, default 600)
- `typingMaxMs` (Number, default 2500)
- `treeVersion` (Number, default 1)
- `updatedBy` (String)
- timestamps

Indexes:
- unique index on `settingsKey`

## 4.2 Collection B: `faq_chatbot_nodes` (`FAQChatbotNode`)

Purpose:
- One document per FAQ node for scalable hierarchy.

Proposed fields:
- `nodeId` (String, unique, immutable)
- `parentNodeId` (String, nullable for root)
- `rootNodeId` (String)
- `type` (enum: `question`, `answer`)
- `questionText` (String; required for `question`)
- `answerText` (String; required for `answer`)
- `depth` (Number, required)
- `order` (Number, required)
- `pathNodeIds` (String[])
- `pathText` (String)
- `isActive` (Boolean, default `true`)
- `createdBy`, `updatedBy`, timestamps

Hierarchy constraints:
- Root nodes must be `question` only.
- `question` nodes may have child `question` nodes and/or child `answer` nodes.
- `answer` nodes are terminal and cannot have children.
- Unlimited nesting is supported through recursive question descendants.

Node lifecycle rules:
- Deleting a `question` deletes its full descendant subtree in one transaction.
- Deleting an `answer` deletes only that answer node.
- Moving a node updates `parentNodeId`, `depth`, `rootNodeId`, `pathNodeIds`, `pathText` for that node and descendants in one transaction.
- Reordering siblings must normalize `order` to unique contiguous values (0..n-1) per parent.
- Invalid moves are blocked: no cycles, no child-to-ancestor move, no assigning children to `answer`.

Indexes:
- unique index on `nodeId`
- compound `{ parentNodeId: 1, order: 1 }`
- compound `{ rootNodeId: 1, depth: 1 }`
- text index on `questionText`, `answerText`, `pathText`

## 4.3 Collection C: `faq_chatbot_search_index` (`FAQChatbotSearchIndex`) (recommended)

Purpose:
- Denormalized index for fast suggestion search on large datasets.

Proposed fields:
- `nodeId`
- `type`
- `text`
- `pathText`
- `depth`
- `weight`
- `isActive`
- `treeVersion`
- timestamps

Indexes:
- text index on `text`, `pathText`
- compound `{ treeVersion: 1, isActive: 1 }`

---

## 5. Functional Requirements Mapping

## 5.1 Admin requirements

1. Add `FAQ Chatbot` menu in admin sidebar.
2. Add chatbot management page.
3. Manage hierarchical FAQ tree:
- add/edit/delete questions
- add/edit/delete answers
- support unlimited nesting for questions
4. Tree UI must use Ant Design `Tree`.
5. Tree supports expand/collapse; drag-and-drop optional for v1.
6. Configure chatbot settings:
- header title
- avatar/logo
- welcome message
- enable/disable
- no results found message

## 5.2 Frontend requirements

1. Show widget only when enabled in admin settings.
2. Show welcome message and Level 1 questions on initial open.
3. Place widget fixed at bottom-right by default.
4. Support desktop/tablet/mobile responsive behavior.
5. Support click/tap navigation and typed search.
6. Search across question and answer text and show suggestions.
7. Search results list must display matching questions only (not direct answers).
8. Selecting a matching question continues flow from that node and then shows answer/child questions.
9. Search supports partial match and related keyword matching.
10. If multiple questions match, show all relevant matching questions in results.
11. Show message timestamp for:
- welcome messages
- user messages
- bot responses
12. Show thinking/typing state before bot response when processing input.
13. If search has no matches, show admin-configured `No Results Found Message`.

---

## 6. API Plan

## 6.1 Admin APIs

All admin endpoints:
- call `requireAuth(req)` first
- enforce admin permission (`isAdmin(session)`)
- reject non-admin with `403`

Routes:
1. `GET /api/admin/faq-chatbot`
- returns config + hierarchical tree payload for admin editor.

2. `PUT /api/admin/faq-chatbot`
- saves config + node changes in one transaction.
- validates and normalizes payload.
- requires optimistic concurrency token (`treeVersion` or `updatedAt`).
- increments `treeVersion` on success.

Optional split endpoints:
- `PUT /api/admin/faq-chatbot/settings`
- `PUT /api/admin/faq-chatbot/tree`

3. `POST /api/admin/faq-chatbot/rebuild-search-index`
- admin-only endpoint to force full search-index rebuild for current `treeVersion`.
- returns rebuild summary: scanned nodes, indexed rows, skipped/invalid rows, duration.

Conflict handling:
- return `409` on stale version conflict.
- frontend must prompt admin to refresh and retry.

## 6.2 Public APIs

1. `GET /api/public/faq-chatbot/config`
- returns safe config:
- `enabled`, `headerTitle`, `welcomeMessage`, `noResultsFoundMessage`, `avatar`, `position`, `showTimestamps`, `timestampFormat`, `timestampLocale`, `timestampTimezoneStrategy`, `fixedTimezone`, `showTypingState`, `typingMinMs`, `typingMaxMs`, `treeVersion`

2. `GET /api/public/faq-chatbot/root-options`
- returns Level 1 question nodes.

3. `GET /api/public/faq-chatbot/node/[id]`
- returns selected node details:
- node content
- child question options
- terminal answers

4. `GET /api/public/faq-chatbot/search?q=...`
- performs keyword matching across active question and answer text.
- returns ranked question-only results (answers are never returned in results list).
- if answer text matches, return its nearest parent question as selectable result.
- supports partial and related keyword matching.
- if no matches, returns empty question results with configured `noResultsFoundMessage`.
- response contract:
- `results`: `[{ questionNodeId, questionText, pathText, score }]`
- `matchedCount`: `number`
- `pagination`: `{ page, pageSize, totalPages, totalResults }`
- `noResultsFoundMessage`: `string | null` (non-null only when `matchedCount=0`)

Search guardrails:
- `q` trimmed and normalized.
- minimum query length: 2 characters.
- search is paginated (`page`, `pageSize`) and frontend aggregates all pages to display all relevant matching questions.
- target response time: <= 300 ms for indexed queries under normal load.
- no-match response must include configured `noResultsFoundMessage`.

Caching:
- use `treeVersion` for invalidation.
- avoid stale results across config/tree updates.

Index recovery contract:
- incremental search-index update on create/update/delete of nodes is default.
- automatic full rebuild is triggered if index rows are missing or `treeVersion` mismatch is detected.
- admin can manually trigger rebuild from settings UI via rebuild API.

---

## 7. Admin UI Plan

## 7.1 Navigation and page

Add menu item:
- `FAQ Chatbot` in `components/admin/AdminLayoutClient.js`

Add page:
- `app/admin/(authenticated)/faq-chatbot/page.js`

Recommended component structure:
- `components/admin/FAQChatbot/FAQChatbotPage.js`
- `components/admin/FAQChatbot/FaqTreeEditor.js`
- `components/admin/FAQChatbot/FaqNodeFormModal.js`
- `components/admin/FAQChatbot/ChatbotSettingsForm.js`

## 7.2 Tree management UX

Use Ant Design `Tree` with custom node controls:
- Add child question
- Add answer
- Edit node
- Delete node

Behavior:
- Expand/collapse all.
- Highlight selected node.
- Confirm dialog for delete.
- Optional drag-and-drop reorder in v1.1 if complexity is high.

Editing patterns:
- Modal or drawer form for node text.
- Node type-aware form fields.
- Inline breadcrumb preview for context.
- Root add action allows only `question`.

## 7.3 Settings UX

Settings form fields:
- Enable chatbot switch
- Header title
- Welcome message
- No Results Found Message
- Avatar selector/uploader
- Timestamp display toggle
- Timestamp format (`12h`/`24h`)
- Timestamp locale
- Timestamp timezone strategy (`client-local` or fixed timezone)
- Thinking/typing state toggle and duration controls

Save flow:
- Client validation
- Server validation
- Version conflict handling (`409`)
- Success/error feedback via Ant notifications/messages

---

## 8. Frontend Widget Plan

## 8.1 Mounting and visibility

New component:
- `components/layout/FAQChatbotWidget.js`

Mount in:
- `components/layout/PublicShell.js`

Visibility logic:
- fetch `/api/public/faq-chatbot/config`
- render widget only if `enabled=true`

## 8.2 Header layout requirements (from attached UI)

Header must include:
- avatar/logo at left
- title and status text
- action icons in header-right in this order:
- expand/collapse icon
- close icon

Placement rule:
- expand/collapse and close controls must remain in header area only (not in body/footer), aligned to attached reference layout.

Header state model:
- `close` transitions widget from open panel state to launcher-only state.
- `expand/collapse` toggles between `normal-open` and `expanded-open`.
- reopening after `close` restores `normal-open` by default.
- open/expanded state persists within current browser tab during route navigation.

## 8.3 Initial render behavior

On first open:
1. Show header with avatar/title/status.
2. Show welcome message with timestamp.
3. Load and display Level 1 questions as selectable chips/list items.

## 8.4 Conversation flow logic

When user selects a question:
1. Append selected question message with timestamp.
2. Show thinking/typing state (if enabled).
3. Resolve node via ID.
4. If node has answer node(s), render answer bubble(s) with timestamp.
5. If node has child questions, render them as next selectable options.

When suggestion selected from search:
1. Jump to matched node.
2. Show thinking/typing state (if enabled).
3. Render resolved answer/options with timestamp.

When search has no matches:
1. Render configured `noResultsFoundMessage` as bot message.
2. Render timestamp for that message.
3. Keep quick navigation options available (`Back`, `Restart`, Level 1 questions).

Navigation controls:
- provide `Back` (to previous node state).
- provide `Restart` (clear journey and return to welcome + Level 1 options).

Timestamp contract:
- each message object stores `createdAtIso` in UTC at creation time.
- display format is derived from config (`timestampFormat`, `timestampLocale`, timezone strategy).
- welcome, user, bot, and typing-to-response replacement messages all retain original timestamp once rendered.

## 8.5 Thinking/typing state requirements

Thinking/typing state should be visually similar to attached typing reference screenshots:
- interim bot bubble with typing dots/loader.
- shown before final bot response.
- duration controlled by settings with min/max bounds.
- typing state must appear for both option-click and search-driven flows before rendering bot output.

Thinking/typing timing contract:
- typing state starts immediately after user action that requests bot output.
- minimum visible duration equals `typingMinMs`.
- if bot output resolves before `typingMinMs`, delay final render until min duration is reached.
- if bot output exceeds `typingMaxMs`, stop typing state and show fallback response.
- when typing is disabled, bot output renders immediately without interim loader.

## 8.6 Responsive behavior

Desktop:
- floating panel bottom-right (default).

Tablet/Mobile:
- compact launcher.
- panel width/height adapted to viewport.
- touch-friendly spacing and tap targets.

---

## 9. Search Strategy Plan

## 9.1 Search scope

Search against:
- question text
- answer text
- breadcrumb/path text

## 9.2 Search implementation approach

Phase 1:
- use `faq_chatbot_search_index` for read path.
- rebuild index on node create/update/delete and treeVersion change.
- fallback to indexed `faq_chatbot_nodes` query if index missing.
- build searchable tokens from both `questionText` and `answerText`.
- map answer-text hits to nearest parent question for result rendering.
- include related keyword matching via normalization + token expansion (stem/alias/synonym map).

Ranking heuristics:
- exact prefix match > substring match.
- question match > answer match.
- shallower depth boost.
- active nodes only.
- output list contains question nodes only.

## 9.3 Performance controls

- minimum query length: 2.
- pagination required for large result sets; UI must display all relevant question matches by loading all pages.
- frontend debounce: 250-350 ms.
- no full-tree traversal per keystroke in normal path.

## 9.4 Index health and rebuild flow

- run index integrity check after node mutation transaction commits.
- detect stale index using `treeVersion` and expected node coverage count.
- auto-trigger asynchronous full rebuild on mismatch.
- expose last rebuild status in admin settings page (time, duration, success/failure, rows indexed).

---

## 10. Validation, Transactions, Security, and Permissions

## 10.1 Validation

Server-side validation for:
- settings required fields.
- `noResultsFoundMessage` non-empty text with min 10 and max 300 characters.
- node payload shape.
- hierarchy rules (root question-only, answer terminal).
- text length and empty-trim checks.
- max nodes per request safety limit.

Client-side validation:
- immediate field feedback.
- block invalid save submission.

## 10.2 Transaction model

For operations that modify nodes:
- use Mongo transaction/session for config version bump + node writes + optional search-index writes.
- prevent partial updates and hierarchy corruption.
- include path/depth/root recalculation + sibling order normalization in the same transaction.

## 10.3 Permissions

Admin-only management:
- Menu visibility: admin only.
- Page access: admin only.
- Admin APIs: admin only.

## 10.4 Security

- Escape/sanitize all rendered text output.
- Validate IDs and payload structures.
- Keep same-origin and middleware protections for state-changing routes.

---

## 11. Implementation Phases (Execution Plan)

## Phase 1: Data and API Foundation

1. Add `FAQChatbotConfig` model.
2. Add `FAQChatbotNode` model with indexes.
3. Add `FAQChatbotSearchIndex` model (recommended path).
4. Add admin read/write APIs with version conflict checks.
5. Add public config/root/node/search APIs with limits.

Deliverable:
- stable module backend with proper DB collections.

## Phase 2: Admin Management UI

1. Add sidebar menu entry.
2. Create admin page with settings form.
3. Implement recursive tree editor using Ant Tree.
4. Implement create/edit/delete node actions.
5. Implement save/load + conflict handling flow.

Deliverable:
- admins can fully manage FAQ chatbot content/settings safely.

## Phase 3: Public Chat Widget

1. Build launcher and widget shell.
2. Implement header layout with expand/collapse and close icons.
3. Render welcome + Level 1 options.
4. Implement node navigation + back/restart.
5. Implement typed search + suggestion selection.
6. Implement timestamps for all message types.
7. Implement thinking/typing state before bot responses.

Deliverable:
- production-usable FAQ chatbot aligned with attached UI references.

## Phase 4: Hardening and Optimization

1. Improve ranking and indexing.
2. Validate large dataset performance.
3. Add optional drag-and-drop ordering.
4. Run cross-device UI validation against attached references.

Deliverable:
- robust behavior and reference-aligned UX at scale.

---

## 12. QA and Acceptance Checklist

## 12.1 Admin acceptance

- `FAQ Chatbot` menu is visible only to admin users.
- Admin can create unlimited nested question hierarchy.
- Admin can add answers at any question level.
- Admin can edit/delete nodes with correct hierarchy updates.
- Settings save/load works (title, avatar, welcome, no-results message, enable/disable, typing/timestamp settings).

## 12.2 Frontend acceptance

- Widget appears at bottom-right when enabled.
- Widget hidden when disabled.
- Initial open shows welcome and Level 1 questions.
- Header includes expand/collapse and close actions.
- Expand/collapse and close are positioned in header-right as per attached reference.
- Close, reopen, and expand/collapse behavior follows defined header state model.
- Every message shows timestamp (welcome, user, bot).
- Timestamp formatting follows configured format/locale/timezone strategy.
- Thinking/typing state appears before bot response when enabled.
- Thinking state follows min/max timing rules and fallback behavior.
- Clicking options navigates through tree correctly.
- Terminal answer nodes show answer text correctly.
- Search returns relevant suggestions from questions and answers.
- Selecting suggestion continues flow from selected node.
- If search has no matches, configured No Results Found Message is displayed.

## 12.3 UI reference acceptance

- Final UI is visually aligned with attached screenshot references in this thread.
- Header/action/icon placement matches attached references.
- Thinking/typing state animation behavior matches attached references.
- QA uses screenshot files from `docs/references/faq-chatbot/` as the baseline.

## 12.4 Non-functional acceptance

- No external AI/network dependency for response generation.
- Search remains responsive with large FAQ datasets.
- Mobile usability verified on small screens.
- No auth/security regression in admin routes.

---

## 13. Risks and Mitigations

1. Hierarchy complexity and editing errors.
- Mitigation: strict hierarchy rules + transactional writes + stable node IDs.

2. Search performance under large datasets.
- Mitigation: dedicated search index collection + bounded result set + debounce.

3. Concurrent admin updates.
- Mitigation: optimistic concurrency (`treeVersion`) + 409 conflict flow.

4. UI mismatch with design references.
- Mitigation: explicit screenshot-based acceptance checklist.

---

## 14. Future Enhancements (Post-v1, Optional)

1. Drag-and-drop reorder with persisted ordering snapshots.
2. Bulk import/export of FAQ nodes.
3. Revision history and rollback for node changes.
4. Analytics:
- top selected questions
- no-result search terms
- drop-off points
5. Multi-language FAQ trees (aligned with `docs/I18N.md` roadmap).

---

## 15. Deliverable Output

Planning document path:
- `docs/FAQ_CHATBOT_MODULE_PLAN.md`

Implementation is intentionally not started in this scope.
