"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Input,
  List,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownOutlined,
  DragOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SaveOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { normalizeFieldName } from "@/lib/forms/fieldName";
import { FORM_DEFAULTS } from "@/lib/forms/constants";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const QUESTION_TYPE_OPTIONS = [
  { value: "short_text", label: "Short Text" },
  { value: "paragraph", label: "Paragraph" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "phone", label: "Mobile / Phone" },
  { value: "url", label: "URL" },
  { value: "date", label: "Date" },
  { value: "single_choice", label: "Single Choice" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "file", label: "File Upload" },
  { value: "hidden", label: "Hidden" },
  { value: "divider", label: "Divider" },
];

const OPTION_TYPE_SET = new Set(["single_choice", "multiple_choice"]);
const SPAN_OPTIONS = [
  { value: 1, label: "1 Column" },
  { value: 2, label: "2 Columns" },
  { value: 3, label: "3 Columns" },
  { value: 4, label: "4 Columns" },
];
const FORM_SUBMIT_LABEL_DEFAULT = FORM_DEFAULTS.submitLabel;
const FORM_SUCCESS_MESSAGE_DEFAULT = FORM_DEFAULTS.successMessage;
const DEFAULT_SUBMISSION_SETTINGS = {
  ...FORM_DEFAULTS.submissionSettings,
};
const DEFAULT_STYLE_SETTINGS = {
  ...FORM_DEFAULTS.styleSettings,
};
const FORM_COLOR_FIELDS = [
  { key: "inputBorderColor", label: "Input border color" },
  { key: "inputFocusColor", label: "Input focus color" },
  { key: "inputErrorColor", label: "Input validation/error color" },
  { key: "buttonBgColor", label: "Button background color" },
  { key: "buttonHoverColor", label: "Button hover color" },
  { key: "buttonFocusColor", label: "Button focus color" },
  { key: "buttonTextColor", label: "Button text color" },
  { key: "checkboxColor", label: "Checkbox color" },
  { key: "radioColor", label: "Radio button color" },
  { key: "switchColor", label: "Switch color" },
  { key: "requiredIndicatorColor", label: "Required field indicator color" },
  { key: "successMessageColor", label: "Success message color" },
  { key: "errorMessageColor", label: "Error message color" },
];
const SUBMISSION_SWITCH_FIELDS = [
  { key: "resetOnSuccess", label: "Reset on success" },
  { key: "notifyOnSuccess", label: "Success notify" },
  { key: "notifyOnError", label: "Error notify" },
];
const SUBMIT_BUTTON_ALIGNMENT_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "full-width", label: "Full-Width" },
];
const CAPTCHA_TYPE_OPTIONS = [
  { value: "alphanumeric", label: "Alphanumeric Text" },
  { value: "math", label: "Basic Math" },
  { value: "checkbox_v2", label: "Google reCAPTCHA (V2)" },
];
function normalizeOptionValue(value) {
  return String(value ?? "").trim();
}

function buildThemeColorOptions(theme = {}) {
  const palette = theme?.themePalette || {};
  const custom = Array.isArray(theme?.colors) ? theme.colors : [];
  const names = [
    ...new Set([
      ...Object.keys(palette),
      ...custom.map((entry) => normalizeOptionValue(entry?.name)).filter(Boolean),
    ]),
  ].sort();
  return names.map((name) => ({ label: name, value: name }));
}

function getShortcodeSnippet(shortcode) {
  const value = String(shortcode || "").trim();
  if (!value) return "";
  return `[form shortcode="${value}"]`;
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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

function normalizeSubmissionSettings(input) {
  const source = input && typeof input === "object" ? input : {};
  const submitButtonAlignment = String(source.submitButtonAlignment || "").trim().toLowerCase();
  const captchaType = String(source.captchaType || "").trim().toLowerCase();
  const normalizedSubmitButtonAlignment =
    submitButtonAlignment === "center" ||
    submitButtonAlignment === "right" ||
    submitButtonAlignment === "full-width"
      ? submitButtonAlignment
      : DEFAULT_SUBMISSION_SETTINGS.submitButtonAlignment;
  const normalizedCaptchaType =
    captchaType === "math" || captchaType === "checkbox_v2" || captchaType === "alphanumeric"
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

function normalizeSchema(input) {
  const raw = input || {};
  const rawSections = sortByOrder(raw.sections || []);
  const sections =
    rawSections.length > 0
      ? rawSections.map((section, idx) => ({
          sectionId: String(section?.sectionId || createId()),
          title: String(section?.title || `Section ${idx + 1}`),
          showTitle: section?.showTitle == null ? true : Boolean(section.showTitle),
          description: String(section?.description || ""),
          order: idx,
        }))
      : [
          {
            sectionId: createId(),
            title: "Section 1",
            showTitle: true,
            description: "",
            order: 0,
          },
        ];

  const sectionIds = new Set(sections.map((section) => section.sectionId));
  const defaultSectionId = sections[0]?.sectionId;

  const questions = sortByOrder(raw.questions || []).map((question, idx) => {
    const type = String(question?.type || "short_text");
    const sectionId = sectionIds.has(question?.sectionId)
      ? question.sectionId
      : defaultSectionId;
    const label = String(question?.label || `Question ${idx + 1}`);
    const normalizedFieldName =
      type === "divider"
        ? ""
        : normalizeFieldName(question?.fieldName || label || `question_${idx + 1}`);
    const options = OPTION_TYPE_SET.has(type)
      ? (Array.isArray(question?.options) ? question.options : []).map((option, optIdx) => ({
          key: String(option?.key || normalizeFieldName(option?.label || `option_${optIdx + 1}`) || `option_${optIdx + 1}`),
          label: String(option?.label || `Option ${optIdx + 1}`),
          order: optIdx,
        }))
      : [];
    return {
      fieldKey: String(question?.fieldKey || createId()),
      sectionId,
      type,
      label,
      description: String(question?.description || ""),
      fieldName: normalizedFieldName,
      required: type === "divider" ? false : Boolean(question?.required),
      span: type === "divider" ? 4 : normalizeSpan(question?.span, 4),
      options,
      rules: question?.rules && typeof question.rules === "object" ? question.rules : {},
      order: idx,
    };
  });

  return { sections, questions };
}

function ensureUniqueFieldName(schema, baseFieldName, skipFieldKey = "") {
  const base = normalizeFieldName(baseFieldName) || "field";
  const used = new Set(
    (schema?.questions || [])
      .filter((q) => q?.type !== "divider" && q?.fieldKey !== skipFieldKey)
      .map((q) => String(q?.fieldName || "").trim())
      .filter(Boolean),
  );
  if (!used.has(base)) return base;
  let idx = 2;
  while (used.has(`${base}_${idx}`)) idx += 1;
  return `${base}_${idx}`;
}

function orderQuestionsBySections(sections, questions) {
  const orderedSections = sortByOrder(sections);
  const sectionOrder = orderedSections.map((section) => section.sectionId);
  const buckets = new Map(sectionOrder.map((sectionId) => [sectionId, []]));
  const unknown = [];
  sortByOrder(questions).forEach((question) => {
    if (buckets.has(question.sectionId)) buckets.get(question.sectionId).push(question);
    else unknown.push(question);
  });
  const ordered = [];
  sectionOrder.forEach((sectionId) => {
    ordered.push(...(buckets.get(sectionId) || []));
  });
  ordered.push(...unknown);
  return ordered.map((question, idx) => ({ ...question, order: idx }));
}

function SortableShell({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners, isDragging })}
    </div>
  );
}

export default function FormBuilderEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const formId = String(params?.formId || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [formMeta, setFormMeta] = useState(null);
  const [formName, setFormName] = useState("");
  const [submitLabel, setSubmitLabel] = useState(FORM_SUBMIT_LABEL_DEFAULT);
  const [successMessage, setSuccessMessage] = useState(FORM_SUCCESS_MESSAGE_DEFAULT);
  const [submissionSettings, setSubmissionSettings] = useState(DEFAULT_SUBMISSION_SETTINGS);
  const [styleSettings, setStyleSettings] = useState(DEFAULT_STYLE_SETTINGS);
  const [themeColorOptions, setThemeColorOptions] = useState([]);
  const [schema, setSchema] = useState({ sections: [], questions: [] });
  const themeFetchedForColorsRef = useRef(false);
  const initialRef = useRef({
    name: "",
    submitLabel: FORM_SUBMIT_LABEL_DEFAULT,
    successMessage: FORM_SUCCESS_MESSAGE_DEFAULT,
    submissionSettingsJson: JSON.stringify(DEFAULT_SUBMISSION_SETTINGS),
    styleSettingsJson: JSON.stringify(DEFAULT_STYLE_SETTINGS),
    schemaJson: "",
  });
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const loadForm = useCallback(async () => {
    if (!formId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/forms/${encodeURIComponent(formId)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load form");
      const nextSchema = normalizeSchema(data?.schema || data?.formSchema);
      const nextName = String(data?.name || "").trim() || "Untitled Form";
      const nextSubmitLabel =
        String(data?.submitLabel || "").trim() || FORM_SUBMIT_LABEL_DEFAULT;
      const nextSuccessMessage =
        String(data?.successMessage || "").trim() || FORM_SUCCESS_MESSAGE_DEFAULT;
      const nextSubmissionSettings = normalizeSubmissionSettings(data?.submissionSettings);
      const nextStyleSettings = normalizeStyleSettings(data?.styleSettings);
      setFormMeta({
        formId: String(data?.formId || formId),
        status: String(data?.status || "draft"),
        shortcode: String(data?.shortcode || ""),
        schemaVersion: Number(data?.schemaVersion || 1),
        updatedAt: data?.updatedAt || "",
      });
      setFormName(nextName);
      setSubmitLabel(nextSubmitLabel);
      setSuccessMessage(nextSuccessMessage);
      setSubmissionSettings(nextSubmissionSettings);
      setStyleSettings(nextStyleSettings);
      setSchema(nextSchema);
      initialRef.current = {
        name: nextName,
        submitLabel: nextSubmitLabel,
        successMessage: nextSuccessMessage,
        submissionSettingsJson: JSON.stringify(nextSubmissionSettings),
        styleSettingsJson: JSON.stringify(nextStyleSettings),
        schemaJson: JSON.stringify(nextSchema),
      };
    } catch (err) {
      message.error(err?.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  useEffect(() => {
    if (themeFetchedForColorsRef.current) return;
    themeFetchedForColorsRef.current = true;
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        setThemeColorOptions(buildThemeColorOptions(theme));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get("preview") === "1") {
      setPreviewOpen(true);
    }
  }, [searchParams]);

  const schemaJson = useMemo(() => JSON.stringify(schema), [schema]);
  const submissionSettingsJson = useMemo(
    () => JSON.stringify(normalizeSubmissionSettings(submissionSettings)),
    [submissionSettings],
  );
  const styleSettingsJson = useMemo(
    () => JSON.stringify(normalizeStyleSettings(styleSettings)),
    [styleSettings],
  );
  const isDirty =
    String(formName || "").trim() !== initialRef.current.name ||
    String(submitLabel || "").trim() !== initialRef.current.submitLabel ||
    String(successMessage || "").trim() !== initialRef.current.successMessage ||
    submissionSettingsJson !== initialRef.current.submissionSettingsJson ||
    styleSettingsJson !== initialRef.current.styleSettingsJson ||
    schemaJson !== initialRef.current.schemaJson;

  const sortedSections = useMemo(() => sortByOrder(schema.sections), [schema.sections]);
  const sortedQuestions = useMemo(() => sortByOrder(schema.questions), [schema.questions]);
  const styleSettingsColorOptions = useMemo(() => {
    const existing = new Set(
      themeColorOptions.map((entry) => normalizeOptionValue(entry?.value).toLowerCase()),
    );
    const extra = FORM_COLOR_FIELDS.map((field) => normalizeOptionValue(styleSettings?.[field.key]))
      .filter(Boolean)
      .filter((value) => !existing.has(value.toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ label: value, value }));
    return [...themeColorOptions, ...extra];
  }, [themeColorOptions, styleSettings]);

  const applySchema = useCallback((updater) => {
    setSchema((prev) => normalizeSchema(updater(prev)));
  }, []);

  const saveChanges = async () => {
    if (!formMeta?.formId) return;
    const nextName = String(formName || "").trim() || "Untitled Form";
    const nextSubmitLabel =
      String(submitLabel || "").trim() || FORM_SUBMIT_LABEL_DEFAULT;
    const nextSuccessMessage =
      String(successMessage || "").trim() || FORM_SUCCESS_MESSAGE_DEFAULT;
    const nextSubmissionSettings = normalizeSubmissionSettings(submissionSettings);
    const nextStyleSettings = normalizeStyleSettings(styleSettings);
    const nameChanged = nextName !== initialRef.current.name;
    const submitLabelChanged = nextSubmitLabel !== initialRef.current.submitLabel;
    const successMessageChanged = nextSuccessMessage !== initialRef.current.successMessage;
    const submissionSettingsChanged =
      JSON.stringify(nextSubmissionSettings) !== initialRef.current.submissionSettingsJson;
    const styleSettingsChanged =
      JSON.stringify(nextStyleSettings) !== initialRef.current.styleSettingsJson;
    const currentSchemaJson = JSON.stringify(schema);
    const schemaChanged = currentSchemaJson !== initialRef.current.schemaJson;
    const metaChanged =
      nameChanged ||
      submitLabelChanged ||
      successMessageChanged ||
      submissionSettingsChanged ||
      styleSettingsChanged;

    if (!metaChanged && !schemaChanged) {
      message.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      if (metaChanged) {
        const res = await fetch(`/api/admin/forms/${encodeURIComponent(formMeta.formId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nextName,
            submitLabel: nextSubmitLabel,
            successMessage: nextSuccessMessage,
            submissionSettings: nextSubmissionSettings,
            styleSettings: nextStyleSettings,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to update form settings");
      }

      if (schemaChanged) {
        const res = await fetch(
          `/api/admin/forms/${encodeURIComponent(formMeta.formId)}/schema`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schema }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to update form schema");
      }

      await loadForm();
      message.success("Form saved");
    } catch (err) {
      message.error(err?.message || "Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  const runLifecycleAction = async (action) => {
    if (!formMeta?.formId) return;
    setActionLoading(action);
    try {
      const res = await fetch(
        `/api/admin/forms/${encodeURIComponent(formMeta.formId)}/${action}`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Failed to ${action}`);
      await loadForm();
      message.success(`Form ${action} successful`);
    } catch (err) {
      message.error(err?.message || `Failed to ${action}`);
    } finally {
      setActionLoading("");
    }
  };

  const copyShortcode = async () => {
    const snippet = getShortcodeSnippet(formMeta?.shortcode);
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
      message.success("Shortcode copied");
    } catch {
      message.error("Copy failed");
    }
  };

  const handleLifecycleDropdownAction = (action) => {
    if (action === "archive") {
      Modal.confirm({
        title: "Archive this form?",
        okText: "Archive",
        okType: "danger",
        onOk: () => runLifecycleAction("archive"),
      });
      return;
    }
    runLifecycleAction(action);
  };

  const setStyleColor = (key, value) => {
    setStyleSettings((prev) => ({
      ...normalizeStyleSettings(prev),
      [key]: normalizeOptionValue(value),
    }));
  };

  const addSection = () => {
    applySchema((prev) => {
      const sections = sortByOrder(prev.sections);
      return {
        ...prev,
        sections: [
          ...sections,
          {
            sectionId: createId(),
            title: `Section ${sections.length + 1}`,
            showTitle: true,
            description: "",
            order: sections.length,
          },
        ],
      };
    });
  };

  const updateSection = (sectionId, patch) => {
    applySchema((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((section) =>
        section.sectionId === sectionId ? { ...section, ...patch } : section,
      ),
    }));
  };

  const moveSection = (sectionId, direction) => {
    applySchema((prev) => {
      const sections = sortByOrder(prev.sections);
      const index = sections.findIndex((section) => section.sectionId === sectionId);
      if (index < 0) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sections.length) return prev;
      const next = [...sections];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return {
        ...prev,
        sections: next,
        questions: orderQuestionsBySections(next, prev.questions || []),
      };
    });
  };

  const deleteSection = (sectionId) => {
    applySchema((prev) => {
      const sections = (prev.sections || []).filter((section) => section.sectionId !== sectionId);
      const questions = (prev.questions || []).filter((question) => question.sectionId !== sectionId);
      return {
        ...prev,
        sections,
        questions: orderQuestionsBySections(sections, questions),
      };
    });
  };

  const addQuestion = (sectionId) => {
    applySchema((prev) => {
      const questions = sortByOrder(prev.questions);
      const fieldName = ensureUniqueFieldName(prev, "question");
      const question = {
        fieldKey: createId(),
        sectionId,
        type: "short_text",
        label: "Untitled question",
        description: "",
        fieldName,
        required: false,
        span: 4,
        options: [],
        rules: {},
        order: questions.length,
      };
      return { ...prev, questions: [...questions, question] };
    });
  };

  const updateQuestion = (fieldKey, patch) => {
    applySchema((prev) => {
      const questions = (prev.questions || []).map((question) => {
        if (question.fieldKey !== fieldKey) return question;
        const type = String(patch?.type || question.type || "short_text");
        const next = { ...question, ...patch, type };
        if (type === "divider") {
          next.fieldName = "";
          next.required = false;
          next.span = 4;
          next.options = [];
        } else {
          next.span = normalizeSpan(next.span, 4);
          if (!String(next.fieldName || "").trim()) {
            next.fieldName = ensureUniqueFieldName(prev, next.label || "question", fieldKey);
          } else {
            next.fieldName = ensureUniqueFieldName(prev, next.fieldName, fieldKey);
          }
          if (!OPTION_TYPE_SET.has(type)) {
            next.options = [];
          } else if (!Array.isArray(next.options) || next.options.length === 0) {
            next.options = [
              { key: "option_1", label: "Option 1", order: 0 },
              { key: "option_2", label: "Option 2", order: 1 },
            ];
          }
        }
        return next;
      });
      const hasSectionChange = Object.prototype.hasOwnProperty.call(patch || {}, "sectionId");
      return {
        ...prev,
        questions: hasSectionChange
          ? orderQuestionsBySections(prev.sections || [], questions)
          : questions,
      };
    });
  };

  const moveQuestion = (fieldKey, direction) => {
    applySchema((prev) => {
      const questions = sortByOrder(prev.questions);
      const index = questions.findIndex((question) => question.fieldKey === fieldKey);
      if (index < 0) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= questions.length) return prev;
      const next = [...questions];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return { ...prev, questions: next };
    });
  };

  const duplicateQuestion = (fieldKey) => {
    applySchema((prev) => {
      const questions = sortByOrder(prev.questions);
      const current = questions.find((question) => question.fieldKey === fieldKey);
      if (!current) return prev;
      const duplicate = {
        ...current,
        fieldKey: createId(),
        fieldName:
          current.type === "divider"
            ? ""
            : ensureUniqueFieldName(prev, current.fieldName || current.label || "question"),
        options: Array.isArray(current.options)
          ? current.options.map((option, idx) => ({
              key: String(option?.key || `option_${idx + 1}`),
              label: String(option?.label || `Option ${idx + 1}`),
              order: idx,
            }))
          : [],
        order: Number(current.order || 0) + 0.5,
      };
      return { ...prev, questions: [...questions, duplicate] };
    });
  };

  const deleteQuestion = (fieldKey) => {
    applySchema((prev) => ({
      ...prev,
      questions: (prev.questions || []).filter((question) => question.fieldKey !== fieldKey),
    }));
  };

  const addOption = (fieldKey) => {
    applySchema((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((question) => {
        if (question.fieldKey !== fieldKey) return question;
        const options = Array.isArray(question.options) ? [...question.options] : [];
        const nextIndex = options.length + 1;
        options.push({
          key: `option_${nextIndex}`,
          label: `Option ${nextIndex}`,
          order: options.length,
        });
        return { ...question, options };
      }),
    }));
  };

  const updateOption = (fieldKey, optionIndex, patch) => {
    applySchema((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((question) => {
        if (question.fieldKey !== fieldKey) return question;
        const options = (question.options || []).map((option, idx) =>
          idx === optionIndex ? { ...option, ...patch } : option,
        );
        return { ...question, options };
      }),
    }));
  };

  const removeOption = (fieldKey, optionIndex) => {
    applySchema((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((question) => {
        if (question.fieldKey !== fieldKey) return question;
        const options = (question.options || [])
          .filter((_, idx) => idx !== optionIndex)
          .map((option, idx) => ({ ...option, order: idx }));
        return { ...question, options };
      }),
    }));
  };

  const onSectionDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    applySchema((prev) => {
      const sections = sortByOrder(prev.sections);
      const oldIndex = sections.findIndex((section) => section.sectionId === active.id);
      const newIndex = sections.findIndex((section) => section.sectionId === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const moved = arrayMove(sections, oldIndex, newIndex).map((section, idx) => ({
        ...section,
        order: idx,
      }));
      return {
        ...prev,
        sections: moved,
        questions: orderQuestionsBySections(moved, prev.questions || []),
      };
    });
  };

  const onQuestionDragEnd = (sectionId, { active, over }) => {
    if (!over || active.id === over.id) return;
    applySchema((prev) => {
      const sections = sortByOrder(prev.sections);
      const sectionQuestions = sortByOrder(prev.questions).filter(
        (question) => question.sectionId === sectionId,
      );
      const oldIndex = sectionQuestions.findIndex((question) => question.fieldKey === active.id);
      const newIndex = sectionQuestions.findIndex((question) => question.fieldKey === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const reorderedSectionQuestions = arrayMove(sectionQuestions, oldIndex, newIndex);
      const questionBuckets = new Map();
      sortByOrder(prev.questions).forEach((question) => {
        if (!questionBuckets.has(question.sectionId)) questionBuckets.set(question.sectionId, []);
        questionBuckets.get(question.sectionId).push(question);
      });
      questionBuckets.set(sectionId, reorderedSectionQuestions);
      const flattened = [];
      sections.forEach((section) => {
        flattened.push(...(questionBuckets.get(section.sectionId) || []));
      });
      return {
        ...prev,
        questions: flattened.map((question, idx) => ({ ...question, order: idx })),
      };
    });
  };

  const lifecycleMenuItems = [
    {
      key: "publish",
      label: "Publish",
      disabled: formMeta?.status === "published",
    },
    {
      key: "unpublish",
      label: "Unpublish",
      disabled: formMeta?.status !== "published",
    },
    {
      key: "archive",
      label: "Archive",
      disabled: formMeta?.status === "archived",
      danger: true,
    },
  ];

  if (loading) {
    return (
      <ThemeAdminCard title="Form Builder Editor">
        <div style={{ minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spin />
        </div>
      </ThemeAdminCard>
    );
  }

  if (!formMeta) {
    return (
      <ThemeAdminCard title="Form Builder Editor">
        <Empty description="Form not found" />
      </ThemeAdminCard>
    );
  }

  return (
    <ThemeAdminCard
      title={(
        <Space size={10} wrap>
          <Link href="/admin/form-builder">
            <Button icon={<ArrowLeftOutlined />} aria-label="Back" title="Back" />
          </Link>
          <Typography.Text strong>{normalizeOptionValue(formName) || "Form"}</Typography.Text>
        </Space>
      )}
      extra={(
        <Space wrap>
          <Button
            icon={<CopyOutlined />}
            onClick={copyShortcode}
            disabled={!formMeta.shortcode}
            aria-label="Copy shortcode"
            title="Copy shortcode"
          />
          <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
            Preview
          </Button>
          <Dropdown
            menu={{
              items: lifecycleMenuItems,
              onClick: ({ key }) => handleLifecycleDropdownAction(key),
            }}
            trigger={["click"]}
            disabled={Boolean(actionLoading)}
          >
            <Button loading={Boolean(actionLoading)}>
              <Space size={6}>
                <span>Status Action</span>
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditDrawerOpen(true)}
          >
            Edit
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={!isDirty}
            onClick={saveChanges}
          >
            Save
          </Button>
        </Space>
      )}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Space>
          <Button icon={<PlusOutlined />} onClick={addSection}>
            Add Section
          </Button>
        </Space>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onSectionDragEnd}
        >
          <SortableContext
            items={sortedSections.map((section) => section.sectionId)}
            strategy={verticalListSortingStrategy}
          >
            {sortedSections.map((section, sectionIndex) => {
          const sectionQuestions = sortedQuestions.filter(
            (question) => question.sectionId === section.sectionId,
          );
          return (
            <SortableShell key={section.sectionId} id={section.sectionId}>
              {({ attributes, listeners }) => (
                <Card
                  size="small"
                  title={(
                    <Space wrap>
                      <Button
                        size="small"
                        icon={<DragOutlined />}
                        {...attributes}
                        {...listeners}
                      />
                      <Typography.Text strong>Section {sectionIndex + 1}</Typography.Text>
                      <Input
                        style={{ width: 300 }}
                        value={section.title}
                        placeholder="Section title"
                        onChange={(e) =>
                          updateSection(section.sectionId, { title: e.target.value })
                        }
                      />
                      <Typography.Text type="secondary">Show title</Typography.Text>
                      <Switch
                        checked={section.showTitle !== false}
                        onChange={(checked) =>
                          updateSection(section.sectionId, { showTitle: checked })
                        }
                      />
                    </Space>
                  )}
                  extra={(
                    <Space>
                      <Button
                        size="small"
                        icon={<UpOutlined />}
                        onClick={() => moveSection(section.sectionId, "up")}
                        disabled={sectionIndex === 0}
                      />
                      <Button
                        size="small"
                        icon={<DownOutlined />}
                        onClick={() => moveSection(section.sectionId, "down")}
                        disabled={sectionIndex === sortedSections.length - 1}
                      />
                      <Popconfirm
                        title="Delete this section?"
                        description="All questions in this section will be removed."
                        okType="danger"
                        onConfirm={() => deleteSection(section.sectionId)}
                        disabled={sortedSections.length <= 1}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={sortedSections.length <= 1}
                        />
                      </Popconfirm>
                    </Space>
                  )}
                >
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Input.TextArea
                  rows={2}
                  value={section.description}
                  placeholder="Section description"
                  onChange={(e) =>
                    updateSection(section.sectionId, { description: e.target.value })
                  }
                />

                {sectionQuestions.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No questions yet" />
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => onQuestionDragEnd(section.sectionId, event)}
                  >
                    <SortableContext
                      items={sectionQuestions.map((question) => question.fieldKey)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sectionQuestions.map((question) => (
                        <SortableShell key={question.fieldKey} id={question.fieldKey}>
                          {({ attributes, listeners }) => (
                            <Card
                              size="small"
                              title={question.label || "Untitled question"}
                              extra={(
                                <Space>
                                  <Button
                                    size="small"
                                    icon={<DragOutlined />}
                                    {...attributes}
                                    {...listeners}
                                  />
                                  <Select
                                    size="small"
                                    value={normalizeSpan(question.span, 4)}
                                    style={{ width: 118 }}
                                    options={SPAN_OPTIONS}
                                    disabled={question.type === "divider"}
                                    onChange={(value) =>
                                      updateQuestion(question.fieldKey, { span: normalizeSpan(value, 4) })
                                    }
                                  />
                                  <Button
                                    size="small"
                                    icon={<UpOutlined />}
                                    onClick={() => moveQuestion(question.fieldKey, "up")}
                                  />
                                  <Button
                                    size="small"
                                    icon={<DownOutlined />}
                                    onClick={() => moveQuestion(question.fieldKey, "down")}
                                  />
                                  <Button
                                    size="small"
                                    onClick={() => duplicateQuestion(question.fieldKey)}
                                  >
                                    Duplicate
                                  </Button>
                                  <Popconfirm
                                    title="Delete this question?"
                                    okType="danger"
                                    onConfirm={() => deleteQuestion(question.fieldKey)}
                                  >
                                    <Button size="small" danger icon={<DeleteOutlined />} />
                                  </Popconfirm>
                                </Space>
                              )}
                            >
                      <Row gutter={[12, 12]}>
                        <Col xs={24} md={8}>
                          <Typography.Text type="secondary">Label</Typography.Text>
                          <Input
                            value={question.label}
                            onChange={(e) =>
                              updateQuestion(question.fieldKey, { label: e.target.value })
                            }
                          />
                        </Col>
                        <Col xs={24} md={8}>
                          <Typography.Text type="secondary">Type</Typography.Text>
                          <Select
                            value={question.type}
                            options={QUESTION_TYPE_OPTIONS}
                            style={{ width: "100%" }}
                            onChange={(value) =>
                              updateQuestion(question.fieldKey, { type: value })
                            }
                          />
                        </Col>
                        <Col xs={24} md={8}>
                          <Typography.Text type="secondary">Field name</Typography.Text>
                          <Input
                            value={question.fieldName}
                            disabled={question.type === "divider"}
                            onChange={(e) =>
                              updateQuestion(question.fieldKey, {
                                fieldName: normalizeFieldName(e.target.value),
                              })
                            }
                          />
                        </Col>
                        <Col xs={24} md={8}>
                          <Typography.Text type="secondary">Section</Typography.Text>
                          <Select
                            value={question.sectionId}
                            style={{ width: "100%" }}
                            options={sortedSections.map((item) => ({
                              value: item.sectionId,
                              label: item.title || "Untitled section",
                            }))}
                            onChange={(value) =>
                              updateQuestion(question.fieldKey, { sectionId: value })
                            }
                          />
                        </Col>
                        <Col xs={24} md={8}>
                          <Typography.Text type="secondary">&nbsp;</Typography.Text>
                          <div
                            style={{
                              minHeight: 32,
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <Typography.Text type="secondary" style={{ margin: 0 }}>
                              Required
                            </Typography.Text>
                            <Switch
                              checked={question.required}
                              disabled={question.type === "divider"}
                              onChange={(checked) =>
                                updateQuestion(question.fieldKey, { required: checked })
                              }
                            />
                          </div>
                        </Col>
                        <Col xs={24}>
                          <Typography.Text type="secondary">Description</Typography.Text>
                          <Input.TextArea
                            rows={2}
                            value={question.description}
                            onChange={(e) =>
                              updateQuestion(question.fieldKey, { description: e.target.value })
                            }
                          />
                        </Col>
                      </Row>

                      {OPTION_TYPE_SET.has(question.type) && (
                        <>
                          <Divider style={{ margin: "14px 0" }} />
                          <Space direction="vertical" size={8} style={{ width: "100%" }}>
                            <Typography.Text strong>Options</Typography.Text>
                            {(question.options || []).map((option, optionIndex) => (
                              <Row key={`${question.fieldKey}_${optionIndex}`} gutter={8}>
                                <Col xs={24} md={8}>
                                  <Input
                                    value={option.label}
                                    placeholder="Option label"
                                    onChange={(e) =>
                                      updateOption(question.fieldKey, optionIndex, {
                                        label: e.target.value,
                                      })
                                    }
                                  />
                                </Col>
                                <Col xs={24} md={8}>
                                  <Input
                                    value={option.key}
                                    placeholder="Option key"
                                    onChange={(e) =>
                                      updateOption(question.fieldKey, optionIndex, {
                                        key: normalizeFieldName(e.target.value) || option.key,
                                      })
                                    }
                                  />
                                </Col>
                                <Col xs={24} md={8}>
                                  <Button
                                    danger
                                    block
                                    disabled={(question.options || []).length <= 1}
                                    onClick={() => removeOption(question.fieldKey, optionIndex)}
                                  >
                                    Remove
                                  </Button>
                                </Col>
                              </Row>
                            ))}
                            <Button onClick={() => addOption(question.fieldKey)}>
                              Add option
                            </Button>
                          </Space>
                        </>
                      )}
                            </Card>
                          )}
                        </SortableShell>
                      ))}
                    </SortableContext>
                  </DndContext>
                )}

                <Button type="dashed" icon={<PlusOutlined />} onClick={() => addQuestion(section.sectionId)}>
                  Add Question
                </Button>
              </Space>
                </Card>
              )}
            </SortableShell>
          );
            })}
          </SortableContext>
        </DndContext>
      </Space>

      <Drawer
        title="Edit Form Settings"
        placement="right"
        width={Math.min(
          520,
          typeof window !== "undefined" ? window.innerWidth * 0.9 : 520,
        )}
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        extra={(
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              setEditDrawerOpen(false);
              message.success("Settings updated. Click Save to persist changes.");
            }}
          >
            Update
          </Button>
        )}
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Card size="small" title="Form Title">
            <Input
              value={formName}
              maxLength={120}
              placeholder="Form title"
              onChange={(e) => setFormName(e.target.value)}
            />
          </Card>

          <Card size="small" title="Submission Settings">
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <List
                size="small"
                bordered
                split
                dataSource={[
                  { key: "submitLabel", label: "Submit Button Text" },
                  { key: "submitButtonAlignment", label: "Button Align" },
                ]}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      item.key === "submitLabel" ? (
                        <Input
                          key={item.key}
                          size="small"
                          value={submitLabel}
                          maxLength={60}
                          style={{ width: 220 }}
                          placeholder="Button Text"
                          onChange={(e) => setSubmitLabel(e.target.value)}
                        />
                      ) : (
                        <Select
                          key={item.key}
                          size="small"
                          style={{ width: 220 }}
                          value={submissionSettings?.submitButtonAlignment || "left"}
                          options={SUBMIT_BUTTON_ALIGNMENT_OPTIONS}
                          onChange={(value) =>
                            setSubmissionSettings((prev) => ({
                              ...normalizeSubmissionSettings(prev),
                              submitButtonAlignment: value,
                            }))
                          }
                        />
                      ),
                    ]}
                  >
                    <Typography.Text type="secondary">{item.label}</Typography.Text>
                  </List.Item>
                )}
              />
              <div>
                <Typography.Text type="secondary">Success message</Typography.Text>
                <Input.TextArea
                  rows={2}
                  value={successMessage}
                  maxLength={300}
                  placeholder={FORM_SUCCESS_MESSAGE_DEFAULT}
                  onChange={(e) => setSuccessMessage(e.target.value)}
                />
              </div>
              <List
                size="small"
                bordered
                split
                dataSource={SUBMISSION_SWITCH_FIELDS}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Switch
                        key={item.key}
                        checked={Boolean(submissionSettings?.[item.key])}
                        onChange={(checked) =>
                          setSubmissionSettings((prev) => ({
                            ...normalizeSubmissionSettings(prev),
                            [item.key]: checked,
                          }))
                        }
                      />,
                    ]}
                  >
                    <Typography.Text type="secondary">{item.label}</Typography.Text>
                  </List.Item>
                )}
              />
            </Space>
          </Card>

          <Card size="small" title="Captcha">
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <List
                size="small"
                bordered
                split
                dataSource={[{ key: "captchaEnabled", label: "Captcha Activation" }]}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Switch
                        key={item.key}
                        checked={Boolean(submissionSettings?.captchaEnabled)}
                        onChange={(checked) =>
                          setSubmissionSettings((prev) => ({
                            ...normalizeSubmissionSettings(prev),
                            captchaEnabled: checked,
                          }))
                        }
                      />,
                    ]}
                  >
                    <Typography.Text type="secondary">{item.label}</Typography.Text>
                  </List.Item>
                )}
              />

              {submissionSettings?.captchaEnabled ? (
                <List
                  size="small"
                  bordered
                  split
                  dataSource={[{ key: "captchaType", label: "Captcha Type" }]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Select
                          key={item.key}
                          size="small"
                          style={{ width: 220 }}
                          value={submissionSettings?.captchaType || "alphanumeric"}
                          options={CAPTCHA_TYPE_OPTIONS}
                          onChange={(value) =>
                            setSubmissionSettings((prev) => ({
                              ...normalizeSubmissionSettings(prev),
                              captchaType: value,
                            }))
                          }
                        />,
                      ]}
                    >
                      <Typography.Text type="secondary">{item.label}</Typography.Text>
                    </List.Item>
                  )}
                />
              ) : null}
            </Space>
          </Card>

          <Card size="small" title="Colors">
            <List
              size="small"
              bordered
              split
              dataSource={FORM_COLOR_FIELDS}
              renderItem={(field) => (
                <List.Item
                  actions={[
                    <Select
                      key={field.key}
                      size="small"
                      value={normalizeOptionValue(styleSettings?.[field.key]) || undefined}
                      options={styleSettingsColorOptions}
                      placeholder="From theme (default)"
                      style={{ width: 180 }}
                      allowClear
                      onChange={(value) => setStyleColor(field.key, value)}
                    />,
                  ]}
                >
                  <Typography.Text type="secondary">{field.label}</Typography.Text>
                </List.Item>
              )}
            />
          </Card>
        </Space>
      </Drawer>

      <Modal
        title="Form Preview (Schema)"
        open={previewOpen}
        width={760}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Text>
            <strong>{formName}</strong>
          </Typography.Text>
          {sortedSections.map((section, sectionIndex) => {
            const sectionQuestions = sortedQuestions.filter(
              (question) => question.sectionId === section.sectionId,
            );
            return (
              <Card
                key={section.sectionId}
                size="small"
                title={
                  section.showTitle === false
                    ? `Section ${sectionIndex + 1}`
                    : `${sectionIndex + 1}. ${section.title || "Untitled section"}`
                }
              >
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  {section.description ? (
                    <Typography.Text type="secondary">{section.description}</Typography.Text>
                  ) : null}
                  {sectionQuestions.length === 0 ? (
                    <Typography.Text type="secondary">No questions</Typography.Text>
                  ) : (
                    sectionQuestions.map((question, idx) => (
                      <Typography.Text key={question.fieldKey}>
                        {idx + 1}. {question.label || "Untitled question"}{" "}
                        <Typography.Text code>{question.type}</Typography.Text>
                      </Typography.Text>
                    ))
                  )}
                </Space>
              </Card>
            );
          })}
        </Space>
      </Modal>
    </ThemeAdminCard>
  );
}
