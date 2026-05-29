export function toPermissionSet(permissionKeys) {
  if (permissionKeys instanceof Set) return permissionKeys;
  if (Array.isArray(permissionKeys)) return new Set(permissionKeys.filter(Boolean));
  if (!permissionKeys) return new Set();
  return new Set([String(permissionKeys)]);
}

const MANAGE_IMPLIED_ACTIONS = new Set([]);
const ACTIONS_REQUIRING_VIEW_ACCESS = new Set([
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
  if (set.has("*")) return true;
  const [modulePart, actionPart] = required.split(".");
  if (modulePart && set.has(`${modulePart}.*`)) return true;
  if (modulePart && actionPart && ACTIONS_REQUIRING_VIEW_ACCESS.has(actionPart)) {
    const hasModuleViewAccess =
      set.has(`${modulePart}.view`) || set.has(`${modulePart}.*`);
    if (!hasModuleViewAccess) {
      return false;
    }
  }
  if (set.has(required)) return true;
  if (
    modulePart &&
    actionPart &&
    MANAGE_IMPLIED_ACTIONS.has(actionPart) &&
    set.has(`${modulePart}.manage`)
  ) {
    return true;
  }

  return false;
}
