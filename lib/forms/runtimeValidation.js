const OPTION_TYPE_SET = new Set(["single_choice", "multiple_choice"]);
const TEXT_TYPE_SET = new Set(["short_text", "paragraph", "hidden"]);
const SEARCHABLE_TYPE_SET = new Set([
  "short_text",
  "paragraph",
  "email",
  "number",
  "phone",
  "url",
  "date",
  "single_choice",
  "multiple_choice",
  "file",
  "hidden",
]);
const DEFAULT_MAX_FILES_PER_FIELD = 1;

function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeTextForSearch(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function isUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isDateValue(value) {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function normalizeDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function normalizePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function normalizeNumberRule(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value.map((entry) => normalizeString(entry).toLowerCase()).filter(Boolean)
    : [];
}

function safeRegex(pattern) {
  if (!pattern) return null;
  try {
    return new RegExp(String(pattern), "i");
  } catch {
    return null;
  }
}

function getFileExtension(filename) {
  const text = normalizeString(filename).toLowerCase();
  const idx = text.lastIndexOf(".");
  if (idx < 0) return "";
  return text.slice(idx);
}

function normalizeOptions(question) {
  return (Array.isArray(question?.options) ? question.options : []).map((option, idx) => ({
    key: normalizeString(option?.key || `option_${idx + 1}`),
    label: normalizeString(option?.label || `Option ${idx + 1}`),
    order: Number(option?.order || idx),
  }));
}

function normalizeQuestions(formSchema) {
  return [...(Array.isArray(formSchema?.questions) ? formSchema.questions : [])]
    .map((question, idx) => ({
      fieldKey: normalizeString(question?.fieldKey),
      sectionId: normalizeString(question?.sectionId),
      type: normalizeString(question?.type),
      label: normalizeString(question?.label),
      description: normalizeString(question?.description),
      fieldName: normalizeString(question?.fieldName),
      required: Boolean(question?.required),
      span: normalizePositiveInt(question?.span, 4),
      order: Number(question?.order ?? idx),
      options: normalizeOptions(question),
      rules: question?.rules && typeof question.rules === "object" ? question.rules : {},
    }))
    .filter((question) => question.fieldKey)
    .sort((a, b) => a.order - b.order);
}

function normalizeSingleChoice(question, rawValue) {
  const value = normalizeString(rawValue);
  const allowed = new Set(question.options.map((option) => option.key));
  if (!value) return { value: "", error: null };
  if (!allowed.has(value)) {
    return { value: "", error: `Invalid option selected for "${question.label || question.fieldKey}"` };
  }
  return { value, error: null };
}

function normalizeMultipleChoice(question, rawValue) {
  const rawArray = Array.isArray(rawValue)
    ? rawValue
    : rawValue == null || rawValue === ""
      ? []
      : [rawValue];
  const allowed = new Set(question.options.map((option) => option.key));
  const deduped = [...new Set(rawArray.map((entry) => normalizeString(entry)).filter(Boolean))];
  for (const entry of deduped) {
    if (!allowed.has(entry)) {
      return {
        value: [],
        error: `Invalid option selected for "${question.label || question.fieldKey}"`,
      };
    }
  }
  return { value: deduped, error: null };
}

function normalizeFileAnswers(question, rawValue, filesById) {
  const refs = Array.isArray(rawValue)
    ? rawValue
    : rawValue == null || rawValue === ""
      ? []
      : [rawValue];
  const maxFiles = normalizePositiveInt(
    question?.rules?.maxFiles,
    DEFAULT_MAX_FILES_PER_FIELD,
  );
  if (refs.length > maxFiles) {
    return {
      value: [],
      error: `A maximum of ${maxFiles} file(s) is allowed for "${question.label || question.fieldKey}"`,
    };
  }
  const maxSizeBytes = normalizeNumberRule(question?.rules?.maxSizeBytes);
  const maxSizeMB = normalizeNumberRule(question?.rules?.maxSizeMB);
  const effectiveMaxSizeBytes =
    maxSizeBytes || (maxSizeMB ? Math.round(maxSizeMB * 1024 * 1024) : null);
  const allowedMimeTypes = normalizeStringArray(question?.rules?.allowedMimeTypes);
  const allowedExtensions = normalizeStringArray(question?.rules?.allowedExtensions);

  const out = [];
  const seen = new Set();
  for (const ref of refs) {
    const submissionFileId = normalizeString(
      ref?.submissionFileId || ref?.id || ref?._id || (typeof ref === "string" ? ref : ""),
    );
    if (!submissionFileId) {
      return {
        value: [],
        error: `Invalid file reference for "${question.label || question.fieldKey}"`,
      };
    }
    if (seen.has(submissionFileId)) continue;
    seen.add(submissionFileId);

    const fileDoc = filesById.get(submissionFileId);
    if (!fileDoc) {
      return {
        value: [],
        error: `Uploaded file not found or expired for "${question.label || question.fieldKey}"`,
      };
    }
    if (normalizeString(fileDoc.fieldKey) !== question.fieldKey) {
      return {
        value: [],
        error: `Uploaded file does not match field "${question.label || question.fieldKey}"`,
      };
    }

    const mimeType = normalizeString(fileDoc.mimeType).toLowerCase();
    const extension = getFileExtension(fileDoc.filename);
    const size = Number(fileDoc.size || 0);

    if (effectiveMaxSizeBytes && size > effectiveMaxSizeBytes) {
      return {
        value: [],
        error: `Uploaded file exceeds allowed size for "${question.label || question.fieldKey}"`,
      };
    }
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(mimeType)) {
      return {
        value: [],
        error: `Uploaded file type is not allowed for "${question.label || question.fieldKey}"`,
      };
    }
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
      return {
        value: [],
        error: `Uploaded file extension is not allowed for "${question.label || question.fieldKey}"`,
      };
    }

    out.push({
      submissionFileId,
      fieldKey: normalizeString(fileDoc.fieldKey),
      filename: normalizeString(fileDoc.filename),
      mimeType: normalizeString(fileDoc.mimeType),
      size: Number(fileDoc.size || 0),
      url: normalizeString(fileDoc.url),
    });
  }

  return { value: out, error: null };
}

function validateTextRules(question, value) {
  if (value === "") return null;
  const minLength = normalizeNumberRule(question?.rules?.minLength);
  const maxLength = normalizeNumberRule(question?.rules?.maxLength);
  const pattern = safeRegex(question?.rules?.pattern);

  if (minLength !== null && String(value).length < minLength) {
    return `"${question.label || question.fieldKey}" must be at least ${minLength} characters`;
  }
  if (maxLength !== null && String(value).length > maxLength) {
    return `"${question.label || question.fieldKey}" must be at most ${maxLength} characters`;
  }
  if (pattern && !pattern.test(String(value))) {
    return `"${question.label || question.fieldKey}" format is invalid`;
  }
  return null;
}

function validateNumberRules(question, value) {
  if (value === "" || value === null || value === undefined) return null;
  const min = normalizeNumberRule(question?.rules?.min);
  const max = normalizeNumberRule(question?.rules?.max);
  if (min !== null && Number(value) < min) {
    return `"${question.label || question.fieldKey}" must be at least ${min}`;
  }
  if (max !== null && Number(value) > max) {
    return `"${question.label || question.fieldKey}" must be at most ${max}`;
  }
  return null;
}

function validateDateRules(question, value) {
  if (!value) return null;
  const min = normalizeString(question?.rules?.min);
  const max = normalizeString(question?.rules?.max);
  const current = new Date(value);
  if (Number.isNaN(current.getTime())) return null;

  if (min) {
    const minDate = new Date(min);
    if (!Number.isNaN(minDate.getTime()) && current < minDate) {
      return `"${question.label || question.fieldKey}" must be on or after ${normalizeDate(minDate)}`;
    }
  }
  if (max) {
    const maxDate = new Date(max);
    if (!Number.isNaN(maxDate.getTime()) && current > maxDate) {
      return `"${question.label || question.fieldKey}" must be on or before ${normalizeDate(maxDate)}`;
    }
  }
  return null;
}

export function validateSubmissionAndBuild({
  formSchema,
  answersByFieldKey,
  filesById = new Map(),
}) {
  const errors = [];
  const payloadByFieldKey = {};
  const payloadByFieldNameSnapshot = {};
  const fieldSnapshot = {};
  const searchParts = [];

  const questions = normalizeQuestions(formSchema);
  for (const question of questions) {
    if (question.type === "divider") continue;
    const raw = answersByFieldKey?.[question.fieldKey];
    let normalizedValue;
    let normalizeError = null;

    if (TEXT_TYPE_SET.has(question.type)) {
      normalizedValue = normalizeString(raw);
    } else if (question.type === "email") {
      normalizedValue = normalizeString(raw).toLowerCase();
      if (normalizedValue && !isEmail(normalizedValue)) {
        normalizeError = `Invalid email for "${question.label || question.fieldKey}"`;
      }
    } else if (question.type === "number") {
      const rawText = normalizeString(raw);
      if (!rawText) {
        normalizedValue = "";
      } else {
        const num = Number(rawText);
        if (!Number.isFinite(num)) {
          normalizeError = `Invalid number for "${question.label || question.fieldKey}"`;
        } else {
          normalizedValue = num;
        }
      }
    } else if (question.type === "phone") {
      normalizedValue = normalizeString(raw);
      if (normalizedValue && !isPhone(normalizedValue)) {
        normalizeError = `Invalid phone number for "${question.label || question.fieldKey}"`;
      }
    } else if (question.type === "url") {
      normalizedValue = normalizeString(raw);
      if (normalizedValue && !isUrl(normalizedValue)) {
        normalizeError = `Invalid URL for "${question.label || question.fieldKey}"`;
      }
    } else if (question.type === "date") {
      const rawText = normalizeString(raw);
      if (!rawText) {
        normalizedValue = "";
      } else if (!isDateValue(rawText)) {
        normalizeError = `Invalid date for "${question.label || question.fieldKey}"`;
      } else {
        normalizedValue = normalizeDate(rawText);
      }
    } else if (question.type === "single_choice") {
      const normalized = normalizeSingleChoice(question, raw);
      normalizedValue = normalized.value;
      normalizeError = normalized.error;
    } else if (question.type === "multiple_choice") {
      const normalized = normalizeMultipleChoice(question, raw);
      normalizedValue = normalized.value;
      normalizeError = normalized.error;
    } else if (question.type === "file") {
      const normalized = normalizeFileAnswers(question, raw, filesById);
      normalizedValue = normalized.value;
      normalizeError = normalized.error;
    } else {
      normalizedValue = raw ?? "";
    }

    if (normalizeError) errors.push({ fieldKey: question.fieldKey, error: normalizeError });
    if (!normalizeError && TEXT_TYPE_SET.has(question.type)) {
      const textRuleError = validateTextRules(question, normalizedValue);
      if (textRuleError) errors.push({ fieldKey: question.fieldKey, error: textRuleError });
    }
    if (!normalizeError && question.type === "number") {
      const numberRuleError = validateNumberRules(question, normalizedValue);
      if (numberRuleError) errors.push({ fieldKey: question.fieldKey, error: numberRuleError });
    }
    if (!normalizeError && question.type === "date") {
      const dateRuleError = validateDateRules(question, normalizedValue);
      if (dateRuleError) errors.push({ fieldKey: question.fieldKey, error: dateRuleError });
    }

    const hasValue =
      Array.isArray(normalizedValue)
        ? normalizedValue.length > 0
        : normalizedValue !== null &&
          normalizedValue !== undefined &&
          normalizeString(normalizedValue) !== "";
    if (question.required && !hasValue) {
      errors.push({
        fieldKey: question.fieldKey,
        error: `"${question.label || question.fieldKey}" is required`,
      });
    }

    payloadByFieldKey[question.fieldKey] = normalizedValue;
    if (question.fieldName) {
      payloadByFieldNameSnapshot[question.fieldName] = normalizedValue;
    }

    fieldSnapshot[question.fieldKey] = {
      fieldKey: question.fieldKey,
      fieldName: question.fieldName,
      label: question.label,
      type: question.type,
      required: question.required,
      sectionId: question.sectionId,
      order: question.order,
      options: OPTION_TYPE_SET.has(question.type) ? question.options : [],
    };

    if (!SEARCHABLE_TYPE_SET.has(question.type)) continue;
    if (question.type === "file") {
      (Array.isArray(normalizedValue) ? normalizedValue : []).forEach((entry) => {
        if (entry?.filename) searchParts.push(entry.filename);
      });
    } else if (Array.isArray(normalizedValue)) {
      normalizedValue.forEach((entry) => {
        const text = normalizeString(entry);
        if (text) searchParts.push(text);
      });
    } else {
      const text = normalizeString(normalizedValue);
      if (text) searchParts.push(text);
    }
  }

  const searchText = normalizeTextForSearch(searchParts.join(" "));
  return {
    valid: errors.length === 0,
    errors,
    payloadByFieldKey,
    payloadByFieldNameSnapshot,
    fieldSnapshot,
    searchText,
  };
}
