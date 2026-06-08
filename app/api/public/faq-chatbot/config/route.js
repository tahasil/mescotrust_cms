import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FAQChatbotConfig from "@/models/FAQChatbotConfig";
import { FAQ_CHATBOT_SETTINGS_KEY, toPublicFaqChatbotConfig } from "@/lib/faqChatbot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();
    const configDoc = await FAQChatbotConfig.findOne({
      settingsKey: FAQ_CHATBOT_SETTINGS_KEY,
    }).lean();
    return NextResponse.json(toPublicFaqChatbotConfig(configDoc), {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(toPublicFaqChatbotConfig(null), {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }
}
