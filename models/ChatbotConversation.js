const mongoose = require("mongoose");

const chatbotConversationSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    entryPage: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true,
    },
    lastActivityAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

chatbotConversationSchema.index({ updatedAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.ChatbotConversation) ||
  mongoose.model("ChatbotConversation", chatbotConversationSchema);
