import mongoose from "mongoose";

const PageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    status: { type: String, default: "draft" },
    isHomePage: { type: Boolean, default: false },
    seoTitle: String,
    seoDescription: String,
    seoOpenGraphImage: String,
    seoCanonicalUrl: String,
    publishedAt: Date,
    unpublishedAt: Date,
  },
  { timestamps: true }
);

export const Page = mongoose.models.Page ?? mongoose.model("Page", PageSchema);
