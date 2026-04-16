const mongoose = require("mongoose");

const blogCommentSchema = new mongoose.Schema(
  {
    blogId: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    comment: { type: String, required: true, trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

blogCommentSchema.index({ blogId: 1, status: 1 });
blogCommentSchema.index({ blogId: 1, status: 1, createdAt: -1 });
blogCommentSchema.index({ createdAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.BlogComment) ||
  mongoose.model("BlogComment", blogCommentSchema);
