const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    content: { type: String, default: "" },
    featuredImageDesktop: { type: String, default: "" },
    featuredImageMobile: { type: String, default: "" },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    time: { type: String, default: "" },
    location: { type: String, default: "" },
    isOnline: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    eventLink: { type: String, default: "" },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["draft", "pending_review", "changes_requested", "approved", "published", "rejected"],
      default: "draft",
    },
    publishedAt: { type: Date, default: null },
    publishedBy: { type: String, default: "" },
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

eventSchema.index({ status: 1 });
eventSchema.index({ creatorId: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ status: 1, featured: 1, startDate: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ updatedAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.Event) || mongoose.model("Event", eventSchema);
