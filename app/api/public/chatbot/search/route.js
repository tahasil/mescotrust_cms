import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  ChatbotError,
  errorPayload,
  getSettings,
  okPayload,
  searchFaqNodes,
} from "@/lib/chatbot/service";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 8);
    const settings = await getSettings({ bootstrap: true });
    const result = await searchFaqNodes({
      q,
      page,
      limit,
      onlyActive: true,
      settings,
    });
    return NextResponse.json(okPayload(result));
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    return NextResponse.json(errorPayload("SERVER_ERROR", err.message), { status: 500 });
  }
}
