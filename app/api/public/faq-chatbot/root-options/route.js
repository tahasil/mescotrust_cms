import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FAQChatbotConfig from "@/models/FAQChatbotConfig";
import FAQChatbotNode from "@/models/FAQChatbotNode";
import {
  FAQ_CHATBOT_SETTINGS_KEY,
  toPublicFaqChatbotConfig,
  serializeFaqChatbotNode,
} from "@/lib/faqChatbot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();
    const [configDoc, roots] = await Promise.all([
      FAQChatbotConfig.findOne({ settingsKey: FAQ_CHATBOT_SETTINGS_KEY }).lean(),
      FAQChatbotNode.find({
        parentNodeId: null,
        type: "question",
        isActive: true,
      })
        .sort({ order: 1, nodeId: 1 })
        .lean(),
    ]);

    const publicConfig = toPublicFaqChatbotConfig(configDoc);
    const options = roots.map((node) => {
      const item = serializeFaqChatbotNode(node);
      return {
        nodeId: item.nodeId,
        questionText: item.questionText,
        order: item.order,
        pathText: item.pathText || item.questionText,
        depth: item.depth,
      };
    });

    return NextResponse.json(
      {
        enabled: publicConfig.enabled,
        treeVersion: publicConfig.treeVersion,
        options,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to load root options" }, { status: 500 });
  }
}
