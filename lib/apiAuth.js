import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { normalizeRole } from "@/lib/permissions";

const USER_STATUS_CACHE_TTL_MS = 30_000;
const USER_STATUS_CACHE_MAX = 2000;
const userStatusCache = new Map();

let _UserModel = null;
async function getUserModel() {
  if (!_UserModel) {
    _UserModel = (await import("@/models/User")).default;
  }
  return _UserModel;
}

export async function requireAuth(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = String(token.id || "").trim();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const cached = userStatusCache.get(userId);
  if (cached && cached.expiresAt > now) {
    if (cached.active) {
      return { ...token, role: normalizeRole(token.role || cached.role) };
    }
    return NextResponse.json({ error: "Account deactivated" }, { status: 403 });
  }

  try {
    await connectDB();
    const User = await getUserModel();
    const user = await User.findById(userId).select("status role").lean();
    const isActive = !!user && user.status === "active";
    const resolvedRole = normalizeRole(token.role || user?.role);

    userStatusCache.set(userId, {
      active: isActive,
      role: resolvedRole,
      expiresAt: now + USER_STATUS_CACHE_TTL_MS,
    });
    if (userStatusCache.size > USER_STATUS_CACHE_MAX) {
      const oldest = userStatusCache.keys().next().value;
      if (oldest) userStatusCache.delete(oldest);
    }

    if (!isActive) {
      return NextResponse.json({ error: "Account deactivated" }, { status: 403 });
    }

    return { ...token, role: resolvedRole };
  } catch {
    return NextResponse.json(
      { error: "Authentication verification unavailable" },
      { status: 503 },
    );
  }
}
