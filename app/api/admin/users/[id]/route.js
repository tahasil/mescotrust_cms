import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { requirePermission } from "@/lib/apiAuth";
import { ensureRbacBootstrap } from "@/lib/rbac/bootstrap";
import { validateRoleAssignment } from "@/lib/rbac/assignmentValidator";
import { invalidateAccessCacheForUser } from "@/lib/rbac/resolver";
import { isConfiguredSuperAdminEmail, normalizeRoleKey, ROLE_KEYS } from "@/lib/rbac/constants";

async function loadModels() {
  const [User, AdminRole, RolePermission] = await Promise.all([
    import("@/models/User").then((module) => module.default || module),
    import("@/models/AdminRole").then((module) => module.default || module),
    import("@/models/RolePermission").then((module) => module.default || module),
  ]);
  return { User, AdminRole, RolePermission };
}

async function getRole(models, roleKeyInput) {
  const roleKey = normalizeRoleKey(roleKeyInput);
  const role = await models.AdminRole.findOne({ key: roleKey, isActive: true, isDeleted: { $ne: true } }).lean();
  if (!role) return null;
  const mappings = await models.RolePermission.find({ roleKey, isDeleted: { $ne: true } }).select("permissionKey").lean();
  return { ...role, permissionKeys: mappings.map((mapping) => mapping.permissionKey) };
}

function isProtectedSuperAdmin(user) {
  return user?.roleKey === ROLE_KEYS.SUPER_ADMIN || isConfiguredSuperAdminEmail(user?.email);
}

function validateId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(req, { params }) {
  const session = await requirePermission(req, "users.user_management");
  if (session instanceof NextResponse) return session;
  if (!validateId(params.id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  try {
    await ensureRbacBootstrap();
    const { User } = await loadModels();
    const user = await User.findById(params.id).select("-password").lean();
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!session.isSuperAdmin && isProtectedSuperAdmin(user)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to load user" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requirePermission(req, "users.user_management");
  if (session instanceof NextResponse) return session;
  if (!validateId(params.id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  try {
    await ensureRbacBootstrap();
    const models = await loadModels();
    const body = await req.json();
    if ((body.permissionKeys || body.permissions) !== undefined) {
      return NextResponse.json({ error: "Assign a predefined role instead of direct user permissions" }, { status: 400 });
    }
    const user = await models.User.findById(params.id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const protectedSuperAdmin = isProtectedSuperAdmin(user);
    if (protectedSuperAdmin && !session.isSuperAdmin) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const currentRoleKey = normalizeRoleKey(user.roleKey || user.role);
    const requestedRoleKey = body.roleKey !== undefined || body.role !== undefined
      ? normalizeRoleKey(body.roleKey || body.role)
      : currentRoleKey;
    const roleChanged = requestedRoleKey !== currentRoleKey;
    const status = body.status === undefined ? user.status : body.status === "inactive" ? "inactive" : "active";
    const statusChanged = status !== user.status;
    if (protectedSuperAdmin && (requestedRoleKey !== ROLE_KEYS.SUPER_ADMIN || status !== "active")) {
      return NextResponse.json({ error: "The protected Super Admin role and status cannot be changed" }, { status: 400 });
    }

    let targetRole = null;
    if (roleChanged) {
      targetRole = await getRole(models, requestedRoleKey);
      if (!targetRole) return NextResponse.json({ error: "Invalid or inactive role" }, { status: 400 });
      const validation = await validateRoleAssignment({
        actorAccess: session,
        targetRoleKey: targetRole.key,
        targetRolePriority: targetRole.priority,
        targetPermissionKeys: targetRole.permissionKeys,
        allowEqualPriority: true,
        enforcePermissionOwnership: false,
      });
      if (!validation.ok) return NextResponse.json({ error: validation.message, code: validation.code }, { status: 403 });
    }

    if (user.roleKey === ROLE_KEYS.ADMIN && (roleChanged || status === "inactive")) {
      const remainingAdmins = await models.User.countDocuments({
        _id: { $ne: user._id },
        roleKey: ROLE_KEYS.ADMIN,
        status: "active",
      });
      const activeSuperAdmins = await models.User.countDocuments({ roleKey: ROLE_KEYS.SUPER_ADMIN, status: "active" });
      if (remainingAdmins === 0 && activeSuperAdmins === 0) {
        return NextResponse.json({ error: "Cannot remove or deactivate the last active administrator" }, { status: 400 });
      }
    }

    if (body.name !== undefined) {
      const name = String(body.name || "").trim();
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
      user.name = name;
    }
    if (body.email !== undefined) {
      const email = String(body.email || "").trim().toLowerCase();
      if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
      if (protectedSuperAdmin && email !== user.email) return NextResponse.json({ error: "Super Admin email cannot be changed" }, { status: 400 });
      if (email !== user.email && (await models.User.exists({ email, _id: { $ne: user._id } }))) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
      user.email = email;
    }
    if (roleChanged) {
      user.roleKey = targetRole.key;
      user.role = targetRole.name;
      user.permissionVersion = Number(user.permissionVersion || 1) + 1;
    }
    if (body.status !== undefined) user.status = status;
    if (body.password) {
      if (String(body.password).length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      user.password = await bcrypt.hash(String(body.password), 10);
    }
    if (roleChanged || statusChanged) user.sessionVersion = Number(user.sessionVersion || 1) + 1;
    await user.save();
    invalidateAccessCacheForUser(user._id);
    const out = await models.User.findById(user._id).select("-password").lean();
    return NextResponse.json({
      ...out,
      reloginRequired: roleChanged || statusChanged,
      affectsCurrentSession: String(session.id) === String(user._id),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requirePermission(req, "users.user_management");
  if (session instanceof NextResponse) return session;
  if (!validateId(params.id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  try {
    await ensureRbacBootstrap();
    const { User } = await loadModels();
    const user = await User.findById(params.id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (isProtectedSuperAdmin(user)) return NextResponse.json({ error: "Super Admin account cannot be deleted" }, { status: 400 });
    if (user.roleKey === ROLE_KEYS.ADMIN) {
      const remainingAdmins = await User.countDocuments({ _id: { $ne: user._id }, roleKey: ROLE_KEYS.ADMIN, status: "active" });
      const activeSuperAdmins = await User.countDocuments({ roleKey: ROLE_KEYS.SUPER_ADMIN, status: "active" });
      if (remainingAdmins === 0 && activeSuperAdmins === 0) {
        return NextResponse.json({ error: "Cannot delete the last active administrator" }, { status: 400 });
      }
    }
    await User.findByIdAndDelete(user._id);
    invalidateAccessCacheForUser(user._id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
