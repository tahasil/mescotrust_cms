const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
  {
    instanceId: { type: String, required: true },
    /** ObjectId for Component ref, or string for site component ID (e.g. "HeroBanner"). */
    componentId: { type: mongoose.Schema.Types.Mixed, default: null },
    baseComponent: { type: String, default: "Paragraph" },
    props: { type: mongoose.Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    layout: { type: [blockSchema], default: [] },
    meta: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      metaKeywords: { type: String, default: "" },
    },
    locale: { type: String, default: "en", index: true },
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

pageSchema.index({ status: 1 });

module.exports =
  (mongoose.models && mongoose.models.Page) || mongoose.model("Page", pageSchema);
