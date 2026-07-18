import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ChatbotEvent from "@/models/ChatbotEvent";

export const dynamic = "force-dynamic";

const ALLOWED_EVENT_TYPES = new Set([
  "chat_open",
  "question_click",
  "search_submit",
  "search_no_result",
  "contact_action_click",
  "donation_action_click",
  "chat_close",
]);

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventType = String(body?.eventType || "").trim();
    const sessionId = String(body?.sessionId || "").trim();

    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid eventType" },
        },
        { status: 400 },
      );
    }
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "sessionId is required" },
        },
        { status: 400 },
      );
    }

    await connectDB();
    await ChatbotEvent.create({
      eventType,
      sessionId,
      entryPage: String(body?.entryPage || "").trim(),
      questionId: String(body?.questionId || "").trim(),
      questionTitle: String(body?.questionTitle || "").trim(),
      depth: Number(body?.depth || 0),
      query: String(body?.query || "").trim(),
      resultCount: Number(body?.resultCount || 0),
      actionType: String(body?.actionType || "").trim(),
      actionLabel: String(body?.actionLabel || "").trim(),
      sourceNodeId: String(body?.sourceNodeId || "").trim(),
      durationSeconds: Number(body?.durationSeconds || 0),
      lastNodeId: String(body?.lastNodeId || "").trim(),
      payload: body?.payload && typeof body.payload === "object" ? body.payload : {},
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message } },
      { status: 500 },
    );
  }
}
