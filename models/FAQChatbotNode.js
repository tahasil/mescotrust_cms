const mongoose = require("mongoose");

const faqChatbotNodeSchema = new mongoose.Schema(
  {
    nodeId: { type: String, required: true, unique: true, trim: true, immutable: true },
    parentNodeId: { type: String, default: null },
    rootNodeId: { type: String, required: true, trim: true },
    type: { type: String, enum: ["question", "answer"], required: true },
    questionText: { type: String, default: "", trim: true },
    answerText: { type: String, default: "", trim: true },
    depth: { type: Number, required: true, min: 0, default: 0 },
    order: { type: Number, required: true, min: 0, default: 0 },
    pathNodeIds: { type: [String], default: [] },
    pathText: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "faq_chatbot_nodes" },
);

faqChatbotNodeSchema.pre("validate", function beforeValidate(next) {
  if (this.type === "question") {
    this.answerText = "";
  } else if (this.type === "answer") {
    this.questionText = "";
  }
  next();
});

faqChatbotNodeSchema.index({ parentNodeId: 1, order: 1 });
faqChatbotNodeSchema.index({ rootNodeId: 1, depth: 1 });
faqChatbotNodeSchema.index({
  questionText: "text",
  answerText: "text",
  pathText: "text",
});

module.exports =
  (mongoose.models && mongoose.models.FAQChatbotNode) ||
  mongoose.model("FAQChatbotNode", faqChatbotNodeSchema);
