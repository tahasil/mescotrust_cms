import {
  FILE_FIELD_TYPES,
  FORM_FIELD_TYPE,
  FORM_FIELD_TYPES,
  FORM_STATUS,
  FORM_STATUSES,
  NON_DATA_FIELD_TYPES,
  OPTION_FIELD_TYPES,
} from "@/lib/formBuilder/constants";

const FIELD_TYPE_ALIASES = {
  "radio": FORM_FIELD_TYPE.RADIO_GROUP,
  "radio-group": FORM_FIELD_TYPE.RADIO_GROUP,
  "radio group": FORM_FIELD_TYPE.RADIO_GROUP,
  "checkbox": FORM_FIELD_TYPE.CHECKBOX_GROUP,
  "checkbox-group": FORM_FIELD_TYPE.CHECKBOX_GROUP,
  "checkbox group": FORM_FIELD_TYPE.CHECKBOX_GROUP,
  "section heading": FORM_FIELD_TYPE.SECTION_HEADING,
  "section-heading": FORM_FIELD_TYPE.SECTION_HEADING,
};

function createUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `field_${Math.random().toString(36).slice(2, 12)}`;
}

function normalizeType(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
  if (FORM_FIELD_TYPES.includes(raw)) return raw;
  const alias = FIELD_TYPE_ALIASES[String(value || "").trim().toLowerCase()];
  return alias || "";
}

function toPositiveNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function sanitizeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function sanitizeCssClass(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw
    .split(/\s+/)
    .map((token) => token.replace(/[^a-zA-Z0-9_-]/g, ""))
    .filter(Boolean)
    .join(" ")
    .slice(0, 160);
}

function normalizeColumnWidth(value, widthFallback = "") {
  const preset = String(value || "").trim().toLowerCase();
  if (preset === "full" || preset === "half" || preset === "third") return preset;

  const widthText = String(widthFallback || "").trim().toLowerCase();
  if (widthText.includes("33")) return "third";
  if (widthText.includes("50")) return "half";

  const n = Number.parseFloat(widthText.replace("%", ""));
  if (Number.isFinite(n)) {
    if (n <= 40) return "third";
    if (n <= 66) return "half";
  }
  return "full";
}

export function normalizeFieldName(rawName, fallback = "field") {
  const src = String(rawName || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  if (!src) return "field";
  if (!/^[a-z]/.test(src)) return `field_${src}`;
  return src;
}

function normalizeOptions(rawOptions) {
  if (!Array.isArray(rawOptions)) return [];
  return rawOptions
    .map((item) => {
      if (item == null) return null;
      if (typeof item === "string") {
        const value = sanitizeText(item);
        if (!value) return null;
        return { label: value, value };
      }
      if (typeof item === "object") {
        const label = sanitizeText(item.label || item.value);
        const value = sanitizeText(item.value || item.label);
        if (!label || !value) return null;
        return { label, value };
      }
      return null;
    })
    .filter(Boolean);
}

function normalizeMessages(raw = {}) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const msg = String(value ?? "").trim();
    if (msg) out[key] = msg;
  }
  return out;
}

function normalizeValidation(raw = {}, type) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = {};

  const minLength = toPositiveNumber(src.minLength);
  const maxLength = toPositiveNumber(src.maxLength);
  const minValue = toPositiveNumber(src.minValue);
  const maxValue = toPositiveNumber(src.maxValue);
  const minChecked = toPositiveNumber(src.minChecked);
  const maxChecked = toPositiveNumber(src.maxChecked);
  const maxFileSizeMb = toPositiveNumber(src.maxFileSizeMb ?? src.maxFileSizeMB);
  const regex = String(src.regex || src.pattern || "").trim();
  const email = src.email === true || type === FORM_FIELD_TYPE.EMAIL;
  const mobileMin = toPositiveNumber(src.mobileMin) ?? 10;
  const mobileMax = toPositiveNumber(src.mobileMax) ?? 15;

  if (minLength !== null) out.minLength = minLength;
  if (maxLength !== null) out.maxLength = maxLength;
  if (minValue !== null) out.minValue = minValue;
  if (maxValue !== null) out.maxValue = maxValue;
  if (minChecked !== null) out.minChecked = minChecked;
  if (maxChecked !== null) out.maxChecked = maxChecked;
  if (maxFileSizeMb !== null) out.maxFileSizeMb = maxFileSizeMb;
  if (regex) out.regex = regex;
  if (email) out.email = true;
  if (type === FORM_FIELD_TYPE.MOBILE) {
    out.mobileMin = mobileMin;
    out.mobileMax = mobileMax;
  }

  if (FILE_FIELD_TYPES.has(type)) {
    const fileTypes = Array.isArray(src.fileTypes)
      ? src.fileTypes.map((entry) => String(entry || "").trim()).filter(Boolean)
      : [];
    if (fileTypes.length > 0) out.fileTypes = fileTypes;
  }

  const messages = normalizeMessages(src.messages);
  if (Object.keys(messages).length > 0) out.messages = messages;

  return out;
}

function normalizeUi(raw = {}) {
  const src = raw && typeof raw === "object" ? raw : {};
  const columnWidth = normalizeColumnWidth(src.columnWidth, src.width);
  const width = columnWidth === "half" ? "50%" : columnWidth === "third" ? "33.33%" : "100%";
  return {
    placeholder: sanitizeText(src.placeholder),
    defaultValue: src.defaultValue ?? "",
    helpText: sanitizeText(src.helpText),
    width,
    columnWidth,
    cssClass: sanitizeCssClass(src.cssClass),
  };
}

function normalizeSingleField(rawField, index) {
  const raw = rawField && typeof rawField === "object" ? rawField : {};
  const type = normalizeType(raw.type);
  const label = sanitizeText(raw.label, `Field ${index + 1}`);
  const fieldKey = sanitizeText(raw.fieldKey, createUuid());
  const order = Number.isFinite(Number(raw.order)) ? Number(raw.order) : index;
  const required = raw.required === true || raw?.flags?.required === true;
  const readOnly = raw.readOnly === true || raw?.flags?.readOnly === true;
  const hidden = raw.hidden === true || raw?.flags?.hidden === true;
  const isDataField = !NON_DATA_FIELD_TYPES.has(type);
  const name = isDataField ? normalizeFieldName(raw.name, label) : "";
  const options = OPTION_FIELD_TYPES.has(type) ? normalizeOptions(raw.options) : [];

  return {
    fieldKey,
    type,
    label,
    name,
    order,
    ui: normalizeUi(raw.ui || raw),
    validation: normalizeValidation(raw.validation, type),
    flags: { required, readOnly, hidden },
    required,
    readOnly,
    hidden,
    options,
  };
}

export function normalizeFieldSchema(rawFields) {
  const fields = Array.isArray(rawFields) ? rawFields : [];
  const errors = [];
  const seenNames = new Set();
  const seenFieldKeys = new Set();

  const normalized = fields.map((field, index) => {
    const next = normalizeSingleField(field, index);

    if (!next.type || !FORM_FIELD_TYPES.includes(next.type)) {
      errors.push(`Field #${index + 1}: unsupported type`);
    }

    if (seenFieldKeys.has(next.fieldKey)) {
      errors.push(`Field #${index + 1}: duplicate fieldKey "${next.fieldKey}"`);
    } else {
      seenFieldKeys.add(next.fieldKey);
    }

    if (!NON_DATA_FIELD_TYPES.has(next.type)) {
      if (!next.name) {
        errors.push(`Field #${index + 1}: name is required`);
      } else if (!/^[a-z][a-z0-9_]*$/.test(next.name)) {
        errors.push(
          `Field #${index + 1}: name must start with a letter and contain only a-z, 0-9, _`,
        );
      } else if (seenNames.has(next.name)) {
        errors.push(`Field #${index + 1}: duplicate name "${next.name}"`);
      } else {
        seenNames.add(next.name);
      }
    }

    if (OPTION_FIELD_TYPES.has(next.type) && next.options.length === 0) {
      errors.push(`Field #${index + 1}: ${next.type} requires at least one option`);
    }

    return next;
  });

  const withOrder = normalized
    .sort((a, b) => (a.order !== b.order ? a.order - b.order : 0))
    .map((field, index) => ({ ...field, order: index }));

  return { fields: withOrder, errors };
}

export function normalizeFormStatus(status) {
  const next = String(status || "").trim().toLowerCase();
  return FORM_STATUSES.includes(next) ? next : FORM_STATUS.DRAFT;
}

export function normalizeFormConfiguration(rawConfig = {}, current = {}) {
  const merged =
    rawConfig && typeof rawConfig === "object"
      ? { ...(current || {}), ...rawConfig }
      : { ...(current || {}) };

  const submitText = sanitizeText(merged.submitText, "Submit");
  const successMessage = sanitizeText(
    merged.successMessage,
    "Thanks! Your submission has been received.",
  );
  const behaviorFlags =
    merged.behaviorFlags && typeof merged.behaviorFlags === "object"
      ? merged.behaviorFlags
      : {};
  const allowArchivedRender = merged.allowArchivedRender === true;

  return {
    submitText,
    successMessage,
    behaviorFlags,
    allowArchivedRender,
  };
}

export function fieldSnapshotFromSchema(fields = []) {
  return (Array.isArray(fields) ? fields : []).map((field) => ({
    fieldKey: field.fieldKey,
    type: field.type,
    label: field.label,
    name: field.name || "",
    order: Number.isFinite(Number(field.order)) ? Number(field.order) : 0,
  }));
}
