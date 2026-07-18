import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { isAdmin, isEditor } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import {
  ChatbotError,
  errorPayload,
  getSettings,
  okPayload,
  updateSettings,
} from "@/lib/chatbot/service";

export const dynamic = "force-dynamic";

function canViewSettings(session) {
  return isAdmin(session) || isEditor(session);
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!canViewSettings(session)) {
    return NextResponse.json(errorPayload("FORBIDDEN", "Forbidden"), { status: 403 });
  }

  try {
    await connectDB();
    const settings = await getSettings({ bootstrap: true });
    return NextResponse.json(okPayload(settings));
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    return NextResponse.json(errorPayload("SERVER_ERROR", err.message), { status: 500 });
  }
}

export async function PUT(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!isAdmin(session)) {
    return NextResponse.json(errorPayload("FORBIDDEN", "Only Admin can update settings"), {
      status: 403,
    });
  }

  try {
    const body = await req.json();
    await connectDB();
    const settings = await updateSettings(body);
    return NextResponse.json(okPayload(settings));
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    return NextResponse.json(errorPayload("SERVER_ERROR", err.message), { status: 500 });
  }
}
