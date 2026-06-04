import crypto from "crypto";
import { decryptSecretValue, encryptSecretValue } from "@/lib/secureConfigCrypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_SAFE_RE = /^(\/|#|https?:\/\/|mailto:|tel:)/i;
const MAX_FAQS = 50;
const MAX_QUICK_ACTIONS = 20;
const MAX_RECIPIENTS = 20;
const MAX_INCLUDE_ROUTES = 100;

export const AI_CHATBOT_SETTINGS_KEY = "default";

export const DEFAULT_AI_CHATBOT_SETTINGS = Object.freeze({
  settingsKey: AI_CHATBOT_SETTINGS_KEY,
  enabled: true,
  name: "Mesco Assistant",
  welcomeMessage:
    "Hi, how can I help you today? Are you looking to donate, volunteer, or learn about our scholarships?",
  avatarUrl: "",
  position: "bottom-right",
  appearance: {
    launcherBgColor: "#1677ff",
    launcherIconColor: "#ffffff",
    panelBgColor: "#ffffff",
    panelTextColor: "#111827",
    userBubbleBgColor: "#1677ff",
    userBubbleTextColor: "#ffffff",
    botBubbleBgColor: "#f3f4f6",
    botBubbleTextColor: "#111827",
    buttonBgColor: "#1677ff",
    buttonTextColor: "#ffffff",
    borderRadius: 14,
  },
  messages: {
    fallbackMessage:
      "I could not find a precise answer right now. You can ask me about donations, volunteering, scholarships, or contact support.",
    timeoutMessage:
      "I am taking longer than expected. Please try again or contact support for immediate help.",
    errorMessage:
      "Something went wrong while processing your request. Please try again or contact support.",
    escalationPromptMessage:
      "Would you like me to connect you with our support team through the contact form?",
    escalationSuccessMessage:
      "Thanks. Your support request has been submitted successfully.",
    escalationErrorMessage:
      "I could not submit your support request right now. Please try again shortly.",
    launcherLabel: "Chat",
    shareDetailsLabel: "Share details",
    escalationInlineNamePlaceholder: "Name",
    escalationInlineEmailPlaceholder: "Email",
    escalationInlineMessagePlaceholder: "How can we help?",
    inputPlaceholder: "Type your question...",
    sendButtonLabel: "Send",
    typingLabel: "Assistant is typing...",
    openButtonAriaLabel: "Open chatbot",
    closeButtonAriaLabel: "Close chatbot",
  },
  prompts: {
    systemPrompt:
      "You are a concise support assistant for Mesco Trust CMS website visitors. Answer only from available website context and chatbot FAQ intent. If unsure, suggest contacting support.",
    assistantStylePrompt:
      "Keep responses short, polite, and practical. Avoid making up facts.",
  },
  faqs: [
    {
      id: "faq_donation_help",
      question: "How can I donate to Mesco Trust?",
      answer:
        "You can donate from the Donate page. Choose an amount, submit your details, and complete payment through the available options.",
      intents: ["donate", "donation", "support financially", "payment"],
      enabled: true,
      order: 1,
    },
    {
      id: "faq_volunteer_help",
      question: "How do I volunteer with Mesco Trust?",
      answer:
        "You can fill the volunteer form from the website. Our team reviews submissions and reaches out to eligible applicants.",
      intents: ["volunteer", "join", "help", "contribute time"],
      enabled: true,
      order: 2,
    },
    {
      id: "faq_scholarship_info",
      question: "Where can I find scholarship information?",
      answer:
        "You can explore scholarship and educational support details from the relevant website sections and announcement pages.",
      intents: ["scholarship", "education aid", "student support"],
      enabled: true,
      order: 3,
    },
    {
      id: "faq_contact_support",
      question: "How can I contact support?",
      answer:
        "You can use the contact form and our team will respond. I can also guide you to the contact page now.",
      intents: ["contact", "support", "help desk", "reach out"],
      enabled: true,
      order: 4,
    },
  ],
  quickActions: [
    {
      id: "qa_donate",
      label: "Donate",
      actionType: "route",
      value: "/donation",
      enabled: true,
      order: 1,
    },
    {
      id: "qa_volunteer",
      label: "Volunteer",
      actionType: "route",
      value: "/contact",
      enabled: true,
      order: 2,
    },
    {
      id: "qa_scholarships",
      label: "Scholarships",
      actionType: "message",
      value: "Tell me about scholarships",
      enabled: true,
      order: 3,
    },
    {
      id: "qa_contact",
      label: "Contact Support",
      actionType: "contact",
      value: "/contact",
      enabled: true,
      order: 4,
    },
  ],
  escalation: {
    enabled: true,
    mode: "both",
    ctaLabel: "Contact support",
    contactRoute: "/contact",
  },
  emailNotifications: {
    enabled: false,
    recipients: [],
    subjectPrefix: "[Chatbot]",
  },
  visibilityBehavior: {
    enabledOnDesktop: true,
    enabledOnMobile: true,
    includeRoutes: [],
    defaultState: "minimized",
    autoOpenEnabled: false,
    autoOpenDelayMs: 1200,
    autoOpenOncePerSession: true,
  },
  ai: {
    enabled: false,
    provider: "disabled",
    model: "gpt-4o-mini",
    temperature: 0.3,
    maxTokens: 350,
    timeoutMs: 9000,
    baseUrl: "https://api.openai.com/v1",
    apiKeyEnc: "",
  },
  updatedBy: "",
});

function toSafeString(value) {
  return value == null ? "" : String(value).trim();
}

function stripHtml(value) {
  const text = toSafeString(value);
  if (!text) return "";
  return text
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeText(value, { min = 0, max = 500, field = "Field" } = {}) {
  const text = stripHtml(value);
  if (text.length < min) {
    throw new Error(`${field} must be at least ${min} characters`);
  }
  if (text.length > max) {
    throw new Error(`${field} must be at most ${max} characters`);
  }
  return text;
}

function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value == null) return fallback;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const x = value.trim().toLowerCase();
    if (x === "true" || x === "1" || x === "yes" || x === "on") return true;
    if (x === "false" || x === "0" || x === "no" || x === "off") return false;
  }
  return fallback;
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizePosition(value, fallback = "bottom-right") {
  const v = toSafeString(value).toLowerCase();
  return v === "bottom-left" || v === "bottom-right" ? v : fallback;
}

function normalizeDefaultState(value, fallback = "minimized") {
  const v = toSafeString(value).toLowerCase();
  return v === "open" || v === "minimized" ? v : fallback;
}

function normalizeEscalationMode(value, fallback = "both") {
  const v = toSafeString(value).toLowerCase();
  return v === "redirect_contact" || v === "inline_capture" || v === "both"
    ? v
    : fallback;
}

function normalizeProvider(value, fallback = "disabled") {
  const v = toSafeString(value).toLowerCase();
  return v === "openai" || v === "openai_compatible" || v === "disabled"
    ? v
    : fallback;
}

function normalizeColorValue(value, fallback) {
  const text = toSafeString(value);
  if (!text) return fallback;
  if (text.length > 64) return fallback;
  return text;
}

function normalizeRoutePath(value) {
  let route = toSafeString(value);
  if (!route) return "";
  if (!route.startsWith("/")) route = `/${route}`;
  const qIdx = route.indexOf("?");
  if (qIdx >= 0) route = route.slice(0, qIdx);
  const hIdx = route.indexOf("#");
  if (hIdx >= 0) route = route.slice(0, hIdx);
  route = route.replace(/\/{2,}/g, "/");
  if (route.length > 1 && route.endsWith("/")) route = route.slice(0, -1);
  if (!route.startsWith("/")) return "";
  return route;
}

function createId(prefix) {
  if (typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeFaqs(rawFaqs = [], fallbackFaqs = []) {
  const input = Array.isArray(rawFaqs) ? rawFaqs : [];
  const fallback = Array.isArray(fallbackFaqs) ? fallbackFaqs : [];
  const fallbackById = new Map(
    fallback
      .filter((item) => item?.id)
      .map((item) => [String(item.id), item]),
  );

  const dedupe = new Set();
  const rows = [];
  for (let i = 0; i < input.length && rows.length < MAX_FAQS; i += 1) {
    const item = input[i] || {};
    const question = sanitizeText(item.question, {
      min: 2,
      max: 240,
      field: "FAQ question",
    });
    const answer = sanitizeText(item.answer, {
      min: 2,
      max: 1000,
      field: "FAQ answer",
    });
    const normalizedQuestion = question.toLowerCase().replace(/\s+/g, " ").trim();
    if (dedupe.has(normalizedQuestion)) continue;
    dedupe.add(normalizedQuestion);

    const intentsInput = Array.isArray(item.intents) ? item.intents : [];
    const intents = intentsInput
      .map((x) => stripHtml(x))
      .filter(Boolean)
      .slice(0, 12)
      .map((x) => (x.length > 100 ? x.slice(0, 100).trim() : x));

    const idCandidate = toSafeString(item.id);
    const existing = idCandidate ? fallbackById.get(idCandidate) : null;
    const id =
      idCandidate && /^[a-zA-Z0-9_-]{3,80}$/.test(idCandidate)
        ? idCandidate
        : existing?.id || createId("faq");

    rows.push({
      id,
      question,
      answer,
      intents,
      enabled: toBool(item.enabled, true),
      order: clampNumber(item.order, 1, 9999, rows.length + 1),
    });
  }
  return rows.sort((a, b) => a.order - b.order);
}

function normalizeQuickActions(rawQuickActions = [], fallbackQuickActions = []) {
  const input = Array.isArray(rawQuickActions) ? rawQuickActions : [];
  const fallback = Array.isArray(fallbackQuickActions) ? fallbackQuickActions : [];
  const fallbackById = new Map(
    fallback
      .filter((item) => item?.id)
      .map((item) => [String(item.id), item]),
  );
  const rows = [];
  for (let i = 0; i < input.length && rows.length < MAX_QUICK_ACTIONS; i += 1) {
    const item = input[i] || {};
    const label = sanitizeText(item.label, {
      min: 1,
      max: 40,
      field: "Quick action label",
    });
    const actionType = ["message", "route", "url", "contact"].includes(
      toSafeString(item.actionType).toLowerCase(),
    )
      ? toSafeString(item.actionType).toLowerCase()
      : "message";

    const value = sanitizeText(item.value, {
      min: actionType === "contact" ? 0 : 1,
      max: 300,
      field: "Quick action value",
    });

    if (actionType === "route" && value && !normalizeRoutePath(value)) {
      throw new Error("Quick action route must be a valid route path");
    }
    if (actionType === "url" && value && !URL_SAFE_RE.test(value)) {
      throw new Error("Quick action URL must start with /, #, http(s), mailto, or tel");
    }

    const idCandidate = toSafeString(item.id);
    const existing = idCandidate ? fallbackById.get(idCandidate) : null;
    const id =
      idCandidate && /^[a-zA-Z0-9_-]{3,80}$/.test(idCandidate)
        ? idCandidate
        : existing?.id || createId("quick");

    rows.push({
      id,
      label,
      actionType,
      value,
      enabled: toBool(item.enabled, true),
      order: clampNumber(item.order, 1, 9999, rows.length + 1),
    });
  }
  return rows.sort((a, b) => a.order - b.order);
}

function normalizeRecipients(raw) {
  const arr = Array.isArray(raw)
    ? raw
    : toSafeString(raw)
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
  const seen = new Set();
  const rows = [];
  for (let i = 0; i < arr.length && rows.length < MAX_RECIPIENTS; i += 1) {
    const email = toSafeString(arr[i]).toLowerCase();
    if (!email || seen.has(email)) continue;
    if (!EMAIL_RE.test(email)) throw new Error(`Invalid email recipient: ${arr[i]}`);
    seen.add(email);
    rows.push(email);
  }
  return rows;
}

function normalizeIncludeRoutes(rawRoutes = []) {
  const input = Array.isArray(rawRoutes) ? rawRoutes : [];
  const dedupe = new Set();
  const rows = [];
  for (let i = 0; i < input.length && rows.length < MAX_INCLUDE_ROUTES; i += 1) {
    const normalized = normalizeRoutePath(input[i]);
    if (!normalized || dedupe.has(normalized)) continue;
    dedupe.add(normalized);
    rows.push(normalized);
  }
  return rows;
}

function normalizeMessages(input = {}, fallback = DEFAULT_AI_CHATBOT_SETTINGS.messages) {
  return {
    fallbackMessage: sanitizeText(input.fallbackMessage ?? fallback.fallbackMessage, {
      min: 5,
      max: 500,
      field: "Fallback message",
    }),
    timeoutMessage: sanitizeText(input.timeoutMessage ?? fallback.timeoutMessage, {
      min: 5,
      max: 500,
      field: "Timeout message",
    }),
    errorMessage: sanitizeText(input.errorMessage ?? fallback.errorMessage, {
      min: 5,
      max: 500,
      field: "Error message",
    }),
    escalationPromptMessage: sanitizeText(
      input.escalationPromptMessage ?? fallback.escalationPromptMessage,
      { min: 5, max: 500, field: "Escalation prompt message" },
    ),
    escalationSuccessMessage: sanitizeText(
      input.escalationSuccessMessage ?? fallback.escalationSuccessMessage,
      { min: 5, max: 500, field: "Escalation success message" },
    ),
    escalationErrorMessage: sanitizeText(
      input.escalationErrorMessage ?? fallback.escalationErrorMessage,
      { min: 5, max: 500, field: "Escalation error message" },
    ),
    launcherLabel: sanitizeText(input.launcherLabel ?? fallback.launcherLabel, {
      min: 1,
      max: 30,
      field: "Launcher label",
    }),
    shareDetailsLabel: sanitizeText(
      input.shareDetailsLabel ?? fallback.shareDetailsLabel,
      {
        min: 2,
        max: 40,
        field: "Share details label",
      },
    ),
    escalationInlineNamePlaceholder: sanitizeText(
      input.escalationInlineNamePlaceholder ??
        fallback.escalationInlineNamePlaceholder,
      {
        min: 2,
        max: 80,
        field: "Escalation name placeholder",
      },
    ),
    escalationInlineEmailPlaceholder: sanitizeText(
      input.escalationInlineEmailPlaceholder ??
        fallback.escalationInlineEmailPlaceholder,
      {
        min: 2,
        max: 80,
        field: "Escalation email placeholder",
      },
    ),
    escalationInlineMessagePlaceholder: sanitizeText(
      input.escalationInlineMessagePlaceholder ??
        fallback.escalationInlineMessagePlaceholder,
      {
        min: 2,
        max: 160,
        field: "Escalation message placeholder",
      },
    ),
    inputPlaceholder: sanitizeText(input.inputPlaceholder ?? fallback.inputPlaceholder, {
      min: 2,
      max: 80,
      field: "Input placeholder",
    }),
    sendButtonLabel: sanitizeText(input.sendButtonLabel ?? fallback.sendButtonLabel, {
      min: 2,
      max: 30,
      field: "Send button label",
    }),
    typingLabel: sanitizeText(input.typingLabel ?? fallback.typingLabel, {
      min: 2,
      max: 80,
      field: "Typing label",
    }),
    openButtonAriaLabel: sanitizeText(
      input.openButtonAriaLabel ?? fallback.openButtonAriaLabel,
      {
        min: 2,
        max: 80,
        field: "Open button ARIA label",
      },
    ),
    closeButtonAriaLabel: sanitizeText(
      input.closeButtonAriaLabel ?? fallback.closeButtonAriaLabel,
      {
        min: 2,
        max: 80,
        field: "Close button ARIA label",
      },
    ),
  };
}

function normalizePrompts(input = {}, fallback = DEFAULT_AI_CHATBOT_SETTINGS.prompts) {
  return {
    systemPrompt: sanitizeText(input.systemPrompt ?? fallback.systemPrompt, {
      min: 10,
      max: 2000,
      field: "System prompt",
    }),
    assistantStylePrompt: sanitizeText(
      input.assistantStylePrompt ?? fallback.assistantStylePrompt,
      {
        min: 5,
        max: 1200,
        field: "Assistant style prompt",
      },
    ),
  };
}

function normalizeAiConfig(input = {}, fallback = DEFAULT_AI_CHATBOT_SETTINGS.ai) {
  const provider = normalizeProvider(input.provider, fallback.provider);
  const merged = {
    ...fallback,
    ...input,
    provider,
  };
  const baseUrlRaw = toSafeString(merged.baseUrl || fallback.baseUrl);
  let baseUrl = fallback.baseUrl;
  if (provider === "openai_compatible" || provider === "openai") {
    try {
      const parsed = new URL(baseUrlRaw);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        baseUrl = parsed.origin + parsed.pathname.replace(/\/+$/, "");
      }
    } catch {
      baseUrl = fallback.baseUrl;
    }
  }

  return {
    enabled: toBool(merged.enabled, false),
    provider,
    model: sanitizeText(merged.model ?? fallback.model, {
      min: 2,
      max: 80,
      field: "AI model",
    }),
    temperature: clampNumber(merged.temperature, 0, 2, fallback.temperature),
    maxTokens: Math.round(clampNumber(merged.maxTokens, 64, 2048, fallback.maxTokens)),
    timeoutMs: Math.round(clampNumber(merged.timeoutMs, 1000, 20000, fallback.timeoutMs)),
    baseUrl,
    apiKeyEnc: toSafeString(merged.apiKeyEnc || fallback.apiKeyEnc),
  };
}

export function normalizeAiChatbotSettingsInput(input = {}, previous = {}) {
  const base = {
    ...DEFAULT_AI_CHATBOT_SETTINGS,
    ...(previous && typeof previous === "object" ? previous : {}),
    ...(input && typeof input === "object" ? input : {}),
  };

  const previousAi = previous?.ai && typeof previous.ai === "object" ? previous.ai : {};
  const inputAi = input?.ai && typeof input.ai === "object" ? input.ai : {};
  const currentApiKey = decryptSecretValue(previousAi.apiKeyEnc);
  const providedApiKey = toSafeString(inputAi.apiKey);
  const aiApiKeyEnc =
    inputAi.apiKey !== undefined
      ? encryptSecretValue(providedApiKey)
      : toSafeString(previousAi.apiKeyEnc || base.ai?.apiKeyEnc || "");

  const appearance = {
    launcherBgColor: normalizeColorValue(
      base.appearance?.launcherBgColor,
      DEFAULT_AI_CHATBOT_SETTINGS.appearance.launcherBgColor,
    ),
    launcherIconColor: normalizeColorValue(
      base.appearance?.launcherIconColor,
      DEFAULT_AI_CHATBOT_SETTINGS.appearance.launcherIconColor,
    ),
    panelBgColor: normalizeColorValue(
      base.appearance?.panelBgColor,
      DEFAULT_AI_CHATBOT_SETTINGS.appearance.panelBgColor,
    ),
    panelTextColor: normalizeColorValue(
      base.appearance?.panelTextColor,
      DEFAULT_AI_CHATBOT_SETTINGS.appearance.panelTextColor,
    ),
    userBubbleBgColor: normalizeColorValue(
      base.appearance?.userBubbleBgColor,
      DEFAULT_AI_CHATBOT_SETTINGS.appearance.userBubbleBgColor,
    ),
    userBubbleTextColor: normalizeColorValue(
      base.appearance?.userBubbleTextColor,
      DEFAULT_AI_CHATBOT_SETTINGS.appearance.userBubbleTextColor,
    ),
    botBubbleBgColor: normalizeColorValue(
      base.appearance?.botBubbleBgColor,
      DEFAULT_AI_CHATBOT_SETTINGS.appearance.botBubbleBgColor,
    ),
    botBubbleTextColor: normalizeColorValue(
      base.appearance?.botBubbleTextColor,
      DEFAULT_AI_CHATBOT_SETTINGS.appearance.botBubbleTextColor,
    ),
    buttonBgColor: normalizeColorValue(
      base.appearance?.buttonBgColor,
      DEFAULT_AI_CHATBOT_SETTINGS.appearance.buttonBgColor,
    ),
    buttonTextColor: normalizeColorValue(
      base.appearance?.buttonTextColor,
      DEFAULT_AI_CHATBOT_SETTINGS.appearance.buttonTextColor,
    ),
    borderRadius: Math.round(
      clampNumber(
        base.appearance?.borderRadius,
        0,
        32,
        DEFAULT_AI_CHATBOT_SETTINGS.appearance.borderRadius,
      ),
    ),
  };

  const normalized = {
    settingsKey: AI_CHATBOT_SETTINGS_KEY,
    enabled: toBool(base.enabled, DEFAULT_AI_CHATBOT_SETTINGS.enabled),
    name: sanitizeText(base.name, { min: 2, max: 60, field: "Chatbot name" }),
    welcomeMessage: sanitizeText(base.welcomeMessage, {
      min: 10,
      max: 500,
      field: "Welcome message",
    }),
    avatarUrl: toSafeString(base.avatarUrl).slice(0, 1000),
    position: normalizePosition(base.position, DEFAULT_AI_CHATBOT_SETTINGS.position),
    appearance,
    messages: normalizeMessages(base.messages, DEFAULT_AI_CHATBOT_SETTINGS.messages),
    prompts: normalizePrompts(base.prompts, DEFAULT_AI_CHATBOT_SETTINGS.prompts),
    faqs: normalizeFaqs(base.faqs, previous?.faqs),
    quickActions: normalizeQuickActions(base.quickActions, previous?.quickActions),
    escalation: {
      enabled: toBool(base.escalation?.enabled, DEFAULT_AI_CHATBOT_SETTINGS.escalation.enabled),
      mode: normalizeEscalationMode(
        base.escalation?.mode,
        DEFAULT_AI_CHATBOT_SETTINGS.escalation.mode,
      ),
      ctaLabel: sanitizeText(base.escalation?.ctaLabel, {
        min: 2,
        max: 80,
        field: "Escalation CTA label",
      }),
      contactRoute: normalizeRoutePath(base.escalation?.contactRoute || "/contact") || "/contact",
    },
    emailNotifications: {
      enabled: toBool(
        base.emailNotifications?.enabled,
        DEFAULT_AI_CHATBOT_SETTINGS.emailNotifications.enabled,
      ),
      recipients: normalizeRecipients(base.emailNotifications?.recipients),
      subjectPrefix: sanitizeText(
        base.emailNotifications?.subjectPrefix ??
          DEFAULT_AI_CHATBOT_SETTINGS.emailNotifications.subjectPrefix,
        {
          min: 1,
          max: 80,
          field: "Email subject prefix",
        },
      ),
    },
    visibilityBehavior: {
      enabledOnDesktop: toBool(
        base.visibilityBehavior?.enabledOnDesktop,
        DEFAULT_AI_CHATBOT_SETTINGS.visibilityBehavior.enabledOnDesktop,
      ),
      enabledOnMobile: toBool(
        base.visibilityBehavior?.enabledOnMobile,
        DEFAULT_AI_CHATBOT_SETTINGS.visibilityBehavior.enabledOnMobile,
      ),
      includeRoutes: normalizeIncludeRoutes(base.visibilityBehavior?.includeRoutes),
      defaultState: normalizeDefaultState(
        base.visibilityBehavior?.defaultState,
        DEFAULT_AI_CHATBOT_SETTINGS.visibilityBehavior.defaultState,
      ),
      autoOpenEnabled: toBool(
        base.visibilityBehavior?.autoOpenEnabled,
        DEFAULT_AI_CHATBOT_SETTINGS.visibilityBehavior.autoOpenEnabled,
      ),
      autoOpenDelayMs: Math.round(
        clampNumber(
          base.visibilityBehavior?.autoOpenDelayMs,
          0,
          15000,
          DEFAULT_AI_CHATBOT_SETTINGS.visibilityBehavior.autoOpenDelayMs,
        ),
      ),
      autoOpenOncePerSession: toBool(
        base.visibilityBehavior?.autoOpenOncePerSession,
        DEFAULT_AI_CHATBOT_SETTINGS.visibilityBehavior.autoOpenOncePerSession,
      ),
    },
    ai: {
      ...normalizeAiConfig(
        { ...base.ai, apiKeyEnc: aiApiKeyEnc },
        { ...DEFAULT_AI_CHATBOT_SETTINGS.ai, ...previous?.ai },
      ),
      apiKeyEnc: aiApiKeyEnc || encryptSecretValue(currentApiKey),
    },
    updatedBy: toSafeString(base.updatedBy).slice(0, 160),
  };

  if (
    normalized.emailNotifications.enabled &&
    normalized.emailNotifications.recipients.length === 0
  ) {
    throw new Error("At least one email recipient is required when notifications are enabled");
  }

  return normalized;
}

function maskSecret(value) {
  const raw = toSafeString(value);
  if (!raw) return "";
  return `${"*".repeat(8)}${raw.slice(-4)}`;
}

export function toAdminChatbotPayload(settings = {}) {
  const normalized = normalizeAiChatbotSettingsInput(settings, settings);
  const aiKey = decryptSecretValue(normalized.ai?.apiKeyEnc);
  return {
    ...normalized,
    ai: {
      ...normalized.ai,
      apiKey: "",
      hasApiKey: Boolean(aiKey),
      apiKeyMasked: maskSecret(aiKey),
    },
  };
}

export function toPublicChatbotConfig(settings = {}) {
  const normalized = normalizeAiChatbotSettingsInput(settings, settings);
  return {
    enabled: normalized.enabled,
    name: normalized.name,
    welcomeMessage: normalized.welcomeMessage,
    avatarUrl: normalized.avatarUrl,
    position: normalized.position,
    appearance: normalized.appearance,
    messages: normalized.messages,
    faqs: normalized.faqs
      .filter((item) => item.enabled !== false)
      .map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        intents: item.intents || [],
        order: item.order,
      })),
    quickActions: normalized.quickActions
      .filter((item) => item.enabled !== false)
      .map((item) => ({
        id: item.id,
        label: item.label,
        actionType: item.actionType,
        value: item.value,
        order: item.order,
      })),
    escalation: normalized.escalation,
    visibilityBehavior: normalized.visibilityBehavior,
    updatedAt: normalized.updatedAt || null,
  };
}

export function getAiProviderRuntimeConfig(settings = {}) {
  const normalized = normalizeAiChatbotSettingsInput(settings, settings);
  return {
    enabled: normalized.ai.enabled === true,
    provider: normalized.ai.provider,
    model: normalized.ai.model,
    temperature: normalized.ai.temperature,
    maxTokens: normalized.ai.maxTokens,
    timeoutMs: normalized.ai.timeoutMs,
    baseUrl: normalized.ai.baseUrl,
    apiKey: decryptSecretValue(normalized.ai.apiKeyEnc),
    prompts: normalized.prompts,
  };
}

export function normalizeRouteForMatching(pathname = "/") {
  return normalizeRoutePath(pathname || "/") || "/";
}
