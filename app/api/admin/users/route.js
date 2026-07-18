import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requirePermission } from "@/lib/apiAuth";
import { ensureRbacBootstrap } from "@/lib/rbac/bootstrap";
import { filterAssignableRolesForActor, validateRoleAssignment } from "@/lib/rbac/assignmentValidator";
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
  const mappings = await models.RolePermission.find({ roleKey, isDeleted: { $ne: true } })
    .select("permissionKey")
    .lean();
  return { ...role, permissionKeys: mappings.map((mapping) => mapping.permissionKey) };
}

export async function GET(req) {
  const session = await requirePermission(req, "users.user_management");
  if (session instanceof NextResponse) return session;
  try {
    await ensureRbacBootstrap();
    const { User } = await loadModels();
    const users = await User.find({}).select("-password").sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      session.isSuperAdmin
        ? users
        : users.filter((user) => user.roleKey !== ROLE_KEYS.SUPER_ADMIN && !isConfiguredSuperAdminEmail(user.email)),
    );
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requirePermission(req, "users.user_management");
  if (session instanceof NextResponse) return session;
  try {
    await ensureRbacBootstrap();
    const models = await loadModels();
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const requestedRoleKey = isConfiguredSuperAdminEmail(email)
      ? ROLE_KEYS.SUPER_ADMIN
      : normalizeRoleKey(body.roleKey || body.role);
    if (!name || !email || password.length < 6) {
      return NextResponse.json({ error: "Name, email, and password (minimum 6 characters) are required" }, { status: 400 });
    }
    if ((body.permissionKeys || body.permissions) !== undefined) {
      return NextResponse.json({ error: "Assign a predefined role instead of direct user permissions" }, { status: 400 });
    }
    if (isConfiguredSuperAdminEmail(email) && !session.isSuperAdmin) {
      return NextResponse.json({ error: "Only Super Admin can create the protected Super Admin account" }, { status: 403 });
    }
    if (await models.User.exists({ email })) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    const role = await getRole(models, requestedRoleKey);
    if (!role) return NextResponse.json({ error: "Invalid or inactive role" }, { status: 400 });
    const validation = await validateRoleAssignment({
      actorAccess: session,
      targetRoleKey: role.key,
      targetRolePriority: role.priority,
      targetPermissionKeys: role.permissionKeys,
      allowEqualPriority: true,
      enforcePermissionOwnership: false,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.message, code: validation.code }, { status: 403 });
    }
    const user = await models.User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: role.name,
      roleKey: role.key,
      status: body.status === "inactive" ? "inactive" : "active",
      permissionVersion: 1,
      sessionVersion: 1,
    });
    return NextResponse.json(await models.User.findById(user._id).select("-password").lean(), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}
