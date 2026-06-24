import Form from "@/models/Form";
import FormCounter from "@/models/FormCounter";
import { FORM_ID_PADDING, FORM_ID_PREFIX, SHORTCODE_MAX_LENGTH } from "@/lib/forms/constants";

function normalizeShortcode(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "form";
}

function withSuffix(base, attempt) {
  if (attempt <= 0) return base.slice(0, SHORTCODE_MAX_LENGTH);
  const suffix = `-${attempt}`;
  const baseBudget = Math.max(1, SHORTCODE_MAX_LENGTH - suffix.length);
  const trimmed = base.slice(0, baseBudget).replace(/-+$/g, "");
  return `${trimmed}${suffix}`;
}

export async function getNextFormId() {
  const counter = await FormCounter.findOneAndUpdate(
    { key: "FORM_ID" },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  const serial = String(counter?.value || 0).padStart(FORM_ID_PADDING, "0");
  return `${FORM_ID_PREFIX}${serial}`;
}

export function getShortcodeAltFromFormId(formId) {
  return String(formId || "").toLowerCase();
}

export async function generateUniqueShortcode(input) {
  const base = normalizeShortcode(input);
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const candidate = withSuffix(base, attempt);
    const existing = await Form.findOne(
      { $or: [{ shortcode: candidate }, { shortcodeAlt: candidate }] },
      { _id: 1 },
    ).lean();
    if (!existing) return candidate;
  }
  throw new Error("Unable to generate a unique shortcode");
}

