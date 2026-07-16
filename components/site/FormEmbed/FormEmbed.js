"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import Image from "next/image";
import styled from "styled-components";
import {
  Alert,
  Button,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Radio,
  Row,
  Space,
  Spin,
  Typography,
  Upload,
  notification,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { FORM_DEFAULTS } from "@/lib/forms/constants";
import { getColor } from "@/styles/Theme";

const { Paragraph, Text, Title } = Typography;
const DATE_FORMAT = "YYYY-MM-DD";
const DEFAULT_SUBMISSION_SETTINGS = {
  ...FORM_DEFAULTS.submissionSettings,
};
const DEFAULT_STYLE_SETTINGS = {
  ...FORM_DEFAULTS.styleSettings,
};
const CAPTCHA_TYPES = new Set(["alphanumeric", "math", "checkbox_v2"]);

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function sortByOrder(items) {
  return [...(Array.isArray(items) ? items : [])].sort(
    (a, b) => Number(a?.order || 0) - Number(b?.order || 0),
  );
}

function normalizeSpan(value, fallback = 4) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 1) return 1;
  if (n > 4) return 4;
  return Math.round(n);
}

function getDesktopSpan(question) {
  if (normalizeText(question?.type) === "divider") return 24;
  return normalizeSpan(question?.span, 4) * 6;
}

function getTabletSpan(question) {
  if (normalizeText(question?.type) === "divider") return 24;
  const desktopCols = normalizeSpan(question?.span, 4);
  const tabletCols = Math.max(1, Math.min(2, Math.round((desktopCols / 4) * 2)));
  return tabletCols * 12;
}

function getRuntimeTarget({ mode, formId, shortcode }) {
  const cleanFormId = normalizeText(formId);
  const cleanShortcode = normalizeText(shortcode).toLowerCase();

  if (mode === "shortcode" && cleanShortcode) {
    return {
      type: "shortcode",
      key: cleanShortcode,
      url: `/api/public/forms/resolve?shortcode=${encodeURIComponent(cleanShortcode)}`,
    };
  }
  if (cleanFormId) {
    return {
      type: "formId",
      key: cleanFormId,
      url: `/api/public/forms/${encodeURIComponent(cleanFormId)}`,
    };
  }
  if (cleanShortcode) {
    return {
      type: "shortcode",
      key: cleanShortcode,
      url: `/api/public/forms/resolve?shortcode=${encodeURIComponent(cleanShortcode)}`,
    };
  }
  return null;
}

function getFileExtension(filename) {
  const text = normalizeText(filename).toLowerCase();
  const dotIndex = text.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return text.slice(dotIndex);
}

function toLowerStringArray(value) {
  return Array.isArray(value)
    ? value.map((entry) => normalizeText(entry).toLowerCase()).filter(Boolean)
    : [];
}

function normalizeExtension(value) {
  const ext = normalizeText(value).toLowerCase();
  if (!ext) return "";
  return ext.startsWith(".") ? ext : `.${ext}`;
}

function normalizeSubmissionSettings(input) {
  const source = input && typeof input === "object" ? input : {};
  const submitButtonAlignment = normalizeText(source.submitButtonAlignment).toLowerCase();
  const captchaType = normalizeText(source.captchaType).toLowerCase();
  const normalizedSubmitButtonAlignment =
    submitButtonAlignment === "center" ||
    submitButtonAlignment === "right" ||
    submitButtonAlignment === "full-width"
      ? submitButtonAlignment
      : DEFAULT_SUBMISSION_SETTINGS.submitButtonAlignment;
  const normalizedCaptchaType = CAPTCHA_TYPES.has(captchaType)
    ? captchaType
    : DEFAULT_SUBMISSION_SETTINGS.captchaType;
  return {
    resetOnSuccess:
      source.resetOnSuccess == null
        ? DEFAULT_SUBMISSION_SETTINGS.resetOnSuccess
        : Boolean(source.resetOnSuccess),
    notifyOnSuccess:
      source.notifyOnSuccess == null
        ? DEFAULT_SUBMISSION_SETTINGS.notifyOnSuccess
        : Boolean(source.notifyOnSuccess),
    notifyOnError:
      source.notifyOnError == null
        ? DEFAULT_SUBMISSION_SETTINGS.notifyOnError
        : Boolean(source.notifyOnError),
    submitButtonAlignment: normalizedSubmitButtonAlignment,
    captchaEnabled:
      source.captchaEnabled == null
        ? DEFAULT_SUBMISSION_SETTINGS.captchaEnabled
        : Boolean(source.captchaEnabled),
    captchaType: normalizedCaptchaType,
  };
}

function normalizeStyleSettings(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    inputBorderColor: String(source.inputBorderColor || DEFAULT_STYLE_SETTINGS.inputBorderColor),
    inputFocusColor: String(source.inputFocusColor || DEFAULT_STYLE_SETTINGS.inputFocusColor),
    inputErrorColor: String(source.inputErrorColor || DEFAULT_STYLE_SETTINGS.inputErrorColor),
    buttonBgColor: String(source.buttonBgColor || DEFAULT_STYLE_SETTINGS.buttonBgColor),
    buttonHoverColor: String(source.buttonHoverColor || DEFAULT_STYLE_SETTINGS.buttonHoverColor),
    buttonFocusColor: String(source.buttonFocusColor || DEFAULT_STYLE_SETTINGS.buttonFocusColor),
    buttonTextColor: String(source.buttonTextColor || DEFAULT_STYLE_SETTINGS.buttonTextColor),
    checkboxColor: String(source.checkboxColor || DEFAULT_STYLE_SETTINGS.checkboxColor),
    radioColor: String(source.radioColor || DEFAULT_STYLE_SETTINGS.radioColor),
    switchColor: String(source.switchColor || DEFAULT_STYLE_SETTINGS.switchColor),
    requiredIndicatorColor: String(
      source.requiredIndicatorColor || DEFAULT_STYLE_SETTINGS.requiredIndicatorColor,
    ),
    successMessageColor: String(
      source.successMessageColor || DEFAULT_STYLE_SETTINGS.successMessageColor,
    ),
    errorMessageColor: String(source.errorMessageColor || DEFAULT_STYLE_SETTINGS.errorMessageColor),
  };
}

function isLiteralCssColor(value) {
  const text = normalizeText(value).toLowerCase();
  if (!text) return false;
  if (text.startsWith("#")) return true;
  if (/^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/.test(text)) return true;
  if (/^(var|color-mix)\(/.test(text)) return true;
  return [
    "transparent",
    "inherit",
    "initial",
    "unset",
    "revert",
    "currentcolor",
  ].includes(text);
}

function resolveThemeColorValue(value) {
  const text = normalizeText(value);
  if (!text) return undefined;
  if (isLiteralCssColor(text)) return text;
  const resolved = normalizeText(getColor(text));
  return resolved || text;
}

function resolveMaxFileSizeBytes(rules = {}) {
  const maxSizeBytes = Number(rules?.maxSizeBytes);
  if (Number.isFinite(maxSizeBytes) && maxSizeBytes > 0) return Math.round(maxSizeBytes);
  const maxSizeMB = Number(rules?.maxSizeMB);
  if (Number.isFinite(maxSizeMB) && maxSizeMB > 0) {
    return Math.round(maxSizeMB * 1024 * 1024);
  }
  return null;
}

function normalizeCaptchaChallenge(input, fallbackType = DEFAULT_SUBMISSION_SETTINGS.captchaType) {
  const source = input && typeof input === "object" ? input : {};
  const rawType = normalizeText(source?.type).toLowerCase();
  const type = CAPTCHA_TYPES.has(rawType) ? rawType : fallbackType;
  return {
    type,
    provider: normalizeText(source?.provider).toLowerCase(),
    siteKey: normalizeText(source?.siteKey),
    token: normalizeText(source?.token),
    prompt: normalizeText(source?.prompt),
    placeholder: normalizeText(source?.placeholder),
    imageDataUri: normalizeText(source?.imageDataUri),
    expiresInSeconds: Number(source?.expiresInSeconds || 0),
  };
}

function buildInitialValues(questions, prefillByFieldName = {}) {
  const values = {};
  sortByOrder(questions || []).forEach((question) => {
    const fieldKey = normalizeText(question?.fieldKey);
    const type = normalizeText(question?.type);
    const fieldName = normalizeText(question?.fieldName);
    if (!fieldKey || type === "divider") return;

    if (prefillByFieldName[fieldName] !== undefined) {
      const prefilled = prefillByFieldName[fieldName];
      if (type === "date") {
        const d = dayjs(prefilled);
        values[fieldKey] = d.isValid() ? d : undefined;
      } else {
        values[fieldKey] = prefilled;
      }
      return;
    }

    if (type === "multiple_choice" || type === "file") {
      values[fieldKey] = [];
      return;
    }

    if (type === "hidden") {
      values[fieldKey] = question?.rules?.defaultValue ?? "";
      return;
    }

    values[fieldKey] = "";
  });
  return values;
}

function buildUploadFileLists(valuesByField = {}) {
  const lists = {};
  Object.entries(valuesByField).forEach(([fieldKey, value]) => {
    if (!Array.isArray(value)) return;
    const refs = value
      .map((entry, idx) => ({
        uid: `existing_${fieldKey}_${idx}`,
        name: normalizeText(entry?.filename || `file_${idx + 1}`),
        status: "done",
        url: normalizeText(entry?.url),
        uploadedRef: {
          submissionFileId: normalizeText(entry?.submissionFileId || entry?.id || entry?._id),
          filename: normalizeText(entry?.filename || `file_${idx + 1}`),
          mimeType: normalizeText(entry?.mimeType),
          size: Number(entry?.size || 0),
          url: normalizeText(entry?.url),
        },
      }))
      .filter((entry) => normalizeText(entry?.uploadedRef?.submissionFileId));
    if (refs.length > 0) lists[fieldKey] = refs;
  });
  return lists;
}

function getRulesForQuestion(question) {
  const rules = [];
  const fieldLabel = normalizeText(question?.label || question?.fieldName || question?.fieldKey || "Field");
  const required = Boolean(question?.required);
  const type = normalizeText(question?.type);
  const qRules = question?.rules && typeof question.rules === "object" ? question.rules : {};

  if (type === "file" || type === "multiple_choice") {
    if (required) {
      rules.push({
        validator: (_, value) => {
          if (Array.isArray(value) && value.length > 0) return Promise.resolve();
          return Promise.reject(new Error(`${fieldLabel} is required`));
        },
      });
    }
  } else if (required) {
    rules.push({ required: true, message: `${fieldLabel} is required` });
  }

  if (type === "email") {
    rules.push({
      validator: (_, value) => {
        const text = normalizeText(value);
        if (!text) return Promise.resolve();
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
        return isValid
          ? Promise.resolve()
          : Promise.reject(new Error("Please enter a valid email address"));
      },
    });
  }

  if (type === "phone") {
    rules.push({
      validator: (_, value) => {
        const text = normalizeText(value);
        if (!text) return Promise.resolve();
        const digits = text.replace(/\D/g, "");
        return digits.length >= 7 && digits.length <= 15
          ? Promise.resolve()
          : Promise.reject(new Error("Please enter a valid mobile number"));
      },
    });
  }

  if (type === "url") {
    rules.push({
      validator: (_, value) => {
        const text = normalizeText(value);
        if (!text) return Promise.resolve();
        try {
          const url = new URL(text);
          const valid = url.protocol === "http:" || url.protocol === "https:";
          return valid
            ? Promise.resolve()
            : Promise.reject(new Error("Please enter a valid URL"));
        } catch {
          return Promise.reject(new Error("Please enter a valid URL"));
        }
      },
    });
  }

  if (type === "number") {
    rules.push({
      validator: (_, value) => {
        const text = normalizeText(value);
        if (!text) return Promise.resolve();
        const number = Number(text);
        if (!Number.isFinite(number)) return Promise.reject(new Error("Please enter a valid number"));

        const min = Number(qRules?.min);
        if (Number.isFinite(min) && number < min) {
          return Promise.reject(new Error(`${fieldLabel} must be at least ${min}`));
        }
        const max = Number(qRules?.max);
        if (Number.isFinite(max) && number > max) {
          return Promise.reject(new Error(`${fieldLabel} must be at most ${max}`));
        }
        return Promise.resolve();
      },
    });
  }

  if (type === "date") {
    rules.push({
      validator: (_, value) => {
        if (!value) return Promise.resolve();
        const d = dayjs(value);
        if (!d.isValid()) return Promise.reject(new Error("Please select a valid date"));
        const min = normalizeText(qRules?.min);
        const max = normalizeText(qRules?.max);
        if (min) {
          const minDate = dayjs(min);
          if (minDate.isValid() && d.isBefore(minDate, "day")) {
            return Promise.reject(new Error(`${fieldLabel} must be on or after ${minDate.format(DATE_FORMAT)}`));
          }
        }
        if (max) {
          const maxDate = dayjs(max);
          if (maxDate.isValid() && d.isAfter(maxDate, "day")) {
            return Promise.reject(new Error(`${fieldLabel} must be on or before ${maxDate.format(DATE_FORMAT)}`));
          }
        }
        return Promise.resolve();
      },
    });
  }

  if (type === "short_text" || type === "paragraph" || type === "hidden") {
    const minLength = Number(qRules?.minLength);
    const maxLength = Number(qRules?.maxLength);
    const pattern = normalizeText(qRules?.pattern);
    rules.push({
      validator: (_, value) => {
        const text = normalizeText(value);
        if (!text) return Promise.resolve();
        if (Number.isFinite(minLength) && text.length < minLength) {
          return Promise.reject(new Error(`${fieldLabel} must be at least ${minLength} characters`));
        }
        if (Number.isFinite(maxLength) && text.length > maxLength) {
          return Promise.reject(new Error(`${fieldLabel} must be at most ${maxLength} characters`));
        }
        if (pattern) {
          try {
            const regex = new RegExp(pattern, "i");
            if (!regex.test(text)) {
              return Promise.reject(new Error(`${fieldLabel} format is invalid`));
            }
          } catch {
            return Promise.resolve();
          }
        }
        return Promise.resolve();
      },
    });
  }

  return rules;
}

function mapUploadRef(entry, fallbackName = "") {
  const submissionFileId = normalizeText(
    entry?.submissionFileId || entry?.id || entry?._id || entry?.uploadedRef?.submissionFileId,
  );
  if (!submissionFileId) return null;
  return {
    submissionFileId,
    filename: normalizeText(entry?.filename || entry?.name || fallbackName),
    mimeType: normalizeText(entry?.mimeType || entry?.type),
    size: Number(entry?.size || 0),
    url: normalizeText(entry?.url),
  };
}

const FormShell = styled.div`
  .form-section-title {
    margin-bottom: 4px;
  }

  .form-section-description {
    margin-bottom: 14px;
    color: rgba(0, 0, 0, 0.65);
  }

  .ant-form-item {
    margin-bottom: 16px;
  }

  .ant-form-item-label > label {
    font-size: 14px;
    font-weight: 600;
    color: #1d1f21;
  }

  .ant-form-item-label > label.ant-form-item-required::before {
    color: var(--form-required-indicator-color, #cf372f) !important;
  }

  .ant-input,
  .ant-select-selector,
  .ant-picker {
    min-height: 52px;
    border-radius: 10px !important;
    border-color: var(--form-input-border-color, #d9d9d9) !important;
    box-shadow: none !important;
    font-size: 14px;
  }

  .ant-input:focus,
  .ant-input-focused,
  .ant-select-focused .ant-select-selector,
  .ant-picker-focused {
    border-color: var(--form-input-focus-color, #cf372f) !important;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--form-input-focus-color, #cf372f) 20%, transparent) !important;
  }

  .ant-select-selector {
    display: flex !important;
    align-items: center !important;
    padding-inline: 12px !important;
    padding-right: 36px !important;
  }

  .ant-select-selection-item,
  .ant-select-selection-placeholder,
  .ant-select-selection-search-input {
    line-height: 50px !important;
    font-size: 14px !important;
  }

  .ant-picker-input > input {
    font-size: 14px;
  }

  .ant-input-number,
  .ant-input-textarea textarea.ant-input {
    border-radius: 10px !important;
  }

  .ant-input-textarea textarea.ant-input {
    min-height: 110px;
    padding: 10px 13px;
  }

  .ant-upload-wrapper .ant-upload-select {
    width: 100%;
  }

  .ant-upload-wrapper .ant-btn {
    min-height: 44px;
    border-radius: 10px;
    font-weight: 600;
  }

  .ant-form-item-extra {
    color: rgba(0, 0, 0, 0.6);
    font-size: 12px;
    margin-top: 4px;
  }

  .ant-form-item-explain-error {
    margin-top: 6px;
    font-size: 12px;
    color: var(--form-error-message-color, #cf372f);
  }

  .ant-form-item-has-error .ant-input,
  .ant-form-item-has-error .ant-select-selector,
  .ant-form-item-has-error .ant-picker {
    border-color: var(--form-input-error-color, #cf372f) !important;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--form-input-error-color, #cf372f) 20%, transparent) !important;
  }

  .form-submit-btn.ant-btn.ant-btn-primary {
    border-radius: 28px;
    min-height: 48px;
    font-size: 14px;
    font-weight: 700;
    padding-inline: 20px;
    background: var(--form-button-bg-color, #cf372f) !important;
    border-color: var(--form-button-bg-color, #cf372f) !important;
    color: var(--form-button-text-color, #ffffff) !important;
  }

  .form-submit-btn.ant-btn.ant-btn-primary:hover,
  .form-submit-btn.ant-btn.ant-btn-primary:focus {
    background: var(--form-button-hover-color, #b42f29) !important;
    border-color: var(--form-button-hover-color, #b42f29) !important;
  }

  .form-submit-btn.ant-btn.ant-btn-primary:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--form-button-focus-color, #cf372f) 25%, transparent) !important;
  }

  .form-submit-actions {
    width: min(100%, 420px);
    max-width: 100%;
  }

  .form-captcha-wrap {
    width: 100%;
    max-width: 100%;
  }

  .form-captcha-image {
    display: block;
    width: min(100%, 220px) !important;
    height: auto !important;
    max-width: 100%;
  }

  .form-google-recaptcha {
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
  }

  @media (max-width: 768px) {
    .form-submit-actions {
      width: 100% !important;
      max-width: 100% !important;
    }

    .form-captcha-image {
      width: min(100%, 200px) !important;
    }
  }

  .ant-checkbox-checked .ant-checkbox-inner,
  .ant-checkbox-indeterminate .ant-checkbox-inner:after {
    background-color: var(--form-checkbox-color, #cf372f) !important;
    border-color: var(--form-checkbox-color, #cf372f) !important;
  }

  .ant-checkbox-wrapper:hover .ant-checkbox-inner,
  .ant-checkbox:hover .ant-checkbox-inner {
    border-color: var(--form-checkbox-color, #cf372f) !important;
  }

  .ant-radio-checked .ant-radio-inner {
    border-color: var(--form-radio-color, #cf372f) !important;
    background-color: #fff !important;
  }

  .ant-radio-checked .ant-radio-inner:after {
    background-color: var(--form-radio-color, #cf372f) !important;
  }

  .ant-radio-wrapper:hover .ant-radio-inner {
    border-color: var(--form-radio-color, #cf372f) !important;
  }

  .ant-switch.ant-switch-checked {
    background: var(--form-switch-color, #cf372f) !important;
  }
`;

export default function FormEmbed(props = {}) {
  const [form] = Form.useForm();
  const mode = normalizeText(props.mode || "formId");
  const configuredFormId = normalizeText(props.formId);
  const configuredShortcode = normalizeText(props.shortcode).toLowerCase();
  const heading = normalizeText(props.heading);
  const description = normalizeText(props.description);
  const submitLabelOverride = normalizeText(props.submitLabel);
  const successMessageOverride = normalizeText(props.successMessage);
  const prefillByFieldName = useMemo(
    () => (isPlainObject(props.prefillByFieldName) ? props.prefillByFieldName : {}),
    [props.prefillByFieldName],
  );

  const [runtimeLoading, setRuntimeLoading] = useState(true);
  const [runtimeError, setRuntimeError] = useState("");
  const [runtimeForm, setRuntimeForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingByFieldKey, setUploadingByFieldKey] = useState({});
  const [uploadFileLists, setUploadFileLists] = useState({});
  const [captchaChallenge, setCaptchaChallenge] = useState(null);
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const recaptchaContainerRef = useRef(null);
  const recaptchaWidgetIdRef = useRef(null);

  const target = useMemo(
    () =>
      getRuntimeTarget({
        mode,
        formId: configuredFormId,
        shortcode: configuredShortcode,
      }),
    [mode, configuredFormId, configuredShortcode],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRuntime() {
      if (!target) {
        setRuntimeForm(null);
        setRuntimeError("Form is not configured. Select a form or provide shortcode in Form Embed settings.");
        setRuntimeLoading(false);
        return;
      }

      setRuntimeLoading(true);
      setRuntimeError("");
      setRuntimeForm(null);
      setUploadFileLists({});
      setCaptchaChallenge(null);
      setCaptchaValue("");
      setCaptchaError("");
      recaptchaWidgetIdRef.current = null;

      try {
        const res = await fetch(target.url, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load form");
        if (cancelled) return;

        const schema = data?.schema || data?.formSchema || { sections: [], questions: [] };
        const normalized = {
          formId: normalizeText(data?.formId),
          name: normalizeText(data?.name),
          schema,
          defaults: {
            submitLabel: normalizeText(data?.defaults?.submitLabel || "Submit"),
            successMessage: normalizeText(
              data?.defaults?.successMessage || "Thank you for your response.",
            ),
            submissionSettings: normalizeSubmissionSettings(data?.defaults?.submissionSettings),
            styleSettings: normalizeStyleSettings(data?.defaults?.styleSettings),
          },
        };
        setRuntimeForm(normalized);

        const initialValues = buildInitialValues(schema?.questions || [], prefillByFieldName);
        form.setFieldsValue(initialValues);
        setUploadFileLists(buildUploadFileLists(initialValues));
      } catch (err) {
        if (!cancelled) setRuntimeError(err?.message || "Failed to load form");
      } finally {
        if (!cancelled) setRuntimeLoading(false);
      }
    }

    loadRuntime();
    return () => {
      cancelled = true;
    };
  }, [target, form, prefillByFieldName]);

  const orderedSections = useMemo(
    () => sortByOrder(runtimeForm?.schema?.sections || []),
    [runtimeForm?.schema?.sections],
  );

  const orderedQuestions = useMemo(
    () => sortByOrder(runtimeForm?.schema?.questions || []),
    [runtimeForm?.schema?.questions],
  );

  const questionsBySection = useMemo(() => {
    const map = new Map();
    orderedSections.forEach((section) => map.set(section.sectionId, []));
    orderedQuestions.forEach((question) => {
      const sectionId = normalizeText(question?.sectionId);
      if (!map.has(sectionId)) map.set(sectionId, []);
      map.get(sectionId).push(question);
    });
    return map;
  }, [orderedSections, orderedQuestions]);

  const submitLabel = submitLabelOverride || runtimeForm?.defaults?.submitLabel || "Submit";
  const runtimeSubmissionSettings = useMemo(
    () => normalizeSubmissionSettings(runtimeForm?.defaults?.submissionSettings),
    [runtimeForm?.defaults?.submissionSettings],
  );
  const runtimeStyleSettings = useMemo(
    () => normalizeStyleSettings(runtimeForm?.defaults?.styleSettings),
    [runtimeForm?.defaults?.styleSettings],
  );
  const submitButtonAlignment = normalizeText(
    runtimeSubmissionSettings?.submitButtonAlignment,
  ).toLowerCase();
  const submitButtonIsFullWidth = submitButtonAlignment === "full-width";
  const submitButtonJustifyContent = useMemo(() => {
    if (submitButtonAlignment === "center") return "center";
    if (submitButtonAlignment === "right") return "flex-end";
    return "flex-start";
  }, [submitButtonAlignment]);
  const submitActionAlignItems = useMemo(() => {
    if (submitButtonAlignment === "center") return "center";
    if (submitButtonAlignment === "right") return "flex-end";
    return "flex-start";
  }, [submitButtonAlignment]);
  const captchaEnabled = Boolean(runtimeSubmissionSettings?.captchaEnabled);
  const captchaType = normalizeText(runtimeSubmissionSettings?.captchaType).toLowerCase() || "alphanumeric";
  const resolvedStyleSettings = useMemo(
    () => ({
      inputBorderColor: resolveThemeColorValue(runtimeStyleSettings.inputBorderColor),
      inputFocusColor: resolveThemeColorValue(runtimeStyleSettings.inputFocusColor),
      inputErrorColor: resolveThemeColorValue(runtimeStyleSettings.inputErrorColor),
      buttonBgColor: resolveThemeColorValue(runtimeStyleSettings.buttonBgColor),
      buttonHoverColor: resolveThemeColorValue(runtimeStyleSettings.buttonHoverColor),
      buttonFocusColor: resolveThemeColorValue(runtimeStyleSettings.buttonFocusColor),
      buttonTextColor: resolveThemeColorValue(runtimeStyleSettings.buttonTextColor),
      checkboxColor: resolveThemeColorValue(runtimeStyleSettings.checkboxColor),
      radioColor: resolveThemeColorValue(runtimeStyleSettings.radioColor),
      switchColor: resolveThemeColorValue(runtimeStyleSettings.switchColor),
      requiredIndicatorColor: resolveThemeColorValue(runtimeStyleSettings.requiredIndicatorColor),
      successMessageColor: resolveThemeColorValue(runtimeStyleSettings.successMessageColor),
      errorMessageColor: resolveThemeColorValue(runtimeStyleSettings.errorMessageColor),
    }),
    [runtimeStyleSettings],
  );
  const loadGoogleRecaptchaScript = useCallback(async () => {
    if (typeof window === "undefined") return null;
    if (window.grecaptcha?.render) return window.grecaptcha;

    const scriptId = "google-recaptcha-api-script";
    const scriptSources = [
      "/api/public/recaptcha/script",
      "https://www.google.com/recaptcha/api.js?render=explicit",
      "https://www.recaptcha.net/recaptcha/api.js?render=explicit",
    ];

    async function waitForGrecaptchaRender(timeoutMs = 5000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (window.grecaptcha?.render) return window.grecaptcha;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      throw new Error("Google reCAPTCHA runtime did not initialize.");
    }

    async function loadScriptSource(src) {
      return new Promise((resolve, reject) => {
        const current = document.getElementById(scriptId);
        if (current && !window.grecaptcha?.render) {
          const status = normalizeText(current.getAttribute("data-status")).toLowerCase();
          const currentSrc = normalizeText(current.getAttribute("src"));
          if (status === "error" || (currentSrc && currentSrc !== src)) {
            current.remove();
          }
        }

        const existing = document.getElementById(scriptId);
        if (existing) {
          if (window.grecaptcha?.render) {
            resolve(window.grecaptcha);
            return;
          }
          existing.addEventListener("load", () => resolve(window.grecaptcha), { once: true });
          existing.addEventListener(
            "error",
            () => reject(new Error("Failed to load Google reCAPTCHA script")),
            { once: true },
          );
          return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = src;
        script.crossOrigin = "anonymous";
        script.async = true;
        script.defer = true;
        script.setAttribute("data-status", "loading");
        script.onload = () => {
          script.setAttribute("data-status", "loaded");
          resolve(window.grecaptcha);
        };
        script.onerror = () => {
          script.setAttribute("data-status", "error");
          script.remove();
          reject(new Error("Failed to load Google reCAPTCHA script"));
        };
        document.head.appendChild(script);
      });
    }

    let lastError = null;
    for (const src of scriptSources) {
      try {
        await loadScriptSource(src);
        return await waitForGrecaptchaRender();
      } catch (err) {
        lastError = err;
      }
    }

    throw (
      lastError ||
      new Error("Failed to load Google reCAPTCHA script from all available sources.")
    );
  }, []);

  const resetGoogleRecaptcha = useCallback(() => {
    if (typeof window === "undefined") return;
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) return;
    const widgetId = recaptchaWidgetIdRef.current;
    if (widgetId != null) {
      grecaptcha.reset(widgetId);
    } else {
      grecaptcha.reset();
    }
    setCaptchaValue("");
  }, []);

  const loadCaptchaChallenge = useCallback(async () => {
    const currentFormId = normalizeText(runtimeForm?.formId);
    if (!captchaEnabled || !currentFormId) {
      setCaptchaChallenge(null);
      setCaptchaValue("");
      setCaptchaError("");
      recaptchaWidgetIdRef.current = null;
      return;
    }

    setCaptchaLoading(true);
    setCaptchaError("");
    setCaptchaValue("");

    try {
      const res = await fetch(
        `/api/public/forms/${encodeURIComponent(currentFormId)}/captcha`,
        { cache: "no-store" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load captcha");
      const challenge = normalizeCaptchaChallenge(data?.captcha, captchaType);
      const isGoogleCheckbox =
        challenge?.type === "checkbox_v2" && challenge?.provider === "google_recaptcha";
      if (isGoogleCheckbox && !challenge?.siteKey) {
        throw new Error("Google reCAPTCHA site key is not configured.");
      }
      if (!isGoogleCheckbox && !challenge?.token) {
        throw new Error("Captcha challenge is unavailable right now.");
      }
      setCaptchaChallenge(challenge);
    } catch (err) {
      setCaptchaChallenge(null);
      setCaptchaError(normalizeText(err?.message || "Failed to load captcha"));
    } finally {
      setCaptchaLoading(false);
    }
  }, [captchaEnabled, captchaType, runtimeForm?.formId]);

  useEffect(() => {
    if (!captchaEnabled) {
      setCaptchaChallenge(null);
      setCaptchaValue("");
      setCaptchaError("");
      recaptchaWidgetIdRef.current = null;
      return;
    }
    loadCaptchaChallenge();
  }, [captchaEnabled, loadCaptchaChallenge]);

  useEffect(() => {
    const challenge = captchaChallenge;
    const shouldRenderGoogle =
      captchaEnabled &&
      captchaType === "checkbox_v2" &&
      normalizeText(challenge?.provider) === "google_recaptcha" &&
      Boolean(challenge?.siteKey);

    if (!shouldRenderGoogle) {
      recaptchaWidgetIdRef.current = null;
      return;
    }

    let cancelled = false;
    async function mountGoogleRecaptcha() {
      try {
        const grecaptcha = await loadGoogleRecaptchaScript();
        if (!grecaptcha || cancelled) return;
        await new Promise((resolve) => grecaptcha.ready(resolve));
        if (cancelled || !recaptchaContainerRef.current) return;

        if (recaptchaWidgetIdRef.current != null) {
          grecaptcha.reset(recaptchaWidgetIdRef.current);
          return;
        }

        const widgetId = grecaptcha.render(recaptchaContainerRef.current, {
          sitekey: challenge.siteKey,
          size: typeof window !== "undefined" && window.innerWidth <= 480 ? "compact" : "normal",
          callback: (token) => {
            setCaptchaValue(normalizeText(token));
            setCaptchaError("");
          },
          "expired-callback": () => setCaptchaValue(""),
          "error-callback": () => {
            setCaptchaValue("");
            setCaptchaError("Google reCAPTCHA failed. Please try again.");
          },
        });
        recaptchaWidgetIdRef.current = widgetId;
      } catch (err) {
        if (!cancelled) {
          setCaptchaError(
            normalizeText(err?.message || "Failed to load Google reCAPTCHA."),
          );
        }
      }
    }

    mountGoogleRecaptcha();
    return () => {
      cancelled = true;
    };
  }, [captchaChallenge, captchaEnabled, captchaType, loadGoogleRecaptchaScript]);

  function showErrorNotification(description, title = "Submission failed") {
    if (!runtimeSubmissionSettings.notifyOnError) return;
    notification.error({
      message: title,
      description,
      placement: "bottomRight",
      styles: resolvedStyleSettings.errorMessageColor
        ? {
            body: { color: resolvedStyleSettings.errorMessageColor },
          }
        : undefined,
    });
  }

  async function uploadFile(question, file) {
    const currentFormId = normalizeText(runtimeForm?.formId);
    const fieldKey = normalizeText(question?.fieldKey);
    if (!currentFormId || !fieldKey || !file) return null;

    const formData = new FormData();
    formData.append("fieldKey", fieldKey);
    formData.append("file", file);

    const res = await fetch(`/api/public/forms/${encodeURIComponent(currentFormId)}/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "File upload failed");

    return {
      submissionFileId: normalizeText(data?.submissionFileId),
      filename: normalizeText(data?.filename || file.name),
      mimeType: normalizeText(data?.mimeType || file.type),
      size: Number(data?.size || file.size || 0),
      url: normalizeText(data?.url),
    };
  }

  function validateUploadFile(question, file, currentCount = 0) {
    const fieldLabel = normalizeText(question?.label || question?.fieldName || question?.fieldKey || "File");
    const rules = question?.rules && typeof question.rules === "object" ? question.rules : {};
    const maxFiles = Math.max(1, Number(rules?.maxFiles) || 1);
    if (maxFiles > 1 && currentCount >= maxFiles) {
      return `A maximum of ${maxFiles} file(s) is allowed for "${fieldLabel}"`;
    }

    const maxBytes = resolveMaxFileSizeBytes(rules);
    if (maxBytes && Number(file?.size || 0) > maxBytes) {
      const maxMb = Math.round((maxBytes / (1024 * 1024)) * 100) / 100;
      return `File too large. Max size is ${maxMb} MB.`;
    }

    const allowedMimeTypes = toLowerStringArray(rules?.allowedMimeTypes);
    const allowedExtensions = Array.isArray(rules?.allowedExtensions)
      ? rules.allowedExtensions.map(normalizeExtension).filter(Boolean)
      : [];
    const mimeType = normalizeText(file?.type).toLowerCase();
    const extension = getFileExtension(file?.name);

    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(mimeType)) {
      return `This file type is not allowed for "${fieldLabel}"`;
    }
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
      return `This file extension is not allowed for "${fieldLabel}"`;
    }
    return "";
  }

  async function handleSubmit(values) {
    if (!runtimeForm?.formId || submitting) return;

    if (captchaEnabled) {
      if (captchaLoading) {
        setCaptchaError("Captcha challenge is loading. Please wait a moment.");
        return;
      }

      if (captchaType === "checkbox_v2") {
        if (!normalizeText(captchaValue)) {
          setCaptchaError("Please complete Google reCAPTCHA.");
          return;
        }
      } else if (!normalizeText(captchaValue)) {
        setCaptchaError("Please complete the captcha challenge.");
        return;
      } else {
        const captchaToken = normalizeText(captchaChallenge?.token);
        if (!captchaToken) {
          setCaptchaError("Captcha challenge is unavailable. Please refresh and try again.");
          return;
        }
      }
    }

    setCaptchaError("");
    setSubmitting(true);

    const pagePath =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "";

    try {
      const answersByFieldKey = {};
      orderedQuestions.forEach((question) => {
        const fieldKey = normalizeText(question?.fieldKey);
        const type = normalizeText(question?.type);
        if (!fieldKey || type === "divider") return;

        const raw = values?.[fieldKey];
        if (type === "date") {
          answersByFieldKey[fieldKey] = raw && dayjs(raw).isValid() ? dayjs(raw).format(DATE_FORMAT) : "";
          return;
        }
        if (type === "multiple_choice") {
          answersByFieldKey[fieldKey] = Array.isArray(raw) ? raw : [];
          return;
        }
        if (type === "file") {
          const refs = Array.isArray(raw)
            ? raw
                .map((entry) => {
                  if (entry?.submissionFileId) return mapUploadRef(entry, entry?.filename);
                  if (entry?.uploadedRef) return mapUploadRef(entry.uploadedRef, entry?.name);
                  if (entry?.response) return mapUploadRef(entry.response, entry?.name);
                  return mapUploadRef(entry, entry?.name);
                })
                .filter(Boolean)
            : [];
          answersByFieldKey[fieldKey] = refs;
          return;
        }
        answersByFieldKey[fieldKey] = raw ?? "";
      });

      const res = await fetch(`/api/public/forms/${encodeURIComponent(runtimeForm.formId)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answersByFieldKey,
          source: "FormEmbed",
          pagePath,
          captcha: captchaEnabled
            ? {
                token: normalizeText(captchaChallenge?.token),
                response: normalizeText(captchaValue),
              }
            : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 400 && data?.captcha?.invalid) {
          const captchaMessage = normalizeText(
            data?.captcha?.message || data?.error || "Captcha validation failed",
          );
          setCaptchaError(captchaMessage);
          if (data?.captcha?.refresh) {
            if (captchaType === "checkbox_v2") {
              resetGoogleRecaptcha();
            } else {
              await loadCaptchaChallenge();
            }
          }
          throw new Error(captchaMessage);
        }

        if (res.status === 400 && Array.isArray(data?.errors)) {
          form.setFields(
            data.errors
              .map((entry) => ({
                name: normalizeText(entry?.fieldKey),
                errors: [normalizeText(entry?.error || "Invalid value")],
              }))
              .filter((entry) => entry.name),
          );
        }
        throw new Error(data?.error || "Failed to submit form");
      }
      setCaptchaError("");

      const successText =
        successMessageOverride ||
        normalizeText(data?.message) ||
        runtimeForm?.defaults?.successMessage ||
        "Thank you for your response.";

      if (runtimeSubmissionSettings.notifyOnSuccess) {
        notification.success({
          message: "Success",
          description: successText,
          placement: "bottomRight",
          styles: resolvedStyleSettings.successMessageColor
            ? {
                body: { color: resolvedStyleSettings.successMessageColor },
              }
            : undefined,
        });
      }

      if (runtimeSubmissionSettings.resetOnSuccess) {
        const resetValues = buildInitialValues(orderedQuestions, prefillByFieldName);
        form.resetFields();
        form.setFieldsValue(resetValues);
        setUploadFileLists(buildUploadFileLists(resetValues));
      }

      if (captchaEnabled) {
        setCaptchaValue("");
        if (captchaType === "checkbox_v2") {
          resetGoogleRecaptcha();
        } else {
          await loadCaptchaChallenge();
        }
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("new-form-submission"));
      }
    } catch (err) {
      showErrorNotification(err?.message || "Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  }

  function renderQuestionField(question) {
    const fieldKey = normalizeText(question?.fieldKey);
    const type = normalizeText(question?.type);
    const label = normalizeText(question?.label || question?.fieldName || fieldKey);
    const descriptionText = normalizeText(question?.description);
    if (!fieldKey) return null;

    if (type === "divider") {
      return (
        <Col key={fieldKey} xs={24} md={24} lg={24}>
          <div style={{ marginBottom: 14 }}>
            {label ? <Text strong>{label}</Text> : null}
            <Divider style={{ margin: "8px 0" }} />
          </div>
        </Col>
      );
    }

    if (type === "hidden") {
      return (
        <Col key={fieldKey} xs={24} md={24} lg={24} style={{ display: "none" }}>
          <Form.Item name={fieldKey} hidden rules={getRulesForQuestion(question)}>
            <Input />
          </Form.Item>
        </Col>
      );
    }

    const options = sortByOrder(question?.options || []);
    const fieldRules = getRulesForQuestion(question);
    const maxFiles = Math.max(1, Number(question?.rules?.maxFiles) || 1);
    const allowedMimeTypes = toLowerStringArray(question?.rules?.allowedMimeTypes);
    const allowedExtensions = Array.isArray(question?.rules?.allowedExtensions)
      ? question.rules.allowedExtensions.map(normalizeExtension).filter(Boolean)
      : [];
    const accept = [...allowedMimeTypes, ...allowedExtensions].filter(Boolean).join(",");
    const currentFileList = uploadFileLists[fieldKey] || [];

    return (
      <Col key={fieldKey} xs={24} md={getTabletSpan(question)} lg={getDesktopSpan(question)}>
        <Form.Item
          name={fieldKey}
          label={label}
          extra={descriptionText || undefined}
          rules={fieldRules}
          getValueProps={type === "file" ? () => ({}) : undefined}
          validateTrigger={["onChange", "onBlur"]}
        >
          {type === "short_text" || type === "email" || type === "phone" || type === "url" ? (
            <Input
              size="large"
              type={type === "email" ? "email" : type === "url" ? "url" : "text"}
              placeholder={label}
              disabled={submitting}
            />
          ) : null}

          {type === "paragraph" ? (
            <Input.TextArea rows={4} placeholder={label} disabled={submitting} />
          ) : null}

          {type === "number" ? (
            <Input
              size="large"
              type="number"
              inputMode="numeric"
              placeholder={label}
              disabled={submitting}
            />
          ) : null}

          {type === "date" ? (
            <DatePicker
              size="large"
              style={{ width: "100%" }}
              format={DATE_FORMAT}
              disabled={submitting}
            />
          ) : null}

          {type === "single_choice" ? (
            <Radio.Group
              disabled={submitting}
              options={options.map((option) => ({
                label: option.label || option.key,
                value: option.key,
              }))}
            />
          ) : null}

          {type === "multiple_choice" ? (
            <Checkbox.Group
              disabled={submitting}
              options={options.map((option) => ({
                label: option.label || option.key,
                value: option.key,
              }))}
            />
          ) : null}

          {type === "file" ? (
            <Upload
              fileList={currentFileList}
              multiple={maxFiles > 1}
              maxCount={maxFiles}
              accept={accept || undefined}
              disabled={submitting}
              beforeUpload={(file) => {
                const error = validateUploadFile(question, file, currentFileList.length);
                if (error) {
                  showErrorNotification(error, "Upload failed");
                  return Upload.LIST_IGNORE;
                }
                return true;
              }}
              customRequest={async (options) => {
                setUploadingByFieldKey((prev) => ({ ...prev, [fieldKey]: true }));
                try {
                  const uploaded = await uploadFile(question, options.file);
                  options.onSuccess?.(uploaded);
                } catch (err) {
                  options.onError?.(new Error(err?.message || "Upload failed"));
                } finally {
                  setUploadingByFieldKey((prev) => ({ ...prev, [fieldKey]: false }));
                }
              }}
              onChange={({ fileList }) => {
                setUploadFileLists((prev) => ({ ...prev, [fieldKey]: fileList }));
                const uploadedRefs = fileList
                  .map((entry) => {
                    if (entry?.uploadedRef) return entry.uploadedRef;
                    if (entry?.response) {
                      const ref = mapUploadRef(entry.response, entry.name);
                      if (ref) entry.uploadedRef = ref;
                      return ref;
                    }
                    return mapUploadRef(entry, entry.name);
                  })
                  .filter(Boolean);
                form.setFieldValue(fieldKey, uploadedRefs);

                if (fileList.some((entry) => entry.status === "error")) {
                  const fileError = normalizeText(fileList.find((entry) => entry.status === "error")?.error?.message);
                  if (fileError) {
                    showErrorNotification(fileError, "Upload failed");
                  }
                }
              }}
              onRemove={(file) => {
                const remaining = (uploadFileLists[fieldKey] || []).filter((entry) => entry.uid !== file.uid);
                setUploadFileLists((prev) => ({ ...prev, [fieldKey]: remaining }));
                const refs = remaining
                  .map((entry) => entry.uploadedRef || mapUploadRef(entry.response || entry, entry.name))
                  .filter(Boolean);
                form.setFieldValue(fieldKey, refs);
                return true;
              }}
            >
              <Button icon={<UploadOutlined />} loading={Boolean(uploadingByFieldKey[fieldKey])}>
                Upload file
              </Button>
            </Upload>
          ) : null}
        </Form.Item>
      </Col>
    );
  }

  function renderCaptchaControl() {
    if (!captchaEnabled) return null;

    const challenge = captchaChallenge;
    const challengeType = normalizeText(challenge?.type || captchaType).toLowerCase();
    const isGoogleRecaptcha =
      challengeType === "checkbox_v2" &&
      normalizeText(challenge?.provider) === "google_recaptcha";
    const challengePrompt =
      normalizeText(challenge?.prompt) ||
      (challengeType === "checkbox_v2" ? "I am not a robot" : "Complete captcha challenge");

    return (
      <div className="form-captcha-wrap">
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          {challengeType !== "checkbox_v2" ? <Text strong>{challengePrompt}</Text> : null}
          {challengeType === "alphanumeric" && challenge?.imageDataUri ? (
            <Image
              src={challenge.imageDataUri}
              alt="Captcha challenge"
              width={220}
              height={68}
              className="form-captcha-image"
              unoptimized
              style={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
          ) : null}
          {challengeType === "checkbox_v2" ? (
            <>
              <Text strong>{challengePrompt}</Text>
              {isGoogleRecaptcha ? (
                <div
                  ref={recaptchaContainerRef}
                  className="form-google-recaptcha"
                  style={{ minHeight: 78 }}
                />
              ) : (
                <Text type="danger">
                  Google reCAPTCHA is not configured. Please add site key and secret key.
                </Text>
              )}
            </>
          ) : (
            <Input
              size="large"
              value={captchaValue}
              disabled={submitting || captchaLoading || !challenge?.token}
              placeholder={challenge?.placeholder || "Enter captcha"}
              onChange={(event) => {
                setCaptchaValue(event.target.value);
                setCaptchaError("");
              }}
            />
          )}
          <Space size={8} wrap>
            <Button
              size="small"
              onClick={() => {
                if (challengeType === "checkbox_v2") {
                  resetGoogleRecaptcha();
                  setCaptchaError("");
                  loadCaptchaChallenge();
                } else {
                  loadCaptchaChallenge();
                }
              }}
              loading={captchaLoading}
              disabled={submitting}
            >
              Refresh Captcha
            </Button>
          </Space>
          {captchaError ? (
            <Text type="danger" style={{ marginTop: -2 }}>
              {captchaError}
            </Text>
          ) : null}
        </Space>
      </div>
    );
  }

  if (runtimeLoading) {
    return (
      <div style={{ minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin />
      </div>
    );
  }

  if (runtimeError) {
    return <Alert type="warning" showIcon message={runtimeError} />;
  }

  if (!runtimeForm) {
    return <Alert type="warning" showIcon message="Form configuration is missing" />;
  }

  return (
    <FormShell
      style={{
        "--form-input-border-color": resolvedStyleSettings.inputBorderColor,
        "--form-input-focus-color": resolvedStyleSettings.inputFocusColor,
        "--form-input-error-color": resolvedStyleSettings.inputErrorColor,
        "--form-button-bg-color": resolvedStyleSettings.buttonBgColor,
        "--form-button-hover-color": resolvedStyleSettings.buttonHoverColor,
        "--form-button-focus-color": resolvedStyleSettings.buttonFocusColor,
        "--form-button-text-color": resolvedStyleSettings.buttonTextColor,
        "--form-checkbox-color": resolvedStyleSettings.checkboxColor,
        "--form-radio-color": resolvedStyleSettings.radioColor,
        "--form-switch-color": resolvedStyleSettings.switchColor,
        "--form-required-indicator-color": resolvedStyleSettings.requiredIndicatorColor,
        "--form-success-message-color": resolvedStyleSettings.successMessageColor,
        "--form-error-message-color": resolvedStyleSettings.errorMessageColor,
      }}
    >
      {heading ? (
        <Title level={4} style={{ marginTop: 0 }}>
          {heading}
        </Title>
      ) : null}
      {description ? <Paragraph>{description}</Paragraph> : null}

      <Form
        form={form}
        layout="vertical"
        requiredMark
        onFinish={handleSubmit}
        onFinishFailed={() => {
          showErrorNotification(
            "Some fields are invalid. Please fix the errors and try again.",
            "Please review required fields",
          );
        }}
      >
        {orderedSections.map((section, sectionIndex) => {
          const sectionId = normalizeText(section?.sectionId);
          const sectionQuestions = questionsBySection.get(sectionId) || [];
          const sectionTitle = normalizeText(section?.title);
          const showSectionTitle = section?.showTitle == null ? true : Boolean(section.showTitle);
          const sectionDescription = normalizeText(section?.description);

          return (
            <div key={sectionId || `section_${sectionIndex}`} style={{ marginBottom: 20 }}>
              {showSectionTitle && sectionTitle ? (
                <Title level={5} className="form-section-title">
                  {sectionTitle}
                </Title>
              ) : null}
              {sectionDescription ? (
                <Paragraph className="form-section-description">{sectionDescription}</Paragraph>
              ) : null}
              <Row gutter={[20, 8]}>
                {sectionQuestions.map((question) => renderQuestionField(question))}
              </Row>
            </div>
          );
        })}

        <div style={{ display: "flex", justifyContent: submitButtonJustifyContent }}>
          <div
            className="form-submit-actions"
            style={{
              width: submitButtonIsFullWidth ? "100%" : undefined,
              display: "flex",
              flexDirection: "column",
              alignItems: submitActionAlignItems,
              gap: 12,
            }}
          >
            {renderCaptchaControl()}
          <Button
            htmlType="submit"
            type="primary"
            loading={submitting}
            disabled={submitting}
            className="form-submit-btn"
            style={submitButtonIsFullWidth ? { width: "100%" } : undefined}
          >
            {submitLabel}
          </Button>
          </div>
        </div>
      </Form>
    </FormShell>
  );
}
