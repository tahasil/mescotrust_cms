const mongoose = require("mongoose");

const socialWallFetchLogSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true, lowercase: true },
    runId: { type: String, required: true, trim: true },
    trigger: { type: String, enum: ["manual", "scheduled"], default: "manual" },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    durationMs: { type: Number, default: 0 },
    fetchedCount: { type: Number, default: 0 },
    newCount: { type: Number, default: 0 },
    updatedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    status: { type: String, enum: ["success", "failed", "partial"], default: "success" },
    errorCode: { type: String, default: "" },
    errorMessage: { type: String, default: "" },
    requestedBy: { type: String, default: "" },
  },
  { timestamps: true, collection: "social_fetch_logs" },
);

socialWallFetchLogSchema.index({ platform: 1, startedAt: -1 });
socialWallFetchLogSchema.index({ runId: 1 });

module.exports =
  (mongoose.models && mongoose.models.SocialWallFetchLog) ||
  mongoose.model("SocialWallFetchLog", socialWallFetchLogSchema);
