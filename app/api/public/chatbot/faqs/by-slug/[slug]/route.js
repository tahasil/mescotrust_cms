import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  ChatbotError,
  ensureChatbotBootstrap,
  errorPayload,
  getNodeContextBySlug,
  incrementPopularity,
  okPayload,
} from "@/lib/chatbot/service";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    await connectDB();
    await ensureChatbotBootstrap();
    const data = await getNodeContextBySlug(params.slug, { onlyActive: true });
    const { searchParams } = new URL(req.url);
    const track = searchParams.get("track");
    if (track !== "false") {
      await incrementPopularity(data?.node?._id);
    }
    return NextResponse.json(okPayload(data));
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    return NextResponse.json(errorPayload("SERVER_ERROR", err.message), { status: 500 });
  }
}
