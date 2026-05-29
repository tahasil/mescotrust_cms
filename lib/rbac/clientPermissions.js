import { hasPermissionKey } from "@/lib/rbac/permissionUtils";
import { isAdminRoleKey, isSuperAdminRoleKey, normalizeRoleKey } from "@/lib/rbac/constants";
import { getPermissionForMenuKey } from "@/lib/rbac/catalog";

export function hasRole(authContext, roleKey) {
  const current = normalizeRoleKey(authContext?.roleKey || authContext?.role);
  const expected = normalizeRoleKey(roleKey);
  return current === expected;
}

export function hasPermission(authContext, permissionKey) {
  return hasPermissionKey(authContext?.permissionKeys || authContext?.permissions || [], permissionKey);
}

export function canAccessMenu(authContext, menuKey) {
  const permissionKey = getPermissionForMenuKey(menuKey);
  if (!permissionKey) return true;
  return hasPermission(authContext, permissionKey);
}

export function canCreate(authContext, moduleKey) {
  return hasPermission(authContext, `${moduleKey}.create`);
}

export function canEdit(authContext, moduleKey) {
  return hasPermission(authContext, `${moduleKey}.edit`);
}

export function canDelete(authContext, moduleKey) {
  return hasPermission(authContext, `${moduleKey}.delete`);
}

export function isSuperAdmin(authContext) {
  return isSuperAdminRoleKey(authContext?.roleKey || authContext?.role);
}

export function isAdmin(authContext) {
  return isAdminRoleKey(authContext?.roleKey || authContext?.role);
}
