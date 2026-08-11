const mongoose = require("mongoose");

const siteFileSettingSchema = new mongoose.Schema(
  {
    fileType: {
      type: String,
      enum: ["sitemap", "robots"],
      required: true,
      unique: true,
    },
    content: { type: String, required: true, default: "" },
    generatedAt: { type: Date, default: null },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports =
  (mongoose.models && mongoose.models.SiteFileSetting) ||
  mongoose.model("SiteFileSetting", siteFileSettingSchema);
