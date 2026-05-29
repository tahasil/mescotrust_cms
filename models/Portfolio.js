const mongoose = require("mongoose");
const softDeletePlugin = require("./plugins/softDelete");

const socialLinkSchema = new mongoose.Schema(
  {
    label: { type: String, default: "", trim: true },
    url: { type: String, default: "", trim: true },
    linkEnabled: { type: Boolean, default: false },
    target: { type: String, enum: ["_self", "_blank"], default: "_self" },
    openInNewTab: { type: Boolean, default: false },
    // Keep legacy support for older records.
    platform: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const portfolioSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PortfolioCategory",
      required: true,
    },
    designation: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    logo: { type: String, default: "", trim: true },
    bio: { type: String, default: "", trim: true },
    socialLinks: { type: [socialLinkSchema], default: [] },
    feature: { type: Boolean, default: false },
    features: {
      showInSlider: { type: Boolean, default: false },
      featuredPortfolio: { type: Boolean, default: false },
      showOnHomepage: { type: Boolean, default: false },
      highlightPortfolio: { type: Boolean, default: false },
      enableSocialIcons: { type: Boolean, default: false },
      mappedSliderComponentId: { type: String, default: "", trim: true },
    },
    order: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "portfolio" },
);

portfolioSchema.index({ categoryId: 1, order: 1 });
portfolioSchema.index({ status: 1, order: 1 });

portfolioSchema.plugin(softDeletePlugin);

module.exports =
  (mongoose.models && mongoose.models.PortfolioItem) ||
  mongoose.model("PortfolioItem", portfolioSchema);



