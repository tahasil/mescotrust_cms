const mongoose = require("mongoose");

const showNeedMoreInfoField = { type: Boolean, default: false };

const faqNodeSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FaqNode",
      default: null,
      index: true,
    },
    question: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    answerHtml: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    synonyms: { type: [String], default: [] },
    icon: { type: String, default: "" },
    showNeedMoreInfo: showNeedMoreInfoField,
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    sortOrder: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 },
  },
  { timestamps: true },
);

faqNodeSchema.index({ parentId: 1, sortOrder: 1 });

const existingModel = mongoose.models && mongoose.models.FaqNode;
if (existingModel && !existingModel.schema.path("showNeedMoreInfo")) {
  existingModel.schema.add({ showNeedMoreInfo: showNeedMoreInfoField });
}

module.exports = existingModel || mongoose.model("FaqNode", faqNodeSchema);
