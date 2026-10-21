import { randomUUID } from "crypto";
import ChatbotConversation from "@/models/ChatbotConversation";
import ChatbotMessage from "@/models/ChatbotMessage";
import { ChatbotError, cleanChatbotHtml, errorPayload, okPayload } from "@/lib/chatbot/service";

export { errorPayload, okPayload };

const SESSION_ID_PATTERN = /^[a-zA-Z0-9-]{8,128}$/;
const MESSAGE_ID_PATTERN = /^[a-zA-Z0-9-]{8,128}$/;

function validateSessionId(sessionId) {
  const value = String(sessionId || "").trim();
  if (!value || !SESSION_ID_PATTERN.test(value)) {
    throw new ChatbotError(
      "VALIDATION_ERROR",
      "A valid sessionId is required",
      400,
    );
  }
  return value;
}

function validateMessageId(messageId) {
  const value = String(messageId || "").trim();
  if (!value || !MESSAGE_ID_PATTERN.test(value)) {
    throw new ChatbotError(
      "VALIDATION_ERROR",
      "A valid messageId is required",
      400,
    );
  }
  return value;
}

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (value !== "user" && value !== "bot") {
    throw new ChatbotError(
      "VALIDATION_ERROR",
      "role must be user or bot",
      400,
    );
  }
  return value;
}

function serializeMessage(doc) {
  if (!doc) return null;
  const row = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    messageId: String(row.messageId || ""),
    conversationId: String(row.conversationId || ""),
    sessionId: String(row.sessionId || ""),
    role: row.role,
    content: String(row.content || "").replace(/&nbsp;/gi, " ").replace(/\u00A0/g, " "),
    contentHtml: cleanChatbotHtml(row.contentHtml),
    messageType: String(row.messageType || "faq"),
    orderIndex: Number(row.orderIndex || 0),
    metadata:
      row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
}

function serializeConversation(doc) {
  if (!doc) return null;
  const row = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(row._id || ""),
    sessionId: String(row.sessionId || ""),
    entryPage: String(row.entryPage || ""),
    status: String(row.status || "active"),
    lastActivityAt: row.lastActivityAt || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
}

export async function getOrCreateConversation(sessionId, entryPage = "") {
  const normalizedSessionId = validateSessionId(sessionId);
  const now = new Date();

  let conversation = await ChatbotConversation.findOne({
    sessionId: normalizedSessionId,
    status: "active",
  });

  if (!conversation) {
    conversation = await ChatbotConversation.create({
      sessionId: normalizedSessionId,
      entryPage: String(entryPage || "").trim(),
      status: "active",
      lastActivityAt: now,
    });
  } else if (entryPage) {
    conversation.entryPage = String(entryPage || "").trim();
    conversation.lastActivityAt = now;
    await conversation.save();
  }

  return serializeConversation(conversation);
}

export async function createNewConversation(entryPage = "") {
  const sessionId = randomUUID();

  const conversation = await ChatbotConversation.create({
    sessionId,
    entryPage: String(entryPage || "").trim(),
    status: "active",
    lastActivityAt: new Date(),
  });

  return serializeConversation(conversation);
}

export async function getConversationMessages(sessionId) {
  const normalizedSessionId = validateSessionId(sessionId);
  const conversation = await ChatbotConversation.findOne({
    sessionId: normalizedSessionId,
    status: "active",
  });

  if (!conversation) {
    return { conversation: null, messages: [] };
  }

  const messages = await ChatbotMessage.find({
    conversationId: conversation._id,
  })
    .sort({ orderIndex: 1, createdAt: 1 })
    .lean();

  return {
    conversation: serializeConversation(conversation),
    messages: messages.map(serializeMessage),
  };
}

export async function appendConversationMessages(sessionId, messagesInput = []) {
  const normalizedSessionId = validateSessionId(sessionId);
  if (!Array.isArray(messagesInput) || messagesInput.length === 0) {
    throw new ChatbotError(
      "VALIDATION_ERROR",
      "At least one message is required",
      400,
    );
  }

  const entryPage =
    messagesInput.find((item) => item?.metadata?.entryPage)?.metadata
      ?.entryPage || "";

  const conversationDoc = await ChatbotConversation.findOne({
    sessionId: normalizedSessionId,
    status: "active",
  });

  let conversation = conversationDoc;
  if (!conversation) {
    conversation = await ChatbotConversation.create({
      sessionId: normalizedSessionId,
      entryPage: String(entryPage || "").trim(),
      status: "active",
      lastActivityAt: new Date(),
    });
  }

  const existingCount = await ChatbotMessage.countDocuments({
    conversationId: conversation._id,
  });

  const normalizedMessages = messagesInput.map((item, index) => {
    const messageId = validateMessageId(
      item?.messageId || randomUUID(),
    );
    const role = normalizeRole(item?.role);
    const orderIndex =
      item?.orderIndex != null && Number.isFinite(Number(item.orderIndex))
        ? Number(item.orderIndex)
        : existingCount + index;

    return {
      conversationId: conversation._id,
      sessionId: normalizedSessionId,
      messageId,
      role,
      content: String(item?.content || "")
        .replace(/&nbsp;/gi, " ")
        .replace(/\u00A0/g, " ")
        .trim(),
      contentHtml: cleanChatbotHtml(item?.contentHtml),
      messageType: String(item?.messageType || "faq"),
      orderIndex,
      metadata:
        item?.metadata && typeof item.metadata === "object" ? item.metadata : {},
    };
  });

  const messageIds = normalizedMessages.map((item) => item.messageId);
  const existing = await ChatbotMessage.find({
    messageId: { $in: messageIds },
  }).lean();
  const existingIds = new Set(existing.map((item) => String(item.messageId)));

  const toInsert = normalizedMessages.filter(
    (item) => !existingIds.has(item.messageId),
  );

  if (toInsert.length > 0) {
    await ChatbotMessage.insertMany(toInsert, { ordered: true });
  }

  conversation.lastActivityAt = new Date();
  await conversation.save();

  const saved = await ChatbotMessage.find({
    messageId: { $in: messageIds },
  })
    .sort({ orderIndex: 1, createdAt: 1 })
    .lean();

  return {
    conversation: serializeConversation(conversation),
    messages: saved.map(serializeMessage),
  };
}

export async function closeConversation(sessionId) {
  const normalizedSessionId = validateSessionId(sessionId);
  const conversation = await ChatbotConversation.findOneAndUpdate(
    { sessionId: normalizedSessionId, status: "active" },
    { status: "closed", lastActivityAt: new Date() },
    { new: true },
  );
  return serializeConversation(conversation);
}
