import { NextResponse } from "next/server";
import {
  generateAiChatbotResponse,
  getPublicAiChatbotConfig,
  redactPII,
} from "@/lib/aiChatbotService";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 20 });

function toSafeString(value) {
  return value == null ? "" : String(value).trim();
}

export async function POST(req) {
  const clientId = getClientIp(req);
  if (!checkRateLimit(`chatbot:${clientId}`)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = toSafeString(body?.message);
  const sessionId = toSafeString(body?.sessionId).slice(0, 120);
  const page = toSafeString(body?.page).slice(0, 300);
  const locale = toSafeString(body?.locale).slice(0, 30);

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > 1000) {
    return NextResponse.json(
      { error: "Message must be 1000 characters or fewer" },
      { status: 400 },
    );
  }

  try {
    console.log("[Chatbot] Incoming message", {
      sessionId,
      page,
      locale,
      message: redactPII(message).slice(0, 240),
    });

    const result = await generateAiChatbotResponse({
      message,
      sessionId,
      page,
      locale,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (err) {
    const publicConfig = await getPublicAiChatbotConfig().catch(() => ({}));
    const fallbackText = publicConfig?.messages?.errorMessage || "";
    return NextResponse.json(
      {
        reply: fallbackText,
        source: "fallback",
        escalation: publicConfig?.escalation || null,
        quickActions: publicConfig?.quickActions || [],
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  }
}
