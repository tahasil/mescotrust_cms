import { connectDB } from "@/lib/db";
import { ensureRbacBootstrap } from "@/lib/rbac/bootstrap";
import { ROLE_KEYS, normalizeRoleKey } from "@/lib/rbac/constants";
import { hasPermissionKey } from "@/lib/rbac/permissionUtils";

function fail(message, code = "FORBIDDEN") {
  return { ok: false, code, message };
}

export async function validateRoleAssignment({
  actorAccess,
  targetRoleKey,
  targetRolePriority,
  targetPermissionKeys = [],
  allowEqualPriority = false,
  enforcePermissionOwnership = true,
}) {
  const actorRoleKey = normalizeRoleKey(actorAccess?.roleKey || actorAccess?.role);
  if (actorRoleKey === ROLE_KEYS.SUPER_ADMIN) return { ok: true };

  await connectDB();
  await ensureRbacBootstrap();
  const [AdminRole, Permission] = await Promise.all([
    import("@/models/AdminRole").then((module) => module.default || module),
    import("@/models/Permission").then((module) => module.default || module),
  ]);
  const requestedRoleKey = normalizeRoleKey(targetRoleKey);
  const [actorRole, targetRole] = await Promise.all([
    AdminRole.findOne({ key: actorRoleKey, isActive: true, isDeleted: { $ne: true } })
      .select("key priority")
      .lean(),
    AdminRole.findOne({ key: requestedRoleKey, isDeleted: { $ne: true } })
      .select("key priority")
      .lean(),
  ]);
  if (!actorRole) return fail("Actor role is invalid", "INVALID_ACTOR_ROLE");

  const priority = Number.isFinite(Number(targetRolePriority))
    ? Number(targetRolePriority)
    : Number(targetRole?.priority);
  if (!Number.isFinite(priority)) return fail("Requested role is invalid", "INVALID_ROLE");
  const isTooHigh = allowEqualPriority ? priority > actorRole.priority : priority >= actorRole.priority;
  if (isTooHigh) return fail("Cannot assign a role with equal or higher priority", "ROLE_ESCALATION");

  const requestedPermissions = Array.from(
    new Set(targetPermissionKeys.map((value) => String(value || "").trim().toLowerCase()).filter(Boolean)),
  );
  if (!enforcePermissionOwnership || requestedPermissions.length === 0) return { ok: true };

  const protectedPermissions = await Permission.find({
    key: { $in: requestedPermissions },
    isProtected: true,
    isActive: true,
  })
    .select("key")
    .lean();
  if (protectedPermissions.length > 0) {
    return fail("Protected permissions can only be assigned by Super Admin", "PROTECTED_PERMISSION");
  }

  for (const permissionKey of requestedPermissions) {
    if (!hasPermissionKey(actorAccess?.permissionKeys || [], permissionKey)) {
      return fail("You can assign only permissions that you currently possess", "PERMISSION_ESCALATION");
    }
  }
  return { ok: true };
}

export async function filterAssignableRolesForActor({ actorAccess, roles = [], allowEqualPriority = true }) {
  const actorRoleKey = normalizeRoleKey(actorAccess?.roleKey || actorAccess?.role);
  if (actorRoleKey === ROLE_KEYS.SUPER_ADMIN) return roles.filter((role) => role?.isActive !== false);

  await connectDB();
  await ensureRbacBootstrap();
  const AdminRole = (await import("@/models/AdminRole")).default;
  const actorRole = await AdminRole.findOne({ key: actorRoleKey, isActive: true, isDeleted: { $ne: true } })
    .select("priority")
    .lean();
  if (!actorRole) return [];

  return roles.filter((role) => {
    if (!role || role.isActive === false || role.isDeleted === true) return false;
    const priority = Number(role.priority || 0);
    return allowEqualPriority ? priority <= actorRole.priority : priority < actorRole.priority;
  });
}
