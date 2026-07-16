const mongoose = require("mongoose");

const socialWallSettingsSchema = new mongoose.Schema(
  {
    moduleName: { type: String, required: true, default: "social-wall", unique: true },
    moduleEnabled: { type: Boolean, default: true },
    defaultLayout: {
      type: String,
      enum: ["grid", "masonry", "carousel"],
      default: "masonry",
    },
    defaultPostLimit: { type: Number, default: 12, min: 1, max: 60 },
    defaultSortBy: {
      type: String,
      enum: ["latest", "platform-priority", "engagement"],
      default: "latest",
    },
    defaultSortOrder: { type: String, enum: ["asc", "desc"], default: "desc" },
    filtersEnabled: { type: Boolean, default: true },
    moderationMode: { type: String, enum: ["auto", "manual"], default: "manual" },
    cardStylePreset: {
      type: String,
      enum: ["clean", "outlined", "elevated"],
      default: "clean",
    },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true, collection: "social_wall_settings" },
);

module.exports =
  (mongoose.models && mongoose.models.SocialWallSettings) ||
  mongoose.model("SocialWallSettings", socialWallSettingsSchema);
