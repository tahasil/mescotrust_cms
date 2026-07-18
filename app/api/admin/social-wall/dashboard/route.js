import { NextResponse } from "next/server";
import { requireEditorOrAdminSession } from "@/lib/socialWallModule/apiGuards";
import { getSocialWallDashboardData } from "@/lib/socialWallModule/syncService";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = await requireEditorOrAdminSession(req);
  if (error) return error;

  try {
    const data = await getSocialWallDashboardData();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to load dashboard data" },
      { status: 500 },
    );
  }
}
