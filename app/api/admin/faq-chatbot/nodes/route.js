import FAQChatbotConfig from "@/models/FAQChatbotConfig";
import FAQChatbotNode from "@/models/FAQChatbotNode";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { FAQ_CHATBOT_SETTINGS_KEY, serializeFaqChatbotNode } from "@/lib/faqChatbot";
import {
  createFaqChatbotNodeId,
  fetchFaqChatbotAdminPayload,
  getActor,
  parseTreeVersionToken,
  replaceFaqChatbotTree,
  runWithOptionalTransaction,
} from "@/lib/faqChatbotAdminApi";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function withNoStore(body, init = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...(init.headers || {}),
    },
  });
}

function normalizeType(rawType) {
  return String(rawType || "").trim().toLowerCase() === "answer" ? "answer" : "question";
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const versionToken = parseTreeVersionToken(body?.treeVersion, { required: true });
    if (versionToken.error) {
      return NextResponse.json({ error: versionToken.error }, { status: 400 });
    }

    const type = normalizeType(body?.type);
    const parentNodeId = String(body?.parentNodeId || "").trim() || null;
    const text = String(body?.text || "").trim();
    const orderInput = Number(body?.order);

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    if (type === "answer" && !parentNodeId) {
      return NextResponse.json(
        { error: "Answer nodes must have a question parentNodeId" },
        { status: 400 },
      );
    }

    await connectDB();
    const actor = getActor(session);
    let writeSummary = null;
    let createdNodeId = "";

    const writeResult = await runWithOptionalTransaction(async (dbSession) => {
      const configQuery = { settingsKey: FAQ_CHATBOT_SETTINGS_KEY };
      const configDoc = dbSession
        ? await FAQChatbotConfig.findOne(configQuery).session(dbSession)
        : await FAQChatbotConfig.findOne(configQuery);
      const configModel =
        configDoc || new FAQChatbotConfig({ settingsKey: FAQ_CHATBOT_SETTINGS_KEY });
      const currentVersion = Math.max(1, Number(configModel.treeVersion) || 1);

      if (versionToken.value !== currentVersion) {
        return { conflict: true, currentVersion };
      }

      const nodeDocs = dbSession
        ? await FAQChatbotNode.find({}).session(dbSession).lean()
        : await FAQChatbotNode.find({}).lean();
      const existingNodes = nodeDocs.map((node) => serializeFaqChatbotNode(node));
      const parentNode = parentNodeId
        ? existingNodes.find((node) => node.nodeId === parentNodeId) || null
        : null;

      if (parentNodeId && !parentNode) {
        return { validationError: true, errors: ["parentNodeId does not exist"] };
      }
      if (parentNode && parentNode.type !== "question") {
        return {
          validationError: true,
          errors: ["parentNodeId must reference a question node"],
        };
      }

      const siblingCount = existingNodes.filter(
        (node) => (node.parentNodeId || null) === (parentNodeId || null),
      ).length;
      const nodeOrder = Number.isFinite(orderInput) ? Math.max(0, Math.floor(orderInput)) : siblingCount;
      const nextNode = {
        nodeId: createFaqChatbotNodeId(type),
        parentNodeId,
        type,
        questionText: type === "question" ? text : "",
        answerText: type === "answer" ? text : "",
        order: nodeOrder,
        isActive: true,
      };
      createdNodeId = nextNode.nodeId;

      const mutation = await replaceFaqChatbotTree({
        rawNodes: [...existingNodes, nextNode],
        configModel,
        actor,
        session: dbSession,
        rebuildSource: "node-create",
      });
      if (mutation.validationError) {
        return { validationError: true, errors: mutation.errors };
      }
      writeSummary = mutation.summary;
      return { conflict: false, validationError: false };
    });

    if (writeResult?.conflict) {
      return NextResponse.json(
        {
          error: "Version conflict. Data changed by another admin. Refresh and retry.",
          code: "FAQ_CHATBOT_VERSION_CONFLICT",
          currentTreeVersion: writeResult.currentVersion,
        },
        { status: 409 },
      );
    }
    if (writeResult?.validationError) {
      return NextResponse.json({ error: writeResult.errors.join("; ") }, { status: 400 });
    }

    const payload = await fetchFaqChatbotAdminPayload();
    return withNoStore(
      {
        ...payload,
        createdNodeId,
        ...(writeSummary ? { searchIndexRebuild: writeSummary } : {}),
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to create FAQ node" }, { status: 500 });
  }
}
