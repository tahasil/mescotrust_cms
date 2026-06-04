# AI Chatbot Integration Plan (Codebase-Aligned, Gap-Fixed)

## Status
Planning only. No implementation included in this document.

## 1) Verified Codebase Baseline (Current Branch: `tahasil_mesco_stage`)
- Admin roles are handled with `isAdmin`, `isEditor`, `isAuthor` in `lib/permissions.js`.
- Middleware already protects `/admin/*` and `/api/admin/*`, and restricts Author access heavily.
- Sidebar menu is static in `components/admin/AdminLayoutClient.js` and role-filtered at runtime.
- Public shell mounts global overlays through `components/layout/PublicShell.js` (currently includes `RoutePopupHost`).
- Existing dynamic refresh pattern exists in popups:
- public endpoint returns `Cache-Control: no-store`
- frontend polls and listens to `storage` event (`popup_config_updated_at`)
- admin save writes localStorage timestamp to trigger frontend sync
- Contact escalation endpoint already exists: `POST /api/contact` with required fields `name`, `email`, `message`.
- Existing email flow in `lib/email.js` uses `EMAIL_TO || ADMIN_EMAIL` fallback and supports best-effort sending.
- Existing singleton settings pattern exists (`settingsKey: "default"`), e.g. media settings.

## 2) Gap Review (What Was Missing Before and How It Is Fixed in This Plan)
- Gap: plan previously mixed branch-specific RBAC assumptions.
- Fix: final RBAC is role-based only (`Admin + Editor allowed`, `Author denied`) for AI chatbot management.
- Gap: previous route-rule scope was over-extended (prefix/wildcard) versus current branch patterns.
- Fix: v1 visibility rules use normalized exact route matching first; prefix/wildcard moved to future enhancement.
- Gap: AI response source was not explicit enough.
- Fix: dedicated message pipeline is now defined (FAQ first, AI fallback, then escalation).
- Gap: immediate frontend reflection strategy needed codebase-compatible mechanism.
- Fix: use popup-proven model (`no-store` + localStorage event + re-fetch on route/focus/visibility).
- Gap: notification behavior needed alignment with existing contact/email flow.
- Fix: escalation uses existing `/api/contact` and existing email service path, with configurable recipient overrides in chatbot settings.

## 3) Final Architecture Decisions
- Widget type: floating chatbot launcher + chat panel.
- Default position: `bottom-right` (admin can switch to `bottom-left`).
- Chat behavior: hybrid (`FAQ/intent-first`, AI fallback second).
- If AI provider unavailable: FAQ + fallback + escalation only.
- Real-time definition (v1): request/response HTTP chat (no streaming/WebSocket in v1).
- No hardcoded chatbot content on frontend. All content comes from DB settings.

## 4) Data Model Plan
- New model: `models/AIChatbotSettings.js` (singleton document).
- Singleton key: `settingsKey: "default"` (same pattern as media settings).
- Proposed fields:
- `enabled`
- `name`
- `welcomeMessage`
- `avatarUrl`
- `position` (`bottom-right` | `bottom-left`)
- `appearance` (theme tokens like bubble/bg/text/button colors, border radius)
- `faqs[]`: `{ id, question, answer, enabled, order }`
- `quickActions[]`: `{ id, label, actionType, value, enabled, order }`
- `escalation`: `{ enabled, mode, ctaLabel, contactRoute }`
- `emailNotifications`: `{ enabled, recipients[], subjectPrefix }`
- `visibilityBehavior`: `{ enabledOnDesktop, enabledOnMobile, includeRoutes[] }`
- `ai`: `{ enabled, provider, model, temperature, maxTokens, timeoutMs }`
- audit: `updatedBy`, `updatedAt` (timestamps)

## 5) Validation and Normalization Plan
- New utility: `lib/aiChatbotValidation.js`.
- Server-side enforcement for all fields, including nested arrays.
- Validation baseline:
- `name`: 2-60 chars
- `welcomeMessage`: 10-500 chars
- `faqs`: max 50, unique normalized question text
- `quickActions`: max 20, valid `actionType` and value format
- `emailNotifications.recipients`: max 20 valid emails
- `position`: enum `bottom-right | bottom-left`
- `escalation.mode`: enum `redirect_contact | inline_capture | both`
- `includeRoutes`: normalized route format (exact paths, deduplicated)
- Sanitize all free text before save/response.

## 6) Admin API Plan
- `GET /api/admin/ai-chatbot`
- `PUT /api/admin/ai-chatbot`
- Handler contract:
- call `requireAuth(req)` first
- enforce `isAdmin(session) || isEditor(session)`
- reject Author/other roles with `403`
- use upsert singleton by `settingsKey: "default"`
- return normalized payload
- set dynamic/no-cache headers
- call `revalidatePath("/", "layout")` on successful write

## 7) Public API Plan
- `GET /api/public/ai-chatbot/config`
- returns frontend-safe config only
- `Cache-Control: no-store, no-cache, must-revalidate`
- `POST /api/public/chatbot/message`
- input: `{ message, sessionId?, page?, locale? }`
- output: `{ reply, source, quickActions?, escalation? }`
- apply rate limit via existing `createRateLimiter` pattern
- apply safe fallback response on errors/timeouts

## 8) AI Response Source (Direct Answer to “Responsive kaha se de raha hai?”)
- Chat response generation pipeline:
- Step 1: normalize user message.
- Step 2: match against enabled FAQ/intent phrases in DB.
- Step 3: if FAQ match found, return configured FAQ answer (`source: "faq"`).
- Step 4: if no FAQ match and AI is enabled/configured, call provider adapter (`source: "ai"`).
- Step 5: if AI call fails/unavailable, return fallback + escalation prompt (`source: "fallback"`).
- Step 6: if escalation triggers are met, show contact CTA or inline contact capture.

## 9) Frontend Widget Plan
- New component: `components/layout/AIChatbotWidget.js`.
- Mount in `components/layout/PublicShell.js` alongside existing `RoutePopupHost`.
- Widget behavior:
- floating launcher icon
- expandable chat panel
- welcome message and quick actions
- FAQ suggestions
- typed input + send state
- escalation UI (`redirect`, `inline`, or both)
- Mobile-first behavior:
- full-width panel on small screens
- touch-friendly controls
- safe bottom spacing to avoid overlap with cookie banner
- Visibility behavior:
- show/hide by `enabled`, device toggles, and `includeRoutes`
- default hidden if disabled
- Immediate reflection behavior:
- fetch config with `no-store`
- re-fetch on route change, focus, visibility change
- listen to `storage` key `chatbot_config_updated_at` for cross-tab sync

## 10) Admin UI Plan (`/admin/ai-chatbot`)
- Add sidebar item in `components/admin/AdminLayoutClient.js`: `AI Chatbot`.
- Create route: `app/admin/(authenticated)/ai-chatbot/page.js`.
- Build settings module using existing CMS style (`ThemeAdminCard`, Ant Design forms, sectioned layout).
- Recommended component path: `components/admin/AIChatbot/AIChatbotSettingsPage.js`.
- Config sections:
- General: enable, name, welcome message, avatar, position
- Appearance: theme colors and style tokens
- FAQs: add/edit/delete/reorder/enable
- Quick Actions: add/edit/delete/reorder/enable
- Escalation: mode + contact behavior + CTA labels
- Email Notifications: toggle + recipient list + subject prefix
- Visibility & Behavior: device toggles + route include list + open/minimized behavior
- UX behavior:
- load current settings on page open
- validate before save
- show field-level errors
- after successful save, write localStorage key `chatbot_config_updated_at`

## 11) Escalation and Email Plan
- Escalation submit path (v1): reuse existing `POST /api/contact`.
- Inline escalation payload:
- `name`, `email`, `message` required
- include `page` and `source: "chatbot-widget"` for tracing
- Email notification behavior:
- if chatbot-specific recipients configured and enabled, use them
- fallback to existing `EMAIL_TO || ADMIN_EMAIL`
- preserve existing best-effort email behavior (no hard failure to user flow)

## 12) RBAC and Security Plan
- Menu visibility: show AI Chatbot item only to Admin/Editor.
- Page access: Author redirected/blocked by existing middleware + route-level guard.
- API access: enforce role checks in handlers for all chatbot admin endpoints.
- Public message API hardening:
- rate limiting
- input length limits
- safe output fallback on provider failure
- Same-origin protections already enforced globally for state-changing API methods.

## 13) Requirement Coverage Checklist
- Chatbot pop-up icon bottom-right: covered (default + admin override).
- Predefined FAQ responses and guided prompts: covered.
- Interactive and mobile-friendly chatbot: covered.
- Escalation to contact forms: covered.
- Sidebar includes `AI Chatbot`: covered.
- Dedicated admin management page: covered.
- Enable/Disable: covered.
- Name/welcome/icon/position/appearance management: covered.
- FAQ CRUD: covered.
- Quick actions/buttons management: covered.
- Contact escalation settings: covered.
- Email notification settings: covered.
- Visibility/behavior controls: covered.
- DB persistence for all settings: covered.
- Dynamic frontend reflection after save: covered.
- Form validation: covered (client + server).
- Role-based permission enforcement: covered.
- CMS-consistent UI: covered.
- No hardcoded chatbot content/config: covered.

## 14) Non-Implementation Deliverable Output
- Planning document path: `docs/AI_CHATBOT_INTEGRATION_PLAN.md`
- This file is the updated, branch-aligned, gap-fixed execution plan.
