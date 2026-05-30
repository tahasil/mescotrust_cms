import { FORM_ID_PREFIX } from "@/lib/formBuilder/constants";

const SHORTCODE_PATTERN = /\[(form|form_builder)\s+id\s*=\s*["']([^"']+)["']\s*\]/i;
const FORM_ID_PATTERN = /^FORM_\d{3,}$/;

export function normalizeFormId(value) {
  return String(value || "").trim().toUpperCase();
}

export function isValidFormId(value) {
  return FORM_ID_PATTERN.test(normalizeFormId(value));
}

export function buildFormIdFromSeq(seq) {
  const n = Number(seq);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error("Sequence must be a positive integer");
  }
  return `${FORM_ID_PREFIX}${String(n).padStart(3, "0")}`;
}

export function buildFormShortcodes(formId) {
  const normalized = normalizeFormId(formId);
  if (!isValidFormId(normalized)) {
    throw new Error("Invalid formId");
  }
  return {
    shortcode: `[form id="${normalized}"]`,
    shortcodeAlt: `[form_builder id="${normalized}"]`,
  };
}

export function parseFormShortcode(input) {
  const raw = String(input || "").trim();
  if (!raw) return { matched: false, formId: "" };

  const match = raw.match(SHORTCODE_PATTERN);
  if (!match) return { matched: false, formId: "" };

  const formId = normalizeFormId(match[2]);
  if (!isValidFormId(formId)) {
    return { matched: true, formId: "", error: "Invalid form id inside shortcode" };
  }
  return { matched: true, formId };
}

export function resolveFormIdInput({ formId, shortcode }) {
  const direct = normalizeFormId(formId);
  if (direct) {
    if (!isValidFormId(direct)) {
      return { formId: "", error: "Invalid formId format" };
    }
    return { formId: direct };
  }

  const parsed = parseFormShortcode(shortcode);
  if (parsed.matched && parsed.formId) return { formId: parsed.formId };
  if (parsed.matched && parsed.error) return { formId: "", error: parsed.error };

  return { formId: "", error: "Missing formId or valid shortcode" };
}

