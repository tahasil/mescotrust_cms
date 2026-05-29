const mongoose = require("mongoose");
const softDeletePlugin = require("./plugins/softDelete");

const teamCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "teamCategories" },
);

teamCategorySchema.index({ order: 1, name: 1 });
teamCategorySchema.index({ isActive: 1, order: 1 });

teamCategorySchema.plugin(softDeletePlugin);

module.exports =
  (mongoose.models && mongoose.models.TeamCategory) ||
  mongoose.model("TeamCategory", teamCategorySchema);


