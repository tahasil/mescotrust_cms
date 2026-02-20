import mongoose from "mongoose";

const BlogCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const BlogCategory = mongoose.models.BlogCategory ?? mongoose.model("BlogCategory", BlogCategorySchema);
