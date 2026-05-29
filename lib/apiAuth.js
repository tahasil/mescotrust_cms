import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authorizeApiAccess } from "@/lib/rbac/accessControl";
import { hasPermissionKey } from "@/lib/rbac/permissionUtils";
import { resolveRoleIdentity } from "@/lib/rbac/constants";
import { deriveUserTypeFromRole, isSuperAdminUserType, normalizeUserType } from "@/lib/rbac/userType";

let _UserModel = null;
async function getUserModel() {
  if (!_UserModel) {
    _UserModel = (await import("@/models/User")).default;
  }
  return _UserModel;
}

function getPathname(req) {
  try {
    if (req?.nextUrl?.pathname) return req.nextUrl.pathname;
    return new URL(req.url).pathname;
  } catch {
    return "";
  }
}

function forbidden(message, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status: 403 });
}

export async function requireAuth(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pathname = getPathname(req);
  const method = String(req?.method || "GET").toUpperCase();

  // MESCO: preserve `email`/`name` from the token. Many admin routes record
  // `session.email` / `session.name` as createdBy/updatedBy/publish author, and
  // the original requireAuth returned the raw token (which carries these standard
  // NextAuth claims). The RBAC sessionLike must keep them. (Migration note R7.)
  let sessionLike = {
    id: token.id,
    email: token.email || "",
    name: token.name || "",
    role: token.role,
    roleKey: token.roleKey || token.role,
    userType: normalizeUserType(token.userType, deriveUserTypeFromRole({ roleKey: token.roleKey || token.role })),
    permissionVersion: token.permissionVersion || 1,
    sessionVersion: token.sessionVersion || 1,
    permissionKeys: Array.isArray(token.permissionKeys) ? token.permissionKeys : [],
  };

  try {
    await connectDB();
    const User = await getUserModel();
    const user = await User.findById(token.id)
      .select("status role roleKey userType permissionVersion sessionVersion")
      .lean();
    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "Account deactivated" }, { status: 403 });
    }
    const dbSessionVersion = Number(user.sessionVersion || 1);
    const tokenSessionVersion = Number(token.sessionVersion || 1);
    if (dbSessionVersion !== tokenSessionVersion) {
      return NextResponse.json(
        {
          error: "Your role and permissions have been updated. Please log in again to continue.",
          code: "SESSION_INVALIDATED",
          reason: "role-updated",
        },
        { status: 401 },
      );
    }
    const roleIdentity = resolveRoleIdentity({ role: user.role, roleKey: user.roleKey });
    sessionLike = {
      ...sessionLike,
      role: roleIdentity.role,
      roleKey: roleIdentity.roleKey,
      userType: normalizeUserType(user.userType, deriveUserTypeFromRole({ roleKey: roleIdentity.roleKey })),
      permissionVersion: user.permissionVersion || sessionLike.permissionVersion || 1,
      sessionVersion: dbSessionVersion,
    };
  } catch {
    // Fallback to token-only context during transient DB failures.
  }

  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/theme")) {
    const authz = await authorizeApiAccess({
      sessionLike,
      pathname,
      method,
    });
    if (!authz.allowed) {
      return forbidden("Forbidden: insufficient permission", {
        requiredPermission: authz.requiredPermission || null,
        role: sessionLike.role,
        roleKey: sessionLike.roleKey,
      });
    }
    if (authz.access) {
      sessionLike = {
        ...sessionLike,
        role: authz.access.role,
        roleKey: authz.access.roleKey,
        permissionVersion: authz.access.permissionVersion,
        permissionKeys: authz.access.permissionKeys,
        isSuperAdmin:
          isSuperAdminUserType(sessionLike.userType) || authz.access.isSuperAdmin === true,
      };
    }
  }

  sessionLike.isSuperAdmin = isSuperAdminUserType(sessionLike.userType) || sessionLike.isSuperAdmin === true;
  return sessionLike;
}

export async function requirePermission(req, permissionKey) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  if (!hasPermissionKey(session.permissionKeys, permissionKey)) {
    return forbidden("Forbidden: missing permission", {
      requiredPermission: permissionKey,
      role: session.role,
      roleKey: session.roleKey,
    });
  }

  return session;
}

export async function requireAnyPermission(req, permissionKeys = []) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const allowed = permissionKeys.some((permissionKey) => hasPermissionKey(session.permissionKeys, permissionKey));
  if (!allowed) {
    return forbidden("Forbidden: missing permission", {
      requiredAnyPermission: permissionKeys,
      role: session.role,
      roleKey: session.roleKey,
    });
  }

  return session;
}

export async function requireAllPermissions(req, permissionKeys = []) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const missing = permissionKeys.filter((permissionKey) => !hasPermissionKey(session.permissionKeys, permissionKey));
  if (missing.length > 0) {
    return forbidden("Forbidden: missing permission", {
      requiredAllPermissions: permissionKeys,
      missingPermissions: missing,
      role: session.role,
      roleKey: session.roleKey,
    });
  }

  return session;
}
