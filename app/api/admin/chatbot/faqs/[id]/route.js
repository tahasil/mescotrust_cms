import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { isAdmin, isEditor } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import {
  ChatbotError,
  deleteFaqNode,
  errorPayload,
  okPayload,
  updateFaqNode,
} from "@/lib/chatbot/service";

export const dynamic = "force-dynamic";

function canManageFaq(session) {
  return isAdmin(session) || isEditor(session);
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canManageFaq(session)) {
    return NextResponse.json(errorPayload("FORBIDDEN", "Forbidden"), { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const updated = await updateFaqNode(params.id, body);
    return NextResponse.json(okPayload(updated));
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    if (String(err?.message || "").toLowerCase().includes("duplicate key")) {
      return NextResponse.json(errorPayload("SLUG_NOT_UNIQUE", "Slug must be unique"), {
        status: 409,
      });
    }
    return NextResponse.json(errorPayload("SERVER_ERROR", err.message), { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!isAdmin(session)) {
    return NextResponse.json(errorPayload("FORBIDDEN", "Only Admin can delete FAQ nodes"), {
      status: 403,
    });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "block";
    const summary = await deleteFaqNode(params.id, mode);
    return NextResponse.json(okPayload(summary));
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    return NextResponse.json(errorPayload("SERVER_ERROR", err.message), { status: 500 });
  }
}
