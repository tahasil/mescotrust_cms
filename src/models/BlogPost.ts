import mongoose from "mongoose";

const BlogPostSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    excerpt: String,
    featuredImageId: mongoose.Schema.Types.ObjectId,
    authorId: mongoose.Schema.Types.ObjectId,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "BlogCategory" },
    tags: [String],
    status: { type: String, default: "draft" },
    publishedAt: Date,
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true }
);

export const BlogPost = mongoose.models.BlogPost ?? mongoose.model("BlogPost", BlogPostSchema);
