const mongoose = require("mongoose");

const contactActionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    actionType: {
      type: String,
      enum: ["call", "whatsapp", "email", "contact", "donation", "custom"],
      default: "custom",
    },
    label: { type: String, default: "" },
    url: { type: String, default: "" },
    icon: { type: String, default: "" },
    target: { type: String, enum: ["_self", "_blank"], default: "_self" },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const chatbotSettingsSchema = new mongoose.Schema(
  {
    settingsKey: { type: String, required: true, unique: true, default: "default" },
    enabled: { type: Boolean, default: true },
    botName: { type: String, default: "MESCO Help Desk" },
    welcomeMessage: { type: String, default: "Welcome to MESCO Trust" },
    welcomeSubtitle: { type: String, default: "How can we help you today?" },
    avatarMediaId: { type: String, default: "" },
    themeColor: { type: String, default: "#1677ff" },
    position: { type: String, enum: ["left", "right"], default: "right" },
    width: { type: Number, default: 360 },
    height: { type: Number, default: 560 },
    borderRadius: { type: Number, default: 16 },
    headerColor: { type: String, default: "#1677ff" },
    chatBackgroundColor: { type: String, default: "#ffffff" },
    botMessageBubbleColor: { type: String, default: "#f5f5f5" },
    botMessageTextColor: { type: String, default: "#1f1f1f" },
    userMessageBubbleColor: { type: String, default: "#1677ff" },
    userMessageTextColor: { type: String, default: "#ffffff" },
    quickOptionButtonColor: { type: String, default: "#f0f5ff" },
    quickOptionButtonTextColor: { type: String, default: "#0958d9" },
    linkAccentColor: { type: String, default: "#1677ff" },
    borderColor: { type: String, default: "#e8e8e8" },
    fontSize: { type: Number, default: 14 },
    enableSearch: { type: Boolean, default: true },
    minSearchChars: { type: Number, default: 2 },
    maxSearchResults: { type: Number, default: 8 },
    searchEnabledFields: {
      title: { type: Boolean, default: true },
      answer: { type: Boolean, default: true },
      keywords: { type: Boolean, default: true },
      tags: { type: Boolean, default: true },
      synonyms: { type: Boolean, default: true },
    },
    enableBreadcrumb: { type: Boolean, default: true },
    enableHomeButton: { type: Boolean, default: true },
    enableBackButton: { type: Boolean, default: true },
    enableRelatedQuestions: { type: Boolean, default: true },
    enableTypingAnimation: { type: Boolean, default: true },
    enableContactBlock: { type: Boolean, default: true },
    featuredQuestionIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    popularQuestionIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    welcomeBannerMediaId: { type: String, default: "" },
    contactActions: { type: [contactActionSchema], default: [] },
  },
  { timestamps: true },
);

module.exports =
  (mongoose.models && mongoose.models.ChatbotSettings) ||
  mongoose.model("ChatbotSettings", chatbotSettingsSchema);
