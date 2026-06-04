# AI Chatbot Implementation Checklist

Source plan: `docs/AI_CHATBOT_INTEGRATION_PLAN.md`

## Phase 0 - Plan Breakdown & Tracking
- [x] Review full AI chatbot integration plan
- [x] Map plan into implementation phases and concrete file/task list
- [x] Create checklist to track progress in-repo

## Phase 1 - Data Model, Defaults, Validation
- [x] Create `models/AIChatbotSettings.js` singleton schema (`settingsKey: "default"`)
- [x] Add full defaults including required seed welcome message, FAQs, quick actions
- [x] Add server-side normalization and validation utility (`lib/aiChatbotValidation.js`)
- [x] Add text sanitization and bounded-length enforcement for user-managed fields
- [x] Add FAQ normalization (dedupe, max limits, ordering)
- [x] Add quick-action normalization (dedupe, max limits, ordering)
- [x] Add visibility route normalization (`includeRoutes` exact paths)
- [x] Add AI config normalization and safe timeout/token clamps
- [x] Add secure handling for provider API key in settings

## Phase 2 - Chat Runtime & APIs
- [x] Add chatbot settings helper/runtime (`lib/aiChatbotService.js` or equivalent)
- [x] Implement FAQ-first matching pipeline
- [x] Implement AI fallback provider adapter (v1 HTTP request/response)
- [x] Implement unsafe/prompt-injection denylist fallback path
- [x] Implement escalation decision payload generation
- [x] Implement admin API: `GET /api/admin/ai-chatbot`
- [x] Implement admin API: `PUT /api/admin/ai-chatbot` (admin-only, singleton upsert)
- [x] Add no-store headers for admin chatbot endpoints
- [x] Trigger `revalidatePath("/", "layout")` after successful admin save
- [x] Implement public config API: `GET /api/public/ai-chatbot/config`
- [x] Implement public message API: `POST /api/public/chatbot/message`
- [x] Add rate limiting for public message API
- [x] Add request validation for public message payload (`message`, length, context)
- [x] Add fallback handling for provider timeout/unavailable/error
- [x] Add basic PII-redacted logging for public message requests

## Phase 3 - Escalation & Email Integration
- [x] Reuse existing `POST /api/contact` path for escalation submissions
- [x] Add chatbot source/page tracing on escalation submissions
- [x] Add chatbot-specific recipient override support (when enabled in settings)
- [x] Preserve existing `EMAIL_TO || ADMIN_EMAIL` fallback behavior
- [x] Preserve best-effort email behavior (no user-flow hard failures)

## Phase 4 - Admin Module UI
- [x] Add CMS sidebar item: `AI Chatbot`
- [x] Restrict sidebar item visibility to Admin only
- [x] Add admin route: `app/admin/(authenticated)/ai-chatbot/page.js`
- [x] Add main settings component: `components/admin/AIChatbot/AIChatbotSettingsPage.js`
- [x] Build General settings section
- [x] Build Appearance settings section
- [x] Build FAQ CRUD section (add/edit/delete/reorder/enable)
- [x] Build Quick Actions CRUD section (add/edit/delete/reorder/enable)
- [x] Build Prompts/settings section (system prompt and related config)
- [x] Build Escalation section (mode/CTA/contact behavior)
- [x] Build Email Notifications section (toggle/recipients/subject prefix)
- [x] Build Visibility & Behavior section (desktop/mobile/routes/defaultState/auto-open)
- [x] Build AI Provider section (enabled/provider/model/temperature/tokens/timeout/key)
- [x] Use existing media picker contract for avatar selection and validation
- [x] Add client-side validation + field-level errors
- [x] On save success, write `localStorage.chatbot_config_updated_at`

## Phase 5 - Public Widget Integration
- [x] Add `components/layout/AIChatbotWidget.js`
- [x] Mount widget in `components/layout/PublicShell.js`
- [x] Implement floating launcher (default bottom-right, configurable left)
- [x] Implement mobile-friendly panel behavior
- [x] Implement welcome + quick actions + FAQ suggestions UI
- [x] Implement typed message input + send/disabled/loading states
- [x] Implement escalation UI (`redirect_contact`, `inline_capture`, `both`)
- [x] Implement widget visibility controls (`enabled`, device toggles, route include list)
- [x] Implement dynamic refresh (`no-store` fetch + route/focus/visibility/storage triggers)
- [x] Implement same-tab immediate refresh after save (custom event)
- [x] Implement safety polling fallback

## Phase 6 - Permissions, Security, Audit
- [x] Update middleware admin-only protection for `/admin/ai-chatbot`
- [x] Update middleware admin-only protection for `/api/admin/ai-chatbot`
- [x] Verify admin APIs enforce `requireAuth` and `isAdmin`
- [x] Verify no hardcoded chatbot content/config is rendered on frontend
- [x] Verify all chatbot settings are DB-backed and editable from CMS
- [x] Run lint/build checks for touched module scope
- [x] Perform full requirement-by-requirement audit against plan doc
- [x] Mark checklist final status and summarize remaining gaps (if any)

## Final Audit Result
- Status: Completed for v1 scope defined in `docs/AI_CHATBOT_INTEGRATION_PLAN.md`.
- Remaining implementation gaps identified: None for planned v1 checklist scope.
- Notes: `npm run lint` prompts for initial ESLint setup in this repository; `npm run build` completed successfully and includes Next.js lint/type checks during build.
