import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  ChatbotError,
  errorPayload,
  getSettings,
  okPayload,
} from "@/lib/chatbot/service";
import { CHATBOT_DEFAULT_SETTINGS } from "@/lib/chatbot/constants";

export const dynamic = "force-dynamic";

function toPublicSettings(settings) {
  const source =
    settings && typeof settings === "object"
      ? { ...CHATBOT_DEFAULT_SETTINGS, ...settings }
      : { ...CHATBOT_DEFAULT_SETTINGS };
  const normalizedSearchFields = {
    ...CHATBOT_DEFAULT_SETTINGS.searchEnabledFields,
    ...(source.searchEnabledFields && typeof source.searchEnabledFields === "object"
      ? source.searchEnabledFields
      : {}),
  };
  const hasAtLeastOneSearchField = Object.values(normalizedSearchFields).some(Boolean);

  return {
    enabled: source.enabled !== false,
    botName: source.botName || CHATBOT_DEFAULT_SETTINGS.botName,
    welcomeMessage: source.welcomeMessage || CHATBOT_DEFAULT_SETTINGS.welcomeMessage,
    welcomeSubtitle: source.welcomeSubtitle || CHATBOT_DEFAULT_SETTINGS.welcomeSubtitle,
    avatarMediaId: source.avatarMediaId || "",
    themeColor: source.themeColor || CHATBOT_DEFAULT_SETTINGS.themeColor,
    position: source.position === "left" ? "left" : "right",
    width: Number(source.width || CHATBOT_DEFAULT_SETTINGS.width),
    height: Number(source.height || CHATBOT_DEFAULT_SETTINGS.height),
    borderRadius: Number(source.borderRadius || CHATBOT_DEFAULT_SETTINGS.borderRadius),
    headerColor: source.headerColor || CHATBOT_DEFAULT_SETTINGS.headerColor,
    chatBackgroundColor:
      source.chatBackgroundColor || CHATBOT_DEFAULT_SETTINGS.chatBackgroundColor,
    botMessageBubbleColor:
      source.botMessageBubbleColor || CHATBOT_DEFAULT_SETTINGS.botMessageBubbleColor,
    botMessageTextColor:
      source.botMessageTextColor || CHATBOT_DEFAULT_SETTINGS.botMessageTextColor,
    userMessageBubbleColor:
      source.userMessageBubbleColor || CHATBOT_DEFAULT_SETTINGS.userMessageBubbleColor,
    userMessageTextColor:
      source.userMessageTextColor || CHATBOT_DEFAULT_SETTINGS.userMessageTextColor,
    quickOptionButtonColor:
      source.quickOptionButtonColor || CHATBOT_DEFAULT_SETTINGS.quickOptionButtonColor,
    quickOptionButtonTextColor:
      source.quickOptionButtonTextColor ||
      CHATBOT_DEFAULT_SETTINGS.quickOptionButtonTextColor,
    linkAccentColor: source.linkAccentColor || CHATBOT_DEFAULT_SETTINGS.linkAccentColor,
    borderColor: source.borderColor || CHATBOT_DEFAULT_SETTINGS.borderColor,
    launcherShadow: source.launcherShadow || CHATBOT_DEFAULT_SETTINGS.launcherShadow,
    windowShadow: source.windowShadow || CHATBOT_DEFAULT_SETTINGS.windowShadow,
    bubbleShadow: source.bubbleShadow || CHATBOT_DEFAULT_SETTINGS.bubbleShadow,
    chipShadow: source.chipShadow || CHATBOT_DEFAULT_SETTINGS.chipShadow,
    contentPadding: Math.max(
      8,
      Number(source.contentPadding || CHATBOT_DEFAULT_SETTINGS.contentPadding),
    ),
    footerPadding: Math.max(
      8,
      Number(source.footerPadding || CHATBOT_DEFAULT_SETTINGS.footerPadding),
    ),
    elementGap: Math.max(
      4,
      Number(source.elementGap || CHATBOT_DEFAULT_SETTINGS.elementGap),
    ),
    fontSize: Number(source.fontSize || CHATBOT_DEFAULT_SETTINGS.fontSize),
    enableSearch: source.enableSearch !== false,
    minSearchChars: Math.max(1, Number(source.minSearchChars || CHATBOT_DEFAULT_SETTINGS.minSearchChars)),
    maxSearchResults: Math.max(
      1,
      Number(source.maxSearchResults || CHATBOT_DEFAULT_SETTINGS.maxSearchResults),
    ),
    searchEnabledFields: hasAtLeastOneSearchField
      ? normalizedSearchFields
      : { ...CHATBOT_DEFAULT_SETTINGS.searchEnabledFields },
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
