import { connectDB } from "@/lib/db";
import { ensureRbacBootstrap } from "@/lib/rbac/bootstrap";
import { getDefaultPermissionKeysForRole } from "@/lib/rbac/catalog";
import { ROLE_KEYS, resolveRoleIdentity } from "@/lib/rbac/constants";

const CACHE_TTL_MS = 60_000;
const accessCache = new Map();

function toCacheKey(input = {}) {
  const { userId, roleKey, permissionVersion } = input || {};
  return `${String(userId || "anon")}:${String(roleKey || "editor")}:${String(permissionVersion || 1)}`;
}

function pruneCache() {
  const now = Date.now();
  for (const [key, value] of accessCache.entries()) {
    if (!value || value.expiresAt <= now) {
      accessCache.delete(key);
    }
  }
}

function buildAccessPayload(input = {}) {
  const { userId, role, roleKey, permissionVersion, permissionKeys } = input || {};
  const normalized = resolveRoleIdentity({ role, roleKey });
  return {
    userId: userId ? String(userId) : "",
    role: normalized.role,
    roleKey: normalized.roleKey,
    permissionVersion: Number(permissionVersion || 1),
    permissionKeys: Array.from(new Set(permissionKeys || [])).sort(),
    isSuperAdmin: normalized.roleKey === ROLE_KEYS.SUPER_ADMIN,
  };
}

export async function resolveAccessFromSession(sessionLike, options = {}) {
  const { bypassDb = false } = options;
  const userId = sessionLike?.id || sessionLike?.userId || sessionLike?._id || "";
  const role = sessionLike?.role || sessionLike?.user?.role || "";
  const roleKey = sessionLike?.roleKey || sessionLike?.user?.roleKey || role;
  const permissionVersion = Number(
    sessionLike?.permissionVersion || sessionLike?.user?.permissionVersion || 1,
  );
  const presetPermissionKeys = Array.isArray(sessionLike?.permissionKeys)
    ? sessionLike.permissionKeys
    : Array.isArray(sessionLike?.permissions)
      ? sessionLike.permissions
      : [];

  const normalizedRole = resolveRoleIdentity({ role, roleKey });
  if (!userId || bypassDb) {
    const fallbackKeys =
      presetPermissionKeys.length > 0
        ? presetPermissionKeys
        : Array.from(getDefaultPermissionKeysForRole(normalizedRole.roleKey));
    return buildAccessPayload({
      userId,
      role: normalizedRole.role,
      roleKey: normalizedRole.roleKey,
      permissionVersion,
      permissionKeys: fallbackKeys,
    });
  }

  await connectDB();
  await ensureRbacBootstrap();

  const [User, AdminRole, RolePermission, Permission] = await Promise.all([
    import("@/models/User").then((mod) => mod.default || mod),
    import("@/models/AdminRole").then((mod) => mod.default || mod),
    import("@/models/RolePermission").then((mod) => mod.default || mod),
    import("@/models/Permission").then((mod) => mod.default || mod),
  ]);

  const user = await User.findById(userId).select("role roleKey permissionVersion status").lean();
  const mergedRole = resolveRoleIdentity({
    role: user?.role || normalizedRole.role,
    roleKey: user?.roleKey || normalizedRole.roleKey,
  });
  const mergedPermissionVersion = Number(user?.permissionVersion || permissionVersion || 1);
  pruneCache();
  const cacheKey = toCacheKey({
    userId,
    roleKey: mergedRole.roleKey,
    permissionVersion: mergedPermissionVersion,
  });
  const cached = accessCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  if (mergedRole.roleKey === ROLE_KEYS.SUPER_ADMIN) {
    const superPayload = buildAccessPayload({
      userId,
      role: mergedRole.role,
      roleKey: mergedRole.roleKey,
      permissionVersion: mergedPermissionVersion,
      permissionKeys: ["*"],
    });
    accessCache.set(cacheKey, { payload: superPayload, expiresAt: Date.now() + CACHE_TTL_MS });
    return superPayload;
  }

  if (!user || user.status !== "active") {
    const inactivePayload = buildAccessPayload({
      userId,
      role: mergedRole.role,
      roleKey: mergedRole.roleKey,
      permissionVersion: mergedPermissionVersion,
      permissionKeys: [],
    });
    accessCache.set(cacheKey, { payload: inactivePayload, expiresAt: Date.now() + CACHE_TTL_MS });
    return inactivePayload;
  }

  const [roleDoc, mappings] = await Promise.all([
    AdminRole.findOne({ key: mergedRole.roleKey }).select("key isActive").lean(),
    RolePermission.find({ roleKey: mergedRole.roleKey, isDeleted: { $ne: true } })
      .select("permissionKey")
      .lean(),
  ]);
  let permissionKeys = mappings.map((item) => item.permissionKey).filter(Boolean);

  if (permissionKeys.length > 0) {
    const activePermissions = await Permission.find({
      key: { $in: permissionKeys },
      isActive: true,
    })
      .select("key")
      .lean();
    permissionKeys = activePermissions.map((item) => item.key);
  } else if (!roleDoc) {
    // Legacy fallback when role metadata does not exist yet.
    permissionKeys = Array.from(getDefaultPermissionKeysForRole(mergedRole.roleKey));
  } else {
    // Role exists but has no mappings: treat as explicit "no permissions".
    permissionKeys = [];
  }

  const payload = buildAccessPayload({
    userId,
    role: mergedRole.role,
    roleKey: mergedRole.roleKey,
    permissionVersion: mergedPermissionVersion,
    permissionKeys,
  });

  accessCache.set(cacheKey, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
  return payload;
}

export function invalidateAccessCacheForUser(userId) {
  const id = String(userId || "").trim();
  if (!id) return;
  for (const key of accessCache.keys()) {
    if (key.startsWith(`${id}:`)) {
      accessCache.delete(key);
    }
  }
}
