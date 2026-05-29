const mongoose = require("mongoose");
const softDeletePlugin = require("./plugins/softDelete");

const portfolioCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "portfolioCategories" },
);

portfolioCategorySchema.index({ order: 1, name: 1 });
portfolioCategorySchema.index({ isActive: 1, order: 1 });

portfolioCategorySchema.plugin(softDeletePlugin);

module.exports =
  (mongoose.models && mongoose.models.PortfolioCategory) ||
  mongoose.model("PortfolioCategory", portfolioCategorySchema);



