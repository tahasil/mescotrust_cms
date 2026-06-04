import { NextResponse } from "next/server";
import { getPublicAiChatbotConfig } from "@/lib/aiChatbotService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const payload = await getPublicAiChatbotConfig();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    return NextResponse.json(
      { enabled: false, name: "", faqs: [], quickActions: [] },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  }
}
