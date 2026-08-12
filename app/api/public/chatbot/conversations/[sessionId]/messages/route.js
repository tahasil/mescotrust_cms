import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ChatbotError } from "@/lib/chatbot/service";
import {
  appendConversationMessages,
  errorPayload,
  getConversationMessages,
  okPayload,
} from "@/lib/chatbot/conversationService";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  try {
    await connectDB();
    const sessionId = String(params?.sessionId || "").trim();
    const data = await getConversationMessages(sessionId);
    return NextResponse.json(okPayload(data));
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    return NextResponse.json(errorPayload("SERVER_ERROR", err.message), {
      status: 500,
    });
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();
    const sessionId = String(params?.sessionId || "").trim();
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const data = await appendConversationMessages(sessionId, messages);
    return NextResponse.json(okPayload(data), { status: 201 });
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    return NextResponse.json(errorPayload("SERVER_ERROR", err.message), {
      status: 500,
    });
  }
}
