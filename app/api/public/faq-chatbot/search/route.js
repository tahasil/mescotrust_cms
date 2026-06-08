import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FAQChatbotConfig from "@/models/FAQChatbotConfig";
import FAQChatbotNode from "@/models/FAQChatbotNode";
import FAQChatbotSearchIndex from "@/models/FAQChatbotSearchIndex";
import {
  FAQ_CHATBOT_SETTINGS_KEY,
  toPublicFaqChatbotConfig,
  serializeFaqChatbotNode,
  normalizeFaqChatbotSearchQuery,
  expandFaqChatbotSearchTokens,
  buildFaqChatbotSearchRegex,
  scoreFaqChatbotSearchCandidate,
  buildFaqChatbotSearchIndexStatus,
  buildFaqChatbotSearchMetricsUpdate,
} from "@/lib/faqChatbot";
import { rebuildFaqChatbotSearchIndex } from "@/lib/faqChatbotIndex";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_CANDIDATE_SCAN = 800;

function queueSearchMetricsUpdate({
  normalizedQuery,
  resultCount,
  latencyMs,
  source,
}) {
  const update = buildFaqChatbotSearchMetricsUpdate({
    normalizedQuery,
    resultCount,
    latencyMs,
    source,
  });
  FAQChatbotConfig.updateOne(
    { settingsKey: FAQ_CHATBOT_SETTINGS_KEY },
    update,
  ).catch(() => {
    // Metrics must be best-effort and never block user-facing search.
  });
}

function parsePagination(searchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize")) || 20));
  return { page, pageSize };
}

async function ensureSearchIndexReady(treeVersion, previousStatus) {
  const [totalNodes, indexedRows] = await Promise.all([
    FAQChatbotNode.countDocuments({}),
    FAQChatbotSearchIndex.countDocuments({ treeVersion }),
  ]);

  if (totalNodes > 0 && indexedRows === 0) {
    try {
      const summary = await rebuildFaqChatbotSearchIndex({ treeVersion });
      try {
        await FAQChatbotConfig.updateOne(
          { settingsKey: FAQ_CHATBOT_SETTINGS_KEY },
          {
            $set: {
              searchIndexStatus: buildFaqChatbotSearchIndexStatus(summary, {
                source: "auto-repair",
                previousStatus,
                treeVersion,
                incrementAutoRepairCount: true,
              }),
            },
          },
        );
      } catch {
        // Telemetry write failures should not block user search.
      }
      return { totalNodes, autoRepaired: true };
    } catch (err) {
      try {
        await FAQChatbotConfig.updateOne(
          { settingsKey: FAQ_CHATBOT_SETTINGS_KEY },
          {
            $set: {
              searchIndexStatus: buildFaqChatbotSearchIndexStatus(null, {
                source: "auto-repair",
                previousStatus,
                treeVersion,
                errorMessage: String(err?.message || "Auto-repair failed"),
                incrementAutoRepairCount: true,
              }),
            },
          },
        );
      } catch {
        // Ignore telemetry update failure.
      }
      throw err;
    }
  }
  return { totalNodes, autoRepaired: false };
}

function rankAndDedupeQuestionIds(candidates, normalizedQuery) {
  const questionScoreMap = new Map();
  for (const candidate of candidates) {
    const questionNodeId = String(candidate?.questionNodeId || "").trim();
    if (!questionNodeId) continue;
    const score = scoreFaqChatbotSearchCandidate(candidate, normalizedQuery);
    const current = questionScoreMap.get(questionNodeId);
    if (!current || score > current.score) {
      questionScoreMap.set(questionNodeId, { score, pathText: String(candidate?.pathText || "") });
    }
  }
  return questionScoreMap;
}

async function buildResultsFromQuestionScores(questionScoreMap) {
  const questionIds = Array.from(questionScoreMap.keys());
  if (questionIds.length === 0) return [];
  const questions = await FAQChatbotNode.find({
    nodeId: { $in: questionIds },
    type: "question",
    isActive: true,
  }).lean();

  return questions
    .map((doc) => serializeFaqChatbotNode(doc))
    .map((question) => ({
      questionNodeId: question.nodeId,
      questionText: question.questionText,
      pathText:
        question.pathText ||
        questionScoreMap.get(question.nodeId)?.pathText ||
        question.questionText,
      score: questionScoreMap.get(question.nodeId)?.score || 0,
      depth: question.depth,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.questionText.localeCompare(b.questionText);
    });
}

async function fallbackNodeSearch(regex, normalizedQuery) {
  const nodes = await FAQChatbotNode.find({
    isActive: true,
    $or: [{ questionText: regex }, { answerText: regex }, { pathText: regex }],
  })
    .limit(MAX_CANDIDATE_SCAN)
    .lean();

  const serialized = nodes.map((node) => serializeFaqChatbotNode(node));
  const nodeMap = new Map(serialized.map((node) => [node.nodeId, node]));
  const referencedQuestionIds = new Set();
  for (const node of serialized) {
    if (node.type === "question") continue;
    for (let i = node.pathNodeIds.length - 1; i >= 0; i -= 1) {
      const candidateId = node.pathNodeIds[i];
      if (candidateId === node.nodeId) continue;
      referencedQuestionIds.add(candidateId);
      break;
    }
  }

  if (referencedQuestionIds.size > 0) {
    const missingQuestionIds = Array.from(referencedQuestionIds).filter((id) => !nodeMap.has(id));
    if (missingQuestionIds.length > 0) {
      const additionalQuestions = await FAQChatbotNode.find({
        nodeId: { $in: missingQuestionIds },
        type: "question",
        isActive: true,
      }).lean();
      for (const question of additionalQuestions) {
        const item = serializeFaqChatbotNode(question);
        nodeMap.set(item.nodeId, item);
      }
    }
  }

  const candidates = serialized.map((node) => {
    if (node.type === "question") {
      return {
        questionNodeId: node.nodeId,
        type: node.type,
        text: node.questionText,
        pathText: node.pathText,
        depth: node.depth,
        weight: 90,
      };
    }
    let questionNodeId = "";
    for (let i = node.pathNodeIds.length - 1; i >= 0; i -= 1) {
      const candidate = nodeMap.get(node.pathNodeIds[i]);
      if (candidate?.type === "question") {
        questionNodeId = candidate.nodeId;
        break;
      }
    }
    return {
      questionNodeId,
      type: node.type,
      text: node.answerText,
      pathText: node.pathText,
      depth: node.depth,
      weight: 70,
    };
  });

  const questionScoreMap = rankAndDedupeQuestionIds(candidates, normalizedQuery);
  return buildResultsFromQuestionScores(questionScoreMap);
}

export async function GET(req) {
  try {
    const requestStartedAt = Date.now();
    const { searchParams } = new URL(req.url);
    const normalizedQuery = normalizeFaqChatbotSearchQuery(searchParams.get("q") || "");
    const { page, pageSize } = parsePagination(searchParams);

    await connectDB();
    const configDoc = await FAQChatbotConfig.findOne({
      settingsKey: FAQ_CHATBOT_SETTINGS_KEY,
    }).lean();
    const publicConfig = toPublicFaqChatbotConfig(configDoc);

    if (normalizedQuery.length < 2) {
      return NextResponse.json(
        {
          results: [],
          matchedCount: 0,
          pagination: {
            page,
            pageSize,
            totalPages: 0,
            totalResults: 0,
          },
          noResultsFoundMessage: null,
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        },
      );
    }

    const treeVersion = Math.max(1, Number(publicConfig.treeVersion) || 1);
    await ensureSearchIndexReady(treeVersion, configDoc?.searchIndexStatus);

    const expandedTokens = expandFaqChatbotSearchTokens(normalizedQuery);
    const searchRegex = buildFaqChatbotSearchRegex(expandedTokens);
    if (!searchRegex) {
      queueSearchMetricsUpdate({
        normalizedQuery,
        resultCount: 0,
        latencyMs: Date.now() - requestStartedAt,
        source: "none",
      });
      return NextResponse.json(
        {
          results: [],
          matchedCount: 0,
          pagination: {
            page,
            pageSize,
            totalPages: 0,
            totalResults: 0,
          },
          noResultsFoundMessage: publicConfig.noResultsFoundMessage,
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        },
      );
    }

    const indexCandidates = await FAQChatbotSearchIndex.find({
      treeVersion,
      isActive: true,
      $or: [{ text: searchRegex }, { pathText: searchRegex }],
    })
      .sort({ weight: -1, depth: 1 })
      .limit(MAX_CANDIDATE_SCAN)
      .lean();

    const rankedResults = indexCandidates.length > 0
      ? await buildResultsFromQuestionScores(
          rankAndDedupeQuestionIds(indexCandidates, normalizedQuery),
        )
      : await fallbackNodeSearch(searchRegex, normalizedQuery);

    const totalResults = rankedResults.length;
    queueSearchMetricsUpdate({
      normalizedQuery,
      resultCount: totalResults,
      latencyMs: Date.now() - requestStartedAt,
      source: indexCandidates.length > 0 ? "indexed" : "fallback",
    });

    const totalPages = totalResults === 0 ? 0 : Math.ceil(totalResults / pageSize);
    const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const pagedResults = totalResults === 0 ? [] : rankedResults.slice(start, start + pageSize);

    return NextResponse.json(
      {
        results: pagedResults.map((item) => ({
          questionNodeId: item.questionNodeId,
          questionText: item.questionText,
          pathText: item.pathText,
          score: item.score,
        })),
        matchedCount: totalResults,
        pagination: {
          page: safePage,
          pageSize,
          totalPages,
          totalResults,
        },
        noResultsFoundMessage:
          totalResults === 0 ? publicConfig.noResultsFoundMessage : null,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to search FAQ chatbot" }, { status: 500 });
  }
}
