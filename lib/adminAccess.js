import { getPermissionForAdminApi, getPermissionForAdminPage, getDefaultPermissionKeysForRole } from "@/lib/rbac/catalog";
import { roleLabelFromKey, normalizeRoleKey } from "@/lib/rbac/constants";
import { hasPermissionKey } from "@/lib/rbac/permissionUtils";

export function getAdminPageRestriction(pathname) {
  const requiredPermission = getPermissionForAdminPage(pathname);
  if (!requiredPermission) return null;
  return {
    requiredPermission,
    requiredRole: roleLabelFromKey("admin"),
  };
}

export function getAdminApiRestriction(pathname, method = "GET") {
  const requiredPermission = getPermissionForAdminApi(pathname, method);
  if (!requiredPermission) return null;
  return {
    requiredPermission,
    requiredRole: roleLabelFromKey("admin"),
  };
}

export function isRoleAllowedForRestriction(roleOrSession, restriction) {
  if (!restriction?.requiredPermission) return true;

  const permissionKeys = Array.isArray(roleOrSession?.permissionKeys)
    ? roleOrSession.permissionKeys
    : null;
  if (permissionKeys) {
    return hasPermissionKey(permissionKeys, restriction.requiredPermission);
  }

  const roleKey = normalizeRoleKey(
    typeof roleOrSession === "string"
      ? roleOrSession
      : roleOrSession?.roleKey || roleOrSession?.role,
  );
  const defaults = getDefaultPermissionKeysForRole(roleKey);
  return hasPermissionKey(defaults, restriction.requiredPermission);
}

export function normalizeRoleLabel(role) {
  return roleLabelFromKey(role);
}
