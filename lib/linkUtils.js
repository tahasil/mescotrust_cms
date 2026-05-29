const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function toText(value, fallback = "") {
  if (value == null) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

export function isEmailLike(value) {
  const raw = toText(value, "");
  if (!raw) return false;
  if (/^mailto:/i.test(raw)) return true;
  return EMAIL_REGEX.test(raw);
}

export function ensureMailto(value) {
  const raw = toText(value, "");
  if (!raw) return "";
  if (/^mailto:/i.test(raw)) return raw;
  return EMAIL_REGEX.test(raw) ? `mailto:${raw}` : raw;
}

export function isExternalLike(value) {
  const raw = toText(value, "");
  if (!raw) return false;
  return /^(https?:\/\/|\/\/|mailto:|tel:)/i.test(raw);
}

export function normalizeLinkTarget(value, fallback = "_self") {
  if (value === true) return "_blank";
  if (value === false) return "_self";
  const raw = toText(value, "").toLowerCase();
  if (raw === "_blank") return "_blank";
  if (raw === "_self") return "_self";
  return fallback === "_blank" ? "_blank" : "_self";
}

export function normalizeTargetFromItem(
  item,
  {
    targetKeys = ["target", "buttonTarget", "sourceTarget"],
    boolKeys = ["openInNewTab", "newTab", "buttonNewTab"],
    fallback = "_self",
  } = {},
) {
  const source = item && typeof item === "object" ? item : {};

  for (const key of targetKeys) {
    if (source[key] == null || source[key] === "") continue;
    return normalizeLinkTarget(source[key], fallback);
  }
  for (const key of boolKeys) {
    if (source[key] == null) continue;
    return source[key] === true ? "_blank" : "_self";
  }
  return normalizeLinkTarget(fallback, "_self");
}

