import {
  getPermissionForAdminPage,
  getRequiredPermissionsForAdminApi,
} from "@/lib/rbac/catalog";
import { hasAnyPermissionKey, hasPermissionKey } from "@/lib/rbac/permissionUtils";
import { resolveAccessFromSession } from "@/lib/rbac/resolver";

function isAllowed(permissionKeys, requiredPermissions) {
  if (!requiredPermissions) return true;
  if (Array.isArray(requiredPermissions)) {
    return hasAnyPermissionKey(permissionKeys, requiredPermissions);
  }
  return hasPermissionKey(permissionKeys, requiredPermissions);
}

export async function authorizeAdminPageAccess({ sessionLike, pathname }) {
  const requiredPermission = getPermissionForAdminPage(pathname);
  if (!requiredPermission) return { allowed: true, requiredPermission: null, access: null };

  let access;
  try {
    access = await resolveAccessFromSession(sessionLike);
  } catch {
    access = await resolveAccessFromSession(sessionLike, { bypassDb: true });
  }
  return {
    allowed: hasPermissionKey(access.permissionKeys, requiredPermission),
    requiredPermission,
    access,
  };
}

export async function authorizeApiAccess({ sessionLike, pathname, method }) {
  const requiredPermission = getRequiredPermissionsForAdminApi(pathname, method);
  if (!requiredPermission) return { allowed: true, requiredPermission: null, access: null };
  const access = await resolveAccessFromSession(sessionLike);
  return {
    allowed: isAllowed(access.permissionKeys, requiredPermission),
    requiredPermission,
    access,
  };
}
