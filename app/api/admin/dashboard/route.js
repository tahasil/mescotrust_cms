import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";
import { getDashboardData } from "@/lib/admin/dashboardData";

export async function GET(req) {
  const session = await requirePermission(req, "dashboard.view");
  if (session instanceof NextResponse) return session;

  try {
    const permissionKeys = Array.isArray(session?.permissionKeys)
      ? session.permissionKeys
      : [];
    const data = await getDashboardData(permissionKeys);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load dashboard data.",
        message: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
