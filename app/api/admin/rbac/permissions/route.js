import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";
import { ensureRbacBootstrap } from "@/lib/rbac/bootstrap";

export async function GET(req) {
  const session = await requirePermission(req, "rbac.role_management");
  if (session instanceof NextResponse) return session;

  try {
    await ensureRbacBootstrap();
    const Permission = (await import("@/models/Permission")).default;
    const permissions = await Permission.find({ isActive: true })
      .select("key module moduleLabel action label description isProtected")
      .sort({ module: 1, action: 1 })
      .lean();
    return NextResponse.json(
      permissions.map((permission) => ({
        ...permission,
        assignable: !permission.isProtected || session.isSuperAdmin === true,
      })),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load permissions" },
      { status: 500 },
    );
  }
}
