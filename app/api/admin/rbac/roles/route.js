import { NextResponse } from "next/server";
import { requireAnyPermission, requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { normalizeRoleKey, roleLabelFromKey } from "@/lib/rbac/constants";
import { filterAssignableRolesForActor, validateRoleAssignment } from "@/lib/rbac/assignmentValidator";
import { ensureRbacBootstrap } from "@/lib/rbac/bootstrap";
import { hasPermissionKey } from "@/lib/rbac/permissionUtils";
import { deriveUserTypeFromRole } from "@/lib/rbac/userType";

const EDITOR_BLOCKED_PERMISSION_KEYS = new Set([
  "components.create",
  "forms.create",
  "sliders.create",
  "popups.create",
]);

function normalizeRolePayload(body = {}) {
  const key = normalizeRoleKey(body.key || body.name);
  const rawPermissionKeys = Array.isArray(body.permissionKeys)
    ? body.permissionKeys.map((value) => String(value || "").trim().toLowerCase()).filter(Boolean)
    : [];
  const permissionKeys =
    key === "editor"
      ? rawPermissionKeys.filter((permissionKey) => !EDITOR_BLOCKED_PERMISSION_KEYS.has(permissionKey))
      : rawPermissionKeys;
  return {
    key,
    name: String(body.name || roleLabelFromKey(key)).trim(),
    description: String(body.description || "").trim(),
    priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : 100,
    isActive: body.isActive !== false,
    permissionKeys,
  };
}

export async function GET(req) {
  const session = await requireAnyPermission(req, ["users.user_management", "rbac.role_management"]);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    await ensureRbacBootstrap();
    const [AdminRole, RolePermission] = await Promise.all([
      import("@/models/AdminRole").then((mod) => mod.default || mod),
      import("@/models/RolePermission").then((mod) => mod.default || mod),
    ]);

    const roles = await AdminRole.find().sort({ priority: -1, createdAt: 1 }).lean();
    const roleKeys = roles.map((role) => role.key);
    const mappings = await RolePermission.find({
      roleKey: { $in: roleKeys },
      isDeleted: { $ne: true },
    })
      .select("roleKey permissionKey")
      .lean();
    const groupedPermissions = new Map();
    for (const mapping of mappings) {
      if (!groupedPermissions.has(mapping.roleKey)) groupedPermissions.set(mapping.roleKey, []);
      groupedPermissions.get(mapping.roleKey).push(mapping.permissionKey);
    }

    const hydratedRoles = roles.map((role) => ({
      ...role,
      permissionKeys: groupedPermissions.get(role.key) || [],
    }));

    const url = new URL(req.url);
    const scope = String(url.searchParams.get("scope") || "").trim().toLowerCase();
    const canManageRoles = hasPermissionKey(session.permissionKeys || [], "rbac.role_management");

    if (scope === "assignable" || !canManageRoles) {
      const assignable = await filterAssignableRolesForActor({
        actorAccess: session,
        roles: hydratedRoles,
        allowEqualPriority: true,
      });
      return NextResponse.json(assignable);
    }

    return NextResponse.json(hydratedRoles);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to load roles" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requirePermission(req, "rbac.role_management");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    await ensureRbacBootstrap();
    const [AdminRole, RolePermission, User] = await Promise.all([
      import("@/models/AdminRole").then((mod) => mod.default || mod),
      import("@/models/RolePermission").then((mod) => mod.default || mod),
      import("@/models/User").then((mod) => mod.default || mod),
    ]);

    const payload = normalizeRolePayload(await req.json());
    if (!payload.key || !payload.name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const validation = await validateRoleAssignment({
      actorAccess: session,
      targetRoleKey: payload.key,
      targetRolePriority: payload.priority,
      targetPermissionKeys: payload.permissionKeys,
      allowEqualPriority: false,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.message, code: validation.code }, { status: 403 });
    }

    const existing = await AdminRole.findOne({ key: payload.key }).lean();
    if (existing) {
      return NextResponse.json({ error: "Role key already exists" }, { status: 400 });
    }

    const role = await AdminRole.create({
      key: payload.key,
      name: payload.name,
      description: payload.description,
      priority: payload.priority,
      isSystem: false,
      isActive: payload.isActive,
    });

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

    const nextUserType = deriveUserTypeFromRole({
      roleKey: payload.key,
      rolePriority: Number(payload.priority || 100),
    });
    await User.updateMany(
      { roleKey: payload.key },
      { $set: { userType: nextUserType }, $inc: { permissionVersion: 1 } },
    );
    return NextResponse.json({ ok: true, roleId: role._id, key: role.key });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to create role" }, { status: 500 });
  }
}
