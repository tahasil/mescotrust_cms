const SUBMISSION_SORT_SET = new Set(["createdAt_desc", "createdAt_asc"]);
const EMAIL_HINT_RE = /\b(e-?mail|mail)\b/i;
const PHONE_HINT_RE = /\b(phone|mobile|contact|tel|telephone|whatsapp)\b/i;

export const LARGE_EXPORT_ROW_THRESHOLD = 5000;

export function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

export function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

export function parseBooleanFilter(value) {
  const normalized = normalizeLower(value);
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
}

export function parseDate(value, { endOfDay = false } = {}) {
  if (!value) return null;
  const raw = normalizeText(value);
  if (!raw) return null;

  const date = new Date(raw);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    if (endOfDay) date.setUTCHours(23, 59, 59, 999);
    else date.setUTCHours(0, 0, 0, 0);
  }
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeDateRange(dateFrom, dateTo) {
  if (dateFrom && dateTo && dateFrom > dateTo) {
    return {
      dateFrom: dateTo,
      dateTo: dateFrom,
    };
  }
  return { dateFrom, dateTo };
}

export function parseSubmissionSort(value) {
  const normalized = normalizeText(value, "createdAt_desc");
  return SUBMISSION_SORT_SET.has(normalized) ? normalized : "createdAt_desc";
}

function parseOrder(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function questionHasHint(question, regexp) {
  const haystack = [
    normalizeText(question?.type),
    normalizeText(question?.label),
    normalizeText(question?.fieldName),
    normalizeText(question?.fieldKey),
  ]
    .filter(Boolean)
    .join(" ");
  return regexp.test(haystack);
}

export function getOrderedFormQuestions(formSchema) {
  return [...(Array.isArray(formSchema?.questions) ? formSchema.questions : [])]
    .map((question, idx) => ({
      fieldKey: normalizeText(question?.fieldKey),
      fieldName: normalizeText(question?.fieldName),
      label: normalizeText(question?.label),
      type: normalizeLower(question?.type),
      order: parseOrder(question?.order, idx),
    }))
    .filter((question) => question.fieldKey && question.type !== "divider")
    .sort((a, b) => a.order - b.order);
}

export function getQuestionLabel(question, fallback = "Field") {
  return (
    normalizeText(question?.label) ||
    normalizeText(question?.fieldName) ||
    normalizeText(question?.fieldKey) ||
    fallback
  );
}

export function resolveSnapshotQuestions(questions) {
  const normalized = Array.isArray(questions) ? questions : [];
  const emailQuestion = normalized.find(
    (question) => question.type === "email" || questionHasHint(question, EMAIL_HINT_RE),
  );
  const phoneQuestion = normalized.find(
    (question) => question.type === "phone" || questionHasHint(question, PHONE_HINT_RE),
  );

  if (emailQuestion && phoneQuestion && emailQuestion.fieldKey !== phoneQuestion.fieldKey) {
    return [emailQuestion, phoneQuestion];
  }
  return normalized.slice(0, 2);
}

export function getSubmissionFieldValue(submission, question) {
  const byName = submission?.payloadByFieldNameSnapshot || {};
  const byKey = submission?.payloadByFieldKey || {};
  const fieldName = normalizeText(question?.fieldName);
  const fieldKey = normalizeText(question?.fieldKey);

  if (fieldName && hasOwn(byName, fieldName)) return byName[fieldName];
  if (fieldKey && hasOwn(byKey, fieldKey)) return byKey[fieldKey];
  return undefined;
}

function normalizeArrayValue(entries) {
  return entries
    .map((entry) => normalizeFieldValueForDisplay(entry))
    .filter(Boolean)
    .join(", ");
}

export function normalizeFieldValueForDisplay(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return normalizeArrayValue(value);
  if (value && typeof value === "object") {
    if (value.filename) return normalizeText(value.filename);
    return normalizeText(JSON.stringify(value));
  }
  return normalizeText(value);
}

export function buildSubmissionSnapshot(submission, snapshotQuestions) {
  const [first, second] = Array.isArray(snapshotQuestions) ? snapshotQuestions : [];

  const buildEntry = (question, fallbackLabel) => {
    const label = question ? getQuestionLabel(question, fallbackLabel) : fallbackLabel;
    const value = question
      ? normalizeFieldValueForDisplay(getSubmissionFieldValue(submission, question))
      : "";
    return {
      key: normalizeText(question?.fieldKey),
      label,
      value: value || "-",
      hasValue: Boolean(value),
    };
  };

  return {
    primary: buildEntry(first, "Column 1"),
    secondary: buildEntry(second, "Column 2"),
  };
}

export function buildSubmissionFilter({
  formId,
  isRead = null,
  search = "",
  dateFrom = null,
  dateTo = null,
  includeDeleted = false,
}) {
  const filter = { formId: normalizeText(formId) };
  if (!includeDeleted) filter.isDeleted = { $ne: true };

  if (typeof isRead === "boolean") {
    filter.isRead = isRead;
  }
  if (search) {
    filter.searchText = { $regex: escapeRegex(search), $options: "i" };
  }
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = dateFrom;
    if (dateTo) filter.createdAt.$lte = dateTo;
  }

  return filter;
}

function formatDateTimeCell(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

export function getSubmissionSortOrder(sort) {
  return parseSubmissionSort(sort) === "createdAt_asc" ? 1 : -1;
}

export function buildSubmissionExportColumns(questions) {
  const baseColumns = [
    {
      key: "submitted_at",
      label: "Submitted At",
      accessor: (submission) => formatDateTimeCell(submission?.createdAt),
    },
    {
      key: "status",
      label: "Status",
      accessor: (submission) => (submission?.isRead ? "Read" : "Unread"),
    },
    {
      key: "source",
      label: "Source",
      accessor: (submission) => normalizeText(submission?.source),
    },
    {
      key: "page_path",
      label: "Page Path",
      accessor: (submission) => normalizeText(submission?.pagePath),
    },
  ];

  const questionColumns = (Array.isArray(questions) ? questions : []).map((question, idx) => ({
    key: `field:${question.fieldKey}`,
    label: getQuestionLabel(question, `Field ${idx + 1}`),
    accessor: (submission) =>
      normalizeFieldValueForDisplay(getSubmissionFieldValue(submission, question)),
  }));

  return [...baseColumns, ...questionColumns];
}

export function buildExportRows(submissions, columns) {
  const safeColumns = Array.isArray(columns) ? columns : [];
  return (Array.isArray(submissions) ? submissions : []).map((submission) =>
    safeColumns.map((column) => normalizeFieldValueForDisplay(column?.accessor?.(submission))),
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

export function buildCsvBuffer(columns, rows) {
  const header = (Array.isArray(columns) ? columns : []).map((column) => csvEscape(column.label)).join(",");
  const bodyLines = (Array.isArray(rows) ? rows : []).map((row) =>
    (Array.isArray(row) ? row : []).map((entry) => csvEscape(entry)).join(","),
  );
  return Buffer.from(`\uFEFF${[header, ...bodyLines].join("\n")}`, "utf8");
}

export function sanitizeFileToken(value, fallback = "export") {
  const safe = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || fallback;
}
