const mongoose = require("mongoose");
const softDeletePlugin = require("./plugins/softDelete");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    content: { type: String, default: "" },
    excerpt: { type: String, default: "" },
    featuredImage: { type: String, default: "" },
    featuredImageMobile: { type: String, default: "" },
    author: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date, default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "BlogCategory", default: null },
    tags: [{ type: String, trim: true }],
    meta: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
    },
    locale: { type: String, default: "en", index: true },
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

blogSchema.index({ status: 1 });
blogSchema.index({ publishedAt: -1 });

blogSchema.plugin(softDeletePlugin);

module.exports =
  (mongoose.models && mongoose.models.Blog) || mongoose.model("Blog", blogSchema);
