import {
  FILE_FIELD_TYPES,
  FORM_FIELD_TYPE,
  NON_DATA_FIELD_TYPES,
  OPTION_FIELD_TYPES,
} from "@/lib/formBuilder/constants";

function messageFor(field, key, fallback) {
  const custom = field?.validation?.messages?.[key];
  return custom ? String(custom) : fallback;
}

function normalizeString(value) {
  if (value == null) return "";
  return String(value).trim();
}

function toDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  return [value];
}

function validateOptionValue(field, value) {
  const allowed = new Set((Array.isArray(field.options) ? field.options : []).map((opt) => opt.value));
  if (field.type === FORM_FIELD_TYPE.CHECKBOX_GROUP) {
    const arr = ensureArray(value).map((entry) => normalizeString(entry)).filter(Boolean);
    const invalid = arr.find((entry) => !allowed.has(entry));
    if (invalid) {
      return {
        valid: false,
        error: messageFor(field, "invalidOption", `Invalid option selected for "${field.label}"`),
      };
    }
    return { valid: true, value: arr };
  }
  const single = normalizeString(value);
  if (!single) return { valid: true, value: "" };
  if (!allowed.has(single)) {
    return {
      valid: false,
      error: messageFor(field, "invalidOption", `Invalid option selected for "${field.label}"`),
    };
  }
  return { valid: true, value: single };
}

function validateFileValue(field, uploadedFiles = []) {
  const files = Array.isArray(uploadedFiles) ? uploadedFiles : [];
  if (field.required && files.length === 0) {
    return {
      valid: false,
      error: messageFor(field, "required", `"${field.label}" is required`),
    };
  }

  const allowed = Array.isArray(field?.validation?.fileTypes)
    ? field.validation.fileTypes.map((item) => String(item).trim().toLowerCase())
    : [];
  const maxFileSizeMb = Number(field?.validation?.maxFileSizeMb || 0);
  const maxBytes = maxFileSizeMb > 0 ? maxFileSizeMb * 1024 * 1024 : 0;

  for (const file of files) {
    const mime = String(file?.mimeType || "").toLowerCase();
    const originalName = String(file?.originalName || file?.fileName || "").toLowerCase();
    if (allowed.length > 0) {
      const ok = allowed.some((rule) => {
        if (!rule) return false;
        if (rule.startsWith(".")) return originalName.endsWith(rule);
        return mime === rule || mime.startsWith(`${rule}/`);
      });
      if (!ok) {
        return {
          valid: false,
          error: messageFor(field, "fileTypes", `Unsupported file type for "${field.label}"`),
        };
      }
    }
    if (maxBytes > 0 && Number(file?.size || 0) > maxBytes) {
      return {
        valid: false,
        error: messageFor(
          field,
          "maxFileSizeMb",
          `File is too large for "${field.label}" (max ${maxFileSizeMb} MB)`,
        ),
      };
    }
  }

  return { valid: true, value: files };
}

function validateTextLike(field, value) {
  const next = normalizeString(value);

  if (field.required && !next) {
    return { valid: false, error: messageFor(field, "required", `"${field.label}" is required`) };
  }
  if (!next) return { valid: true, value: "" };

  const minLength = Number(field?.validation?.minLength || 0);
  const maxLength = Number(field?.validation?.maxLength || 0);
  if (minLength > 0 && next.length < minLength) {
    return {
      valid: false,
      error: messageFor(field, "minLength", `"${field.label}" must be at least ${minLength} characters`),
    };
  }
  if (maxLength > 0 && next.length > maxLength) {
    return {
      valid: false,
      error: messageFor(field, "maxLength", `"${field.label}" must be at most ${maxLength} characters`),
    };
  }

  const regex = String(field?.validation?.regex || "").trim();
  if (regex) {
    try {
      const pattern = new RegExp(regex);
      if (!pattern.test(next)) {
        return {
          valid: false,
          error: messageFor(field, "regex", `"${field.label}" is invalid`),
        };
      }
    } catch {
      // Ignore invalid regex defined in admin schema.
    }
  }

  if (field.type === FORM_FIELD_TYPE.EMAIL || field?.validation?.email === true) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
      return {
        valid: false,
        error: messageFor(field, "email", `"${field.label}" must be a valid email`),
      };
    }
  }

  if (field.type === FORM_FIELD_TYPE.URL) {
    try {
      const parsed = new URL(next);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("invalid protocol");
      }
    } catch {
      return {
        valid: false,
        error: messageFor(field, "url", `"${field.label}" must be a valid URL`),
      };
    }
  }

  if (field.type === FORM_FIELD_TYPE.MOBILE) {
    const digits = toDigits(next);
    const min = Number(field?.validation?.mobileMin || 10);
    const max = Number(field?.validation?.mobileMax || 15);
    if (digits.length < min || digits.length > max) {
      return {
        valid: false,
        error: messageFor(field, "mobile", `"${field.label}" must be a valid mobile number`),
      };
    }
    return { valid: true, value: digits };
  }

  return { valid: true, value: next };
}

function validateNumber(field, value) {
  const raw = normalizeString(value);
  if (!raw) {
    if (field.required) {
      return { valid: false, error: messageFor(field, "required", `"${field.label}" is required`) };
    }
    return { valid: true, value: null };
  }

  const numberValue = Number(raw);
  if (!Number.isFinite(numberValue)) {
    return { valid: false, error: messageFor(field, "number", `"${field.label}" must be a number`) };
  }

  const minValue = Number(field?.validation?.minValue);
  const maxValue = Number(field?.validation?.maxValue);
  if (Number.isFinite(minValue) && numberValue < minValue) {
    return {
      valid: false,
      error: messageFor(field, "minValue", `"${field.label}" must be at least ${minValue}`),
    };
  }
  if (Number.isFinite(maxValue) && numberValue > maxValue) {
    return {
      valid: false,
      error: messageFor(field, "maxValue", `"${field.label}" must be at most ${maxValue}`),
    };
  }

  return { valid: true, value: numberValue };
}

function validateDate(field, value) {
  const raw = normalizeString(value);
  if (!raw) {
    if (field.required) {
      return { valid: false, error: messageFor(field, "required", `"${field.label}" is required`) };
    }
    return { valid: true, value: "" };
  }
  const ts = Date.parse(raw);
  if (Number.isNaN(ts)) {
    return { valid: false, error: messageFor(field, "date", `"${field.label}" must be a valid date`) };
  }
  return { valid: true, value: raw };
}

export function validateSubmissionAgainstSchema({
  fields = [],
  payloadByFieldKey = {},
  filesByFieldKey = {},
}) {
  const errors = [];
  const byFieldKey = {};
  const byFieldNameSnapshot = {};

  const list = Array.isArray(fields) ? fields : [];
  for (const field of list) {
    if (!field || NON_DATA_FIELD_TYPES.has(field.type)) continue;

    const rawValue = payloadByFieldKey?.[field.fieldKey];
    let result = { valid: true, value: rawValue };

    if (OPTION_FIELD_TYPES.has(field.type)) {
      result = validateOptionValue(field, rawValue);
      if (
        result.valid &&
        field.required &&
        ((Array.isArray(result.value) && result.value.length === 0) || !result.value)
      ) {
        result = {
          valid: false,
          error: messageFor(field, "required", `"${field.label}" is required`),
        };
      }
      if (
        result.valid &&
        field.type === FORM_FIELD_TYPE.CHECKBOX_GROUP &&
        Array.isArray(result.value)
      ) {
        const minChecked = Number(field?.validation?.minChecked || 0);
        const maxChecked = Number(field?.validation?.maxChecked || 0);
        if (minChecked > 0 && result.value.length < minChecked) {
          result = {
            valid: false,
            error: messageFor(
              field,
              "minChecked",
              `Please select at least ${minChecked} option(s) for "${field.label}"`,
            ),
          };
        } else if (maxChecked > 0 && result.value.length > maxChecked) {
          result = {
            valid: false,
            error: messageFor(
              field,
              "maxChecked",
              `Please select at most ${maxChecked} option(s) for "${field.label}"`,
            ),
          };
        }
      }
    } else if (FILE_FIELD_TYPES.has(field.type)) {
      result = validateFileValue(field, filesByFieldKey?.[field.fieldKey] || []);
    } else if (field.type === FORM_FIELD_TYPE.NUMBER) {
      result = validateNumber(field, rawValue);
    } else if (field.type === FORM_FIELD_TYPE.DATE) {
      result = validateDate(field, rawValue);
    } else {
      result = validateTextLike(field, rawValue);
    }

    if (!result.valid) {
      errors.push(result.error || `Invalid value for "${field.label}"`);
      continue;
    }

    byFieldKey[field.fieldKey] = result.value;
    if (field.name) byFieldNameSnapshot[field.name] = result.value;
  }

  return {
    ok: errors.length === 0,
    errors,
    payloadByFieldKey: byFieldKey,
    payloadByFieldNameSnapshot: byFieldNameSnapshot,
  };
}

