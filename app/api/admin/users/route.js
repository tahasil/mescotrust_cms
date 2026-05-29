import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { ensureRbacBootstrap } from "@/lib/rbac/bootstrap";
import { ROLE_KEYS, normalizeRoleKey, roleLabelFromKey } from "@/lib/rbac/constants";
import { validateRoleAssignment } from "@/lib/rbac/assignmentValidator";
import { deriveUserTypeFromRole, isSuperAdminUserType, normalizeUserType } from "@/lib/rbac/userType";

async function loadModels() {
  const [User, AdminRole, RolePermission] = await Promise.all([
    import("@/models/User").then((mod) => mod.default || mod),
    import("@/models/AdminRole").then((mod) => mod.default || mod),
    import("@/models/RolePermission").then((mod) => mod.default || mod),
  ]);
  return { User, AdminRole, RolePermission };
}

async function getRoleWithPermissions(models = {}, inputRoleKey) {
  const { AdminRole, RolePermission } = models || {};
  if (!AdminRole || !RolePermission) return null;
  const roleKey = normalizeRoleKey(inputRoleKey);
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

function sanitizeCreatePayload(body = {}) {
  const rawPermissionKeys = Array.isArray(body.permissionKeys) ? body.permissionKeys : [];
  return {
    name: String(body.name || "").trim(),
    email: String(body.email || "")
      .trim()
      .toLowerCase(),
    password: String(body.password || ""),
    roleKey: normalizeRoleKey(body.roleKey || body.role),
    userType: body.userType === undefined ? undefined : String(body.userType || "").trim().toLowerCase(),
    status: body.status === "inactive" ? "inactive" : "active",
    hasDirectPermissionPayload: rawPermissionKeys.length > 0 || body.permissions !== undefined,
  };
}

export async function GET(req) {
  const session = await requirePermission(req, "users.user_management");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    await ensureRbacBootstrap();
    const { User } = await loadModels();
    const query = session.isSuperAdmin
      ? {}
      : {
          $and: [
            {
              userType: {
                $nin: ["superadmin", "super_admin", "super admin"],
              },
            },
            { roleKey: { $ne: ROLE_KEYS.SUPER_ADMIN } },
            { role: { $nin: [roleLabelFromKey(ROLE_KEYS.SUPER_ADMIN), "super_admin", "super admin"] } },
          ],
        };
    const users = await User.find(query).select("-password").sort({ createdAt: -1 }).lean();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requirePermission(req, "users.user_management");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    await ensureRbacBootstrap();
    const models = await loadModels();
    const { User } = models;

    const payload = sanitizeCreatePayload(await req.json());
    if (payload.hasDirectPermissionPayload) {
      return NextResponse.json(
        { error: "Direct user permission assignment is not allowed. Assign a predefined role only." },
        { status: 400 },
      );
    }
    if (!payload.name || !payload.email || payload.password.length < 6) {
      return NextResponse.json(
        { error: "Name, email, and password (minimum 6 characters) are required" },
        { status: 400 },
      );
    }

    const existing = await User.findOne({ email: payload.email }).lean();
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const roleWithPermissions = await getRoleWithPermissions(models, payload.roleKey);
    if (!roleWithPermissions) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const assignedUserType = resolveUserTypeForRole(roleWithPermissions.role);
    if (!session.isSuperAdmin && isSuperAdminUserType(assignedUserType)) {
      return NextResponse.json(
        { error: "Only Super Admin can create users with Super Admin role." },
        { status: 403 },
      );
    }

    const assignmentValidation = await validateRoleAssignment({
      actorAccess: session,
      targetRoleKey: roleWithPermissions.role.key,
      targetPermissionKeys: roleWithPermissions.permissionKeys,
      allowEqualPriority: true,
    });
    if (!assignmentValidation.ok) {
      return NextResponse.json(
        { error: assignmentValidation.message, code: assignmentValidation.code },
        { status: 403 },
      );
    }

    const hashed = await bcrypt.hash(payload.password, 10);
    const created = await User.create({
      name: payload.name,
      email: payload.email,
      password: hashed,
      roleKey: roleWithPermissions.role.key,
      role: roleWithPermissions.role.name || roleLabelFromKey(roleWithPermissions.role.key),
      userType: normalizeUserType(
        payload.userType,
        assignedUserType,
      ),
      status: payload.status,
      permissionVersion: 1,
      sessionVersion: 1,
    });

    const out = await User.findById(created._id).select("-password").lean();
    return NextResponse.json(out);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}
