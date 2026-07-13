const mongoose = require("mongoose");

const chatbotEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        "chat_open",
        "question_click",
        "search_submit",
        "search_no_result",
        "contact_action_click",
        "donation_action_click",
        "chat_close",
      ],
      required: true,
      index: true,
    },
    sessionId: { type: String, required: true, index: true },
    entryPage: { type: String, default: "" },
    questionId: { type: String, default: "" },
    questionTitle: { type: String, default: "" },
    depth: { type: Number, default: 0 },
    query: { type: String, default: "" },
    resultCount: { type: Number, default: 0 },
    actionType: { type: String, default: "" },
    actionLabel: { type: String, default: "" },
    sourceNodeId: { type: String, default: "" },
    durationSeconds: { type: Number, default: 0 },
    lastNodeId: { type: String, default: "" },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

chatbotEventSchema.index({ createdAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.ChatbotEvent) ||
  mongoose.model("ChatbotEvent", chatbotEventSchema);
