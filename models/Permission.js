const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    module: { type: String, required: true, trim: true, lowercase: true },
    action: { type: String, required: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    isProtected: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

permissionSchema.index({ module: 1, action: 1 });

module.exports =
  (mongoose.models && mongoose.models.Permission) || mongoose.model("Permission", permissionSchema);
