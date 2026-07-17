import { NextResponse } from "next/server";
import { requireAnyPermission, requirePermission } from "@/lib/apiAuth";
import { ensureRbacBootstrap } from "@/lib/rbac/bootstrap";
import { normalizeRoleKey } from "@/lib/rbac/constants";
import { validateRoleAssignment } from "@/lib/rbac/assignmentValidator";
import { invalidateAccessCacheForUser } from "@/lib/rbac/resolver";
import { logPermissionAudit } from "@/lib/rbac/audit";

async function loadModels() {
  const [AdminRole, Permission, RolePermission, User] = await Promise.all([
    import("@/models/AdminRole").then((module) => module.default || module),
    import("@/models/Permission").then((module) => module.default || module),
    import("@/models/RolePermission").then((module) => module.default || module),
    import("@/models/User").then((module) => module.default || module),
  ]);
  return { AdminRole, Permission, RolePermission, User };
}

async function getRole(models, roleKey) {
  const role = await models.AdminRole.findOne({ key: roleKey, isDeleted: { $ne: true } }).lean();
  if (!role) return null;
  const mappings = await models.RolePermission.find({ roleKey, isDeleted: { $ne: true } })
    .select("permissionKey")
    .lean();
  return { ...role, permissionKeys: mappings.map((mapping) => mapping.permissionKey) };
}

function sanitizePayload(body = {}) {
  return {
    name: body.name === undefined ? undefined : String(body.name || "").trim(),
    description: body.description === undefined ? undefined : String(body.description || "").trim(),
    priority: body.priority === undefined ? undefined : Math.min(2000, Math.max(1, Number(body.priority) || 50)),
    isActive: body.isActive === undefined ? undefined : body.isActive !== false,
    permissionKeys: body.permissionKeys === undefined
      ? undefined
      : Array.from(new Set((Array.isArray(body.permissionKeys) ? body.permissionKeys : []).map((value) => String(value || "").trim().toLowerCase()).filter(Boolean))),
  };
}

export async function GET(req, { params }) {
  const session = await requireAnyPermission(req, ["users.user_management", "rbac.role_management"]);
  if (session instanceof NextResponse) return session;
  try {
    await ensureRbacBootstrap();
    const models = await loadModels();
    const role = await getRole(models, normalizeRoleKey(params.key));
    return role
      ? NextResponse.json(role)
      : NextResponse.json({ error: "Role not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to load role" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requirePermission(req, "rbac.role_management");
  if (session instanceof NextResponse) return session;
  try {
    await ensureRbacBootstrap();
    const models = await loadModels();
    const roleKey = normalizeRoleKey(params.key);
    const existing = await getRole(models, roleKey);
    if (!existing) return NextResponse.json({ error: "Role not found" }, { status: 404 });
    if (existing.isSystem && !session.isSuperAdmin) {
      return NextResponse.json({ error: "System roles can only be managed by Super Admin" }, { status: 403 });
    }

    const payload = sanitizePayload(await req.json());
    if (existing.isSystem && payload.isActive === false) {
      return NextResponse.json({ error: "System roles cannot be deactivated" }, { status: 400 });
    }
    const permissionKeys = payload.permissionKeys === undefined ? existing.permissionKeys : payload.permissionKeys;
    const activePermissions = await models.Permission.find({ key: { $in: permissionKeys }, isActive: true })
      .select("key")
      .lean();
    if (activePermissions.length !== permissionKeys.length) {
      return NextResponse.json({ error: "One or more permissions are invalid" }, { status: 400 });
    }
    const priority = payload.priority ?? existing.priority;
    const validation = await validateRoleAssignment({
      actorAccess: session,
      targetRoleKey: roleKey,
      targetRolePriority: priority,
      targetPermissionKeys: permissionKeys,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.message, code: validation.code }, { status: 403 });
    }

    const update = {};
    if (payload.name !== undefined) update.name = payload.name || existing.name;
    if (payload.description !== undefined) update.description = payload.description;
    if (payload.priority !== undefined) update.priority = payload.priority;
    if (payload.isActive !== undefined) update.isActive = payload.isActive;
    if (Object.keys(update).length > 0) {
      await models.AdminRole.updateOne({ key: roleKey }, { $set: update });
    }
    if (payload.permissionKeys !== undefined) {
      await models.RolePermission.updateMany(
        { roleKey, isDeleted: { $ne: true } },
        { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: session.email || session.id } },
      );
      if (permissionKeys.length > 0) {
        await models.RolePermission.bulkWrite(
          permissionKeys.map((permissionKey) => ({
            updateOne: {
              filter: { roleKey, permissionKey },
              update: {
                $set: { isDeleted: false, deletedAt: null, deletedBy: "" },
                $setOnInsert: { roleKey, permissionKey },
              },
              upsert: true,
            },
          })),
          { ordered: false },
        );
      }
    }

    const users = await models.User.find({ roleKey }).select("_id").lean();
    if (users.length > 0) {
      await models.User.updateMany(
        { roleKey },
        { $set: { role: update.name || existing.name }, $inc: { permissionVersion: 1, sessionVersion: 1 } },
      );
      users.forEach((user) => invalidateAccessCacheForUser(user._id));
    }
    const updated = await getRole(models, roleKey);
    await logPermissionAudit({ req, actorAccess: session, targetType: "role", targetId: roleKey, action: "update_role", before: existing, after: updated });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requirePermission(req, "rbac.role_management");
  if (session instanceof NextResponse) return session;
  try {
    await ensureRbacBootstrap();
    const models = await loadModels();
    const roleKey = normalizeRoleKey(params.key);
    const existing = await getRole(models, roleKey);
    if (!existing) return NextResponse.json({ error: "Role not found" }, { status: 404 });
    if (existing.isSystem) {
      return NextResponse.json({ error: "System roles cannot be deleted" }, { status: 400 });
    }
    const validation = await validateRoleAssignment({
      actorAccess: session,
      targetRoleKey: roleKey,
      targetRolePriority: existing.priority,
      targetPermissionKeys: existing.permissionKeys,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.message, code: validation.code }, { status: 403 });
    }
    const assignedUsers = await models.User.countDocuments({ roleKey });
    if (assignedUsers > 0) {
      return NextResponse.json(
        { error: `Role is assigned to ${assignedUsers} user${assignedUsers === 1 ? "" : "s"}. Reassign them before deleting it.` },
        { status: 409 },
      );
    }
    await models.AdminRole.updateOne(
      { key: roleKey },
      { $set: { isDeleted: true, isActive: false, deletedAt: new Date(), deletedBy: session.email || session.id } },
    );
    await logPermissionAudit({ req, actorAccess: session, targetType: "role", targetId: roleKey, action: "delete_role", before: existing });
    return NextResponse.json({ deleted: true, key: roleKey });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to delete role" }, { status: 500 });
  }
}
