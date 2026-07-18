import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { isAdmin, isEditor } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import {
  ChatbotError,
  errorPayload,
  okPayload,
  reorderFaqSiblings,
} from "@/lib/chatbot/service";

export const dynamic = "force-dynamic";

function canManageFaq(session) {
  return isAdmin(session) || isEditor(session);
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canManageFaq(session)) {
    return NextResponse.json(errorPayload("FORBIDDEN", "Forbidden"), { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const parentId = body?.parentId || null;
    const orderedIds = Array.isArray(body?.orderedIds) ? body.orderedIds : [];
    const reordered = await reorderFaqSiblings(parentId, orderedIds);
    return NextResponse.json(okPayload(reordered));
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    return NextResponse.json(errorPayload("SERVER_ERROR", err.message), { status: 500 });
  }
}
