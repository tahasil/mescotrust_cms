import { randomUUID } from "crypto";
import { FORM_OPTION_TYPES, FORM_QUESTION_TYPES } from "@/lib/forms/constants";
import { isValidFieldName, normalizeFieldName } from "@/lib/forms/fieldName";

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeOrder(value, fallback = 0) {
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  return fallback;
}

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function normalizeSpan(value, fallback = 4) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 1) return 1;
  if (n > 4) return 4;
  return Math.round(n);
}

function makeOptionKey(value) {
  const key = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return key || "option";
}

function ensureUniqueOptionKey(baseKey, seen) {
  if (!seen.has(baseKey)) {
    seen.add(baseKey);
    return baseKey;
  }
  let i = 2;
  while (seen.has(`${baseKey}_${i}`)) i += 1;
  const next = `${baseKey}_${i}`;
  seen.add(next);
  return next;
}

export function createDefaultFormSchema() {
  return {
    sections: [
      {
        sectionId: randomUUID(),
        title: "Section 1",
        description: "",
        order: 0,
      },
    ],
    questions: [],
  };
}

export function validateAndNormalizeFormSchema(input) {
  const errors = [];
  const raw = input || {};
  const rawSections = Array.isArray(raw.sections) ? raw.sections : [];
  const rawQuestions = Array.isArray(raw.questions) ? raw.questions : [];
  const sections = [];
  const questions = [];

  const sectionIds = new Set();
  rawSections.forEach((section, idx) => {
    const sectionId = normalizeText(section?.sectionId);
    if (!sectionId) {
      errors.push(`sections[${idx}].sectionId is required`);
      return;
    }
    if (sectionIds.has(sectionId)) {
      errors.push(`Duplicate sectionId "${sectionId}"`);
      return;
    }
    sectionIds.add(sectionId);
    sections.push({
      sectionId,
      title: normalizeText(section?.title),
      description: normalizeText(section?.description),
      order: normalizeOrder(section?.order, idx),
    });
  });

  const fieldKeys = new Set();
  const fieldNames = new Set();
  rawQuestions.forEach((question, idx) => {
    const fieldKey = normalizeText(question?.fieldKey);
    const sectionId = normalizeText(question?.sectionId);
    const type = normalizeText(question?.type);
    const label = normalizeText(question?.label);

    if (!fieldKey) errors.push(`questions[${idx}].fieldKey is required`);
    if (fieldKey && fieldKeys.has(fieldKey)) errors.push(`Duplicate fieldKey "${fieldKey}"`);
    if (fieldKey) fieldKeys.add(fieldKey);

    if (!sectionId) errors.push(`questions[${idx}].sectionId is required`);
    if (sectionId && !sectionIds.has(sectionId)) {
      errors.push(`questions[${idx}].sectionId "${sectionId}" does not exist`);
    }

    if (!FORM_QUESTION_TYPES.includes(type)) {
      errors.push(`questions[${idx}].type "${type}" is invalid`);
    }

    const isDivider = type === "divider";
    let fieldName = normalizeFieldName(question?.fieldName || label);
    if (isDivider) fieldName = "";
    if (!isDivider) {
      if (!fieldName) errors.push(`questions[${idx}].fieldName is required`);
      if (fieldName && !isValidFieldName(fieldName)) {
        errors.push(`questions[${idx}].fieldName "${fieldName}" is invalid`);
      }
      if (fieldName && fieldNames.has(fieldName)) {
        errors.push(`Duplicate fieldName "${fieldName}"`);
      }
      if (fieldName) fieldNames.add(fieldName);
    }

    const options = [];
    if (FORM_OPTION_TYPES.has(type)) {
      const rawOptions = Array.isArray(question?.options) ? question.options : [];
      if (rawOptions.length === 0) errors.push(`questions[${idx}].options must contain at least one option`);
      const optionKeys = new Set();
      rawOptions.forEach((opt, optIdx) => {
        const labelText = normalizeText(opt?.label, `Option ${optIdx + 1}`);
        const baseKey = makeOptionKey(opt?.key || labelText);
        const key = ensureUniqueOptionKey(baseKey, optionKeys);
        options.push({
          key,
          label: labelText,
          order: normalizeOrder(opt?.order, optIdx),
        });
      });
    }

    const order = normalizeOrder(question?.order, idx);
    if (!isFiniteNumber(order)) {
      errors.push(`questions[${idx}].order must be numeric`);
    }

    questions.push({
      fieldKey,
      sectionId,
      type,
      label,
      description: normalizeText(question?.description),
      fieldName,
      required: Boolean(question?.required),
      span: normalizeSpan(question?.span, 4),
      options,
      order,
      rules: question?.rules && typeof question.rules === "object" ? question.rules : {},
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    schema: { sections, questions },
  };
}
