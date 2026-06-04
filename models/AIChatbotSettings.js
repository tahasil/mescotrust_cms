const mongoose = require("mongoose");

const chatbotFaqSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    intents: [{ type: String, trim: true }],
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 1 },
  },
  { _id: false },
);

const chatbotQuickActionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    actionType: {
      type: String,
      enum: ["message", "route", "url", "contact"],
      default: "message",
    },
    value: { type: String, default: "", trim: true },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 1 },
  },
  { _id: false },
);

const aiChatbotSettingsSchema = new mongoose.Schema(
  {
    settingsKey: { type: String, required: true, default: "default", unique: true },
    enabled: { type: Boolean, default: false },
    name: { type: String, default: "Assistant", trim: true },
    welcomeMessage: { type: String, default: "", trim: true },
    avatarUrl: { type: String, default: "", trim: true },
    position: {
      type: String,
      enum: ["bottom-right", "bottom-left"],
      default: "bottom-right",
    },
    appearance: {
      launcherBgColor: { type: String, default: "#1677ff", trim: true },
      launcherIconColor: { type: String, default: "#ffffff", trim: true },
      panelBgColor: { type: String, default: "#ffffff", trim: true },
      panelTextColor: { type: String, default: "#111827", trim: true },
      userBubbleBgColor: { type: String, default: "#1677ff", trim: true },
      userBubbleTextColor: { type: String, default: "#ffffff", trim: true },
      botBubbleBgColor: { type: String, default: "#f3f4f6", trim: true },
      botBubbleTextColor: { type: String, default: "#111827", trim: true },
      buttonBgColor: { type: String, default: "#1677ff", trim: true },
      buttonTextColor: { type: String, default: "#ffffff", trim: true },
      borderRadius: { type: Number, default: 14 },
    },
    messages: {
      fallbackMessage: { type: String, default: "", trim: true },
      timeoutMessage: { type: String, default: "", trim: true },
      errorMessage: { type: String, default: "", trim: true },
      escalationPromptMessage: { type: String, default: "", trim: true },
      escalationSuccessMessage: { type: String, default: "", trim: true },
      escalationErrorMessage: { type: String, default: "", trim: true },
      launcherLabel: { type: String, default: "", trim: true },
      shareDetailsLabel: { type: String, default: "", trim: true },
      escalationInlineNamePlaceholder: { type: String, default: "", trim: true },
      escalationInlineEmailPlaceholder: { type: String, default: "", trim: true },
      escalationInlineMessagePlaceholder: { type: String, default: "", trim: true },
      inputPlaceholder: { type: String, default: "", trim: true },
      sendButtonLabel: { type: String, default: "", trim: true },
      typingLabel: { type: String, default: "", trim: true },
      openButtonAriaLabel: { type: String, default: "", trim: true },
      closeButtonAriaLabel: { type: String, default: "", trim: true },
    },
    prompts: {
      systemPrompt: { type: String, default: "", trim: true },
      assistantStylePrompt: { type: String, default: "", trim: true },
    },
    faqs: { type: [chatbotFaqSchema], default: [] },
    quickActions: { type: [chatbotQuickActionSchema], default: [] },
    escalation: {
      enabled: { type: Boolean, default: true },
      mode: {
        type: String,
        enum: ["redirect_contact", "inline_capture", "both"],
        default: "redirect_contact",
      },
      ctaLabel: { type: String, default: "Contact support", trim: true },
      contactRoute: { type: String, default: "/contact", trim: true },
    },
    emailNotifications: {
      enabled: { type: Boolean, default: false },
      recipients: [{ type: String, trim: true }],
      subjectPrefix: { type: String, default: "", trim: true },
    },
    visibilityBehavior: {
      enabledOnDesktop: { type: Boolean, default: true },
      enabledOnMobile: { type: Boolean, default: true },
      includeRoutes: [{ type: String, trim: true }],
      defaultState: {
        type: String,
        enum: ["minimized", "open"],
        default: "minimized",
      },
      autoOpenEnabled: { type: Boolean, default: false },
      autoOpenDelayMs: { type: Number, default: 1200 },
      autoOpenOncePerSession: { type: Boolean, default: true },
    },
    ai: {
      enabled: { type: Boolean, default: false },
      provider: {
        type: String,
        enum: ["openai", "openai_compatible", "disabled"],
        default: "disabled",
      },
      model: { type: String, default: "gpt-4o-mini", trim: true },
      temperature: { type: Number, default: 0.3 },
      maxTokens: { type: Number, default: 350 },
      timeoutMs: { type: Number, default: 9000 },
      baseUrl: { type: String, default: "https://api.openai.com/v1", trim: true },
      apiKeyEnc: { type: String, default: "", trim: true },
    },
    updatedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

module.exports =
  (mongoose.models && mongoose.models.AIChatbotSettings) ||
  mongoose.model("AIChatbotSettings", aiChatbotSettingsSchema);
