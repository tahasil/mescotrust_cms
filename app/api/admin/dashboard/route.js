import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { getDashboardData } from "@/lib/admin/dashboardData";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const data = await getDashboardData();
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
