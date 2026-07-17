const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: "Editor", trim: true },
    roleKey: { type: String, trim: true, lowercase: true, index: true },
    permissionVersion: { type: Number, default: 1, min: 1 },
    sessionVersion: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

userSchema.pre("validate", function normalizeAccessFields(next) {
  const legacyKeyMap = {
    "super admin": "super_admin",
    superadmin: "super_admin",
    admin: "admin",
    editor: "editor",
    author: "author",
  };
  const rawRoleKey = String(this.roleKey || this.role || "editor").trim().toLowerCase();
  this.roleKey =
    legacyKeyMap[rawRoleKey] ||
    rawRoleKey.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") ||
    "editor";
  if (!Number.isFinite(Number(this.permissionVersion)) || Number(this.permissionVersion) < 1) {
    this.permissionVersion = 1;
  }
  if (!Number.isFinite(Number(this.sessionVersion)) || Number(this.sessionVersion) < 1) {
    this.sessionVersion = 1;
  }
  next();
});

module.exports =
  (mongoose.models && mongoose.models.User) || mongoose.model("User", userSchema);
