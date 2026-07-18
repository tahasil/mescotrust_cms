import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { isAdmin, isEditor } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import {
  ChatbotError,
  duplicateFaqNode,
  errorPayload,
  okPayload,
} from "@/lib/chatbot/service";

export const dynamic = "force-dynamic";

function canManageFaq(session) {
  return isAdmin(session) || isEditor(session);
}

export async function POST(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canManageFaq(session)) {
    return NextResponse.json(errorPayload("FORBIDDEN", "Forbidden"), { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const includeChildren = Boolean(body?.includeChildren);
    const result = await duplicateFaqNode(params.id, includeChildren);
    return NextResponse.json(okPayload(result));
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    return NextResponse.json(errorPayload("DUPLICATE_FAILED", err.message), { status: 500 });
  }
}
