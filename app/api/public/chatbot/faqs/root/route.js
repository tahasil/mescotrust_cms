import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FaqNode from "@/models/FaqNode";
import {
  ChatbotError,
  ensureChatbotBootstrap,
  errorPayload,
  okPayload,
} from "@/lib/chatbot/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    await ensureChatbotBootstrap();
    const roots = await FaqNode.find({ parentId: null, status: "active" })
      .sort({ sortOrder: 1, question: 1 })
      .lean();
    return NextResponse.json(okPayload(roots));
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    return NextResponse.json(errorPayload("SERVER_ERROR", err.message), { status: 500 });
  }
}
