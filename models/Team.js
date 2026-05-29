const mongoose = require("mongoose");
const softDeletePlugin = require("./plugins/softDelete");

const socialLinkSchema = new mongoose.Schema(
  {
    platform: { type: String, default: "", trim: true },
    url: { type: String, default: "", trim: true },
    target: { type: String, enum: ["_self", "_blank"], default: "_self" },
    openInNewTab: { type: Boolean, default: false },
  },
  { _id: false },
);

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamCategory",
      required: true,
    },
    designation: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    bio: { type: String, default: "", trim: true },
    socialLinks: { type: [socialLinkSchema], default: [] },
    features: {
      showInSlider: { type: Boolean, default: false },
      featuredTeam: { type: Boolean, default: false },
      showOnHomepage: { type: Boolean, default: false },
      highlightTeam: { type: Boolean, default: false },
      enableSocialIcons: { type: Boolean, default: false },
      mappedSliderComponentId: { type: String, default: "", trim: true },
    },
    order: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "teams" },
);

teamSchema.index({ categoryId: 1, order: 1 });
teamSchema.index({ status: 1, order: 1 });

teamSchema.plugin(softDeletePlugin);

module.exports =
  (mongoose.models && mongoose.models.TeamMember) ||
  mongoose.model("TeamMember", teamSchema);


