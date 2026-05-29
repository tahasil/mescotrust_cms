import { connectDB } from "@/lib/db";
import { ensureRbacBootstrap } from "@/lib/rbac/bootstrap";
import { ROLE_KEYS, normalizeRoleKey } from "@/lib/rbac/constants";
import { hasPermissionKey } from "@/lib/rbac/permissionUtils";

function fail(message, code = "FORBIDDEN") {
  return { ok: false, code, message };
}

function pass() {
  return { ok: true };
}

async function getActorRole(actorRoleKey) {
  await connectDB();
  await ensureRbacBootstrap();
  const AdminRole = (await import("@/models/AdminRole")).default;
  const actorRole = await AdminRole.findOne({ key: actorRoleKey, isActive: true })
    .select("key priority")
    .lean();
  return actorRole;
}

export async function validateRoleAssignment({
  actorAccess,
  targetRoleKey,
  targetRolePriority,
  targetPermissionKeys = [],
  allowEqualPriority = false,
}) {
  const actorRoleKey = normalizeRoleKey(actorAccess?.roleKey || actorAccess?.role);
  const requestedRoleKey = normalizeRoleKey(targetRoleKey);
  const isOwnRoleAssignment = requestedRoleKey === actorRoleKey;
  if (actorRoleKey === ROLE_KEYS.SUPER_ADMIN) {
    return pass();
  }

  await connectDB();
  await ensureRbacBootstrap();
  const [AdminRole, Permission] = await Promise.all([
    import("@/models/AdminRole").then((mod) => mod.default || mod),
    import("@/models/Permission").then((mod) => mod.default || mod),
  ]);

  const [actorRole, requestedRole] = await Promise.all([
    AdminRole.findOne({ key: actorRoleKey, isActive: true }).select("key priority").lean(),
    AdminRole.findOne({ key: requestedRoleKey, isActive: true }).select("key priority").lean(),
  ]);

  if (!actorRole) {
    return fail("Actor role is invalid", "INVALID_ACTOR_ROLE");
  }

  const requestedPriority = Number.isFinite(Number(targetRolePriority))
    ? Number(targetRolePriority)
    : requestedRole
      ? requestedRole.priority
      : null;

  if (requestedPriority === null) {
    return fail("Requested role is invalid", "INVALID_ROLE");
  }

  const denyEqualOrHigher = allowEqualPriority ? requestedPriority > actorRole.priority : requestedPriority >= actorRole.priority;
  if (denyEqualOrHigher) {
    return fail("Cannot assign a role with equal or higher privilege", "ROLE_ESCALATION");
  }

  const uniqueRequestedPermissions = Array.from(
    new Set(targetPermissionKeys.map((value) => String(value || "").trim().toLowerCase()).filter(Boolean)),
  );
  if (uniqueRequestedPermissions.length === 0) {
    return pass();
  }

  if (!(allowEqualPriority && isOwnRoleAssignment)) {
    const protectedPermissions = await Permission.find({
      key: { $in: uniqueRequestedPermissions },
      isProtected: true,
    })
      .select("key")
      .lean();
    if (protectedPermissions.length > 0) {
      return fail("Protected permissions can only be assigned by Super Admin", "PROTECTED_PERMISSION");
    }
  }

  const actorPermissionKeys = actorAccess?.permissionKeys || [];
  for (const permissionKey of uniqueRequestedPermissions) {
    if (!hasPermissionKey(actorPermissionKeys, permissionKey)) {
      return fail("You can assign only permissions that you currently possess", "PERMISSION_ESCALATION");
    }
  }

  return pass();
}

export async function filterAssignableRolesForActor({
  actorAccess,
  roles = [],
  allowEqualPriority = false,
}) {
  const actorRoleKey = normalizeRoleKey(actorAccess?.roleKey || actorAccess?.role);
  if (actorRoleKey === ROLE_KEYS.SUPER_ADMIN) {
    return roles;
  }

  const actorRole = await getActorRole(actorRoleKey);
  if (!actorRole) return [];

  await connectDB();
  await ensureRbacBootstrap();
  const Permission = (await import("@/models/Permission")).default;
  const protectedPermissions = await Permission.find({ isProtected: true, isActive: true })
    .select("key")
    .lean();
  const protectedSet = new Set(protectedPermissions.map((item) => item.key));
  const actorPermissionKeys = actorAccess?.permissionKeys || [];

  const filtered = [];
  for (const role of roles) {
    if (!role || role.isActive === false) continue;
    const rolePriority = Number(role.priority || 0);
    const denyEqualOrHigher = allowEqualPriority ? rolePriority > actorRole.priority : rolePriority >= actorRole.priority;
    if (denyEqualOrHigher) continue;

    const rolePermissionKeys = Array.isArray(role.permissionKeys) ? role.permissionKeys : [];
    const isOwnRole = normalizeRoleKey(role.key) === actorRoleKey;
    if (rolePermissionKeys.some((permissionKey) => protectedSet.has(permissionKey)) && !(allowEqualPriority && isOwnRole)) {
      continue;
    }

    let allowed = true;
    for (const permissionKey of rolePermissionKeys) {
      if (!hasPermissionKey(actorPermissionKeys, permissionKey)) {
        allowed = false;
        break;
      }
    }
    if (!allowed) continue;
    filtered.push(role);
  }

  return filtered;
}
