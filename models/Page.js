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
    // Draft fields edited in admin.
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    // Soft delete flag: 0 = active, 1 = deleted
    isDeleted: { type: Number, enum: [0, 1], default: 0, index: true },
    deletedSlug: { type: String, default: "" },
    layout: { type: [blockSchema], default: [] },
    meta: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
    },
    // Published snapshot fields used by live website rendering.
    publishedTitle: { type: String, trim: true },
    publishedSlug: { type: String, trim: true, lowercase: true, index: true },
    publishedLayout: { type: [blockSchema] },
    publishedMeta: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
    },
    publishedAt: { type: Date, default: null },
    publishedBy: { type: String, default: "" },
    publishedRevision: { type: Number, default: 0 },
    previousPublishedSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    locale: { type: String, default: "en", index: true },
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

pageSchema.index({ status: 1 });
// Hot path: every public page render does
//   Page.findOne({ publishedSlug || slug, status: "published", isDeleted: { $ne: 1 } })
// Compound index lets Mongo answer this with a single index hit.
pageSchema.index({ slug: 1, status: 1, isDeleted: 1 });
pageSchema.index({ publishedSlug: 1, status: 1, isDeleted: 1 });
pageSchema.index({ status: 1, isDeleted: 1, updatedAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.Page) || mongoose.model("Page", pageSchema);
