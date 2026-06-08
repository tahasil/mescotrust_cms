const mongoose = require("mongoose");

const faqChatbotSearchIndexSchema = new mongoose.Schema(
  {
    nodeId: { type: String, required: true, trim: true },
    questionNodeId: { type: String, required: true, trim: true },
    type: { type: String, enum: ["question", "answer"], required: true },
    text: { type: String, required: true, trim: true },
    pathText: { type: String, default: "", trim: true },
    depth: { type: Number, required: true, min: 0, default: 0 },
    weight: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
    treeVersion: { type: Number, required: true, min: 1 },
  },
  { timestamps: true, collection: "faq_chatbot_search_index" },
);

faqChatbotSearchIndexSchema.index({ text: "text", pathText: "text" });
faqChatbotSearchIndexSchema.index({ treeVersion: 1, isActive: 1 });
faqChatbotSearchIndexSchema.index({ questionNodeId: 1, treeVersion: 1, isActive: 1 });
faqChatbotSearchIndexSchema.index({ nodeId: 1, treeVersion: 1 }, { unique: true });

module.exports =
  (mongoose.models && mongoose.models.FAQChatbotSearchIndex) ||
  mongoose.model("FAQChatbotSearchIndex", faqChatbotSearchIndexSchema);
