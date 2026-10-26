const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    content: { type: String, default: "" },
    excerpt: { type: String, default: "" },
    featuredImage: { type: String, default: "" },
    featuredImageMobile: { type: String, default: "" },
    author: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "pending_review", "changes_requested", "approved", "published", "rejected"],
      default: "draft",
    },
    publishedAt: { type: Date, default: null },
    publishedBy: { type: String, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "BlogCategory", default: null },
    tags: [{ type: String, trim: true }],
    meta: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      metaKeywords: { type: String, default: "" },
    },
    locale: { type: String, default: "en", index: true },
    createdBy: { type: String, default: "" },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: String, default: "" },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: "" },
    reviewComments: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
    workflowHistory: [
      {
        action: { type: String, default: "" },
        performedBy: { type: String, default: "" },
        performedByRole: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String, default: "" },
      },
    ],
    pendingRevision: {
      hasPendingRevision: { type: Boolean, default: false },
      submittedAt: { type: Date, default: null },
      submittedBy: { type: String, default: "" },
      data: { type: mongoose.Schema.Types.Mixed, default: null },
      reviewComments: { type: String, default: "" },
      status: { type: String, default: "none" },
    },
  },
  { timestamps: true }
);

blogSchema.index({ status: 1 });
blogSchema.index({ creatorId: 1 });
blogSchema.index({ createdBy: 1 });
blogSchema.index({ publishedAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.Blog) || mongoose.model("Blog", blogSchema);
