# FAQ Chatbot UI Reference Assets

This folder is the source of truth for screenshot-based UI validation mentioned in:
- `docs/FAQ_CHATBOT_MODULE_PLAN.md`

Expected files:
- `ui-open-state.png`
- `ui-thinking-state-1.png`
- `ui-thinking-state-2.png`

Notes:
- Use the screenshots shared in the requirement thread dated `08-06-2026`.
- Compare current UI to these references using:
  - `npm run faq-chatbot-visual-qa`
- To refresh reference baselines from current UI captures:
  - `node scripts/faq-chatbot-visual-qa.js --update-reference`
- Visual QA outputs are stored under:
  - `artifacts/faq-chatbot-qa/`
- If filenames are changed, update both this file and `docs/FAQ_CHATBOT_MODULE_PLAN.md`.
