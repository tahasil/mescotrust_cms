const mongoose = require("mongoose");

const faqChatbotAvatarSchema = new mongoose.Schema(
  {
    mediaId: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  { _id: false },
);

const faqChatbotUiPreferencesSchema = new mongoose.Schema(
  {
    showTimestamps: { type: Boolean, default: true },
    timestampFormat: {
      type: String,
      enum: ["12h", "24h"],
      default: "12h",
    },
    timestampLocale: { type: String, default: "en-US" },
    timestampTimezoneStrategy: {
      type: String,
      enum: ["client-local", "fixed-timezone"],
      default: "client-local",
    },
    fixedTimezone: { type: String, default: "" },
    showTypingState: { type: Boolean, default: true },
    typingMinMs: { type: Number, default: 600, min: 0, max: 15000 },
    typingMaxMs: { type: Number, default: 2500, min: 0, max: 30000 },
  },
  { _id: false },
);

const faqChatbotColorsSchema = new mongoose.Schema(
  {
    launcherGradientStart: { type: String, default: "#13567a", trim: true },
    launcherGradientEnd: { type: String, default: "#1d9b78", trim: true },
    headerGradientStart: { type: String, default: "#0f4f74", trim: true },
    headerGradientEnd: { type: String, default: "#157f67", trim: true },
    userBubbleBackground: { type: String, default: "#125679", trim: true },
    userBubbleText: { type: String, default: "#ffffff", trim: true },
    botBubbleBackground: { type: String, default: "#ffffff", trim: true },
    botBubbleText: { type: String, default: "#132430", trim: true },
    chipBackground: { type: String, default: "#ffffff", trim: true },
    chipText: { type: String, default: "#1b3a4e", trim: true },
  },
  { _id: false },
);

const faqChatbotSearchIndexStatusSchema = new mongoose.Schema(
  {
    lastRebuildAt: { type: Date, default: null },
    lastRebuildSource: { type: String, default: "", trim: true },
    lastTreeVersion: { type: Number, default: 1, min: 1 },
    lastScannedNodes: { type: Number, default: 0, min: 0 },
    lastIndexedRows: { type: Number, default: 0, min: 0 },
    lastSkippedRows: { type: Number, default: 0, min: 0 },
    lastDurationMs: { type: Number, default: 0, min: 0 },
    lastError: { type: String, default: "", trim: true },
    autoRepairCount: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const faqChatbotSearchMetricsStatusSchema = new mongoose.Schema(
  {
    totalQueries: { type: Number, default: 0, min: 0 },
    noResultQueries: { type: Number, default: 0, min: 0 },
    indexedQueryCount: { type: Number, default: 0, min: 0 },
    fallbackQueryCount: { type: Number, default: 0, min: 0 },
    totalLatencyMs: { type: Number, default: 0, min: 0 },
    lastLatencyMs: { type: Number, default: 0, min: 0 },
    lastResultCount: { type: Number, default: 0, min: 0 },
    lastSource: {
      type: String,
      enum: ["", "indexed", "fallback", "none"],
      default: "",
      trim: true,
    },
    lastQuery: { type: String, default: "", trim: true },
    lastQueryAt: { type: Date, default: null },
  },
  { _id: false },
);

const faqChatbotConfigSchema = new mongoose.Schema(
  {
    settingsKey: { type: String, default: "default", unique: true },
    enabled: { type: Boolean, default: false },
    headerTitle: { type: String, required: true, trim: true, default: "FAQ Assistant" },
    welcomeMessage: {
      type: String,
      required: true,
      trim: true,
      default: "Hi! How can I help you today?",
    },
    noResultsFoundMessage: {
      type: String,
      required: true,
      trim: true,
      default: "Sorry, I couldn't find an answer to your question.",
    },
    avatar: { type: faqChatbotAvatarSchema, default: () => ({}) },
    colors: { type: faqChatbotColorsSchema, default: () => ({}) },
    searchIndexStatus: { type: faqChatbotSearchIndexStatusSchema, default: () => ({}) },
    searchMetricsStatus: { type: faqChatbotSearchMetricsStatusSchema, default: () => ({}) },
    position: {
      type: String,
      enum: ["bottom-right", "bottom-left"],
      default: "bottom-right",
    },
    uiPreferences: { type: faqChatbotUiPreferencesSchema, default: () => ({}) },
    treeVersion: { type: Number, default: 1, min: 1 },
    updatedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "faq_chatbot_configs" },
);

module.exports =
  (mongoose.models && mongoose.models.FAQChatbotConfig) ||
  mongoose.model("FAQChatbotConfig", faqChatbotConfigSchema);
