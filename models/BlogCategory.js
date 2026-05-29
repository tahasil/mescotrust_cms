const mongoose = require("mongoose");
const softDeletePlugin = require("./plugins/softDelete");

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

blogCategorySchema.plugin(softDeletePlugin);

module.exports =
  (mongoose.models && mongoose.models.BlogCategory) || mongoose.model("BlogCategory", blogCategorySchema);
