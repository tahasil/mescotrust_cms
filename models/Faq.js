const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      trim: true,
      default: "General",
      index: true,
    },
    order: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "published",
      index: true,
    },
    tags: [{ type: String, trim: true }],
    isFeatured: { type: Boolean, default: false },
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

faqSchema.index({ category: 1, order: 1 });
faqSchema.index({ status: 1, order: 1 });

const existingModel = mongoose.models && mongoose.models.Faq;
module.exports = existingModel || mongoose.model("Faq", faqSchema);

