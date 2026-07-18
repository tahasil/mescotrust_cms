const mongoose = require("mongoose");

const socialWallConfigAuditSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ["settings", "platform-config", "token-refresh"],
      required: true,
      default: "settings",
    },
    entityKey: { type: String, required: true, trim: true, default: "social-wall" },
    action: { type: String, required: true, trim: true, default: "update" },
    performedBy: { type: String, default: "" },
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: "social_config_audit_logs" },
);

socialWallConfigAuditSchema.index({ entityType: 1, createdAt: -1 });
socialWallConfigAuditSchema.index({ entityKey: 1, createdAt: -1 });
socialWallConfigAuditSchema.index({ performedBy: 1, createdAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.SocialWallConfigAudit) ||
  mongoose.model("SocialWallConfigAudit", socialWallConfigAuditSchema);

