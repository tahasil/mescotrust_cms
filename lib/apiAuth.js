import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authorizeApiAccess } from "@/lib/rbac/accessControl";
import { hasPermissionKey } from "@/lib/rbac/permissionUtils";
import { resolveAccessFromSession } from "@/lib/rbac/resolver";

let UserModel = null;
async function getUserModel() {
  if (!UserModel) UserModel = (await import("@/models/User")).default;
  return UserModel;
}

function pathnameFromRequest(req) {
  try {
    return req?.nextUrl?.pathname || new URL(req.url).pathname;
  } catch {
    return "";
  }
}

function forbidden(message, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status: 403 });
}

export async function requireAuth(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const User = await getUserModel();
    const user = await User.findById(token.id)
      .select("email status role roleKey permissionVersion sessionVersion")
      .lean();
    if (!user || user.status !== "active") {
      return forbidden("Account deactivated");
    }
    if (Number(user.sessionVersion || 1) !== Number(token.sessionVersion || 1)) {
      return NextResponse.json(
        {
          error: "Your role or permissions changed. Please log in again.",
          code: "SESSION_INVALIDATED",
        },
        { status: 401 },
      );
    }

    let sessionLike = {
      id: String(user._id),
      email: user.email,
      role: user.role,
      roleKey: user.roleKey || user.role,
      permissionVersion: user.permissionVersion || 1,
      sessionVersion: user.sessionVersion || 1,
      permissionKeys: Array.isArray(token.permissionKeys) ? token.permissionKeys : [],
    };
    const access = await resolveAccessFromSession(sessionLike);
    sessionLike = { ...sessionLike, ...access };

    const pathname = pathnameFromRequest(req);
    if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/theme")) {
      const authorization = await authorizeApiAccess({
        sessionLike,
        pathname,
        method: req.method,
      });
      if (!authorization.allowed) {
        return forbidden("Forbidden: insufficient permission", {
          requiredPermission: authorization.requiredPermission,
          role: access.role,
          roleKey: access.roleKey,
        });
      }
    }
    return sessionLike;
  } catch {
    return NextResponse.json(
      { error: "Authentication verification unavailable" },
      { status: 503 },
    );
  }
}

export async function requirePermission(req, permissionKey) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!hasPermissionKey(session.permissionKeys, permissionKey)) {
    return forbidden("Forbidden: missing permission", { requiredPermission: permissionKey });
  }
  return session;
}

export async function requireAnyPermission(req, permissionKeys = []) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!permissionKeys.some((permissionKey) => hasPermissionKey(session.permissionKeys, permissionKey))) {
    return forbidden("Forbidden: missing permission", { requiredAnyPermission: permissionKeys });
  }
  return session;
}
