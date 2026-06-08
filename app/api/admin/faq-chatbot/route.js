import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import FAQChatbotConfig from "@/models/FAQChatbotConfig";
import FAQChatbotNode from "@/models/FAQChatbotNode";
import {
  FAQ_CHATBOT_SETTINGS_KEY,
  normalizeFaqChatbotConfigInput,
  normalizeFaqChatbotNodes,
  toAdminFaqChatbotConfig,
  serializeFaqChatbotNode,
  buildFaqChatbotTree,
  buildFaqChatbotSearchIndexStatus,
} from "@/lib/faqChatbot";
import { rebuildFaqChatbotSearchIndex } from "@/lib/faqChatbotIndex";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getActor(session) {
  return String(session?.email || session?.id || session?.name || "").trim();
}

function isTransactionUnsupportedError(err) {
  const message = String(err?.message || "");
  return (
    /Transaction numbers are only allowed/i.test(message) ||
    /Transaction .* not supported/i.test(message) ||
    /replica set/i.test(message)
  );
}

async function runWithOptionalTransaction(work) {
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

function parseTreeVersionToken(value) {
  if (value === undefined || value === null || value === "") {
    return { provided: false, value: null };
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 1) {
    return { provided: true, value: NaN };
  }
  return { provided: true, value: Math.floor(num) };
}

function withNoStore(body, init = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...(init.headers || {}),
    },
  });
}

async function fetchAdminPayload() {
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

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    await connectDB();
    return withNoStore(await fetchAdminPayload());
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to load FAQ chatbot" }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    await connectDB();

    const versionToken = parseTreeVersionToken(body?.treeVersion);
    if (versionToken.provided && Number.isNaN(versionToken.value)) {
      return NextResponse.json({ error: "treeVersion must be a positive number" }, { status: 400 });
    }

    const hasNodesField = Object.prototype.hasOwnProperty.call(body || {}, "nodes");
    if (hasNodesField && !Array.isArray(body?.nodes)) {
      return NextResponse.json({ error: "nodes must be an array" }, { status: 400 });
    }

    const actor = getActor(session);
    let rebuildSummary = null;

    const writeResult = await runWithOptionalTransaction(async (dbSession) => {
      const query = { settingsKey: FAQ_CHATBOT_SETTINGS_KEY };
      const configDoc = dbSession
        ? await FAQChatbotConfig.findOne(query).session(dbSession)
        : await FAQChatbotConfig.findOne(query);
      const configModel = configDoc || new FAQChatbotConfig({ settingsKey: FAQ_CHATBOT_SETTINGS_KEY });
      const currentVersion = Math.max(1, Number(configModel.treeVersion) || 1);

      if (versionToken.provided && versionToken.value !== currentVersion) {
        return {
          conflict: true,
          currentVersion,
        };
      }

      const configInput =
        body?.config && typeof body.config === "object" ? body.config : (body || {});
      const { config: nextConfig, errors: configErrors } = normalizeFaqChatbotConfigInput(
        configInput,
        configModel,
      );
      if (configErrors.length > 0) {
        return {
          validationError: true,
          errors: configErrors,
        };
      }

      let normalizedNodes = [];
      if (hasNodesField) {
        const { nodes, errors } = normalizeFaqChatbotNodes(body.nodes);
        if (errors.length > 0) {
          return {
            validationError: true,
            errors,
          };
        }
        normalizedNodes = nodes;
      }

      const isNewConfig = configModel.isNew;
      const nextTreeVersion = hasNodesField
        ? (isNewConfig ? 1 : currentVersion + 1)
        : currentVersion;

      configModel.settingsKey = FAQ_CHATBOT_SETTINGS_KEY;
      configModel.enabled = nextConfig.enabled;
      configModel.headerTitle = nextConfig.headerTitle;
      configModel.welcomeMessage = nextConfig.welcomeMessage;
      configModel.noResultsFoundMessage = nextConfig.noResultsFoundMessage;
      configModel.avatar = nextConfig.avatar;
      configModel.colors = nextConfig.colors;
      configModel.position = nextConfig.position;
      configModel.uiPreferences = nextConfig.uiPreferences;
      configModel.updatedBy = actor;
      configModel.treeVersion = nextTreeVersion;

      if (dbSession) {
        await configModel.save({ session: dbSession });
      } else {
        await configModel.save();
      }

      if (hasNodesField) {
        if (dbSession) {
          await FAQChatbotNode.deleteMany({}).session(dbSession);
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
            ...(dbSession ? { session: dbSession } : {}),
          });
        }

        rebuildSummary = await rebuildFaqChatbotSearchIndex({
          treeVersion: nextTreeVersion,
          session: dbSession,
        });

        configModel.searchIndexStatus = buildFaqChatbotSearchIndexStatus(rebuildSummary, {
          source: "tree-save",
          previousStatus: configModel.searchIndexStatus,
          treeVersion: nextTreeVersion,
        });
        if (dbSession) {
          await configModel.save({ session: dbSession });
        } else {
          await configModel.save();
        }
      }

      return {
        conflict: false,
        validationError: false,
      };
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

    const payload = await fetchAdminPayload();
    return withNoStore(
      {
        ...payload,
        ...(rebuildSummary ? { searchIndexRebuild: rebuildSummary } : {}),
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to save FAQ chatbot" }, { status: 500 });
  }
}
