import { ROLE_KEYS, normalizeRoleKey } from "@/lib/rbac/constants";

export const USER_TYPES = Object.freeze({
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  EDITOR: "editor",
});

const USER_TYPE_ALIASES = Object.freeze({
  superadmin: USER_TYPES.SUPERADMIN,
  "super admin": USER_TYPES.SUPERADMIN,
  super_admin: USER_TYPES.SUPERADMIN,
  admin: USER_TYPES.ADMIN,
  editor: USER_TYPES.EDITOR,
});

export function normalizeUserType(value, fallback = USER_TYPES.EDITOR) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return fallback;
  return USER_TYPE_ALIASES[raw] || fallback;
}

export function deriveUserTypeFromRole({ roleKey, rolePriority } = {}) {
  const normalizedRoleKey = normalizeRoleKey(roleKey);
  if (normalizedRoleKey === ROLE_KEYS.SUPER_ADMIN) return USER_TYPES.SUPERADMIN;
  if (normalizedRoleKey === ROLE_KEYS.ADMIN) return USER_TYPES.ADMIN;
  if (normalizedRoleKey === ROLE_KEYS.EDITOR) return USER_TYPES.EDITOR;

  const priority = Number(rolePriority);
  if (Number.isFinite(priority)) {
    if (priority >= 1000) return USER_TYPES.SUPERADMIN;
    if (priority >= 500) return USER_TYPES.ADMIN;
  }

  return USER_TYPES.EDITOR;
}

export function isSuperAdminUserType(userType) {
  return normalizeUserType(userType) === USER_TYPES.SUPERADMIN;
}

export function isAdminUserType(userType) {
  const normalized = normalizeUserType(userType);
  return normalized === USER_TYPES.ADMIN || normalized === USER_TYPES.SUPERADMIN;
}
