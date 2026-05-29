import { getPermissionForAdminApi, getPermissionForAdminPage } from "@/lib/rbac/catalog";
import { hasPermissionKey } from "@/lib/rbac/permissionUtils";
import { resolveAccessFromSession } from "@/lib/rbac/resolver";

export function getRequiredPermissionForPath(pathname, method = "GET") {
  const path = String(pathname || "");
  if (path.startsWith("/api/")) {
    return getPermissionForAdminApi(path, method);
  }
  return getPermissionForAdminPage(path);
}

export async function authorizeAdminPageAccess({ sessionLike, pathname }) {
  const requiredPermission = getPermissionForAdminPage(pathname);
  if (!requiredPermission) {
    return { allowed: true, requiredPermission: null, access: null };
  }
  const access = await resolveAccessFromSession(sessionLike);
  const allowed = hasPermissionKey(access.permissionKeys, requiredPermission);
  return { allowed, requiredPermission, access };
}

export async function authorizeApiAccess({ sessionLike, pathname, method }) {
  const requiredPermission = getPermissionForAdminApi(pathname, method);
  if (!requiredPermission) {
    return { allowed: true, requiredPermission: null, access: null };
  }
  const access = await resolveAccessFromSession(sessionLike);
  const allowed = hasPermissionKey(access.permissionKeys, requiredPermission);
  return { allowed, requiredPermission, access };
}
