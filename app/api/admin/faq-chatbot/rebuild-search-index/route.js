import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import FAQChatbotConfig from "@/models/FAQChatbotConfig";
import {
  FAQ_CHATBOT_SETTINGS_KEY,
  toAdminFaqChatbotConfig,
  buildFaqChatbotSearchIndexStatus,
} from "@/lib/faqChatbot";
import { rebuildFaqChatbotSearchIndex } from "@/lib/faqChatbotIndex";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    await connectDB();
    const configDoc = await FAQChatbotConfig.findOne({
      settingsKey: FAQ_CHATBOT_SETTINGS_KEY,
    });
    if (!configDoc) {
      return NextResponse.json(
        { error: "FAQ chatbot configuration not found. Save settings first." },
        { status: 404 },
      );
    }

    const treeVersion = Math.max(1, Number(configDoc.treeVersion) || 1);
    const summary = await rebuildFaqChatbotSearchIndex({ treeVersion });
    configDoc.searchIndexStatus = buildFaqChatbotSearchIndexStatus(summary, {
      source: "manual",
      previousStatus: configDoc.searchIndexStatus,
      treeVersion,
    });
    await configDoc.save();
    return NextResponse.json(
      {
        ok: true,
        config: toAdminFaqChatbotConfig(configDoc),
        ...summary,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to rebuild FAQ chatbot search index" },
      { status: 500 },
    );
  }
}
