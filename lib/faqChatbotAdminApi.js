import mongoose from "mongoose";
import FAQChatbotConfig from "@/models/FAQChatbotConfig";
import FAQChatbotNode from "@/models/FAQChatbotNode";
import {
  FAQ_CHATBOT_SETTINGS_KEY,
  toAdminFaqChatbotConfig,
  serializeFaqChatbotNode,
  buildFaqChatbotTree,
  normalizeFaqChatbotNodes,
  buildFaqChatbotSearchIndexStatus,
} from "@/lib/faqChatbot";
import { rebuildFaqChatbotSearchIndex } from "@/lib/faqChatbotIndex";

const TREE_ROOT_KEY = "__root__";

export function getActor(session) {
  return String(session?.email || session?.id || session?.name || "").trim();
}

export function createFaqChatbotNodeId(type = "question") {
  const prefix = type === "answer" ? "a" : "q";
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function parseTreeVersionToken(value, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    return {
      provided: false,
      value: null,
      error: required ? "treeVersion is required" : null,
    };
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 1) {
    return { provided: true, value: NaN, error: "treeVersion must be a positive number" };
  }
  return { provided: true, value: Math.floor(num), error: null };
}

export function isTransactionUnsupportedError(err) {
  const message = String(err?.message || "");
  return (
    /Transaction numbers are only allowed/i.test(message) ||
    /Transaction .* not supported/i.test(message) ||
    /replica set/i.test(message)
  );
}

export async function runWithOptionalTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let output = null;
    await session.withTransaction(async () => {
      output = await work(session);
    });
    return output;
  } catch (err) {
    if (!isTransactionUnsupportedError(err)) throw err;
    return work(null);
  } finally {
    await session.endSession();
  }
}

export async function fetchFaqChatbotAdminPayload() {
  const [configDoc, nodeDocs] = await Promise.all([
    FAQChatbotConfig.findOne({ settingsKey: FAQ_CHATBOT_SETTINGS_KEY }).lean(),
    FAQChatbotNode.find({}).sort({ parentNodeId: 1, order: 1, nodeId: 1 }).lean(),
  ]);
  const nodes = nodeDocs.map((doc) => serializeFaqChatbotNode(doc));
  return {
    config: toAdminFaqChatbotConfig(configDoc),
    nodes,
    tree: buildFaqChatbotTree(nodes),
  };
}

export function collectSubtreeNodeIds(nodes, rootNodeId) {
  const queue = [rootNodeId];
  const deleted = new Set();
  const childrenByParent = new Map();
  for (const node of nodes) {
    const key = node.parentNodeId || TREE_ROOT_KEY;
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key).push(node);
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || deleted.has(current)) continue;
    deleted.add(current);
    const children = childrenByParent.get(current) || [];
    for (const child of children) {
      queue.push(child.nodeId);
    }
  }

  return deleted;
}

export async function replaceFaqChatbotTree({
  rawNodes,
  configModel,
  actor,
  session = null,
  rebuildSource = "tree-save",
}) {
  const { nodes: normalizedNodes, errors } = normalizeFaqChatbotNodes(rawNodes);
  if (errors.length > 0) {
    return {
      validationError: true,
      errors,
      summary: null,
      nextTreeVersion: null,
    };
  }

  const isNewConfig = configModel.isNew;
  const currentVersion = Math.max(1, Number(configModel.treeVersion) || 1);
  const nextTreeVersion = isNewConfig ? 1 : currentVersion + 1;

  configModel.settingsKey = FAQ_CHATBOT_SETTINGS_KEY;
  configModel.updatedBy = actor;
  configModel.treeVersion = nextTreeVersion;
  if (session) {
    await configModel.save({ session });
  } else {
    await configModel.save();
  }

  if (session) {
    await FAQChatbotNode.deleteMany({}).session(session);
  } else {
    await FAQChatbotNode.deleteMany({});
  }

  if (normalizedNodes.length > 0) {
    const docs = normalizedNodes.map((node) => ({
      ...node,
      createdBy: actor,
      updatedBy: actor,
    }));
    await FAQChatbotNode.insertMany(docs, {
      ordered: false,
      ...(session ? { session } : {}),
    });
  }

  const summary = await rebuildFaqChatbotSearchIndex({
    treeVersion: nextTreeVersion,
    session,
  });
  configModel.searchIndexStatus = buildFaqChatbotSearchIndexStatus(summary, {
    source: rebuildSource,
    previousStatus: configModel.searchIndexStatus,
    treeVersion: nextTreeVersion,
  });
  if (session) {
    await configModel.save({ session });
  } else {
    await configModel.save();
  }

  return {
    validationError: false,
    errors: [],
    summary,
    nextTreeVersion,
    normalizedNodes,
  };
}
