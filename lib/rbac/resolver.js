import { connectDB } from "@/lib/db";
import { ensureRbacBootstrap } from "@/lib/rbac/bootstrap";
import { getDefaultPermissionKeysForRole } from "@/lib/rbac/catalog";
import {
  ROLE_KEYS,
  isConfiguredSuperAdminEmail,
  resolveRoleIdentity,
} from "@/lib/rbac/constants";

const CACHE_TTL_MS = 30_000;
const accessCache = new Map();

function buildAccessPayload({ userId, email, role, roleKey, permissionVersion, sessionVersion, permissionKeys }) {
  const identity = resolveRoleIdentity({ role, roleKey });
  return {
    id: userId ? String(userId) : "",
    userId: userId ? String(userId) : "",
    email: String(email || ""),
    role: identity.role,
    roleKey: identity.roleKey,
    permissionVersion: Number(permissionVersion || 1),
    sessionVersion: Number(sessionVersion || 1),
    permissionKeys: Array.from(new Set(permissionKeys || [])).sort(),
    isSuperAdmin: identity.roleKey === ROLE_KEYS.SUPER_ADMIN,
  };
}

function cacheKey({ userId, roleKey, permissionVersion }) {
  return `${String(userId || "anon")}:${String(roleKey || "editor")}:${Number(permissionVersion || 1)}`;
}

export async function resolveAccessFromSession(sessionLike, options = {}) {
  const userId = sessionLike?.id || sessionLike?.userId || sessionLike?.user?.id || "";
  const email = sessionLike?.email || sessionLike?.user?.email || "";
  const role = sessionLike?.role || sessionLike?.user?.role || "";
  const suppliedRoleKey = sessionLike?.roleKey || sessionLike?.user?.roleKey || role;
  const roleKey = isConfiguredSuperAdminEmail(email) ? ROLE_KEYS.SUPER_ADMIN : suppliedRoleKey;
  const identity = resolveRoleIdentity({ role, roleKey });
  const presetKeys = Array.isArray(sessionLike?.permissionKeys)
    ? sessionLike.permissionKeys
    : Array.isArray(sessionLike?.user?.permissionKeys)
      ? sessionLike.user.permissionKeys
      : [];

  if (!userId || options.bypassDb) {
    return buildAccessPayload({
      userId,
      email,
      ...identity,
      permissionVersion: sessionLike?.permissionVersion || sessionLike?.user?.permissionVersion || 1,
      sessionVersion: sessionLike?.sessionVersion || sessionLike?.user?.sessionVersion || 1,
      permissionKeys: presetKeys.length > 0 ? presetKeys : Array.from(getDefaultPermissionKeysForRole(identity.roleKey)),
    });
  }

  await connectDB();
  await ensureRbacBootstrap();
  const [User, AdminRole, RolePermission, Permission] = await Promise.all([
    import("@/models/User").then((module) => module.default || module),
    import("@/models/AdminRole").then((module) => module.default || module),
    import("@/models/RolePermission").then((module) => module.default || module),
    import("@/models/Permission").then((module) => module.default || module),
  ]);

  const user = await User.findById(userId)
    .select("email role roleKey status permissionVersion sessionVersion")
    .lean();
  if (!user || user.status !== "active") {
    return buildAccessPayload({
      userId,
      email,
      ...identity,
      permissionVersion: user?.permissionVersion || 1,
      sessionVersion: user?.sessionVersion || 1,
      permissionKeys: [],
    });
  }

  const dbRoleKey = isConfiguredSuperAdminEmail(user.email)
    ? ROLE_KEYS.SUPER_ADMIN
    : user.roleKey || user.role;
  const dbIdentity = resolveRoleIdentity({ role: user.role, roleKey: dbRoleKey });
  const key = cacheKey({
    userId,
    roleKey: dbIdentity.roleKey,
    permissionVersion: user.permissionVersion,
  });
  const cached = accessCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.payload;

  let permissionKeys = [];
  if (dbIdentity.roleKey === ROLE_KEYS.SUPER_ADMIN) {
    permissionKeys = ["*"];
  } else {
    const [roleDocument, mappings] = await Promise.all([
      AdminRole.findOne({ key: dbIdentity.roleKey, isDeleted: { $ne: true } })
        .select("key isActive")
        .lean(),
      RolePermission.find({ roleKey: dbIdentity.roleKey, isDeleted: { $ne: true } })
        .select("permissionKey")
        .lean(),
    ]);
    const mappedKeys = mappings.map((mapping) => mapping.permissionKey).filter(Boolean);
    if (roleDocument?.isActive === false) {
      permissionKeys = [];
    } else if (mappedKeys.length > 0) {
      const activePermissions = await Permission.find({ key: { $in: mappedKeys }, isActive: true })
        .select("key")
        .lean();
      permissionKeys = activePermissions.map((permission) => permission.key);
    } else if (!roleDocument) {
      permissionKeys = Array.from(getDefaultPermissionKeysForRole(dbIdentity.roleKey));
    }
  }

  const payload = buildAccessPayload({
    userId,
    email: user.email,
    ...dbIdentity,
    permissionVersion: user.permissionVersion,
    sessionVersion: user.sessionVersion,
    permissionKeys,
  });
  accessCache.set(key, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
  return payload;
}

export function invalidateAccessCacheForUser(userId) {
  const id = String(userId || "").trim();
  if (!id) return;
  for (const key of accessCache.keys()) {
    if (key.startsWith(`${id}:`)) accessCache.delete(key);
  }
}
