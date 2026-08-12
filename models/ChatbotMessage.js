const mongoose = require("mongoose");

const chatbotMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatbotConversation",
      required: true,
      index: true,
    },
    sessionId: { type: String, required: true, index: true },
    messageId: { type: String, required: true, unique: true, index: true },
    role: {
      type: String,
      enum: ["user", "bot"],
      required: true,
      index: true,
    },
    content: { type: String, default: "" },
    contentHtml: { type: String, default: "" },
    messageType: {
      type: String,
      enum: ["faq", "search", "welcome", "system"],
      default: "faq",
    },
    orderIndex: { type: Number, required: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

chatbotMessageSchema.index({ conversationId: 1, orderIndex: 1 });

module.exports =
  (mongoose.models && mongoose.models.ChatbotMessage) ||
  mongoose.model("ChatbotMessage", chatbotMessageSchema);
