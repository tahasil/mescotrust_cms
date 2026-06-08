import FAQChatbotNode from "@/models/FAQChatbotNode";
import FAQChatbotSearchIndex from "@/models/FAQChatbotSearchIndex";
import { buildFaqChatbotSearchIndexRows } from "@/lib/faqChatbot";

export async function rebuildFaqChatbotSearchIndex({ treeVersion, session = null }) {
  const startedAt = Date.now();
  const safeTreeVersion = Math.max(1, Number(treeVersion) || 1);
  const nodes = session
    ? await FAQChatbotNode.find({}).session(session).lean()
    : await FAQChatbotNode.find({}).lean();
  const scannedNodes = nodes.length;
  const { rows, skippedRows } = buildFaqChatbotSearchIndexRows(nodes, safeTreeVersion);

  if (session) {
    await FAQChatbotSearchIndex.deleteMany({}).session(session);
  } else {
    await FAQChatbotSearchIndex.deleteMany({});
  }
  if (rows.length > 0) {
    await FAQChatbotSearchIndex.insertMany(rows, {
      ordered: false,
      ...(session ? { session } : {}),
    });
  }

  return {
    treeVersion: safeTreeVersion,
    scannedNodes,
    indexedRows: rows.length,
    skippedRows,
    durationMs: Date.now() - startedAt,
  };
}
