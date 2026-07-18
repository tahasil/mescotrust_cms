import { getPermissionForMenuKey } from "@/lib/rbac/catalog";
import { isAdminRoleKey, isSuperAdminRoleKey, normalizeRoleKey } from "@/lib/rbac/constants";
import { hasPermissionKey } from "@/lib/rbac/permissionUtils";

export function hasPermission(authContext, permissionKey) {
  return hasPermissionKey(authContext?.permissionKeys || [], permissionKey);
}

export function canAccessMenu(authContext, menuKey) {
  const requiredPermission = getPermissionForMenuKey(menuKey);
  return !requiredPermission || hasPermission(authContext, requiredPermission);
}

export function hasRole(authContext, roleKey) {
  return normalizeRoleKey(authContext?.roleKey || authContext?.role) === normalizeRoleKey(roleKey);
}

export function isSuperAdmin(authContext) {
  return isSuperAdminRoleKey(authContext?.roleKey || authContext?.role);
}

export function isAdmin(authContext) {
  return isAdminRoleKey(authContext?.roleKey || authContext?.role);
}
