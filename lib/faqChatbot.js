const NODE_ID_REGEX = /^[a-zA-Z0-9:_-]{2,80}$/;
const RELATED_TERM_MAP = {
  donate: ["donation", "contribute", "support", "fund", "funding"],
  donation: ["donate", "contribute", "support", "fund"],
  volunteer: ["help", "join", "assist", "mentor"],
  event: ["events", "program", "workshop", "activity"],
  contact: ["reach", "email", "phone", "call"],
  apply: ["application", "register", "enroll"],
  scholarship: ["grant", "financial aid", "support"],
};

export const FAQ_CHATBOT_SETTINGS_KEY = "default";
export const FAQ_CHATBOT_MAX_NODES_PER_SAVE = 5000;
export const FAQ_CHATBOT_DEFAULT_CONFIG = Object.freeze({
  settingsKey: FAQ_CHATBOT_SETTINGS_KEY,
  enabled: false,
  headerTitle: "FAQ Assistant",
  welcomeMessage: "Hi! How can I help you today?",
  noResultsFoundMessage: "Sorry, I couldn't find an answer to your question.",
  avatar: { mediaId: "", url: "" },
  searchIndexStatus: {
    lastRebuildAt: null,
    lastRebuildSource: "",
    lastTreeVersion: 1,
    lastScannedNodes: 0,
    lastIndexedRows: 0,
    lastSkippedRows: 0,
    lastDurationMs: 0,
    lastError: "",
    autoRepairCount: 0,
  },
  searchMetricsStatus: {
    totalQueries: 0,
    noResultQueries: 0,
    indexedQueryCount: 0,
    fallbackQueryCount: 0,
    totalLatencyMs: 0,
    averageLatencyMs: 0,
    lastLatencyMs: 0,
    lastResultCount: 0,
    lastSource: "",
    lastQuery: "",
    lastQueryAt: null,
  },
  colors: {
    launcherGradientStart: "#13567a",
    launcherGradientEnd: "#1d9b78",
    headerGradientStart: "#0f4f74",
    headerGradientEnd: "#157f67",
    userBubbleBackground: "#125679",
    userBubbleText: "#ffffff",
    botBubbleBackground: "#ffffff",
    botBubbleText: "#132430",
    chipBackground: "#ffffff",
    chipText: "#1b3a4e",
  },
  position: "bottom-right",
  uiPreferences: {
    showTimestamps: true,
    timestampFormat: "12h",
    timestampLocale: "en-US",
    timestampTimezoneStrategy: "client-local",
    fixedTimezone: "",
    showTypingState: true,
    typingMinMs: 600,
    typingMaxMs: 2500,
  },
  treeVersion: 1,
  updatedBy: "",
});

function toTrimmedString(value, maxLength = 1000) {
  return String(value == null ? "" : value).trim().slice(0, maxLength);
}

function toOptionalNodeId(value) {
  const cleaned = toTrimmedString(value, 80);
  return cleaned || null;
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

function isLikelyCssColor(value) {
  const raw = toTrimmedString(value, 64);
  if (!raw) return false;
  return (
    /^#[0-9a-fA-F]{3,8}$/.test(raw) ||
    /^rgba?\([^)]{3,}\)$/i.test(raw) ||
    /^hsla?\([^)]{3,}\)$/i.test(raw) ||
    /^var\(--[a-zA-Z0-9_-]+\)$/.test(raw) ||
    /^(transparent|inherit|initial|currentColor|unset)$/i.test(raw)
  );
}

function normalizeColorValue(value, fallback, fieldName, errors) {
  if (value === undefined) return fallback;
  const raw = toTrimmedString(value, 64);
  if (!raw) return fallback;
  if (!isLikelyCssColor(raw)) {
    errors.push(`${fieldName} must be a valid CSS color`);
    return fallback;
  }
  return raw;
}

function sortByOrderThenId(a, b) {
  const orderA = Number.isFinite(Number(a?.order)) ? Number(a.order) : 0;
  const orderB = Number.isFinite(Number(b?.order)) ? Number(b.order) : 0;
  if (orderA !== orderB) return orderA - orderB;
  return String(a?.nodeId || "").localeCompare(String(b?.nodeId || ""));
}

function getUiField(topLevelSource, uiSource, fieldName) {
  if (uiSource[fieldName] !== undefined) return uiSource[fieldName];
  return topLevelSource[fieldName];
}

function normalizeUiPreferences(topLevelSource, baseUi) {
  const uiSource =
    topLevelSource?.uiPreferences && typeof topLevelSource.uiPreferences === "object"
      ? topLevelSource.uiPreferences
      : {};
  const errors = [];
  const next = {
    ...FAQ_CHATBOT_DEFAULT_CONFIG.uiPreferences,
    ...(baseUi || {}),
  };

  const timestampFormatRaw = getUiField(topLevelSource, uiSource, "timestampFormat");
  const timestampFormat = timestampFormatRaw !== undefined
    ? toTrimmedString(timestampFormatRaw, 16).toLowerCase()
    : next.timestampFormat;
  next.timestampFormat = timestampFormat === "24h" ? "24h" : "12h";

  const timezoneStrategyRaw = getUiField(
    topLevelSource,
    uiSource,
    "timestampTimezoneStrategy",
  );
  const timezoneStrategy = timezoneStrategyRaw !== undefined
    ? toTrimmedString(timezoneStrategyRaw, 32).toLowerCase()
    : next.timestampTimezoneStrategy;
  next.timestampTimezoneStrategy =
    timezoneStrategy === "fixed-timezone" ? "fixed-timezone" : "client-local";

  const timestampLocaleRaw = getUiField(topLevelSource, uiSource, "timestampLocale");
  next.timestampLocale =
    timestampLocaleRaw !== undefined
      ? toTrimmedString(timestampLocaleRaw, 40) || "en-US"
      : toTrimmedString(next.timestampLocale, 40) || "en-US";

  const fixedTimezoneRaw = getUiField(topLevelSource, uiSource, "fixedTimezone");
  next.fixedTimezone =
    fixedTimezoneRaw !== undefined
      ? toTrimmedString(fixedTimezoneRaw, 80)
      : toTrimmedString(next.fixedTimezone, 80);

  const showTimestampsRaw = getUiField(topLevelSource, uiSource, "showTimestamps");
  if (showTimestampsRaw !== undefined) {
    next.showTimestamps = Boolean(showTimestampsRaw);
  }

  const showTypingStateRaw = getUiField(topLevelSource, uiSource, "showTypingState");
  if (showTypingStateRaw !== undefined) {
    next.showTypingState = Boolean(showTypingStateRaw);
  }

  const typingMinRaw = getUiField(topLevelSource, uiSource, "typingMinMs");
  const typingMaxRaw = getUiField(topLevelSource, uiSource, "typingMaxMs");
  next.typingMinMs = clampNumber(
    typingMinRaw,
    0,
    15000,
    clampNumber(next.typingMinMs, 0, 15000, FAQ_CHATBOT_DEFAULT_CONFIG.uiPreferences.typingMinMs),
  );
  const normalizedTypingMax = clampNumber(
    typingMaxRaw,
    0,
    30000,
    clampNumber(next.typingMaxMs, 0, 30000, FAQ_CHATBOT_DEFAULT_CONFIG.uiPreferences.typingMaxMs),
  );
  next.typingMaxMs = Math.max(next.typingMinMs, normalizedTypingMax);

  if (
    next.timestampTimezoneStrategy === "fixed-timezone" &&
    !toTrimmedString(next.fixedTimezone, 80)
  ) {
    errors.push("fixedTimezone is required when timestampTimezoneStrategy is fixed-timezone");
  }

  return { uiPreferences: next, errors };
}

function normalizeColors(topLevelSource, baseColors) {
  const source =
    topLevelSource?.colors && typeof topLevelSource.colors === "object"
      ? topLevelSource.colors
      : {};
  const errors = [];
  const fallback = {
    ...FAQ_CHATBOT_DEFAULT_CONFIG.colors,
    ...(baseColors || {}),
  };

  const next = {
    launcherGradientStart: normalizeColorValue(
      source.launcherGradientStart,
      fallback.launcherGradientStart,
      "colors.launcherGradientStart",
      errors,
    ),
    launcherGradientEnd: normalizeColorValue(
      source.launcherGradientEnd,
      fallback.launcherGradientEnd,
      "colors.launcherGradientEnd",
      errors,
    ),
    headerGradientStart: normalizeColorValue(
      source.headerGradientStart,
      fallback.headerGradientStart,
      "colors.headerGradientStart",
      errors,
    ),
    headerGradientEnd: normalizeColorValue(
      source.headerGradientEnd,
      fallback.headerGradientEnd,
      "colors.headerGradientEnd",
      errors,
    ),
    userBubbleBackground: normalizeColorValue(
      source.userBubbleBackground,
      fallback.userBubbleBackground,
      "colors.userBubbleBackground",
      errors,
    ),
    userBubbleText: normalizeColorValue(
      source.userBubbleText,
      fallback.userBubbleText,
      "colors.userBubbleText",
      errors,
    ),
    botBubbleBackground: normalizeColorValue(
      source.botBubbleBackground,
      fallback.botBubbleBackground,
      "colors.botBubbleBackground",
      errors,
    ),
    botBubbleText: normalizeColorValue(
      source.botBubbleText,
      fallback.botBubbleText,
      "colors.botBubbleText",
      errors,
    ),
    chipBackground: normalizeColorValue(
      source.chipBackground,
      fallback.chipBackground,
      "colors.chipBackground",
      errors,
    ),
    chipText: normalizeColorValue(source.chipText, fallback.chipText, "colors.chipText", errors),
  };

  return { colors: next, errors };
}

export function resolveFaqChatbotConfigDoc(doc) {
  const source = doc && typeof doc === "object"
    ? typeof doc.toObject === "function"
      ? doc.toObject()
      : doc
    : {};
  const merged = {
    ...FAQ_CHATBOT_DEFAULT_CONFIG,
    ...source,
    avatar: {
      ...FAQ_CHATBOT_DEFAULT_CONFIG.avatar,
      ...(source?.avatar && typeof source.avatar === "object" ? source.avatar : {}),
    },
    searchIndexStatus: {
      ...FAQ_CHATBOT_DEFAULT_CONFIG.searchIndexStatus,
      ...(source?.searchIndexStatus && typeof source.searchIndexStatus === "object"
        ? source.searchIndexStatus
        : {}),
    },
    searchMetricsStatus: {
      ...FAQ_CHATBOT_DEFAULT_CONFIG.searchMetricsStatus,
      ...(source?.searchMetricsStatus && typeof source.searchMetricsStatus === "object"
        ? source.searchMetricsStatus
        : {}),
    },
    colors: {
      ...FAQ_CHATBOT_DEFAULT_CONFIG.colors,
      ...(source?.colors && typeof source.colors === "object" ? source.colors : {}),
    },
    uiPreferences: {
      ...FAQ_CHATBOT_DEFAULT_CONFIG.uiPreferences,
      ...(source?.uiPreferences && typeof source.uiPreferences === "object"
        ? source.uiPreferences
        : {}),
    },
  };
  merged.settingsKey = FAQ_CHATBOT_SETTINGS_KEY;
  merged.headerTitle = toTrimmedString(merged.headerTitle, 120) || FAQ_CHATBOT_DEFAULT_CONFIG.headerTitle;
  merged.welcomeMessage =
    toTrimmedString(merged.welcomeMessage, 2000) || FAQ_CHATBOT_DEFAULT_CONFIG.welcomeMessage;
  merged.noResultsFoundMessage =
    toTrimmedString(merged.noResultsFoundMessage, 300) ||
    FAQ_CHATBOT_DEFAULT_CONFIG.noResultsFoundMessage;
  merged.avatar.mediaId = toTrimmedString(merged.avatar.mediaId, 64);
  merged.avatar.url = toTrimmedString(merged.avatar.url, 2048);
  merged.searchIndexStatus = {
    ...FAQ_CHATBOT_DEFAULT_CONFIG.searchIndexStatus,
    ...(merged.searchIndexStatus && typeof merged.searchIndexStatus === "object"
      ? merged.searchIndexStatus
      : {}),
  };
  merged.searchIndexStatus.lastRebuildAt = merged.searchIndexStatus.lastRebuildAt || null;
  merged.searchIndexStatus.lastRebuildSource = toTrimmedString(
    merged.searchIndexStatus.lastRebuildSource,
    40,
  );
  merged.searchIndexStatus.lastTreeVersion = Math.max(
    1,
    Number(merged.searchIndexStatus.lastTreeVersion) || 1,
  );
  merged.searchIndexStatus.lastScannedNodes = Math.max(
    0,
    Number(merged.searchIndexStatus.lastScannedNodes) || 0,
  );
  merged.searchIndexStatus.lastIndexedRows = Math.max(
    0,
    Number(merged.searchIndexStatus.lastIndexedRows) || 0,
  );
  merged.searchIndexStatus.lastSkippedRows = Math.max(
    0,
    Number(merged.searchIndexStatus.lastSkippedRows) || 0,
  );
  merged.searchIndexStatus.lastDurationMs = Math.max(
    0,
    Number(merged.searchIndexStatus.lastDurationMs) || 0,
  );
  merged.searchIndexStatus.lastError = toTrimmedString(merged.searchIndexStatus.lastError, 500);
  merged.searchIndexStatus.autoRepairCount = Math.max(
    0,
    Number(merged.searchIndexStatus.autoRepairCount) || 0,
  );
  merged.searchMetricsStatus = {
    ...FAQ_CHATBOT_DEFAULT_CONFIG.searchMetricsStatus,
    ...(merged.searchMetricsStatus && typeof merged.searchMetricsStatus === "object"
      ? merged.searchMetricsStatus
      : {}),
  };
  merged.searchMetricsStatus.totalQueries = Math.max(
    0,
    Number(merged.searchMetricsStatus.totalQueries) || 0,
  );
  merged.searchMetricsStatus.noResultQueries = Math.max(
    0,
    Number(merged.searchMetricsStatus.noResultQueries) || 0,
  );
  merged.searchMetricsStatus.indexedQueryCount = Math.max(
    0,
    Number(merged.searchMetricsStatus.indexedQueryCount) || 0,
  );
  merged.searchMetricsStatus.fallbackQueryCount = Math.max(
    0,
    Number(merged.searchMetricsStatus.fallbackQueryCount) || 0,
  );
  merged.searchMetricsStatus.totalLatencyMs = Math.max(
    0,
    Number(merged.searchMetricsStatus.totalLatencyMs) || 0,
  );
  merged.searchMetricsStatus.lastLatencyMs = Math.max(
    0,
    Number(merged.searchMetricsStatus.lastLatencyMs) || 0,
  );
  merged.searchMetricsStatus.lastResultCount = Math.max(
    0,
    Number(merged.searchMetricsStatus.lastResultCount) || 0,
  );
  merged.searchMetricsStatus.lastSource = (() => {
    const source = toTrimmedString(merged.searchMetricsStatus.lastSource, 20).toLowerCase();
    if (source === "indexed" || source === "fallback" || source === "none") return source;
    return "";
  })();
  merged.searchMetricsStatus.lastQuery = toTrimmedString(merged.searchMetricsStatus.lastQuery, 200);
  merged.searchMetricsStatus.lastQueryAt = merged.searchMetricsStatus.lastQueryAt || null;
  merged.searchMetricsStatus.averageLatencyMs =
    merged.searchMetricsStatus.totalQueries > 0
      ? Math.round(
        merged.searchMetricsStatus.totalLatencyMs /
            merged.searchMetricsStatus.totalQueries,
      )
      : 0;
  merged.colors = {
    ...FAQ_CHATBOT_DEFAULT_CONFIG.colors,
    ...(merged.colors && typeof merged.colors === "object" ? merged.colors : {}),
  };
  merged.position = merged.position === "bottom-left" ? "bottom-left" : "bottom-right";
  merged.treeVersion = Math.max(1, Number(merged.treeVersion) || 1);
  return merged;
}

export function normalizeFaqChatbotConfigInput(input, currentConfig) {
  const base = resolveFaqChatbotConfigDoc(currentConfig);
  const source = input && typeof input === "object" ? input : {};
  const errors = [];

  const next = {
    ...base,
    enabled: source.enabled !== undefined ? Boolean(source.enabled) : base.enabled,
    headerTitle:
      source.headerTitle !== undefined
        ? toTrimmedString(source.headerTitle, 120)
        : base.headerTitle,
    welcomeMessage:
      source.welcomeMessage !== undefined
        ? toTrimmedString(source.welcomeMessage, 2000)
        : base.welcomeMessage,
    noResultsFoundMessage:
      source.noResultsFoundMessage !== undefined
        ? toTrimmedString(source.noResultsFoundMessage, 300)
        : base.noResultsFoundMessage,
    avatar: {
      mediaId:
        source?.avatar?.mediaId !== undefined
          ? toTrimmedString(source.avatar.mediaId, 64)
          : base.avatar.mediaId,
      url:
        source?.avatar?.url !== undefined
          ? toTrimmedString(source.avatar.url, 2048)
          : base.avatar.url,
    },
    position:
      source.position !== undefined
        ? (toTrimmedString(source.position, 32) === "bottom-left"
            ? "bottom-left"
            : "bottom-right")
        : base.position,
  };

  if (!next.headerTitle) {
    errors.push("headerTitle is required");
  }
  if (!next.welcomeMessage) {
    errors.push("welcomeMessage is required");
  }
  if (!next.noResultsFoundMessage) {
    errors.push("noResultsFoundMessage is required");
  } else if (next.noResultsFoundMessage.length < 10 || next.noResultsFoundMessage.length > 300) {
    errors.push("noResultsFoundMessage must be between 10 and 300 characters");
  }

  const { uiPreferences, errors: uiErrors } = normalizeUiPreferences(source, base.uiPreferences);
  next.uiPreferences = uiPreferences;
  errors.push(...uiErrors);

  const { colors, errors: colorErrors } = normalizeColors(source, base.colors);
  next.colors = colors;
  errors.push(...colorErrors);

  return { config: next, errors };
}

export function toPublicFaqChatbotConfig(doc) {
  const config = resolveFaqChatbotConfigDoc(doc);
  return {
    enabled: config.enabled,
    headerTitle: config.headerTitle,
    welcomeMessage: config.welcomeMessage,
    noResultsFoundMessage: config.noResultsFoundMessage,
    avatar: {
      mediaId: config.avatar.mediaId,
      url: config.avatar.url,
    },
    colors: { ...config.colors },
    position: config.position,
    showTimestamps: config.uiPreferences.showTimestamps,
    timestampFormat: config.uiPreferences.timestampFormat,
    timestampLocale: config.uiPreferences.timestampLocale,
    timestampTimezoneStrategy: config.uiPreferences.timestampTimezoneStrategy,
    fixedTimezone: config.uiPreferences.fixedTimezone,
    showTypingState: config.uiPreferences.showTypingState,
    typingMinMs: config.uiPreferences.typingMinMs,
    typingMaxMs: config.uiPreferences.typingMaxMs,
    treeVersion: config.treeVersion,
  };
}

export function buildFaqChatbotSearchIndexStatus(
  summary,
  {
    source = "manual",
    previousStatus = null,
    treeVersion = null,
    errorMessage = "",
    incrementAutoRepairCount = false,
  } = {},
) {
  const prev =
    previousStatus && typeof previousStatus === "object"
      ? previousStatus
      : FAQ_CHATBOT_DEFAULT_CONFIG.searchIndexStatus;
  const nowIso = new Date().toISOString();
  const safeSummary = summary && typeof summary === "object" ? summary : {};
  return {
    lastRebuildAt: nowIso,
    lastRebuildSource: toTrimmedString(source, 40) || "manual",
    lastTreeVersion: Math.max(
      1,
      Number(
        treeVersion !== null && treeVersion !== undefined
          ? treeVersion
          : safeSummary.treeVersion,
      ) || 1,
    ),
    lastScannedNodes: Math.max(0, Number(safeSummary.scannedNodes) || 0),
    lastIndexedRows: Math.max(0, Number(safeSummary.indexedRows) || 0),
    lastSkippedRows: Math.max(0, Number(safeSummary.skippedRows) || 0),
    lastDurationMs: Math.max(0, Number(safeSummary.durationMs) || 0),
    lastError: toTrimmedString(errorMessage, 500),
    autoRepairCount: incrementAutoRepairCount
      ? Math.max(0, Number(prev.autoRepairCount) || 0) + 1
      : Math.max(0, Number(prev.autoRepairCount) || 0),
  };
}

export function toAdminFaqChatbotConfig(doc) {
  const config = resolveFaqChatbotConfigDoc(doc);
  return {
    settingsKey: config.settingsKey,
    enabled: config.enabled,
    headerTitle: config.headerTitle,
    welcomeMessage: config.welcomeMessage,
    noResultsFoundMessage: config.noResultsFoundMessage,
    avatar: {
      mediaId: config.avatar.mediaId,
      url: config.avatar.url,
    },
    colors: { ...config.colors },
    searchIndexStatus: { ...config.searchIndexStatus },
    searchMetricsStatus: { ...config.searchMetricsStatus },
    position: config.position,
    uiPreferences: { ...config.uiPreferences },
    treeVersion: config.treeVersion,
    updatedBy: toTrimmedString(config.updatedBy, 120),
    createdAt: config.createdAt || null,
    updatedAt: config.updatedAt || null,
  };
}

export function serializeFaqChatbotNode(doc) {
  const source = doc && typeof doc === "object"
    ? typeof doc.toObject === "function"
      ? doc.toObject()
      : doc
    : {};
  return {
    nodeId: toTrimmedString(source.nodeId, 80),
    parentNodeId: toOptionalNodeId(source.parentNodeId),
    rootNodeId: toTrimmedString(source.rootNodeId, 80),
    type: source.type === "answer" ? "answer" : "question",
    questionText: toTrimmedString(source.questionText, 2000),
    answerText: toTrimmedString(source.answerText, 4000),
    depth: Math.max(0, Number(source.depth) || 0),
    order: Math.max(0, Number(source.order) || 0),
    pathNodeIds: Array.isArray(source.pathNodeIds)
      ? source.pathNodeIds.map((id) => toTrimmedString(id, 80)).filter(Boolean)
      : [],
    pathText: toTrimmedString(source.pathText, 2000),
    isActive: source.isActive !== false,
    createdBy: toTrimmedString(source.createdBy, 120),
    updatedBy: toTrimmedString(source.updatedBy, 120),
    createdAt: source.createdAt || null,
    updatedAt: source.updatedAt || null,
  };
}

export function normalizeFaqChatbotNodes(rawNodes, { maxNodes = FAQ_CHATBOT_MAX_NODES_PER_SAVE } = {}) {
  const errors = [];
  if (!Array.isArray(rawNodes)) {
    return { nodes: [], errors: ["nodes must be an array"] };
  }
  if (rawNodes.length > maxNodes) {
    return {
      nodes: [],
      errors: [`nodes exceeds maximum allowed size (${maxNodes})`],
    };
  }

  const rawNormalized = rawNodes.map((item, index) => {
    const source = item && typeof item === "object" ? item : {};
    const nodeId = toTrimmedString(source.nodeId, 80);
    const type = toTrimmedString(source.type, 20).toLowerCase() === "answer"
      ? "answer"
      : "question";
    const parentNodeId = toOptionalNodeId(source.parentNodeId);
    const questionText =
      type === "question"
        ? toTrimmedString(source.questionText, 2000)
        : "";
    const answerText =
      type === "answer"
        ? toTrimmedString(source.answerText, 4000)
        : "";
    const order = Number.isFinite(Number(source.order))
      ? Math.max(0, Number(source.order))
      : index;
    const isActive = source.isActive !== false;
    return {
      nodeId,
      parentNodeId,
      rootNodeId: "",
      type,
      questionText,
      answerText,
      depth: 0,
      order,
      pathNodeIds: [],
      pathText: "",
      isActive,
    };
  });

  for (const node of rawNormalized) {
    if (!NODE_ID_REGEX.test(node.nodeId)) {
      errors.push(
        `nodeId "${node.nodeId}" is invalid; use 2-80 chars [a-zA-Z0-9:_-]`,
      );
    }
    if (node.parentNodeId && !NODE_ID_REGEX.test(node.parentNodeId)) {
      errors.push(`parentNodeId "${node.parentNodeId}" is invalid`);
    }
    if (node.type === "question" && !node.questionText) {
      errors.push(`questionText is required for question node "${node.nodeId}"`);
    }
    if (node.type === "answer" && !node.answerText) {
      errors.push(`answerText is required for answer node "${node.nodeId}"`);
    }
  }

  const byId = new Map();
  for (const node of rawNormalized) {
    if (byId.has(node.nodeId)) {
      errors.push(`Duplicate nodeId "${node.nodeId}"`);
      continue;
    }
    byId.set(node.nodeId, node);
  }

  for (const node of rawNormalized) {
    if (node.parentNodeId && !byId.has(node.parentNodeId)) {
      errors.push(`Node "${node.nodeId}" references missing parent "${node.parentNodeId}"`);
    }
  }

  if (errors.length > 0) return { nodes: [], errors };

  const childrenByParent = new Map();
  const pushChild = (parentId, node) => {
    const key = parentId || "__root__";
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key).push(node);
  };
  for (const node of rawNormalized) {
    pushChild(node.parentNodeId, node);
  }

  for (const [key, children] of childrenByParent.entries()) {
    children.sort(sortByOrderThenId);
    for (let idx = 0; idx < children.length; idx += 1) {
      children[idx].order = idx;
    }
    childrenByParent.set(key, children);
  }

  const roots = childrenByParent.get("__root__") || [];
  for (const root of roots) {
    if (root.type !== "question") {
      errors.push(`Root node "${root.nodeId}" must be of type question`);
    }
  }
  if (rawNormalized.length > 0 && roots.length === 0) {
    errors.push("At least one root question node is required");
  }

  for (const node of rawNormalized) {
    if (!node.parentNodeId) continue;
    const parent = byId.get(node.parentNodeId);
    if (!parent) continue;
    if (parent.type === "answer") {
      errors.push(`Answer node "${parent.nodeId}" cannot have child nodes`);
    }
  }

  const normalizedNodes = [];
  const visited = new Set();
  const pathStack = new Set();

  const dfs = (node, { rootNodeId, depth, pathNodeIds, pathTextParts }) => {
    if (pathStack.has(node.nodeId)) {
      errors.push(`Hierarchy cycle detected at node "${node.nodeId}"`);
      return;
    }
    if (visited.has(node.nodeId)) return;

    pathStack.add(node.nodeId);
    visited.add(node.nodeId);
    const label = node.type === "question" ? node.questionText : node.answerText;
    const nextPathNodeIds = [...pathNodeIds, node.nodeId];
    const nextPathTextParts = [...pathTextParts, label].filter(Boolean);

    const normalizedNode = {
      ...node,
      rootNodeId,
      depth,
      pathNodeIds: nextPathNodeIds,
      pathText: nextPathTextParts.join(" > ").slice(0, 2000),
    };
    normalizedNodes.push(normalizedNode);

    const children = childrenByParent.get(node.nodeId) || [];
    if (node.type === "answer" && children.length > 0) {
      errors.push(`Answer node "${node.nodeId}" cannot have child nodes`);
    }

    for (const child of children) {
      dfs(child, {
        rootNodeId,
        depth: depth + 1,
        pathNodeIds: nextPathNodeIds,
        pathTextParts: nextPathTextParts,
      });
    }

    pathStack.delete(node.nodeId);
  };

  for (const root of roots) {
    dfs(root, {
      rootNodeId: root.nodeId,
      depth: 0,
      pathNodeIds: [],
      pathTextParts: [],
    });
  }

  if (visited.size !== rawNormalized.length) {
    const unvisited = rawNormalized
      .filter((node) => !visited.has(node.nodeId))
      .map((node) => node.nodeId);
    if (unvisited.length > 0) {
      errors.push(
        `Invalid hierarchy: unreachable/cyclic nodes detected (${unvisited.join(", ")})`,
      );
    }
  }

  if (errors.length > 0) return { nodes: [], errors };
  return { nodes: normalizedNodes, errors: [] };
}

export function buildFaqChatbotTree(nodesInput) {
  const items = Array.isArray(nodesInput)
    ? nodesInput.map((node) => serializeFaqChatbotNode(node))
    : [];
  const byId = new Map(items.map((node) => [node.nodeId, { ...node, children: [] }]));
  const roots = [];

  for (const node of byId.values()) {
    if (node.parentNodeId && byId.has(node.parentNodeId)) {
      byId.get(node.parentNodeId).children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (list) => {
    list.sort(sortByOrderThenId);
    for (const node of list) {
      sortTree(node.children);
    }
  };
  sortTree(roots);
  return roots;
}

function resolveQuestionNodeId(node, nodeMap) {
  if (!node) return null;
  if (node.type === "question") return node.nodeId;
  const pathNodeIds = Array.isArray(node.pathNodeIds) ? node.pathNodeIds : [];
  for (let i = pathNodeIds.length - 1; i >= 0; i -= 1) {
    const candidate = nodeMap.get(pathNodeIds[i]);
    if (candidate?.type === "question") return candidate.nodeId;
  }
  let cursor = node.parentNodeId;
  while (cursor) {
    const parent = nodeMap.get(cursor);
    if (!parent) break;
    if (parent.type === "question") return parent.nodeId;
    cursor = parent.parentNodeId;
  }
  return null;
}

export function buildFaqChatbotSearchIndexRows(nodesInput, treeVersion) {
  const nodes = Array.isArray(nodesInput)
    ? nodesInput.map((node) => serializeFaqChatbotNode(node))
    : [];
  const nodeMap = new Map(nodes.map((node) => [node.nodeId, node]));
  const rows = [];
  let skippedRows = 0;

  for (const node of nodes) {
    const text = toTrimmedString(
      node.type === "question" ? node.questionText : node.answerText,
      4000,
    );
    if (!text) {
      skippedRows += 1;
      continue;
    }
    const questionNodeId = resolveQuestionNodeId(node, nodeMap);
    if (!questionNodeId) {
      skippedRows += 1;
      continue;
    }
    let weight = node.type === "question" ? 120 : 90;
    if (node.type === "question" && node.depth === 0) weight += 10;
    weight -= Math.min(40, (Number(node.depth) || 0) * 2);
    if (node.isActive === false) weight -= 50;

    rows.push({
      nodeId: node.nodeId,
      questionNodeId,
      type: node.type,
      text,
      pathText: toTrimmedString(node.pathText, 2000),
      depth: Math.max(0, Number(node.depth) || 0),
      weight,
      isActive: node.isActive !== false,
      treeVersion: Math.max(1, Number(treeVersion) || 1),
    });
  }

  return { rows, skippedRows };
}

export function normalizeFaqChatbotSearchQuery(input) {
  return toTrimmedString(input, 200).toLowerCase().replace(/\s+/g, " ");
}

export function tokenizeFaqChatbotSearchTerms(input) {
  return normalizeFaqChatbotSearchQuery(input)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

export function expandFaqChatbotSearchTokens(normalizedQuery) {
  const tokens = tokenizeFaqChatbotSearchTerms(normalizedQuery);
  const expanded = new Set(tokens);
  for (const token of tokens) {
    for (const [key, aliases] of Object.entries(RELATED_TERM_MAP)) {
      if (key.includes(token) || token.includes(key)) {
        expanded.add(key);
        for (const alias of aliases) expanded.add(alias);
      }
    }
  }
  return Array.from(expanded).filter((token) => token.length >= 2);
}

export function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildFaqChatbotSearchRegex(tokensInput) {
  const tokens = Array.isArray(tokensInput)
    ? tokensInput.map((token) => normalizeFaqChatbotSearchQuery(token)).filter(Boolean)
    : [];
  if (tokens.length === 0) return null;
  return new RegExp(tokens.map((token) => escapeRegex(token)).join("|"), "i");
}

function computeTokenCoverageScore(text, tokens, maxScore) {
  if (!text || !Array.isArray(tokens) || tokens.length === 0) {
    return { score: 0, matched: 0, total: 0 };
  }
  let matched = 0;
  for (const token of tokens) {
    if (token && text.includes(token)) matched += 1;
  }
  const ratio = matched / tokens.length;
  return {
    score: Math.round(ratio * maxScore),
    matched,
    total: tokens.length,
  };
}

export function scoreFaqChatbotSearchCandidate(candidate, normalizedQuery) {
  const query = normalizeFaqChatbotSearchQuery(normalizedQuery);
  const text = normalizeFaqChatbotSearchQuery(candidate?.text || "");
  const pathText = normalizeFaqChatbotSearchQuery(candidate?.pathText || "");
  const queryTokens = tokenizeFaqChatbotSearchTerms(query);
  const expandedTokens = expandFaqChatbotSearchTokens(query);
  let score = Number(candidate?.weight) || 0;

  if (query && text === query) {
    score += 150;
  } else if (query && text.startsWith(query)) {
    score += 100;
  } else if (query && text.includes(query)) {
    const phraseIndex = text.indexOf(query);
    score += 70;
    if (phraseIndex > 0) {
      score += Math.max(0, 30 - Math.min(30, phraseIndex));
    }
  }

  const textCoverage = computeTokenCoverageScore(text, queryTokens, 80);
  score += textCoverage.score;
  if (textCoverage.total > 1 && textCoverage.matched === textCoverage.total) {
    score += 20;
  }

  score += computeTokenCoverageScore(pathText, queryTokens, 35).score;
  score += computeTokenCoverageScore(pathText, expandedTokens, 20).score;

  if (query && pathText.includes(query)) score += 20;
  if (candidate?.type === "question") score += 20;
  if (Number(candidate?.depth) <= 1) score += 8;
  score -= Math.min(24, Math.max(0, Number(candidate?.depth) || 0) * 2);

  return score;
}

export function buildFaqChatbotSearchMetricsUpdate({
  normalizedQuery,
  resultCount = 0,
  latencyMs = 0,
  source = "none",
} = {}) {
  const safeQuery = normalizeFaqChatbotSearchQuery(normalizedQuery);
  const safeResultCount = Math.max(0, Number(resultCount) || 0);
  const safeLatencyMs = Math.max(0, Number(latencyMs) || 0);
  const safeSource =
    source === "indexed" || source === "fallback" || source === "none"
      ? source
      : "none";

  return {
    $inc: {
      "searchMetricsStatus.totalQueries": 1,
      "searchMetricsStatus.noResultQueries": safeResultCount === 0 ? 1 : 0,
      "searchMetricsStatus.indexedQueryCount": safeSource === "indexed" ? 1 : 0,
      "searchMetricsStatus.fallbackQueryCount": safeSource === "fallback" ? 1 : 0,
      "searchMetricsStatus.totalLatencyMs": safeLatencyMs,
    },
    $set: {
      "searchMetricsStatus.lastLatencyMs": safeLatencyMs,
      "searchMetricsStatus.lastResultCount": safeResultCount,
      "searchMetricsStatus.lastSource": safeSource,
      "searchMetricsStatus.lastQuery": safeQuery,
      "searchMetricsStatus.lastQueryAt": new Date(),
    },
  };
}
