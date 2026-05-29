const mongoose = require("mongoose");
const softDeletePlugin = require("./plugins/softDelete");

const adminRoleSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    priority: { type: Number, required: true, default: 100 },
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

adminRoleSchema.index({ priority: -1 });

adminRoleSchema.plugin(softDeletePlugin);

module.exports =
  (mongoose.models && mongoose.models.AdminRole) || mongoose.model("AdminRole", adminRoleSchema);
