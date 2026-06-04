import { connectDB } from "@/lib/db";
import AIChatbotSettings from "@/models/AIChatbotSettings";
import {
  AI_CHATBOT_SETTINGS_KEY,
  DEFAULT_AI_CHATBOT_SETTINGS,
  getAiProviderRuntimeConfig,
  normalizeAiChatbotSettingsInput,
  normalizeRouteForMatching,
  toAdminChatbotPayload,
  toPublicChatbotConfig,
} from "@/lib/aiChatbotValidation";

const UNSAFE_CATEGORY_RE =
  /(suicide|self[-\s]?harm|bomb|explosive|weapon|terror|porn|sexual content involving minors|credit card number|cvv|otp|one[-\s]?time password)/i;

const PROMPT_INJECTION_RE =
  /(ignore previous|ignore all previous|reveal system prompt|show hidden prompt|jailbreak|developer instructions|system instructions)/i;

function toSafeString(value) {
  return value == null ? "" : String(value).trim();
}

function safeJsonParse(value, fallback = {}) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeMessageForMatch(message) {
  return toSafeString(message)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeMessageForMatch(value)
    .split(" ")
    .map((x) => x.trim())
    .filter((x) => x.length > 1);
}

function scoreFaqMatch(messageNorm, messageTokens, faq) {
  const phrases = [faq?.question, ...(Array.isArray(faq?.intents) ? faq.intents : [])]
    .map((x) => normalizeMessageForMatch(x))
    .filter(Boolean);

  let best = 0;
  for (const phrase of phrases) {
    const phraseTokens = tokenize(phrase);
    if (!phraseTokens.length) continue;
    const overlap = phraseTokens.filter((t) => messageTokens.has(t)).length;
    const ratio = overlap / phraseTokens.length;
    let score = overlap;
    if (messageNorm.includes(phrase) || phrase.includes(messageNorm)) score += 2;
    if (ratio >= 0.65) score += 2;
    if (ratio >= 0.85) score += 1;
    best = Math.max(best, score);
  }
  return best;
}

function findFaqAnswer(message, settings) {
  const faqs = Array.isArray(settings?.faqs)
    ? settings.faqs.filter((item) => item?.enabled !== false)
    : [];
  if (!faqs.length) return null;

  const normalized = normalizeMessageForMatch(message);
  if (!normalized) return null;
  const tokens = new Set(tokenize(normalized));
  if (!tokens.size) return null;

  let winner = null;
  let winnerScore = 0;
  for (const faq of faqs) {
    const score = scoreFaqMatch(normalized, tokens, faq);
    if (score > winnerScore) {
      winner = faq;
      winnerScore = score;
    }
  }

  if (!winner || winnerScore < 2) return null;
  return {
    id: winner.id,
    answer: toSafeString(winner.answer),
  };
}

function shouldEscalate(message, source, settings) {
  if (settings?.escalation?.enabled !== true) return false;
  if (source === "fallback") return true;
  const text = normalizeMessageForMatch(message);
  return /(contact|human|agent|support|help me directly|call me)/i.test(text);
}

function buildEscalationPayload(settings, force = false) {
  const esc = settings?.escalation || {};
  if (esc.enabled !== true && !force) return null;
  return {
    enabled: esc.enabled === true,
    mode: esc.mode || "both",
    ctaLabel: esc.ctaLabel || "Contact support",
    contactRoute: esc.contactRoute || "/contact",
  };
}

function getEnabledQuickActions(settings, limit = 4) {
  return (Array.isArray(settings?.quickActions) ? settings.quickActions : [])
    .filter((item) => item?.enabled !== false)
    .sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0))
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      label: item.label,
      actionType: item.actionType,
      value: item.value,
      order: item.order,
    }));
}

function fallbackMessageFor(settings, reason) {
  if (reason === "timeout") return settings?.messages?.timeoutMessage;
  if (reason === "error") return settings?.messages?.errorMessage;
  return settings?.messages?.fallbackMessage;
}

export function redactPII(text) {
  const value = toSafeString(text);
  if (!value) return "";
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\+?\d[\d\s().-]{8,}\d/g, "[phone]")
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, "[card]")
    .replace(/\b\d{6}\b/g, "[code]");
}

async function callOpenAICompatible({
  baseUrl,
  apiKey,
  model,
  temperature,
  maxTokens,
  timeoutMs,
  prompts,
  message,
  context,
}) {
  const endpoint = `${String(baseUrl || "").replace(/\/+$/, "")}/chat/completions`;
  const systemPrompt = [prompts?.systemPrompt, prompts?.assistantStylePrompt]
    .map((x) => toSafeString(x))
    .filter(Boolean)
    .join("\n\n");

  const userPayload = {
    message,
    context: {
      page: context?.page || "",
      locale: context?.locale || "",
      sessionId: context?.sessionId || "",
    },
  };

  const payload = {
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(userPayload) },
    ],
  };

  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("timeout"), timeoutMs);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = safeJsonParse(await res.text(), {});
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || `AI provider error (${res.status})`);
      }
      const content = toSafeString(data?.choices?.[0]?.message?.content);
      if (!content) throw new Error("AI provider returned empty response");
      return content;
    } catch (err) {
      lastError = err;
      if (attempt >= 2) break;
      await new Promise((resolve) => setTimeout(resolve, 180));
    } finally {
      clearTimeout(timeout);
    }
  }

  if (String(lastError?.message || "").toLowerCase().includes("timeout")) {
    const timeoutErr = new Error("AI_TIMEOUT");
    timeoutErr.code = "AI_TIMEOUT";
    throw timeoutErr;
  }
  throw lastError || new Error("AI_FAILED");
}

export async function getOrCreateAiChatbotSettings() {
  await connectDB();
  let doc = await AIChatbotSettings.findOne({ settingsKey: AI_CHATBOT_SETTINGS_KEY });
  if (!doc) {
    const normalizedDefault = normalizeAiChatbotSettingsInput(
      DEFAULT_AI_CHATBOT_SETTINGS,
      DEFAULT_AI_CHATBOT_SETTINGS,
    );
    doc = await AIChatbotSettings.create(normalizedDefault);
  }
  return doc;
}

export async function getAiChatbotSettingsRaw() {
  const doc = await getOrCreateAiChatbotSettings();
  return doc?.toObject ? doc.toObject() : doc;
}

export async function getAdminAiChatbotConfig() {
  const raw = await getAiChatbotSettingsRaw();
  return toAdminChatbotPayload(raw);
}

export async function getPublicAiChatbotConfig() {
  const raw = await getAiChatbotSettingsRaw();
  return toPublicChatbotConfig(raw);
}

export async function saveAiChatbotSettings(input = {}, updatedBy = "") {
  await connectDB();
  const existingDoc = await AIChatbotSettings.findOne({
    settingsKey: AI_CHATBOT_SETTINGS_KEY,
  });
  const existing =
    existingDoc && typeof existingDoc.toObject === "function"
      ? existingDoc.toObject()
      : existingDoc || {};

  const normalized = normalizeAiChatbotSettingsInput(
    {
      ...input,
      updatedBy: toSafeString(updatedBy || input?.updatedBy),
    },
    existing,
  );
  const { settingsKey: _settingsKey, ...updatePayload } = normalized;

  const saved = await AIChatbotSettings.findOneAndUpdate(
    { settingsKey: AI_CHATBOT_SETTINGS_KEY },
    {
      $set: updatePayload,
      $setOnInsert: { settingsKey: AI_CHATBOT_SETTINGS_KEY },
    },
    { upsert: true, new: true },
  ).lean();

  return saved || normalized;
}

export function shouldShowChatbotForRoute(settings, pathname, { isMobile } = {}) {
  if (!settings?.enabled) return false;
  if (isMobile && settings?.visibilityBehavior?.enabledOnMobile === false) return false;
  if (!isMobile && settings?.visibilityBehavior?.enabledOnDesktop === false) return false;

  const includeRoutes = Array.isArray(settings?.visibilityBehavior?.includeRoutes)
    ? settings.visibilityBehavior.includeRoutes
    : [];
  if (!includeRoutes.length) return true;

  const route = normalizeRouteForMatching(pathname || "/");
  return includeRoutes.includes(route);
}

export function getChatbotNotificationOverrides(settings) {
  const enabled = settings?.emailNotifications?.enabled === true;
  const recipients = Array.isArray(settings?.emailNotifications?.recipients)
    ? settings.emailNotifications.recipients
    : [];
  if (!enabled || recipients.length === 0) return null;
  return {
    recipients,
    subjectPrefix: toSafeString(settings?.emailNotifications?.subjectPrefix),
  };
}

export async function generateAiChatbotResponse({
  message,
  sessionId = "",
  page = "",
  locale = "",
} = {}) {
  const raw = await getAiChatbotSettingsRaw();
  const settings = normalizeAiChatbotSettingsInput(raw, raw);
  const cleanMessage = toSafeString(message).slice(0, 1000);

  if (!cleanMessage) {
    return {
      reply: settings.messages.errorMessage,
      source: "fallback",
      quickActions: getEnabledQuickActions(settings),
      escalation: buildEscalationPayload(settings, true),
    };
  }

  if (PROMPT_INJECTION_RE.test(cleanMessage) || UNSAFE_CATEGORY_RE.test(cleanMessage)) {
    return {
      reply: `${settings.messages.fallbackMessage} ${settings.messages.escalationPromptMessage}`.trim(),
      source: "fallback",
      quickActions: getEnabledQuickActions(settings),
      escalation: buildEscalationPayload(settings, true),
    };
  }

  const faq = findFaqAnswer(cleanMessage, settings);
  if (faq?.answer) {
    return {
      reply: faq.answer,
      source: "faq",
      quickActions: getEnabledQuickActions(settings),
      escalation: shouldEscalate(cleanMessage, "faq", settings)
        ? buildEscalationPayload(settings)
        : null,
    };
  }

  const aiConfig = getAiProviderRuntimeConfig(settings);
  if (
    aiConfig.enabled &&
    aiConfig.provider !== "disabled" &&
    aiConfig.apiKey &&
    aiConfig.model
  ) {
    try {
      const aiReply = await callOpenAICompatible({
        ...aiConfig,
        message: cleanMessage,
        context: { page, locale, sessionId },
      });
      return {
        reply: toSafeString(aiReply).slice(0, 2000),
        source: "ai",
        quickActions: getEnabledQuickActions(settings),
        escalation: shouldEscalate(cleanMessage, "ai", settings)
          ? buildEscalationPayload(settings)
          : null,
      };
    } catch (err) {
      const reason = err?.code === "AI_TIMEOUT" ? "timeout" : "error";
      return {
        reply: `${fallbackMessageFor(settings, reason)} ${settings.messages.escalationPromptMessage}`.trim(),
        source: "fallback",
        quickActions: getEnabledQuickActions(settings),
        escalation: buildEscalationPayload(settings, true),
      };
    }
  }

  return {
    reply: `${settings.messages.fallbackMessage} ${settings.messages.escalationPromptMessage}`.trim(),
    source: "fallback",
    quickActions: getEnabledQuickActions(settings),
    escalation: buildEscalationPayload(settings, true),
  };
}
