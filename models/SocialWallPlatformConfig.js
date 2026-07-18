const mongoose = require("mongoose");

const socialWallPlatformConfigSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true, lowercase: true },
    label: { type: String, default: "" },
    mode: { type: String, enum: ["live", "manual-only"], default: "manual-only" },
    active: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 1 },
    postLimit: { type: Number, default: 12, min: 1, max: 60 },
    fetchIntervalMinutes: { type: Number, default: 30, min: 5, max: 1440 },
    accessTokenEnc: { type: String, default: "" },
    refreshTokenEnc: { type: String, default: "" },
    accountIdEnc: { type: String, default: "" },
    apiKeyEnc: { type: String, default: "" },
    accessTokenExpiresAt: { type: Date, default: null },
    scopes: [{ type: String }],
    lastSyncAt: { type: Date, default: null },
    lastSyncStatus: {
      type: String,
      enum: ["idle", "success", "failed"],
      default: "idle",
    },
    lastSyncError: { type: String, default: "" },
    syncCooldownUntil: { type: Date, default: null },
    syncLockUntil: { type: Date, default: null },
    lastRunWindowKey: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true, collection: "social_platform_configs" },
);

socialWallPlatformConfigSchema.index({ platform: 1 }, { unique: true });
socialWallPlatformConfigSchema.index({ active: 1, displayOrder: 1 });

module.exports =
  (mongoose.models && mongoose.models.SocialWallPlatformConfig) ||
  mongoose.model("SocialWallPlatformConfig", socialWallPlatformConfigSchema);
