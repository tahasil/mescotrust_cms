const mongoose = require("mongoose");

const socialWallPostSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true, lowercase: true },
    postId: { type: String, required: true, trim: true },
    authorName: { type: String, default: "" },
    authorHandle: { type: String, default: "" },
    authorImage: { type: String, default: "" },
    caption: { type: String, default: "" },
    mediaType: {
      type: String,
      enum: ["image", "video", "text"],
      default: "text",
    },
    mediaUrl: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    postUrl: { type: String, default: "" },
    publishedAt: { type: Date, default: null },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 },
    hashtags: [{ type: String }],
    source: { type: String, enum: ["live", "manual"], default: "live" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    featured: { type: Boolean, default: false },
    visibility: { type: String, enum: ["all", "desktop", "mobile", "none"], default: "all" },
    rawPayload: { type: mongoose.Schema.Types.Mixed, default: null },
    moderationNote: { type: String, default: "" },
    moderatedBy: { type: String, default: "" },
    moderatedAt: { type: Date, default: null },
    moderationHistory: [
      {
        action: { type: String, default: "" },
        performedBy: { type: String, default: "" },
        performedAt: { type: Date, default: Date.now },
        reason: { type: String, default: "" },
      },
    ],
    lastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "social_posts" },
);

socialWallPostSchema.index({ platform: 1, postId: 1 }, { unique: true });
socialWallPostSchema.index({ status: 1, publishedAt: -1, _id: -1 });
socialWallPostSchema.index({ platform: 1, publishedAt: -1 });
socialWallPostSchema.index({ featured: 1, status: 1 });

module.exports =
  (mongoose.models && mongoose.models.SocialWallPost) ||
  mongoose.model("SocialWallPost", socialWallPostSchema);
