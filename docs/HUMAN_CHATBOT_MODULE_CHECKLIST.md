# Human Chatbot Module Checklist

Source plan: `docs/HUMAN_CHATBOT_MODULE_PLAN.md`

## 1. Foundation
- [x] Add `FaqNode` data model with tree fields, status, sorting, popularity, and slug uniqueness.
- [x] Add `ChatbotSettings` data model with full settings groups (general/appearance/features/search/welcome/contact actions).
- [x] Add seeded FAQ tree aligned to website content domains in plan.
- [x] Add automatic bootstrap to create default settings and seed FAQ tree when missing.

## 2. Admin APIs (`/api/admin/chatbot/*`)
- [x] `GET /faqs` with pagination, parent filtering, and includeInactive support.
- [x] `POST /faqs` create question node.
- [x] `PUT /faqs/:id` update question node.
- [x] `DELETE /faqs/:id` with `block|cascade|reparent` modes.
- [x] `POST /faqs/reorder` sibling reorder.
- [x] `POST /faqs/:id/duplicate` with optional child duplication.
- [x] `PATCH /faqs/:id/status` active/inactive toggle.
- [x] `GET /settings` load chatbot settings.
- [x] `PUT /settings` save chatbot settings (Admin-only).
- [x] Standard response shape implemented (`{ success, data }` / `{ success:false, error }`).
- [x] Error code mapping implemented for key validation/conflict/permission cases.

## 3. Public APIs (`/api/public/chatbot/*`)
- [x] `GET /settings` public-safe settings output.
- [x] `GET /faqs/root` active root questions.
- [x] `GET /faqs/:id` node + children + breadcrumb.
- [x] `GET /faqs/by-slug/:slug` node + children + breadcrumb.
- [x] `GET /search` ranked FAQ search with configured min chars/max results/enabled fields.
- [x] `GET /featured` featured questions.
- [x] `GET /popular` popular questions.

## 4. Admin UI (`/admin/chatbot`)
- [x] Add dedicated admin route `/admin/chatbot`.
- [x] Add `Chatbot` item in admin sidebar navigation.
- [x] Page-body FAQ management using Ant Design Tree.
- [x] CRUD operations: add root, add child, edit, delete, duplicate, enable/disable.
- [x] Drag-and-drop sibling reorder support.
- [x] Rich text answer editing.
- [x] Search metadata editing (keywords, tags, synonyms).
- [x] Settings Drawer for global chatbot configuration.
- [x] Contact action button management in settings drawer.
- [x] Featured/popular question assignment in settings drawer.

## 5. Public Widget
- [x] Chat launcher + chat window mounted in public shell.
- [x] Welcome message + quick options from root FAQs.
- [x] Question flow with predefined answers and follow-up child buttons.
- [x] Search UI using public search API.
- [x] Breadcrumb/home/back controls (configurable).
- [x] Contact block rendering for support actions.
- [x] Responsive behavior for desktop/mobile.
- [x] Theme-driven visual settings (colors, size, position, radius, typography).

## 6. Analytics
- [x] Event storage model for chatbot activity.
- [x] Public event ingestion endpoint (`POST /api/public/chatbot/events`).
- [x] Widget event tracking: open, close, question click, search submit/no-result, contact/donation clicks.
- [x] Admin analytics summary endpoint (`GET /api/admin/chatbot/analytics`) with daily/weekly/monthly window support.
- [x] CSV export support (`format=csv`) from analytics endpoint.

## 7. Manual Validation Checklist
- [ ] Verify website-domain wording accuracy against live pages (content governance step).
- [ ] Smoke test as Admin and Editor roles for expected permission behavior.
- [ ] Smoke test public chatbot on mobile and desktop.
- [ ] Run full pre-release checks (`npm run lint`, `npm run build`).
