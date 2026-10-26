import {
  ROLE_KEYS,
  isAdminRoleKey,
  isConfiguredSuperAdminEmail,
  normalizeRoleKey,
  roleLabelFromKey,
} from "./rbac/constants.js";

function readValue(input, key) {
  if (!input || typeof input !== "object") return "";
  if (typeof input[key] === "string") return input[key];
  if (typeof input.user?.[key] === "string") return input.user[key];
  return "";
}

function readRoleKey(input) {
  if (typeof input === "string") return normalizeRoleKey(input);
  return normalizeRoleKey(readValue(input, "roleKey") || readValue(input, "role"));
}

function hasResolvedPermissionContext(input) {
  return Boolean(
    input &&
      typeof input === "object" &&
      (Array.isArray(input.permissionKeys) || Array.isArray(input.user?.permissionKeys)),
  );
}

function isCustomRole(input) {
  const key = readRoleKey(input);
  return !Object.values(ROLE_KEYS).includes(key);
}

export function isSuperAdminEmail(email) {
  return isConfiguredSuperAdminEmail(email);
}

export function isSuperAdmin(input) {
  return (
    isSuperAdminEmail(readValue(input, "email")) ||
    readRoleKey(input) === ROLE_KEYS.SUPER_ADMIN
  );
}

export function normalizeRole(input) {
  if (isSuperAdmin(input)) return "Admin";
  const rawRole = typeof input === "string" ? input : readValue(input, "role");
  if (!rawRole) return "";
  return roleLabelFromKey(readRoleKey(input));
}

export function isAdmin(input) {
  if (isSuperAdmin(input) || isAdminRoleKey(readRoleKey(input))) return true;
  // Legacy route-level guards run after the central permission check. A custom
  // role that reached them already owns the operation-specific permission.
  return isCustomRole(input) && hasResolvedPermissionContext(input);
}

export function isEditor(input) {
  return readRoleKey(input) === ROLE_KEYS.EDITOR || (isCustomRole(input) && hasResolvedPermissionContext(input));
}

export function isAuthor(input) {
  return readRoleKey(input) === ROLE_KEYS.AUTHOR;
}
