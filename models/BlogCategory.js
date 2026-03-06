const mongoose = require("mongoose");

const blogCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogCategorySchema.index({ order: 1 });

module.exports =
  (mongoose.models && mongoose.models.BlogCategory) || mongoose.model("BlogCategory", blogCategorySchema);
