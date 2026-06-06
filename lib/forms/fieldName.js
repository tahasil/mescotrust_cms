const FIELD_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export function normalizeFieldName(value) {
  let normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!normalized) return "";
  if (!/^[a-z]/.test(normalized)) normalized = `f_${normalized}`;
  return normalized;
}

export function isValidFieldName(value) {
  return FIELD_NAME_PATTERN.test(String(value ?? "").trim());
}

