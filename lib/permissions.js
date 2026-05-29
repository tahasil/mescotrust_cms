import { isAdminRoleKey, normalizeRoleKey, ROLE_KEYS } from "@/lib/rbac/constants";
import { hasPermissionKey } from "@/lib/rbac/permissionUtils";

export function isAdmin(session) {
  return isAdminRoleKey(session?.roleKey || session?.role);
}

export function isEditor(session) {
  return normalizeRoleKey(session?.roleKey || session?.role) === ROLE_KEYS.EDITOR;
}

export function isSuperAdmin(session) {
  return normalizeRoleKey(session?.roleKey || session?.role) === ROLE_KEYS.SUPER_ADMIN;
}

export function hasPermission(session, permissionKey) {
  return hasPermissionKey(session?.permissionKeys || session?.permissions || [], permissionKey);
}
