import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { isAdmin, isEditor } from "@/lib/permissions";

function toSessionError(session) {
  if (session instanceof NextResponse) return session;
  return null;
}

export async function requireAdminSession(req) {
  const session = await requireAuth(req);
  const authError = toSessionError(session);
  if (authError) return { error: authError, session: null };
  if (!isAdmin(session)) {
    return {
      error: NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

export async function requireEditorOrAdminSession(req) {
  const session = await requireAuth(req);
  const authError = toSessionError(session);
  if (authError) return { error: authError, session: null };
  if (!isAdmin(session) && !isEditor(session)) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Admin or Editor only" },
        { status: 403 },
      ),
      session: null,
    };
  }
  return { error: null, session };
}
