const mongoose = require("mongoose");

const permissionAuditLogSchema = new mongoose.Schema(
  {
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    actorRoleKey: { type: String, trim: true, lowercase: true },
    targetType: { type: String, enum: ["user", "role"], required: true },
    targetId: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true, lowercase: true },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    status: { type: String, enum: ["success", "rejected"], default: "success" },
    reason: { type: String, default: "", trim: true },
    ip: { type: String, default: "", trim: true },
    userAgent: { type: String, default: "", trim: true },
    traceId: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

permissionAuditLogSchema.index({ createdAt: -1 });
permissionAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

module.exports =
  (mongoose.models && mongoose.models.PermissionAuditLog) ||
  mongoose.model("PermissionAuditLog", permissionAuditLogSchema);
