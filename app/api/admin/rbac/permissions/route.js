import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";
import { buildPermissionDefinitions } from "@/lib/rbac/catalog";
import { connectDB } from "@/lib/db";
import { ensureRbacBootstrap } from "@/lib/rbac/bootstrap";

export async function GET(req) {
  const session = await requirePermission(req, "rbac.role_management");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    await ensureRbacBootstrap();

    const Permission = (await import("@/models/Permission")).default;
    const active = await Permission.find({ isActive: true })
      .select("key module action label description isProtected")
      .sort({ module: 1, action: 1 })
      .lean();

    if (active.length > 0) {
      return NextResponse.json(active);
    }

    return NextResponse.json(buildPermissionDefinitions());
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to load permissions" }, { status: 500 });
  }
}
