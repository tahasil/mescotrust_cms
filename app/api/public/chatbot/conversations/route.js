import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ChatbotError } from "@/lib/chatbot/service";
import {
  createNewConversation,
  errorPayload,
  getConversationMessages,
  getOrCreateConversation,
  okPayload,
} from "@/lib/chatbot/conversationService";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const sessionId = String(searchParams.get("sessionId") || "").trim();
    const entryPage = String(searchParams.get("entryPage") || "").trim();

    if (!sessionId) {
      return NextResponse.json(
        errorPayload("VALIDATION_ERROR", "sessionId is required"),
        { status: 400 },
      );
    }

    await getOrCreateConversation(sessionId, entryPage);
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

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "").trim().toLowerCase();
    const entryPage = String(body?.entryPage || "").trim();

    if (action === "new") {
      const conversation = await createNewConversation(entryPage);
      return NextResponse.json(
        okPayload({ conversation, messages: [] }),
        { status: 201 },
      );
    }

    const sessionId = String(body?.sessionId || "").trim();
    if (!sessionId) {
      return NextResponse.json(
        errorPayload("VALIDATION_ERROR", "sessionId is required"),
        { status: 400 },
      );
    }

    const conversation = await getOrCreateConversation(sessionId, entryPage);
    const data = await getConversationMessages(sessionId);
    return NextResponse.json(
      okPayload({
        conversation: data.conversation || conversation,
        messages: data.messages || [],
      }),
    );
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
