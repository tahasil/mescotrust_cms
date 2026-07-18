export function toSafeString(value) {
  return value == null ? "" : String(value).trim();
}

export function toPositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.floor(num);
  return rounded > 0 ? rounded : fallback;
}

export function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function toIsoDate(value) {
  const raw = toSafeString(value);
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

export function toDateOrNull(value) {
  const iso = toIsoDate(value);
  if (!iso) return null;
  return new Date(iso);
}

export function hashString(value) {
  const input = toSafeString(value);
  if (!input) return "x";
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

function toBase64Url(input) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input) {
  const value = toSafeString(input).replace(/-/g, "+").replace(/_/g, "/");
  if (!value) return "";
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  return Buffer.from(`${value}${pad}`, "base64").toString("utf8");
}

export function encodeCursor(payload) {
  try {
    return toBase64Url(JSON.stringify(payload || {}));
  } catch {
    return "";
  }
}

export function decodeCursor(cursor) {
  try {
    const raw = fromBase64Url(cursor);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function normalizeVisibility(value) {
  const visibility = toSafeString(value).toLowerCase();
  if (["all", "desktop", "mobile", "none"].includes(visibility)) return visibility;
  return "all";
}

export function normalizeSortBy(value) {
  const sortBy = toSafeString(value).toLowerCase();
  if (["latest", "platform-priority", "engagement"].includes(sortBy)) return sortBy;
  return "latest";
}

export function normalizeSortOrder(value) {
  const sortOrder = toSafeString(value).toLowerCase();
  if (sortOrder === "asc" || sortOrder === "desc") return sortOrder;
  return "desc";
}

export function normalizeLayout(value) {
  const layout = toSafeString(value).toLowerCase();
  if (layout === "grid") return "grid";
  return "grid";
}
