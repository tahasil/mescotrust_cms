const mongoose = require("mongoose");
const softDeletePlugin = require("./plugins/softDelete");
const LEGACY_ROLE_TO_KEY_MAP = Object.freeze({
  "super admin": "super_admin",
  super_admin: "super_admin",
  superadmin: "super_admin",
  admin: "admin",
  editor: "editor",
  // MESCO migration (decision 6.1): the dropped "Author" role maps to Editor so
  // any legacy/stray Author user resolves to a real catalog role instead of an
  // orphaned roleKey. The bulk backfill is scripts/migrate-author-to-editor.js (M1).
  author: "editor",
});

const USER_TYPE_VALUES = Object.freeze({
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  EDITOR: "editor",
});

function normalizeUserType(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return "";
  if (raw === "super_admin" || raw === "super admin" || raw === "superadmin") return USER_TYPE_VALUES.SUPERADMIN;
  if (raw === "admin") return USER_TYPE_VALUES.ADMIN;
  if (raw === "editor") return USER_TYPE_VALUES.EDITOR;
  return "";
}

function normalizeRoleKey(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return "editor";
  return LEGACY_ROLE_TO_KEY_MAP[raw] || raw.replace(/\s+/g, "_");
}

function roleLabelFromKey(roleKey) {
  const key = normalizeRoleKey(roleKey);
  if (key === "super_admin") return "Super Admin";
  if (key === "admin") return "Admin";
  if (key === "editor") return "Editor";
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveRoleIdentity(role, roleKey) {
  const nextRoleKey = normalizeRoleKey(roleKey || role);
  return { roleKey: nextRoleKey, role: roleLabelFromKey(nextRoleKey) };
}

function defaultUserTypeFromRoleKey(roleKey) {
  const key = normalizeRoleKey(roleKey);
  if (key === "super_admin") return USER_TYPE_VALUES.SUPERADMIN;
  if (key === "admin") return USER_TYPE_VALUES.ADMIN;
  return USER_TYPE_VALUES.EDITOR;
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: "Editor", trim: true },
    roleKey: { type: String, default: "editor", trim: true, lowercase: true, index: true },
    userType: {
      type: String,
      enum: Object.values(USER_TYPE_VALUES),
      default: USER_TYPE_VALUES.EDITOR,
      trim: true,
      lowercase: true,
      index: true,
    },
    permissionVersion: { type: Number, default: 1 },
    sessionVersion: { type: Number, default: 1 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

userSchema.pre("validate", function mapRoleFields(next) {
  const resolved = resolveRoleIdentity(this.role, this.roleKey);
  this.role = resolved.role;
  this.roleKey = resolved.roleKey;
  const normalizedUserType = normalizeUserType(this.userType);
  this.userType = normalizedUserType || defaultUserTypeFromRoleKey(this.roleKey);
  if (!Number.isFinite(Number(this.permissionVersion)) || Number(this.permissionVersion) < 1) {
    this.permissionVersion = 1;
  }
  if (!Number.isFinite(Number(this.sessionVersion)) || Number(this.sessionVersion) < 1) {
    this.sessionVersion = 1;
  }
  next();
});

userSchema.plugin(softDeletePlugin);

module.exports =
  (mongoose.models && mongoose.models.User) || mongoose.model("User", userSchema);
