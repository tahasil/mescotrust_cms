import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { isAdmin } from "@/lib/permissions";
import {
  getMediaSettings,
  upsertMediaSettings,
} from "@/lib/media/settings";

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const settings = await getMediaSettings();
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const saved = await upsertMediaSettings(body || {}, session.email || "");
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
