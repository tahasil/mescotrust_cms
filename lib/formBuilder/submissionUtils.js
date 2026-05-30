export function valueToDisplay(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (entry == null) return "";
        if (typeof entry === "string") return entry;
        if (typeof entry === "object") return entry.originalName || entry.fileName || entry.value || "";
        return String(entry);
      })
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    return value.originalName || value.fileName || value.label || value.value || JSON.stringify(value);
  }
  return String(value);
}

export function buildSearchableText({ fields = [], payloadByFieldNameSnapshot = {}, payloadByFieldKey = {} }) {
  const chunks = [];
  const list = Array.isArray(fields) ? fields : [];
  for (const field of list) {
    if (!field) continue;
    const value =
      payloadByFieldKey?.[field.fieldKey] !== undefined
        ? payloadByFieldKey?.[field.fieldKey]
        : payloadByFieldNameSnapshot?.[field.name];
    const printable = valueToDisplay(value);
    if (field.label) chunks.push(String(field.label));
    if (field.name) chunks.push(String(field.name));
    if (printable) chunks.push(printable);
  }
  for (const [key, value] of Object.entries(payloadByFieldNameSnapshot || {})) {
    chunks.push(String(key));
    const printable = valueToDisplay(value);
    if (printable) chunks.push(printable);
  }
  return chunks.join(" ").trim();
}

