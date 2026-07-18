import { NextResponse } from "next/server";
import { requireAnyPermission, requirePermission } from "@/lib/apiAuth";
import { ensureRbacBootstrap } from "@/lib/rbac/bootstrap";
import { normalizeRoleKey, roleLabelFromKey } from "@/lib/rbac/constants";
import { filterAssignableRolesForActor, validateRoleAssignment } from "@/lib/rbac/assignmentValidator";
import { hasPermissionKey } from "@/lib/rbac/permissionUtils";
import { logPermissionAudit } from "@/lib/rbac/audit";

function normalizePayload(body = {}) {
  const key = normalizeRoleKey(body.key || body.name);
  return {
    key,
    name: String(body.name || roleLabelFromKey(key)).trim(),
    description: String(body.description || "").trim(),
    priority: Math.min(999, Math.max(1, Number(body.priority) || 50)),
    isActive: body.isActive !== false,
    permissionKeys: Array.from(
      new Set(
        (Array.isArray(body.permissionKeys) ? body.permissionKeys : [])
          .map((value) => String(value || "").trim().toLowerCase())
          .filter(Boolean),
      ),
    ),
  };
}

async function hydrateRoles(AdminRole, RolePermission) {
  const roles = await AdminRole.find({ isDeleted: { $ne: true } })
    .sort({ priority: -1, createdAt: 1 })
    .lean();
  const mappings = await RolePermission.find({
    roleKey: { $in: roles.map((role) => role.key) },
    isDeleted: { $ne: true },
  })
    .select("roleKey permissionKey")
    .lean();
  const grouped = new Map();
  for (const mapping of mappings) {
    if (!grouped.has(mapping.roleKey)) grouped.set(mapping.roleKey, []);
    grouped.get(mapping.roleKey).push(mapping.permissionKey);
  }
  return roles.map((role) => ({ ...role, permissionKeys: grouped.get(role.key) || [] }));
}

export async function GET(req) {
  const session = await requireAnyPermission(req, ["users.user_management", "rbac.role_management"]);
  if (session instanceof NextResponse) return session;

  try {
    await ensureRbacBootstrap();
    const [AdminRole, RolePermission] = await Promise.all([
      import("@/models/AdminRole").then((module) => module.default || module),
      import("@/models/RolePermission").then((module) => module.default || module),
    ]);
    const roles = await hydrateRoles(AdminRole, RolePermission);
    const url = new URL(req.url);
    const canManageRoles = hasPermissionKey(session.permissionKeys, "rbac.role_management");
    const actorRole = roles.find((role) => role.key === session.roleKey);
    const actorPriority = Number(actorRole?.priority || 0);
    const visibleRoles = url.searchParams.get("scope") === "assignable" || !canManageRoles
      ? await filterAssignableRolesForActor({ actorAccess: session, roles })
      : roles;
    return NextResponse.json(
      visibleRoles.map((role) => ({
        ...role,
        canEdit:
          session.isSuperAdmin === true ||
          (!role.isSystem && Number(role.priority || 0) < actorPriority),
        canDelete:
          !role.isSystem &&
          (session.isSuperAdmin === true || Number(role.priority || 0) < actorPriority),
      })),
    );
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to load roles" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requirePermission(req, "rbac.role_management");
  if (session instanceof NextResponse) return session;

  try {
    await ensureRbacBootstrap();
    const [AdminRole, Permission, RolePermission] = await Promise.all([
      import("@/models/AdminRole").then((module) => module.default || module),
      import("@/models/Permission").then((module) => module.default || module),
      import("@/models/RolePermission").then((module) => module.default || module),
    ]);
    const payload = normalizePayload(await req.json());
    if (!payload.key || !payload.name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }
    if (await AdminRole.exists({ key: payload.key })) {
      return NextResponse.json({ error: "Role key already exists" }, { status: 400 });
    }

    const activePermissions = await Permission.find({
      key: { $in: payload.permissionKeys },
      isActive: true,
    })
      .select("key")
      .lean();
    if (activePermissions.length !== payload.permissionKeys.length) {
      return NextResponse.json({ error: "One or more permissions are invalid" }, { status: 400 });
    }
    const validation = await validateRoleAssignment({
      actorAccess: session,
      targetRoleKey: payload.key,
      targetRolePriority: payload.priority,
      targetPermissionKeys: payload.permissionKeys,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.message, code: validation.code }, { status: 403 });
    }

    const role = await AdminRole.create({ ...payload, permissionKeys: undefined, isSystem: false });
    if (payload.permissionKeys.length > 0) {
      await RolePermission.bulkWrite(
        payload.permissionKeys.map((permissionKey) => ({
          updateOne: {
            filter: { roleKey: payload.key, permissionKey },
            update: {
              $set: { isDeleted: false, deletedAt: null, deletedBy: "" },
              $setOnInsert: { roleKey: payload.key, permissionKey },
            },
            upsert: true,
          },
        })),
        { ordered: false },
      );
    }
    await logPermissionAudit({
      req,
      actorAccess: session,
      targetType: "role",
      targetId: payload.key,
      action: "create_role",
      after: payload,
    });
    return NextResponse.json({ ...role.toObject(), permissionKeys: payload.permissionKeys }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to create role" }, { status: 500 });
  }
}
