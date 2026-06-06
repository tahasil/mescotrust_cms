"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownOutlined,
  DragOutlined,
  EyeOutlined,
  PlusOutlined,
  SaveOutlined,
  UpOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { normalizeFieldName } from "@/lib/forms/fieldName";
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
const FORM_SUBMIT_LABEL_DEFAULT = "Submit";
const FORM_SUCCESS_MESSAGE_DEFAULT = "Thank you for your response.";
const STATUS_COLORS = {
  draft: "default",
  published: "green",
  archived: "orange",
};

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

function normalizeSchema(input) {
  const raw = input || {};
  const rawSections = sortByOrder(raw.sections || []);
  const sections =
    rawSections.length > 0
      ? rawSections.map((section, idx) => ({
          sectionId: String(section?.sectionId || createId()),
          title: String(section?.title || `Section ${idx + 1}`),
          description: String(section?.description || ""),
          order: idx,
        }))
      : [
          {
            sectionId: createId(),
            title: "Section 1",
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
  const [formMeta, setFormMeta] = useState(null);
  const [formName, setFormName] = useState("");
  const [submitLabel, setSubmitLabel] = useState(FORM_SUBMIT_LABEL_DEFAULT);
  const [successMessage, setSuccessMessage] = useState(FORM_SUCCESS_MESSAGE_DEFAULT);
  const [schema, setSchema] = useState({ sections: [], questions: [] });
  const initialRef = useRef({
    name: "",
    submitLabel: FORM_SUBMIT_LABEL_DEFAULT,
    successMessage: FORM_SUCCESS_MESSAGE_DEFAULT,
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
      setSchema(nextSchema);
      initialRef.current = {
        name: nextName,
        submitLabel: nextSubmitLabel,
        successMessage: nextSuccessMessage,
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
    if (searchParams.get("preview") === "1") {
      setPreviewOpen(true);
    }
  }, [searchParams]);

  const schemaJson = useMemo(() => JSON.stringify(schema), [schema]);
  const isDirty =
    String(formName || "").trim() !== initialRef.current.name ||
    String(submitLabel || "").trim() !== initialRef.current.submitLabel ||
    String(successMessage || "").trim() !== initialRef.current.successMessage ||
    schemaJson !== initialRef.current.schemaJson;

  const sortedSections = useMemo(() => sortByOrder(schema.sections), [schema.sections]);
  const sortedQuestions = useMemo(() => sortByOrder(schema.questions), [schema.questions]);

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
    const nameChanged = nextName !== initialRef.current.name;
    const submitLabelChanged = nextSubmitLabel !== initialRef.current.submitLabel;
    const successMessageChanged = nextSuccessMessage !== initialRef.current.successMessage;
    const currentSchemaJson = JSON.stringify(schema);
    const schemaChanged = currentSchemaJson !== initialRef.current.schemaJson;
    const metaChanged = nameChanged || submitLabelChanged || successMessageChanged;

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
    const shortcode = String(formMeta?.shortcode || "").trim();
    if (!shortcode) return;
    try {
      await navigator.clipboard.writeText(shortcode);
      message.success("Shortcode copied");
    } catch {
      message.error("Copy failed");
    }
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

  const lifecyclePrimary = useMemo(() => {
    const status = formMeta?.status;
    if (status === "published") return { action: "unpublish", label: "Unpublish" };
    if (status === "archived") return { action: "unpublish", label: "Restore Draft" };
    return { action: "publish", label: "Publish" };
  }, [formMeta?.status]);

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
            <Button icon={<ArrowLeftOutlined />}>Back</Button>
          </Link>
          <Typography.Text strong>
            {formMeta.formId}
          </Typography.Text>
          <Tag color={STATUS_COLORS[formMeta.status] || "default"}>{formMeta.status}</Tag>
          <Typography.Text type="secondary">
            schema v{formMeta.schemaVersion}
          </Typography.Text>
        </Space>
      )}
      extra={(
        <Space wrap>
          <Link href={`/admin/form-builder/${encodeURIComponent(formMeta.formId)}/submissions`}>
            <Button icon={<UnorderedListOutlined />}>Submissions</Button>
          </Link>
          <Button
            icon={<CopyOutlined />}
            onClick={copyShortcode}
            disabled={!formMeta.shortcode}
          >
            Copy shortcode
          </Button>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
            Preview
          </Button>
          <Popconfirm
            title="Archive this form?"
            disabled={formMeta.status === "archived"}
            onConfirm={() => runLifecycleAction("archive")}
          >
            <Button
              danger
              disabled={formMeta.status === "archived"}
              loading={actionLoading === "archive"}
            >
              Archive
            </Button>
          </Popconfirm>
          <Button
            loading={actionLoading === lifecyclePrimary.action}
            onClick={() => runLifecycleAction(lifecyclePrimary.action)}
          >
            {lifecyclePrimary.label}
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
        <Alert
          type={isDirty ? "warning" : "success"}
          showIcon
          message={isDirty ? "You have unsaved changes" : "All changes saved"}
          description={(
            <Space size={16} wrap>
              <Typography.Text>
                Shortcode: <Typography.Text code>{formMeta.shortcode || "-"}</Typography.Text>
              </Typography.Text>
              <Typography.Text type="secondary">
                Drag and drop is enabled for section cards and question cards.
              </Typography.Text>
            </Space>
          )}
        />

        <Card size="small" title="Form Title">
          <Input
            value={formName}
            maxLength={120}
            placeholder="Form title"
            onChange={(e) => setFormName(e.target.value)}
          />
        </Card>

        <Card size="small" title="Submission Settings">
          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Typography.Text type="secondary">Submit button text</Typography.Text>
              <Input
                value={submitLabel}
                maxLength={60}
                placeholder={FORM_SUBMIT_LABEL_DEFAULT}
                onChange={(e) => setSubmitLabel(e.target.value)}
              />
            </Col>
            <Col xs={24} md={12}>
              <Typography.Text type="secondary">Success message</Typography.Text>
              <Input.TextArea
                rows={2}
                value={successMessage}
                maxLength={300}
                placeholder={FORM_SUCCESS_MESSAGE_DEFAULT}
                onChange={(e) => setSuccessMessage(e.target.value)}
              />
            </Col>
          </Row>
        </Card>

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
                          <Space>
                            <Typography.Text type="secondary">Required</Typography.Text>
                            <Switch
                              checked={question.required}
                              disabled={question.type === "divider"}
                              onChange={(checked) =>
                                updateQuestion(question.fieldKey, { required: checked })
                              }
                            />
                          </Space>
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

      <Modal
        title="Form Preview (Schema)"
        open={previewOpen}
        width={760}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Text>
            <strong>{formName}</strong> ({formMeta.formId})
          </Typography.Text>
          {sortedSections.map((section, sectionIndex) => {
            const sectionQuestions = sortedQuestions.filter(
              (question) => question.sectionId === section.sectionId,
            );
            return (
              <Card key={section.sectionId} size="small" title={`${sectionIndex + 1}. ${section.title || "Untitled section"}`}>
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
