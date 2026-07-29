export const ROLE_KEYS = Object.freeze({
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  EDITOR: "editor",
  AUTHOR: "author",
});

export const SYSTEM_ROLE_LABELS = Object.freeze({
  [ROLE_KEYS.SUPER_ADMIN]: "Super Admin",
  [ROLE_KEYS.ADMIN]: "Admin",
  [ROLE_KEYS.EDITOR]: "Editor",
  [ROLE_KEYS.AUTHOR]: "Author",
});

const LEGACY_ROLE_TO_KEY = Object.freeze({
  "super admin": ROLE_KEYS.SUPER_ADMIN,
  super_admin: ROLE_KEYS.SUPER_ADMIN,
  superadmin: ROLE_KEYS.SUPER_ADMIN,
  administrator: ROLE_KEYS.ADMIN,
  admin: ROLE_KEYS.ADMIN,
  editor: ROLE_KEYS.EDITOR,
  "content editor": ROLE_KEYS.EDITOR,
  author: ROLE_KEYS.AUTHOR,
  "content author": ROLE_KEYS.AUTHOR,
});

const DEFAULT_SUPER_ADMIN_EMAILS = ["superadmin@aiolos.cloud"];
const ENV_SUPER_ADMIN_EMAILS = String(process.env.SUPER_ADMIN_EMAILS || "")
  .split(",")
  .map((value) => String(value || "").trim().toLowerCase())
  .filter(Boolean);

const SUPER_ADMIN_EMAILS = new Set([
  ...DEFAULT_SUPER_ADMIN_EMAILS,
  ...ENV_SUPER_ADMIN_EMAILS,
]);

export const RBAC_ACTIONS = Object.freeze([
  "view",
  "create",
  "edit",
  "delete",
  "manage",
  "publish",
  "settings_access",
  "user_management",
  "role_management",
]);

export function normalizeRoleKey(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return ROLE_KEYS.EDITOR;
  const normalized = LEGACY_ROLE_TO_KEY[raw] || raw.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return normalized || ROLE_KEYS.EDITOR;
}

export function roleLabelFromKey(roleKey) {
  const key = normalizeRoleKey(roleKey);
  if (SYSTEM_ROLE_LABELS[key]) return SYSTEM_ROLE_LABELS[key];
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function resolveRoleIdentity(input = {}) {
  const roleKey = normalizeRoleKey(input?.roleKey || input?.role);
  return { roleKey, role: roleLabelFromKey(roleKey) };
}

export function isConfiguredSuperAdminEmail(email) {
  return SUPER_ADMIN_EMAILS.has(String(email || "").trim().toLowerCase());
}

export function getConfiguredSuperAdminEmails() {
  return Array.from(SUPER_ADMIN_EMAILS);
}

export function isSuperAdminRoleKey(roleKey) {
  return normalizeRoleKey(roleKey) === ROLE_KEYS.SUPER_ADMIN;
}

export function isAdminRoleKey(roleKey) {
  const key = normalizeRoleKey(roleKey);
  return key === ROLE_KEYS.ADMIN || key === ROLE_KEYS.SUPER_ADMIN;
}
