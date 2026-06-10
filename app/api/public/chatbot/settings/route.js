import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  ChatbotError,
  errorPayload,
  getSettings,
  okPayload,
} from "@/lib/chatbot/service";

export const dynamic = "force-dynamic";

function toPublicSettings(settings) {
  const source = settings && typeof settings === "object" ? settings : {};
  return {
    enabled: source.enabled !== false,
    botName: source.botName || "MESCO Help Desk",
    welcomeMessage: source.welcomeMessage || "Welcome to MESCO Trust",
    welcomeSubtitle: source.welcomeSubtitle || "How can we help you today?",
    avatarMediaId: source.avatarMediaId || "",
    themeColor: source.themeColor || "#1677ff",
    position: source.position === "left" ? "left" : "right",
    width: Number(source.width || 360),
    height: Number(source.height || 560),
    borderRadius: Number(source.borderRadius || 16),
    headerColor: source.headerColor || "#1677ff",
    chatBackgroundColor: source.chatBackgroundColor || "#ffffff",
    botMessageBubbleColor: source.botMessageBubbleColor || "#f5f5f5",
    botMessageTextColor: source.botMessageTextColor || "#1f1f1f",
    userMessageBubbleColor: source.userMessageBubbleColor || "#1677ff",
    userMessageTextColor: source.userMessageTextColor || "#ffffff",
    quickOptionButtonColor: source.quickOptionButtonColor || "#f0f5ff",
    quickOptionButtonTextColor: source.quickOptionButtonTextColor || "#0958d9",
    linkAccentColor: source.linkAccentColor || "#1677ff",
    borderColor: source.borderColor || "#e8e8e8",
    fontSize: Number(source.fontSize || 14),
    enableSearch: source.enableSearch !== false,
    minSearchChars: Math.max(1, Number(source.minSearchChars || 2)),
    maxSearchResults: Math.max(1, Number(source.maxSearchResults || 8)),
    searchEnabledFields: source.searchEnabledFields || {
      title: true,
      answer: true,
      keywords: true,
      tags: true,
      synonyms: true,
    },
    enableBreadcrumb: source.enableBreadcrumb !== false,
    enableHomeButton: source.enableHomeButton !== false,
    enableBackButton: source.enableBackButton !== false,
    enableRelatedQuestions: source.enableRelatedQuestions !== false,
    enableTypingAnimation: source.enableTypingAnimation !== false,
    enableContactBlock: source.enableContactBlock !== false,
    featuredQuestionIds: Array.isArray(source.featuredQuestionIds)
      ? source.featuredQuestionIds
      : [],
    popularQuestionIds: Array.isArray(source.popularQuestionIds)
      ? source.popularQuestionIds
      : [],
    welcomeBannerMediaId: source.welcomeBannerMediaId || "",
    contactActions: Array.isArray(source.contactActions)
      ? source.contactActions
          .filter((action) => action && action.enabled !== false)
          .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
      : [],
  };
}

export async function GET() {
  try {
    await connectDB();
    const settings = await getSettings({ bootstrap: true });
    return NextResponse.json(okPayload(toPublicSettings(settings)), {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err) {
    if (err instanceof ChatbotError) {
      return NextResponse.json(errorPayload(err.code, err.message, err.details), {
        status: err.status,
      });
    }
    return NextResponse.json(errorPayload("SERVER_ERROR", err.message), { status: 500 });
  }
}
