const mongoose = require("mongoose");

const socialMediaPlatformConfigSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true, lowercase: true },
    active: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 1 },
    accessTokenEnc: { type: String, default: "" },
    accountIdEnc: { type: String, default: "" },
    apiKeyEnc: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

socialMediaPlatformConfigSchema.index({ platform: 1 }, { unique: true });
socialMediaPlatformConfigSchema.index({ displayOrder: 1 });

module.exports =
  (mongoose.models && mongoose.models.SocialMediaPlatformConfig) ||
  mongoose.model("SocialMediaPlatformConfig", socialMediaPlatformConfigSchema);
