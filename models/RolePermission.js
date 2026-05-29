const mongoose = require("mongoose");

const rolePermissionSchema = new mongoose.Schema(
  {
    roleKey: { type: String, required: true, trim: true, lowercase: true },
    permissionKey: { type: String, required: true, trim: true, lowercase: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

rolePermissionSchema.index({ roleKey: 1, permissionKey: 1 }, { unique: true });
rolePermissionSchema.index({ roleKey: 1 });
rolePermissionSchema.index({ permissionKey: 1 });

module.exports =
  (mongoose.models && mongoose.models.RolePermission) || mongoose.model("RolePermission", rolePermissionSchema);
