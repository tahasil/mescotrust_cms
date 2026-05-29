import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { ensureRbacBootstrap } from "@/lib/rbac/bootstrap";
import { normalizeRoleKey, roleLabelFromKey } from "@/lib/rbac/constants";
import { validateRoleAssignment } from "@/lib/rbac/assignmentValidator";
import { invalidateAccessCacheForUser } from "@/lib/rbac/resolver";
import { deriveUserTypeFromRole, isSuperAdminUserType, normalizeUserType } from "@/lib/rbac/userType";

async function loadModels() {
  const [User, AdminRole, RolePermission] = await Promise.all([
    import("@/models/User").then((mod) => mod.default || mod),
    import("@/models/AdminRole").then((mod) => mod.default || mod),
    import("@/models/RolePermission").then((mod) => mod.default || mod),
  ]);
  return { User, AdminRole, RolePermission };
}

async function getRoleWithPermissions(models = {}, roleKeyInput) {
  const { AdminRole, RolePermission } = models || {};
  if (!AdminRole || !RolePermission) return null;
  const roleKey = normalizeRoleKey(roleKeyInput);
  const role = await AdminRole.findOne({ key: roleKey, isActive: true }).lean();
  if (!role) return null;
  const mappings = await RolePermission.find({ roleKey, isDeleted: { $ne: true } })
    .select("permissionKey")
    .lean();
  return {
    role,
    permissionKeys: mappings.map((row) => row.permissionKey),
  };
}

function resolveUserTypeForRole(roleDoc) {
  if (!roleDoc) return "editor";
  return deriveUserTypeFromRole({
    roleKey: roleDoc.key,
    rolePriority: roleDoc.priority,
  });
}

function getUserTypeFromUserDoc(userLike) {
  const normalized = normalizeUserType(userLike?.userType, "");
  if (normalized) return normalized;
  return deriveUserTypeFromRole({ roleKey: userLike?.roleKey || userLike?.role });
}

async function assertCriticalRoleSafety({ User }, user, nextRoleKey, nextStatus, nextUserType, deleting = false) {
  const currentRoleKey = normalizeRoleKey(user?.roleKey || user?.role);
  const currentUserType = getUserTypeFromUserDoc(user);
  const leavingCurrentRole = deleting || nextRoleKey !== currentRoleKey || nextStatus === "inactive";
  const leavingCurrentUserType = deleting || normalizeUserType(nextUserType, currentUserType) !== currentUserType;

  if (!leavingCurrentRole && !leavingCurrentUserType) {
    return { ok: true };
  }

  if (isSuperAdminUserType(currentUserType)) {
    const remainingSuperAdmins = await User.countDocuments({
      _id: { $ne: user._id },
      $or: [{ userType: "superadmin" }, { roleKey: "super_admin" }],
      status: "active",
    });
    if (remainingSuperAdmins <= 0) {
      return { ok: false, error: "Cannot remove or deactivate the last active Super Admin" };
    }
  }

  const activeSuperAdmins = await User.countDocuments({
    $or: [{ userType: "superadmin" }, { roleKey: "super_admin" }],
    status: "active",
  });
  if (activeSuperAdmins <= 0 && currentUserType === "admin") {
    const remainingAdmins = await User.countDocuments({
      _id: { $ne: user._id },
      $or: [{ userType: "admin" }, { roleKey: "admin" }],
      status: "active",
    });
    if (remainingAdmins <= 0) {
      return { ok: false, error: "Cannot remove or deactivate the last active Admin while no Super Admin exists" };
    }
  }

  return { ok: true };
}

function parseUpdatePayload(body = {}) {
  const rawRoleValue =
    body.roleKey !== undefined && body.roleKey !== null && String(body.roleKey).trim() !== ""
      ? body.roleKey
      : body.role !== undefined && body.role !== null && String(body.role).trim() !== ""
        ? body.role
        : undefined;

  return {
    name: body.name === undefined ? undefined : String(body.name || "").trim(),
    email:
      body.email === undefined
        ? undefined
        : String(body.email || "")
            .trim()
            .toLowerCase(),
    roleKey: rawRoleValue === undefined ? undefined : normalizeRoleKey(rawRoleValue),
    userType: body.userType === undefined ? undefined : String(body.userType || "").trim().toLowerCase(),
    status: body.status === undefined ? undefined : body.status === "inactive" ? "inactive" : "active",
    password: body.password ? String(body.password) : "",
    hasDirectPermissionPayload:
      (Array.isArray(body.permissionKeys) && body.permissionKeys.length > 0) ||
      body.permissions !== undefined,
  };
}

function isSuperAdminUser(user) {
  return isSuperAdminUserType(getUserTypeFromUserDoc(user));
}

export async function GET(req, { params }) {
  const session = await requirePermission(req, "users.user_management");
  if (session instanceof NextResponse) return session;

  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await connectDB();
    await ensureRbacBootstrap();
    const { User } = await loadModels();
    const user = await User.findById(id).select("-password").lean();
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!session.isSuperAdmin && isSuperAdminUser(user)) {
      return NextResponse.json({ error: "Forbidden: cannot access Super Admin user details." }, { status: 403 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to load user" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requirePermission(req, "users.user_management");
  if (session instanceof NextResponse) return session;

  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await connectDB();
    await ensureRbacBootstrap();
    const models = await loadModels();
    const { User } = models;

    const payload = parseUpdatePayload(await req.json());
    if (payload.hasDirectPermissionPayload) {
      return NextResponse.json(
        { error: "Direct user permission assignment is not allowed. Assign a predefined role only." },
        { status: 400 },
      );
    }
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!session.isSuperAdmin && isSuperAdminUser(user)) {
      return NextResponse.json({ error: "Forbidden: cannot modify Super Admin users." }, { status: 403 });
    }
    const currentRoleKey = normalizeRoleKey(user?.roleKey || user?.role);
    const currentUserType = getUserTypeFromUserDoc(user);
    const requestedRoleKey = payload.roleKey !== undefined ? normalizeRoleKey(payload.roleKey) : currentRoleKey;
    const roleChanged = requestedRoleKey !== currentRoleKey;
    const statusChanged = payload.status !== undefined && payload.status !== String(user.status || "active");

    let targetRoleWithPermissions = null;
    let nextUserType = currentUserType;
    if (roleChanged) {
      targetRoleWithPermissions = await getRoleWithPermissions(models, requestedRoleKey);
      if (!targetRoleWithPermissions || !targetRoleWithPermissions.role) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      nextUserType = resolveUserTypeForRole(targetRoleWithPermissions.role);
      const targetAssignmentValidation = await validateRoleAssignment({
        actorAccess: session,
        targetRoleKey: targetRoleWithPermissions.role.key,
        targetPermissionKeys: targetRoleWithPermissions.permissionKeys,
        allowEqualPriority: true,
      });
      if (!targetAssignmentValidation.ok) {
        return NextResponse.json(
          { error: targetAssignmentValidation.message, code: targetAssignmentValidation.code },
          { status: 403 },
        );
      }
    }

    if (!session.isSuperAdmin) {
      if (isSuperAdminUserType(currentUserType)) {
        return NextResponse.json({ error: "Forbidden: cannot modify Super Admin users." }, { status: 403 });
      }
      if (roleChanged && isSuperAdminUserType(nextUserType)) {
        return NextResponse.json(
          { error: "Only Super Admin can assign Super Admin role." },
          { status: 403 },
        );
      }
    }

    const nextRoleKey = requestedRoleKey;
    const nextStatus = payload.status || user.status || "active";
    const criticalRoleCheck = await assertCriticalRoleSafety({
      User,
      user,
      nextRoleKey,
      nextStatus,
      nextUserType,
    });
    if (!criticalRoleCheck.ok) {
      return NextResponse.json({ error: criticalRoleCheck.error }, { status: 400 });
    }

    if (roleChanged) {
      user.roleKey = targetRoleWithPermissions.role.key;
      user.role = targetRoleWithPermissions.role.name || roleLabelFromKey(targetRoleWithPermissions.role.key);
      user.userType = nextUserType;
      user.permissionVersion = Number(user.permissionVersion || 1) + 1;
    } else if (!user.userType) {
      user.userType = currentUserType;
    }

    if (payload.name !== undefined) {
      if (!payload.name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      user.name = payload.name;
    }
    if (payload.email !== undefined) {
      if (!payload.email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }
      if (payload.email !== String(user.email || "").toLowerCase()) {
        const duplicate = await User.findOne({ email: payload.email, _id: { $ne: id } }).lean();
        if (duplicate) {
          return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }
      }
      user.email = payload.email;
    }
    if (payload.status !== undefined) user.status = payload.status;
    if (payload.password) {
      if (payload.password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      user.password = await bcrypt.hash(payload.password, 10);
    }
    if (roleChanged || statusChanged) {
      user.sessionVersion = Number(user.sessionVersion || 1) + 1;
    }

    await user.save();
    invalidateAccessCacheForUser(user._id);

    const out = await User.findById(id).select("-password").lean();
    const reloginRequired = roleChanged || statusChanged;
    const affectsCurrentSession = String(session.id || "") === String(user._id || "");
    return NextResponse.json({
      ...out,
      reloginRequired,
      reloginMessage: reloginRequired
        ? "Your role and permissions have been updated. Please log in again to continue."
        : "",
      affectsCurrentSession,
    });
  } catch (error) {
    console.error("Users PUT failed", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requirePermission(req, "users.user_management");
  if (session instanceof NextResponse) return session;

  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await connectDB();
    await ensureRbacBootstrap();
    const models = await loadModels();
    const { User } = models;
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const currentUserType = getUserTypeFromUserDoc(user);
    if (!session.isSuperAdmin && isSuperAdminUserType(currentUserType)) {
      return NextResponse.json({ error: "Forbidden: cannot delete Super Admin users." }, { status: 403 });
    }

    const criticalRoleCheck = await assertCriticalRoleSafety({
      User,
      user,
      nextRoleKey: normalizeRoleKey(user.roleKey || user.role),
      nextStatus: "inactive",
      nextUserType: currentUserType,
      deleting: true,
    });
    if (!criticalRoleCheck.ok) {
      return NextResponse.json({ error: criticalRoleCheck.error }, { status: 400 });
    }

    const deleted = await User.softDeleteById(id, {
      deletedBy: session.email || session.id || "",
    });
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await User.updateOne(
      { _id: id },
      { $inc: { permissionVersion: 1, sessionVersion: 1 } },
      { withDeleted: true },
    );
    invalidateAccessCacheForUser(id);
    return NextResponse.json({ deleted: true, softDeleted: true });
  } catch (error) {
    console.error("Users DELETE failed", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
