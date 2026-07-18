export function toPermissionSet(permissionKeys) {
  if (permissionKeys instanceof Set) return permissionKeys;
  if (Array.isArray(permissionKeys)) return new Set(permissionKeys.filter(Boolean));
  if (!permissionKeys) return new Set();
  return new Set([String(permissionKeys)]);
}

const ACTIONS_REQUIRING_VIEW = new Set([
  "create",
  "edit",
  "delete",
  "manage",
  "publish",
  "settings_access",
]);

export function hasPermissionKey(permissionKeys, permissionKey) {
  const required = String(permissionKey || "").trim();
  if (!required) return true;

  const set = toPermissionSet(permissionKeys);
  if (set.has("*") || set.has(required)) return true;

  const [moduleKey, actionKey] = required.split(".");
  if (!moduleKey || !actionKey) return false;
  if (set.has(`${moduleKey}.*`)) return true;

  if (ACTIONS_REQUIRING_VIEW.has(actionKey) && !set.has(`${moduleKey}.view`)) {
    return false;
  }

  return false;
}

export function hasAnyPermissionKey(permissionKeys, requiredPermissions = []) {
  const list = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  return list.some((permissionKey) => hasPermissionKey(permissionKeys, permissionKey));
}
