import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";

function toSessionError(session) {
  if (session instanceof NextResponse) return session;
  return null;
}

export async function requireSocialWallPermission(req, permissionKey) {
  const session = await requirePermission(req, permissionKey);
  const authError = toSessionError(session);
  if (authError) return { error: authError, session: null };
  return { error: null, session };
}
