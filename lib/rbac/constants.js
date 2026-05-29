export const ROLE_KEYS = Object.freeze({
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  EDITOR: "editor",
});

export const SYSTEM_ROLE_LABELS = Object.freeze({
  [ROLE_KEYS.SUPER_ADMIN]: "Super Admin",
  [ROLE_KEYS.ADMIN]: "Admin",
  [ROLE_KEYS.EDITOR]: "Editor",
});

const LEGACY_ROLE_TO_KEY_MAP = Object.freeze({
  "super admin": ROLE_KEYS.SUPER_ADMIN,
  super_admin: ROLE_KEYS.SUPER_ADMIN,
  superadmin: ROLE_KEYS.SUPER_ADMIN,
  admin: ROLE_KEYS.ADMIN,
  editor: ROLE_KEYS.EDITOR,
  // MESCO migration (decision 6.1): dropped "Author" role resolves to Editor.
  author: ROLE_KEYS.EDITOR,
});

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
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return ROLE_KEYS.EDITOR;
  return LEGACY_ROLE_TO_KEY_MAP[raw] || raw.replace(/\s+/g, "_");
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
  const role = input?.role;
  const roleKey = input?.roleKey;
  const normalizedKey = normalizeRoleKey(roleKey || role);
  return {
    roleKey: normalizedKey,
    role: roleLabelFromKey(normalizedKey),
  };
}

export function isSuperAdminRoleKey(roleKey) {
  return normalizeRoleKey(roleKey) === ROLE_KEYS.SUPER_ADMIN;
}

export function isAdminRoleKey(roleKey) {
  const key = normalizeRoleKey(roleKey);
  return key === ROLE_KEYS.ADMIN || key === ROLE_KEYS.SUPER_ADMIN;
}
