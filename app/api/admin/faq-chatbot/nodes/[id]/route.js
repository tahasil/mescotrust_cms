import FAQChatbotConfig from "@/models/FAQChatbotConfig";
import FAQChatbotNode from "@/models/FAQChatbotNode";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { FAQ_CHATBOT_SETTINGS_KEY, serializeFaqChatbotNode } from "@/lib/faqChatbot";
import {
  collectSubtreeNodeIds,
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

async function parseJsonBody(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export async function PATCH(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  const nodeId = String(params?.id || "").trim();
  if (!nodeId) {
    return NextResponse.json({ error: "Node ID is required" }, { status: 400 });
  }

  try {
    const body = await parseJsonBody(req);
    const versionToken = parseTreeVersionToken(body?.treeVersion, { required: true });
    if (versionToken.error) {
      return NextResponse.json({ error: versionToken.error }, { status: 400 });
    }

    const hasParentNodeId = Object.prototype.hasOwnProperty.call(body || {}, "parentNodeId");
    const hasOrder = Object.prototype.hasOwnProperty.call(body || {}, "order");
    const hasText = Object.prototype.hasOwnProperty.call(body || {}, "text");
    if (!hasParentNodeId && !hasOrder && !hasText) {
      return NextResponse.json(
        { error: "At least one mutable field is required (text, parentNodeId, order)" },
        { status: 400 },
      );
    }

    await connectDB();
    const actor = getActor(session);
    let writeSummary = null;

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
      const currentNode = existingNodes.find((node) => node.nodeId === nodeId);
      if (!currentNode) {
        return { notFound: true };
      }

      const targetParentNodeId = hasParentNodeId
        ? String(body?.parentNodeId || "").trim() || null
        : currentNode.parentNodeId || null;
      const targetOrder = hasOrder ? Math.max(0, Math.floor(Number(body?.order) || 0)) : currentNode.order;
      const targetText = hasText ? String(body?.text || "").trim() : null;
      if (hasText && !targetText) {
        return { validationError: true, errors: ["text is required"] };
      }

      if (currentNode.type === "answer" && !targetParentNodeId) {
        return {
          validationError: true,
          errors: ["Answer nodes must have a question parentNodeId"],
        };
      }

      const subtreeIds = collectSubtreeNodeIds(existingNodes, currentNode.nodeId);
      if (targetParentNodeId && subtreeIds.has(targetParentNodeId)) {
        return {
          validationError: true,
          errors: ["Invalid move: parentNodeId cannot be the node itself or its descendant"],
        };
      }

      if (targetParentNodeId) {
        const parentNode = existingNodes.find((node) => node.nodeId === targetParentNodeId);
        if (!parentNode) {
          return { validationError: true, errors: ["parentNodeId does not exist"] };
        }
        if (parentNode.type !== "question") {
          return {
            validationError: true,
            errors: ["parentNodeId must reference a question node"],
          };
        }
      } else if (currentNode.type !== "question") {
        return {
          validationError: true,
          errors: ["Only question nodes can be root nodes"],
        };
      }

      const nextNodes = existingNodes.map((node) => {
        if (node.nodeId !== nodeId) return node;
        return {
          ...node,
          parentNodeId: targetParentNodeId,
          order: targetOrder,
          questionText:
            node.type === "question"
              ? hasText
                ? targetText
                : node.questionText
              : "",
          answerText:
            node.type === "answer"
              ? hasText
                ? targetText
                : node.answerText
              : "",
        };
      });

      const mutation = await replaceFaqChatbotTree({
        rawNodes: nextNodes,
        configModel,
        actor,
        session: dbSession,
        rebuildSource: "node-update",
      });
      if (mutation.validationError) {
        return { validationError: true, errors: mutation.errors };
      }
      writeSummary = mutation.summary;
      return { conflict: false, validationError: false, notFound: false };
    });

    if (writeResult?.notFound) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }
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
        ...(writeSummary ? { searchIndexRebuild: writeSummary } : {}),
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to update FAQ node" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  const nodeId = String(params?.id || "").trim();
  if (!nodeId) {
    return NextResponse.json({ error: "Node ID is required" }, { status: 400 });
  }

  try {
    const body = await parseJsonBody(req);
    const versionToken = parseTreeVersionToken(body?.treeVersion, { required: true });
    if (versionToken.error) {
      return NextResponse.json({ error: versionToken.error }, { status: 400 });
    }

    await connectDB();
    const actor = getActor(session);
    let writeSummary = null;

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
      const targetNode = existingNodes.find((node) => node.nodeId === nodeId);
      if (!targetNode) {
        return { notFound: true };
      }

      const idsToDelete =
        targetNode.type === "question"
          ? collectSubtreeNodeIds(existingNodes, targetNode.nodeId)
          : new Set([targetNode.nodeId]);
      const nextNodes = existingNodes.filter((node) => !idsToDelete.has(node.nodeId));

      const mutation = await replaceFaqChatbotTree({
        rawNodes: nextNodes,
        configModel,
        actor,
        session: dbSession,
        rebuildSource: "node-delete",
      });
      if (mutation.validationError) {
        return { validationError: true, errors: mutation.errors };
      }
      writeSummary = mutation.summary;
      return { conflict: false, validationError: false, notFound: false };
    });

    if (writeResult?.notFound) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }
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
        ...(writeSummary ? { searchIndexRebuild: writeSummary } : {}),
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to delete FAQ node" }, { status: 500 });
  }
}
