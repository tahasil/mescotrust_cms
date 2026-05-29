import { NextResponse } from "next/server";
import { requireAnyPermission, requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { normalizeRoleKey } from "@/lib/rbac/constants";
import { validateRoleAssignment } from "@/lib/rbac/assignmentValidator";
import { ensureRbacBootstrap } from "@/lib/rbac/bootstrap";
import { invalidateAccessCacheForUser } from "@/lib/rbac/resolver";
import { logPermissionAudit } from "@/lib/rbac/audit";
import { deriveUserTypeFromRole } from "@/lib/rbac/userType";

const EDITOR_BLOCKED_PERMISSION_KEYS = new Set([
  "components.create",
  "forms.create",
  "sliders.create",
  "popups.create",
]);

function sanitizePayload(body = {}) {
  const rawPermissionKeys = Array.isArray(body.permissionKeys)
    ? body.permissionKeys.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean)
    : undefined;
  return {
    name: body.name === undefined ? undefined : String(body.name || "").trim(),
    description: body.description === undefined ? undefined : String(body.description || "").trim(),
    priority:
      body.priority === undefined || body.priority === null || body.priority === ""
        ? undefined
        : Number(body.priority),
    isActive: body.isActive === undefined ? undefined : body.isActive !== false,
    permissionKeys: rawPermissionKeys,
  };
}

async function loadModels() {
  const [AdminRole, RolePermission, User] = await Promise.all([
    import("@/models/AdminRole").then((mod) => mod.default || mod),
    import("@/models/RolePermission").then((mod) => mod.default || mod),
    import("@/models/User").then((mod) => mod.default || mod),
  ]);
  return { AdminRole, RolePermission, User };
}

async function getRoleByKey({ AdminRole, RolePermission }, roleKey) {
  const role = await AdminRole.findOne({ key: roleKey }).lean();
  if (!role) return null;
  const mappings = await RolePermission.find({ roleKey, isDeleted: { $ne: true } })
    .select("permissionKey")
    .lean();
  return {
    ...role,
    permissionKeys: mappings.map((item) => item.permissionKey),
  };
}

export async function GET(req, { params }) {
  const session = await requireAnyPermission(req, ["users.user_management", "rbac.role_management"]);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    await ensureRbacBootstrap();
    const models = await loadModels();
    const roleKey = normalizeRoleKey(params.key);
    const role = await getRoleByKey(models, roleKey);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to load role" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requirePermission(req, "rbac.role_management");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    await ensureRbacBootstrap();
    const models = await loadModels();
    const { AdminRole, RolePermission, User } = models;
    const roleKey = normalizeRoleKey(params.key);

    const existing = await getRoleByKey(models, roleKey);
    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (existing.isSystem && !session.isSuperAdmin) {
      return NextResponse.json({ error: "System roles can only be managed by Super Admin" }, { status: 403 });
    }

    const payload = sanitizePayload(await req.json());
    const nextPriority =
      Number.isFinite(Number(payload.priority)) && Number(payload.priority) > 0
        ? Number(payload.priority)
        : Number(existing.priority || 100);
    const requestedPermissionKeys =
      payload.permissionKeys === undefined ? existing.permissionKeys : payload.permissionKeys;
    const nextPermissionKeys =
      roleKey === "editor"
        ? requestedPermissionKeys.filter((permissionKey) => !EDITOR_BLOCKED_PERMISSION_KEYS.has(permissionKey))
        : requestedPermissionKeys;

    const validation = await validateRoleAssignment({
      actorAccess: session,
      targetRoleKey: roleKey,
      targetRolePriority: nextPriority,
      targetPermissionKeys: nextPermissionKeys,
      allowEqualPriority: false,
    });
    if (!validation.ok) {
      await logPermissionAudit({
        req,
        actorAccess: session,
        targetType: "role",
        targetId: roleKey,
        action: "update_role",
        before: existing,
        after: { ...existing, ...payload, priority: nextPriority, permissionKeys: nextPermissionKeys },
        status: "rejected",
        reason: validation.message,
      });
      return NextResponse.json({ error: validation.message, code: validation.code }, { status: 403 });
    }

    if (existing.isSystem && payload.isActive === false) {
      return NextResponse.json({ error: "System roles cannot be deactivated" }, { status: 400 });
    }

    const updateDoc = {};
    if (payload.name !== undefined) updateDoc.name = payload.name || existing.name;
    if (payload.description !== undefined) updateDoc.description = payload.description;
    if (payload.priority !== undefined) updateDoc.priority = nextPriority;
    if (payload.isActive !== undefined) updateDoc.isActive = payload.isActive;

    if (Object.keys(updateDoc).length > 0) {
      await AdminRole.updateOne({ key: roleKey }, { $set: updateDoc });
    }

    if (payload.permissionKeys !== undefined) {
      await RolePermission.updateMany(
        { roleKey, isDeleted: { $ne: true } },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: session.email || session.id || "",
          },
        },
      );
      if (nextPermissionKeys.length > 0) {
        await RolePermission.bulkWrite(
          nextPermissionKeys.map((permissionKey) => ({
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

    const users = await User.find({ roleKey }).select("_id permissionVersion").lean();
    if (users.length > 0) {
      const nextUserType = deriveUserTypeFromRole({
        roleKey,
        rolePriority: Number(nextPriority || existing?.priority || 100),
      });
      await User.updateMany(
        { roleKey },
        { $set: { userType: nextUserType }, $inc: { permissionVersion: 1, sessionVersion: 1 } },
      );
      for (const user of users) {
        invalidateAccessCacheForUser(user._id);
      }
    }

    const updated = await getRoleByKey(models, roleKey);
    await logPermissionAudit({
      req,
      actorAccess: session,
      targetType: "role",
      targetId: roleKey,
      action: "update_role",
      before: existing,
      after: updated,
      status: "success",
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requirePermission(req, "rbac.role_management");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    await ensureRbacBootstrap();
    const models = await loadModels();
    const { AdminRole, User } = models;
    const roleKey = normalizeRoleKey(params.key);
    const existing = await getRoleByKey(models, roleKey);
    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (existing.isSystem) {
      return NextResponse.json({ error: "System roles cannot be deleted" }, { status: 400 });
    }

    const validation = await validateRoleAssignment({
      actorAccess: session,
      targetRoleKey: roleKey,
      targetRolePriority: Number(existing.priority || 100),
      targetPermissionKeys: existing.permissionKeys || [],
      allowEqualPriority: false,
    });
    if (!validation.ok) {
      await logPermissionAudit({
        req,
        actorAccess: session,
        targetType: "role",
        targetId: roleKey,
        action: "delete_role",
        before: existing,
        status: "rejected",
        reason: validation.message,
      });
      return NextResponse.json({ error: validation.message, code: validation.code }, { status: 403 });
    }

    const softDeletedRole = await AdminRole.findOneAndUpdate(
      { key: roleKey, isDeleted: { $ne: true } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: session.email || session.id || "",
          isActive: false,
        },
      },
      { new: true, withDeleted: true },
    );
    if (!softDeletedRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const assignedUsers = await User.find({ roleKey }).select("_id permissionVersion").lean();
    if (assignedUsers.length > 0) {
      await User.updateMany(
        { roleKey },
        {
          $set: { status: "inactive" },
          $inc: { permissionVersion: 1, sessionVersion: 1 },
        },
      );
      for (const user of assignedUsers) {
        invalidateAccessCacheForUser(user._id);
      }
    }

    await logPermissionAudit({
      req,
      actorAccess: session,
      targetType: "role",
      targetId: roleKey,
      action: "delete_role",
      before: existing,
      status: "success",
    });

    return NextResponse.json({
      deleted: true,
      softDeleted: true,
      key: roleKey,
      inactivatedUsers: assignedUsers.length,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to delete role" }, { status: 500 });
  }
}
