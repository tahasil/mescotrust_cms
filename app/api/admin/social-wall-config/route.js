import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { isAdmin } from "@/lib/permissions";
import {
  getAdminSocialWallConfigPayload,
  saveSocialWallPlatformRows,
} from "@/lib/socialWallPlatformConfig";

export const dynamic = "force-dynamic";

function guardAdmin(session) {
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }
  return null;
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  const forbidden = guardAdmin(session);
  if (forbidden) return forbidden;

  try {
    const payload = await getAdminSocialWallConfigPayload();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Failed to load config" }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  const forbidden = guardAdmin(session);
  if (forbidden) return forbidden;

  try {
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [];
    await saveSocialWallPlatformRows(items, { updatedBy: session?.email || "" });
    const payload = await getAdminSocialWallConfigPayload();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Failed to save config" }, { status: 500 });
  }
}
