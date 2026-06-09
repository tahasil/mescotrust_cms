import mongoose from "mongoose";
import { normalizeSlug } from "@/lib/slug";
import FaqNode from "@/models/FaqNode";
import ChatbotSettings from "@/models/ChatbotSettings";
import { CHATBOT_DEFAULT_SETTINGS, CHATBOT_SEED_TREE } from "@/lib/chatbot/constants";

const SETTINGS_QUERY = { settingsKey: "default" };
const STATUS_VALUES = new Set(["active", "inactive"]);
let seedBootstrapPromise = null;

export class ChatbotError extends Error {
  constructor(code, message, status = 400, details) {
    super(message);
    this.name = "ChatbotError";
    this.code = code || "VALIDATION_ERROR";
    this.status = status || 400;
    this.details = details;
  }
}

export function okPayload(data, meta) {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function errorPayload(code, message, details) {
  return {
    success: false,
    error: {
      code: code || "SERVER_ERROR",
      message: message || "Unexpected error",
      ...(details ? { details } : {}),
    },
  };
}

export function sanitizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    ),
  );
}

function toObjectId(value, fieldName = "id") {
  if (!value) return null;
  const id = String(value).trim();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ChatbotError("VALIDATION_ERROR", `Invalid ${fieldName}`, 400);
  }
  return new mongoose.Types.ObjectId(id);
}

function normalizedStatus(value, { fallback = "active" } = {}) {
  if (value == null || value === "") return fallback;
  const v = String(value).trim().toLowerCase();
  if (!STATUS_VALUES.has(v)) {
    throw new ChatbotError("INVALID_STATUS", "Status must be active or inactive", 400);
  }
  return v;
}

function parseNumberish(value, fallback = 0) {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSearchFields(value) {
  const base = { ...CHATBOT_DEFAULT_SETTINGS.searchEnabledFields };
  if (!value || typeof value !== "object") return base;
  for (const key of Object.keys(base)) {
    if (value[key] != null) base[key] = Boolean(value[key]);
  }
  return base;
}

function normalizeContactActions(value) {
  if (!Array.isArray(value)) return CHATBOT_DEFAULT_SETTINGS.contactActions;
  return value
    .map((action, index) => ({
      id: String(action?.id || `action-${index + 1}`).trim(),
      actionType: String(action?.actionType || "custom").trim().toLowerCase(),
      label: String(action?.label || "").trim(),
      url: String(action?.url || "").trim(),
      icon: String(action?.icon || "").trim(),
      target: action?.target === "_blank" ? "_blank" : "_self",
      enabled: action?.enabled == null ? true : Boolean(action.enabled),
      sortOrder: parseNumberish(action?.sortOrder, index),
    }))
    .filter((action) => action.id && action.label && action.url)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function asSlug(input, fallbackLabel = "faq-item") {
  const normalized = normalizeSlug(String(input || "").trim());
  if (normalized?.valid && normalized.slug) return normalized.slug;
  const fallback = normalizeSlug(fallbackLabel);
  return fallback?.valid && fallback.slug ? fallback.slug : "faq-item";
}

export async function getUniqueSlug(baseSlug, excludeId = null) {
  const base = asSlug(baseSlug);
  let slug = base;
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await FaqNode.findOne({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select("_id")
      .lean();
    if (!existing) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function seedFaqsIfEmpty() {
  const count = await FaqNode.countDocuments();
  if (count > 0) return;

  const createdRootIds = [];
  const upsertSeedNode = async (item, parentId, sortOrder) => {
    const slug = asSlug(item?.slug || item?.question);
    const node = await FaqNode.findOneAndUpdate(
      { slug },
      {
        $setOnInsert: {
          parentId: parentId || null,
          question: String(item?.question || "").trim(),
          slug,
          answerHtml: String(item?.answerHtml || "").trim(),
          keywords: sanitizeStringList(item?.keywords),
          tags: sanitizeStringList(item?.tags),
          synonyms: sanitizeStringList(item?.synonyms),
          icon: String(item?.icon || "").trim(),
          status: "active",
          sortOrder,
          popularityScore: 0,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    const children = Array.isArray(item?.children) ? item.children : [];
    for (let i = 0; i < children.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await upsertSeedNode(children[i], node._id, i);
    }
    return node._id;
  };

  for (let i = 0; i < CHATBOT_SEED_TREE.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const rootId = await upsertSeedNode(CHATBOT_SEED_TREE[i], null, i);
    createdRootIds.push(rootId);
  }

  const settings = await ChatbotSettings.findOne(SETTINGS_QUERY);
  if (settings) {
    if (!Array.isArray(settings.featuredQuestionIds) || settings.featuredQuestionIds.length === 0) {
      settings.featuredQuestionIds = createdRootIds.slice(0, 4);
    }
    if (!Array.isArray(settings.popularQuestionIds) || settings.popularQuestionIds.length === 0) {
      settings.popularQuestionIds = createdRootIds.slice(0, 4);
    }
    await settings.save();
  }
}

export async function ensureChatbotBootstrap() {
  let settings = await ChatbotSettings.findOne(SETTINGS_QUERY);
  if (!settings) {
    settings = await ChatbotSettings.create({
      settingsKey: "default",
      ...CHATBOT_DEFAULT_SETTINGS,
    });
  }
  if (!seedBootstrapPromise) {
    seedBootstrapPromise = seedFaqsIfEmpty().finally(() => {
      seedBootstrapPromise = null;
    });
  }
  await seedBootstrapPromise;
  return settings;
}

export async function getSettings({ bootstrap = true } = {}) {
  if (bootstrap) await ensureChatbotBootstrap();
  return ChatbotSettings.findOne(SETTINGS_QUERY).lean();
}

function normalizeObjectIdArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((id) => String(id || "").trim())
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
}

export async function updateSettings(payload = {}) {
  const settings =
    (await ChatbotSettings.findOne(SETTINGS_QUERY)) ||
    (await ChatbotSettings.create({ settingsKey: "default", ...CHATBOT_DEFAULT_SETTINGS }));

  const incoming = payload && typeof payload === "object" ? payload : {};

  const directBooleanFields = [
    "enabled",
    "enableSearch",
    "enableBreadcrumb",
    "enableHomeButton",
    "enableBackButton",
    "enableRelatedQuestions",
    "enableTypingAnimation",
    "enableContactBlock",
  ];
  const directStringFields = [
    "botName",
    "welcomeMessage",
    "welcomeSubtitle",
    "avatarMediaId",
    "themeColor",
    "position",
    "headerColor",
    "chatBackgroundColor",
    "botMessageBubbleColor",
    "botMessageTextColor",
    "userMessageBubbleColor",
    "userMessageTextColor",
    "quickOptionButtonColor",
    "quickOptionButtonTextColor",
    "linkAccentColor",
    "borderColor",
    "welcomeBannerMediaId",
  ];
  const directNumberFields = [
    "width",
    "height",
    "borderRadius",
    "fontSize",
    "minSearchChars",
    "maxSearchResults",
  ];

  directBooleanFields.forEach((field) => {
    if (incoming[field] != null) settings[field] = Boolean(incoming[field]);
  });
  directStringFields.forEach((field) => {
    if (incoming[field] != null) settings[field] = String(incoming[field]).trim();
  });
  directNumberFields.forEach((field) => {
    if (incoming[field] != null) settings[field] = parseNumberish(incoming[field], settings[field]);
  });

  if (incoming.general && typeof incoming.general === "object") {
    const group = incoming.general;
    if (group.enabled != null) settings.enabled = Boolean(group.enabled);
    if (group.botName != null) settings.botName = String(group.botName).trim();
    if (group.welcomeMessage != null)
      settings.welcomeMessage = String(group.welcomeMessage).trim();
    if (group.welcomeSubtitle != null)
      settings.welcomeSubtitle = String(group.welcomeSubtitle).trim();
    if (group.avatarMediaId != null)
      settings.avatarMediaId = String(group.avatarMediaId).trim();
    if (group.themeColor != null) settings.themeColor = String(group.themeColor).trim();
    if (group.position != null) settings.position = group.position === "left" ? "left" : "right";
  }

  if (incoming.appearance && typeof incoming.appearance === "object") {
    const group = incoming.appearance;
    for (const [key, value] of Object.entries(group)) {
      if (value == null) continue;
      if (["width", "height", "borderRadius", "fontSize"].includes(key)) {
        settings[key] = parseNumberish(value, settings[key]);
      } else if (typeof value === "string") {
        settings[key] = value.trim();
      }
    }
  }

  if (incoming.features && typeof incoming.features === "object") {
    const group = incoming.features;
    const keys = [
      "enableSearch",
      "enableBreadcrumb",
      "enableHomeButton",
      "enableBackButton",
      "enableRelatedQuestions",
      "enableTypingAnimation",
      "enableContactBlock",
    ];
    keys.forEach((key) => {
      if (group[key] != null) settings[key] = Boolean(group[key]);
    });
  }

  if (incoming.search && typeof incoming.search === "object") {
    const group = incoming.search;
    if (group.minSearchChars != null) {
      settings.minSearchChars = Math.max(1, parseNumberish(group.minSearchChars, settings.minSearchChars));
    }
    if (group.maxSearchResults != null) {
      settings.maxSearchResults = Math.max(1, parseNumberish(group.maxSearchResults, settings.maxSearchResults));
    }
    if (group.enabledFields != null) {
      settings.searchEnabledFields = normalizeSearchFields(group.enabledFields);
    }
  }

  if (incoming.welcome && typeof incoming.welcome === "object") {
    const group = incoming.welcome;
    if (group.featuredQuestionIds != null) {
      settings.featuredQuestionIds = normalizeObjectIdArray(group.featuredQuestionIds);
    }
    if (group.popularQuestionIds != null) {
      settings.popularQuestionIds = normalizeObjectIdArray(group.popularQuestionIds);
    }
    if (group.welcomeBannerMediaId != null) {
      settings.welcomeBannerMediaId = String(group.welcomeBannerMediaId).trim();
    }
  }

  if (incoming.featuredQuestionIds != null) {
    settings.featuredQuestionIds = normalizeObjectIdArray(incoming.featuredQuestionIds);
  }
  if (incoming.popularQuestionIds != null) {
    settings.popularQuestionIds = normalizeObjectIdArray(incoming.popularQuestionIds);
  }
  if (incoming.searchEnabledFields != null) {
    settings.searchEnabledFields = normalizeSearchFields(incoming.searchEnabledFields);
  }
  if (incoming.contactActions != null) {
    settings.contactActions = normalizeContactActions(incoming.contactActions);
  }

  settings.minSearchChars = Math.max(1, parseNumberish(settings.minSearchChars, 2));
  settings.maxSearchResults = Math.max(1, parseNumberish(settings.maxSearchResults, 8));
  settings.width = Math.max(280, parseNumberish(settings.width, 360));
  settings.height = Math.max(380, parseNumberish(settings.height, 560));
  settings.fontSize = Math.max(12, parseNumberish(settings.fontSize, 14));
  settings.borderRadius = Math.max(0, parseNumberish(settings.borderRadius, 16));

  await settings.save();
  return settings.toObject();
}

export function normalizeFaqPayload(input, { partial = false } = {}) {
  const payload = input && typeof input === "object" ? input : {};
  const output = {};

  if (!partial || payload.question != null) {
    const question = String(payload.question || "").trim();
    if (!question) throw new ChatbotError("VALIDATION_ERROR", "Question title is required", 400);
    output.question = question;
  }

  if (!partial || payload.slug != null || output.question) {
    const candidate = payload.slug != null ? String(payload.slug).trim() : output.question;
    const normalized = normalizeSlug(candidate);
    if (!normalized?.valid || !normalized.slug) {
      throw new ChatbotError(
        "VALIDATION_ERROR",
        normalized?.error || "Invalid slug",
        400,
      );
    }
    output.slug = normalized.slug;
  }

  if (!partial || payload.answerHtml != null) {
    output.answerHtml = String(payload.answerHtml || "").trim();
  }

  if (!partial || payload.parentId != null) {
    output.parentId = payload.parentId ? toObjectId(payload.parentId, "parentId") : null;
  }

  if (!partial || payload.keywords != null) {
    output.keywords = sanitizeStringList(payload.keywords);
  }
  if (!partial || payload.tags != null) {
    output.tags = sanitizeStringList(payload.tags);
  }
  if (!partial || payload.synonyms != null) {
    output.synonyms = sanitizeStringList(payload.synonyms);
  }
  if (!partial || payload.icon != null) {
    output.icon = String(payload.icon || "").trim();
  }
  if (!partial || payload.status != null) {
    output.status = normalizedStatus(payload.status, { fallback: "active" });
  }
  if (!partial || payload.sortOrder != null) {
    output.sortOrder = parseNumberish(payload.sortOrder, 0);
  }
  if (!partial || payload.popularityScore != null) {
    output.popularityScore = parseNumberish(payload.popularityScore, 0);
  }

  return output;
}

async function assertParentExists(parentId) {
  if (!parentId) return;
  const parent = await FaqNode.findById(parentId).select("_id").lean();
  if (!parent) {
    throw new ChatbotError("INVALID_PARENT", "Parent question not found", 400);
  }
}

async function assertNoCycle(nodeId, parentId) {
  if (!parentId || !nodeId) return;
  const nodeIdStr = String(nodeId);
  let cursor = String(parentId);
  while (cursor) {
    if (cursor === nodeIdStr) {
      throw new ChatbotError(
        "TREE_CYCLE_DETECTED",
        "Moving question under this parent creates a cycle",
        409,
      );
    }
    const current = await FaqNode.findById(cursor).select("parentId").lean();
    cursor = current?.parentId ? String(current.parentId) : "";
  }
}

async function getMaxSiblingSortOrder(parentId) {
  const sibling = await FaqNode.findOne({ parentId: parentId || null })
    .sort({ sortOrder: -1 })
    .select("sortOrder")
    .lean();
  return sibling ? Number(sibling.sortOrder || 0) : -1;
}

export async function createFaqNode(payload) {
  const normalized = normalizeFaqPayload(payload, { partial: false });
  await assertParentExists(normalized.parentId);

  const slug = await getUniqueSlug(normalized.slug);
  const nextSortOrder =
    payload?.sortOrder == null
      ? (await getMaxSiblingSortOrder(normalized.parentId)) + 1
      : normalized.sortOrder;

  const created = await FaqNode.create({
    ...normalized,
    slug,
    sortOrder: nextSortOrder,
  });
  return created.toObject();
}

export async function updateFaqNode(id, payload) {
  const faqId = toObjectId(id, "faq id");
  const node = await FaqNode.findById(faqId);
  if (!node) throw new ChatbotError("NOT_FOUND", "FAQ node not found", 404);

  const normalized = normalizeFaqPayload(payload, { partial: true });

  if (normalized.parentId != null) {
    if (String(normalized.parentId) === String(node._id)) {
      throw new ChatbotError("INVALID_PARENT", "Question cannot be its own parent", 400);
    }
    await assertParentExists(normalized.parentId);
    await assertNoCycle(node._id, normalized.parentId);
  }

  if (normalized.slug != null) {
    normalized.slug = await getUniqueSlug(normalized.slug, node._id);
  }

  for (const [key, value] of Object.entries(normalized)) {
    node[key] = value;
  }
  await node.save();
  return node.toObject();
}

async function collectDescendants(rootId) {
  const ids = [];
  const queue = [String(rootId)];
  while (queue.length > 0) {
    const current = queue.shift();
    const children = await FaqNode.find({ parentId: current }).select("_id").lean();
    children.forEach((child) => {
      const childId = String(child._id);
      ids.push(childId);
      queue.push(childId);
    });
  }
  return ids;
}

export async function deleteFaqNode(id, mode = "block") {
  const faqId = toObjectId(id, "faq id");
  const node = await FaqNode.findById(faqId);
  if (!node) throw new ChatbotError("NOT_FOUND", "FAQ node not found", 404);

  const children = await FaqNode.find({ parentId: node._id }).select("_id").lean();
  const normalizedMode = String(mode || "block").trim().toLowerCase();
  if (!["block", "cascade", "reparent"].includes(normalizedMode)) {
    throw new ChatbotError("VALIDATION_ERROR", "Invalid delete mode", 400);
  }

  if (normalizedMode === "block" && children.length > 0) {
    throw new ChatbotError(
      "HAS_CHILDREN_DELETE_BLOCKED",
      "Cannot delete question with children in block mode",
      409,
    );
  }

  let deletedCount = 1;
  let reparentedCount = 0;
  if (normalizedMode === "cascade") {
    const descendants = await collectDescendants(node._id);
    if (descendants.length > 0) {
      await FaqNode.deleteMany({ _id: { $in: descendants } });
      deletedCount += descendants.length;
    }
  } else if (normalizedMode === "reparent" && children.length > 0) {
    const parentId = node.parentId || null;
    const maxSort = await getMaxSiblingSortOrder(parentId);
    for (let i = 0; i < children.length; i += 1) {
      await FaqNode.updateOne(
        { _id: children[i]._id },
        { $set: { parentId, sortOrder: maxSort + 1 + i } },
      );
      reparentedCount += 1;
    }
  }

  await FaqNode.deleteOne({ _id: node._id });
  return { deletedCount, reparentedCount };
}

export async function reorderFaqSiblings(parentId, orderedIds) {
  const normalizedParentId = parentId ? toObjectId(parentId, "parentId") : null;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new ChatbotError("VALIDATION_ERROR", "orderedIds is required", 400);
  }

  const normalizedIds = orderedIds.map((id) => String(toObjectId(id, "ordered id")));
  const siblings = await FaqNode.find({ parentId: normalizedParentId })
    .select("_id parentId")
    .lean();
  const siblingIds = siblings.map((item) => String(item._id));
  if (siblingIds.length !== normalizedIds.length) {
    throw new ChatbotError("VALIDATION_ERROR", "orderedIds must include all siblings", 400);
  }
  const idSet = new Set(siblingIds);
  for (const id of normalizedIds) {
    if (!idSet.has(id)) {
      throw new ChatbotError("VALIDATION_ERROR", "orderedIds contain invalid sibling ids", 400);
    }
  }

  for (let i = 0; i < normalizedIds.length; i += 1) {
    await FaqNode.updateOne({ _id: normalizedIds[i] }, { $set: { sortOrder: i } });
  }

  return FaqNode.find({ parentId: normalizedParentId }).sort({ sortOrder: 1 }).lean();
}

export async function duplicateFaqNode(id, includeChildren = false) {
  const faqId = toObjectId(id, "faq id");
  const source = await FaqNode.findById(faqId).lean();
  if (!source) throw new ChatbotError("NOT_FOUND", "FAQ node not found", 404);

  const siblingsMax = await getMaxSiblingSortOrder(source.parentId || null);
  const rootSlug = await getUniqueSlug(`${source.slug}-copy`);
  const root = await FaqNode.create({
    parentId: source.parentId || null,
    question: `${source.question} (Copy)`,
    slug: rootSlug,
    answerHtml: source.answerHtml || "",
    keywords: sanitizeStringList(source.keywords),
    tags: sanitizeStringList(source.tags),
    synonyms: sanitizeStringList(source.synonyms),
    icon: source.icon || "",
    status: source.status || "active",
    sortOrder: siblingsMax + 1,
    popularityScore: source.popularityScore || 0,
  });

  let createdCount = 1;
  if (includeChildren) {
    const cloneChildren = async (oldParentId, newParentId) => {
      const children = await FaqNode.find({ parentId: oldParentId })
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean();
      for (let i = 0; i < children.length; i += 1) {
        const child = children[i];
        const slug = await getUniqueSlug(`${child.slug}-copy`);
        const copy = await FaqNode.create({
          parentId: newParentId,
          question: child.question,
          slug,
          answerHtml: child.answerHtml || "",
          keywords: sanitizeStringList(child.keywords),
          tags: sanitizeStringList(child.tags),
          synonyms: sanitizeStringList(child.synonyms),
          icon: child.icon || "",
          status: child.status || "active",
          sortOrder: i,
          popularityScore: child.popularityScore || 0,
        });
        createdCount += 1;
        // eslint-disable-next-line no-await-in-loop
        await cloneChildren(child._id, copy._id);
      }
    };
    await cloneChildren(source._id, root._id);
  }

  return { root: root.toObject(), createdCount };
}

export async function updateFaqStatus(id, status) {
  const faqId = toObjectId(id, "faq id");
  const normalized = normalizedStatus(status, { fallback: "active" });
  const updated = await FaqNode.findByIdAndUpdate(
    faqId,
    { $set: { status: normalized } },
    { new: true },
  ).lean();
  if (!updated) throw new ChatbotError("NOT_FOUND", "FAQ node not found", 404);
  return updated;
}

function matchesArray(list, queryLower) {
  if (!Array.isArray(list)) return { exact: false, prefix: false, partial: false };
  let exact = false;
  let prefix = false;
  let partial = false;
  for (const item of list) {
    const value = String(item || "").toLowerCase();
    if (!value) continue;
    if (value === queryLower) exact = true;
    if (value.startsWith(queryLower)) prefix = true;
    if (value.includes(queryLower)) partial = true;
  }
  return { exact, prefix, partial };
}

export async function searchFaqNodes({
  q,
  page = 1,
  limit = 8,
  onlyActive = true,
  settings = null,
}) {
  const query = String(q || "").trim().toLowerCase();
  const appliedSettings = settings || (await getSettings({ bootstrap: true }));
  const minChars = Math.max(1, Number(appliedSettings?.minSearchChars || 2));
  const maxResults = Math.max(1, Number(appliedSettings?.maxSearchResults || 8));
  if (!query || query.length < minChars) {
    throw new ChatbotError(
      "INVALID_SEARCH_QUERY",
      `Please enter at least ${minChars} characters`,
      400,
    );
  }

  const enabledFields = normalizeSearchFields(appliedSettings?.searchEnabledFields);
  const list = await FaqNode.find(onlyActive ? { status: "active" } : {})
    .select(
      "_id parentId question slug answerHtml keywords tags synonyms icon status sortOrder popularityScore",
    )
    .lean();

  const ranked = [];
  for (const item of list) {
    const question = String(item.question || "").toLowerCase();
    const answer = String(item.answerHtml || "").toLowerCase();
    let score = 0;

    if (enabledFields.title) {
      if (question === query) score += 1000;
      else if (question.startsWith(query)) score += 850;
      else if (question.includes(query)) score += 600;
    }

    if (enabledFields.keywords) {
      const matched = matchesArray(item.keywords, query);
      if (matched.exact) score += 780;
      else if (matched.prefix) score += 700;
      else if (matched.partial) score += 560;
    }

    if (enabledFields.tags) {
      const matched = matchesArray(item.tags, query);
      if (matched.exact) score += 760;
      else if (matched.prefix) score += 680;
      else if (matched.partial) score += 540;
    }

    if (enabledFields.synonyms) {
      const matched = matchesArray(item.synonyms, query);
      if (matched.exact) score += 740;
      else if (matched.prefix) score += 660;
      else if (matched.partial) score += 520;
    }

    if (enabledFields.answer && answer.includes(query)) {
      score += 300;
    }

    if (score > 0) {
      ranked.push({
        ...item,
        _score: score,
      });
    }
  }

  ranked.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    if ((b.popularityScore || 0) !== (a.popularityScore || 0)) {
      return (b.popularityScore || 0) - (a.popularityScore || 0);
    }
    if ((a.sortOrder || 0) !== (b.sortOrder || 0)) return (a.sortOrder || 0) - (b.sortOrder || 0);
    return String(a.question || "").localeCompare(String(b.question || ""));
  });

  const currentPage = Math.max(1, Number(page || 1));
  const safeLimit = Math.min(maxResults, Math.max(1, Number(limit || maxResults)));
  const start = (currentPage - 1) * safeLimit;
  const paged = ranked.slice(start, start + safeLimit);
  return {
    items: paged,
    total: ranked.length,
    page: currentPage,
    limit: safeLimit,
    minSearchChars: minChars,
    maxSearchResults: maxResults,
  };
}

export function buildTree(items = []) {
  const byParent = new Map();
  const normalizedItems = Array.isArray(items) ? items : [];
  normalizedItems.forEach((item) => {
    const parentKey = item.parentId ? String(item.parentId) : "__root__";
    if (!byParent.has(parentKey)) byParent.set(parentKey, []);
    byParent.get(parentKey).push(item);
  });

  const sortNodes = (list) =>
    list.sort((a, b) => {
      if ((a.sortOrder || 0) !== (b.sortOrder || 0)) return (a.sortOrder || 0) - (b.sortOrder || 0);
      return String(a.question || "").localeCompare(String(b.question || ""));
    });

  const makeNode = (item) => {
    const key = String(item._id);
    const children = sortNodes([...(byParent.get(key) || [])]).map(makeNode);
    return {
      ...item,
      children,
    };
  };

  return sortNodes([...(byParent.get("__root__") || [])]).map(makeNode);
}

export async function getNodeContextById(id, { onlyActive = true } = {}) {
  const faqId = toObjectId(id, "faq id");
  const node = await FaqNode.findOne({
    _id: faqId,
    ...(onlyActive ? { status: "active" } : {}),
  }).lean();
  if (!node) throw new ChatbotError("NOT_FOUND", "FAQ node not found", 404);

  const children = await FaqNode.find({
    parentId: node._id,
    ...(onlyActive ? { status: "active" } : {}),
  })
    .sort({ sortOrder: 1, question: 1 })
    .lean();

  const breadcrumb = [];
  let cursor = node;
  // eslint-disable-next-line no-await-in-loop
  while (cursor) {
    breadcrumb.unshift({
      _id: cursor._id,
      question: cursor.question,
      slug: cursor.slug,
    });
    if (!cursor.parentId) break;
    // eslint-disable-next-line no-await-in-loop
    cursor = await FaqNode.findOne({
      _id: cursor.parentId,
      ...(onlyActive ? { status: "active" } : {}),
    })
      .select("_id parentId question slug")
      .lean();
  }

  return { node, children, breadcrumb };
}

export async function getNodeContextBySlug(slug, { onlyActive = true } = {}) {
  const normalized = normalizeSlug(String(slug || "").trim());
  if (!normalized?.valid || !normalized.slug) {
    throw new ChatbotError("VALIDATION_ERROR", "Invalid slug", 400);
  }
  const node = await FaqNode.findOne({
    slug: normalized.slug,
    ...(onlyActive ? { status: "active" } : {}),
  })
    .select("_id")
    .lean();
  if (!node) throw new ChatbotError("NOT_FOUND", "FAQ node not found", 404);
  return getNodeContextById(node._id, { onlyActive });
}

export async function incrementPopularity(questionId) {
  if (!questionId || !mongoose.Types.ObjectId.isValid(String(questionId))) return;
  await FaqNode.updateOne(
    { _id: questionId },
    { $inc: { popularityScore: 1 } },
  );
}
