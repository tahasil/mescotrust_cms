"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  HolderOutlined,
  PlusOutlined,
  SaveOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { normalizeFieldName } from "@/lib/formBuilder/schema";

const FIELD_PALETTE = [
  { type: "text", label: "Text" },
  { type: "email", label: "Email" },
  { type: "number", label: "Number" },
  { type: "mobile", label: "Mobile" },
  { type: "password", label: "Password" },
  { type: "textarea", label: "Textarea" },
  { type: "select", label: "Select" },
  { type: "radio_group", label: "Radio Group" },
  { type: "checkbox_group", label: "Checkbox Group" },
  { type: "date", label: "Date" },
  { type: "file", label: "File" },
  { type: "url", label: "URL" },
  { type: "hidden", label: "Hidden" },
  { type: "section_heading", label: "Section Heading" },
  { type: "divider", label: "Divider" },
];

const NON_DATA_TYPES = new Set(["section_heading", "divider"]);
const OPTION_TYPES = new Set(["select", "radio_group", "checkbox_group"]);
const COLUMN_WIDTH_OPTIONS = [
  { value: "full", label: "Full width (1 column)" },
  { value: "half", label: "Half width (2 columns)" },
  { value: "third", label: "One-third width (3 columns)" },
];

function resolveColumnWidth(ui = {}) {
  const preset = String(ui?.columnWidth || "")
    .trim()
    .toLowerCase();
  if (preset === "full" || preset === "half" || preset === "third") return preset;

  const width = String(ui?.width || "")
    .trim()
    .toLowerCase();
  if (width.includes("33")) return "third";
  if (width.includes("50")) return "half";

  const n = Number.parseFloat(width.replace("%", ""));
  if (Number.isFinite(n)) {
    if (n <= 40) return "third";
    if (n <= 66) return "half";
  }
  return "full";
}

function widthFromPreset(preset) {
  if (preset === "half") return "50%";
  if (preset === "third") return "33.33%";
  return "100%";
}

function sanitizeCssClass(value) {
  return String(value || "")
    .split(/\s+/)
    .map((token) => token.replace(/[^a-zA-Z0-9_-]/g, ""))
    .filter(Boolean)
    .join(" ");
}

function createFieldKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `field_${Math.random().toString(36).slice(2, 11)}`;
}

function titleFromType(type) {
  return FIELD_PALETTE.find((item) => item.type === type)?.label || type;
}

function createDefaultField(type, index = 0) {
  const title = titleFromType(type);
  const fieldKey = createFieldKey();
  const base = {
    fieldKey,
    type,
    label: `${title}`,
    name: NON_DATA_TYPES.has(type) ? "" : normalizeFieldName(title),
    order: index,
    ui: {
      placeholder: "",
      defaultValue: "",
      helpText: "",
      columnWidth: "full",
      width: "100%",
      cssClass: "",
    },
    validation: {},
    flags: {
      required: false,
      readOnly: false,
      hidden: false,
    },
    required: false,
    readOnly: false,
    hidden: false,
    options: OPTION_TYPES.has(type)
      ? [
          { label: "Option 1", value: "option_1" },
          { label: "Option 2", value: "option_2" },
        ]
      : [],
  };
  if (type === "email") {
    base.validation.email = true;
  }
  if (type === "mobile") {
    base.validation.mobileMin = 10;
    base.validation.mobileMax = 15;
  }
  if (type === "file") {
    base.validation.maxFileSizeMb = 5;
    base.validation.fileTypes = [];
  }
  return base;
}

function normalizeFieldForClient(field = {}) {
  const nextPreset = resolveColumnWidth(field?.ui || {});
  return {
    ...field,
    ui: {
      ...(field?.ui || {}),
      columnWidth: nextPreset,
      width: widthFromPreset(nextPreset),
      cssClass: sanitizeCssClass(field?.ui?.cssClass),
    },
  };
}

function ensureUniqueFieldName(name, fields = [], excludeFieldKey = "") {
  const base = normalizeFieldName(name || "field");
  const taken = new Set(
    (Array.isArray(fields) ? fields : [])
      .filter((field) => field && field.fieldKey !== excludeFieldKey && !NON_DATA_TYPES.has(field.type))
      .map((field) => normalizeFieldName(field.name || "field")),
  );
  if (!taken.has(base)) return base;

  let index = 2;
  while (taken.has(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}

function SortableFieldCard({ field, selected, onSelect, onDuplicate, onDelete, readOnly }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.fieldKey,
    disabled: readOnly,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: selected ? "1px solid #1677ff" : "1px solid #f0f0f0",
    borderRadius: 10,
    padding: 12,
    background: "#fff",
    opacity: isDragging ? 0.6 : 1,
    marginBottom: 10,
    boxShadow: selected ? "0 0 0 2px rgba(22,119,255,0.08)" : "none",
    cursor: "pointer",
  };

  return (
    <div ref={setNodeRef} style={style} onClick={() => onSelect(field.fieldKey)}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <div>
          <Typography.Text strong>{field.label || "Untitled Field"}</Typography.Text>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
            <Tag>{field.type}</Tag>
            {field.flags?.required ? <Tag color="red">Required</Tag> : null}
            {field.flags?.hidden ? <Tag color="default">Hidden</Tag> : null}
          </div>
          {!NON_DATA_TYPES.has(field.type) ? (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {field.name || "(no field name)"}
            </Typography.Text>
          ) : null}
        </div>
        <Space>
          {!readOnly ? (
            <Tooltip title="Drag to reorder">
              <Button type="text" size="small" icon={<HolderOutlined />} {...attributes} {...listeners} />
            </Tooltip>
          ) : null}
          {!readOnly ? (
            <Tooltip title="Duplicate">
              <Button
                type="text"
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  onDuplicate(field.fieldKey);
                }}
              >
                +
              </Button>
            </Tooltip>
          ) : null}
          {!readOnly ? (
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(field.fieldKey);
                }}
              />
            </Tooltip>
          ) : null}
        </Space>
      </Space>
    </div>
  );
}

function PaletteDraggableItem({ item, readOnly, onAdd }) {
  const draggable = useDraggable({
    id: `palette:${item.type}`,
    disabled: readOnly,
  });
  const style = {
    transform: CSS.Translate.toString(draggable.transform),
    transition: draggable.transition,
    opacity: draggable.isDragging ? 0.6 : 1,
  };

  return (
    <Button
      ref={draggable.setNodeRef}
      style={style}
      disabled={readOnly}
      icon={<PlusOutlined />}
      onClick={() => onAdd(item.type)}
      {...draggable.attributes}
      {...draggable.listeners}
    >
      {item.label}
    </Button>
  );
}

function DividerHeadingPreview({ field }) {
  if (field.type === "divider") {
    return <hr style={{ borderColor: "#e5e7eb" }} />;
  }
  return (
    <Typography.Title level={5} style={{ marginTop: 0 }}>
      {field.label || "Section heading"}
    </Typography.Title>
  );
}

function FieldPreview({ field }) {
  if (!field) return null;
  if (NON_DATA_TYPES.has(field.type)) {
    return (
      <div className="fb-preview-field fb-preview-full">
        <DividerHeadingPreview field={field} />
      </div>
    );
  }
  if (field.flags?.hidden) return null;

  const columnWidth = resolveColumnWidth(field.ui || {});
  const wrapperClass = [
    "fb-preview-field",
    `fb-preview-${columnWidth}`,
    sanitizeCssClass(field?.ui?.cssClass),
  ]
    .filter(Boolean)
    .join(" ");
  const commonProps = {
    disabled: true,
    placeholder: field.ui?.placeholder || "",
    style: { width: "100%" },
    value: field.ui?.defaultValue || "",
  };

  return (
    <div className={wrapperClass}>
      <label style={{ fontWeight: 500, display: "block", marginBottom: 6 }}>
        {field.label || field.name}
        {field.flags?.required ? <span style={{ color: "#ff4d4f" }}> *</span> : null}
      </label>
      {field.type === "textarea" ? (
        <Input.TextArea {...commonProps} rows={3} />
      ) : field.type === "select" ? (
        <Select
          disabled
          style={{ width: "100%" }}
          options={(field.options || []).map((option) => ({
            label: option.label,
            value: option.value,
          }))}
        />
      ) : field.type === "radio_group" ? (
        <Space direction="vertical">
          {(field.options || []).map((option) => (
            <label key={option.value}>
              <input type="radio" disabled style={{ marginRight: 6 }} />
              {option.label}
            </label>
          ))}
        </Space>
      ) : field.type === "checkbox_group" ? (
        <Space direction="vertical">
          {(field.options || []).map((option) => (
            <label key={option.value}>
              <input type="checkbox" disabled style={{ marginRight: 6 }} />
              {option.label}
            </label>
          ))}
        </Space>
      ) : field.type === "file" ? (
        <input type="file" disabled style={{ width: "100%" }} />
      ) : (
        <Input {...commonProps} type={field.type === "mobile" ? "tel" : field.type} />
      )}
      {field.ui?.helpText ? (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {field.ui.helpText}
        </Typography.Text>
      ) : null}
    </div>
  );
}

export default function FormBuilderEditor({ formId, readOnly = false }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formMeta, setFormMeta] = useState(null);
  const [fields, setFields] = useState([]);
  const [configuration, setConfiguration] = useState({
    submitText: "Submit",
    successMessage: "Thanks! Your submission has been received.",
    allowArchivedRender: false,
  });
  const [selectedFieldKey, setSelectedFieldKey] = useState("");
  const [viewport, setViewport] = useState("desktop");
  const [previewViewport, setPreviewViewport] = useState("desktop");
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );
  const canvasDrop = useDroppable({ id: "form-canvas-drop", disabled: readOnly });

  const selectedField = useMemo(
    () => fields.find((field) => field.fieldKey === selectedFieldKey) || null,
    [fields, selectedFieldKey],
  );

  const reload = () => {
    setLoading(true);
    fetch(`/api/admin/form-builder/${encodeURIComponent(formId)}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setFormMeta(data.form || null);
        const list = (Array.isArray(data.fields) ? data.fields : []).map(normalizeFieldForClient);
        setFields(list);
        setConfiguration({
          submitText: data.configuration?.submitText || "Submit",
          successMessage:
            data.configuration?.successMessage ||
            "Thanks! Your submission has been received.",
          allowArchivedRender: data.configuration?.allowArchivedRender === true,
        });
        setSelectedFieldKey((prev) =>
          list.length === 0 ? "" : list.some((field) => field.fieldKey === prev) ? prev : list[0].fieldKey,
        );
      })
      .catch(async (err) => {
        if (typeof err?.json === "function") {
          const data = await err.json().catch(() => ({}));
          message.error(data.error || "Failed to load form");
        } else {
          message.error("Failed to load form");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const updateViewport = () => {
      const width = window.innerWidth || 1400;
      if (width < 992) setViewport("mobile");
      else if (width < 1360) setViewport("tablet");
      else setViewport("desktop");
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const updateField = (fieldKey, patch) => {
    setFields((prev) =>
      prev.map((field) =>
        field.fieldKey === fieldKey
          ? {
              ...field,
              ...patch,
            }
          : field,
      ),
    );
  };

  const updateFieldNested = (fieldKey, key, patch) => {
    setFields((prev) =>
      prev.map((field) =>
        field.fieldKey === fieldKey
          ? {
              ...field,
              [key]: {
                ...(field[key] || {}),
                ...(patch || {}),
              },
            }
          : field,
      ),
    );
  };

  const addField = (type) => {
    if (readOnly) return;
    setFields((prev) => {
      const nextField = createDefaultField(type, prev.length);
      if (!NON_DATA_TYPES.has(nextField.type)) {
        nextField.name = ensureUniqueFieldName(nextField.name || nextField.label, prev);
      }
      const next = [...prev, nextField];
      setSelectedFieldKey(next[next.length - 1].fieldKey);
      return next;
    });
  };

  const duplicateField = (fieldKey) => {
    if (readOnly) return;
    setFields((prev) => {
      const index = prev.findIndex((field) => field.fieldKey === fieldKey);
      if (index < 0) return prev;
      const current = prev[index];
      const clone = {
        ...current,
        fieldKey: createFieldKey(),
        label: `${current.label} Copy`,
      };
      if (!NON_DATA_TYPES.has(clone.type)) {
        clone.name = ensureUniqueFieldName(`${clone.name || current.label}_copy`, prev);
      }
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      setSelectedFieldKey(clone.fieldKey);
      return next;
    });
  };

  const removeField = (fieldKey) => {
    if (readOnly) return;
    setFields((prev) => prev.filter((field) => field.fieldKey !== fieldKey));
    setSelectedFieldKey((prev) => (prev === fieldKey ? "" : prev));
  };

  const onDragEnd = ({ active, over }) => {
    if (readOnly || !active?.id || !over?.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const droppedOnCanvas = overId === "form-canvas-drop";

    if (activeId.startsWith("palette:")) {
      const type = activeId.replace("palette:", "");
      if (!FIELD_PALETTE.some((item) => item.type === type)) return;
      setFields((prev) => {
        const nextField = createDefaultField(type, prev.length);
        if (!NON_DATA_TYPES.has(nextField.type)) {
          nextField.name = ensureUniqueFieldName(nextField.name || nextField.label, prev);
        }
        if (droppedOnCanvas) {
          const appended = [...prev, nextField];
          setSelectedFieldKey(nextField.fieldKey);
          return appended;
        }
        const overIndex = prev.findIndex((field) => field.fieldKey === overId);
        if (overIndex < 0) {
          const appended = [...prev, nextField];
          setSelectedFieldKey(nextField.fieldKey);
          return appended;
        }
        const inserted = [...prev];
        inserted.splice(overIndex, 0, nextField);
        setSelectedFieldKey(nextField.fieldKey);
        return inserted;
      });
      return;
    }

    if (activeId === overId) return;
    setFields((prev) => {
      const oldIndex = prev.findIndex((field) => field.fieldKey === activeId);
      const newIndex = droppedOnCanvas
        ? prev.length - 1
        : prev.findIndex((field) => field.fieldKey === overId);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSave = async () => {
    if (readOnly || !formMeta) return;
    const payload = {
      name: formMeta.name,
      status: formMeta.status,
      fields: fields.map((field, index) => ({
        ...field,
        order: index,
      })),
      configuration,
    };
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/form-builder/${encodeURIComponent(formId)}/schema`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (Array.isArray(data.details) && data.details.length > 0) {
          message.error(data.details[0]);
        } else {
          message.error(data.error || "Failed to save");
        }
        return;
      }
      message.success("Form schema saved");
      setFormMeta(data.form || formMeta);
      const nextFields = (Array.isArray(data.fields) ? data.fields : []).map(normalizeFieldForClient);
      setFields(nextFields);
      setSelectedFieldKey((prev) =>
        nextFields.length === 0
          ? ""
          : nextFields.some((field) => field.fieldKey === prev)
            ? prev
            : nextFields[0].fieldKey,
      );
      setConfiguration({
        submitText: data.configuration?.submitText || configuration.submitText,
        successMessage: data.configuration?.successMessage || configuration.successMessage,
        allowArchivedRender: data.configuration?.allowArchivedRender === true,
      });
    } finally {
      setSaving(false);
    }
  };

  const copyShortcode = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success("Shortcode copied");
    } catch {
      message.error("Failed to copy");
    }
  };

  const layoutColumns =
    viewport === "desktop"
      ? "320px minmax(0,1fr) 360px"
      : viewport === "tablet"
        ? "280px minmax(0,1fr)"
        : "1fr";

  if (loading) {
    return <Card loading />;
  }

  if (!formMeta) {
    return <Alert type="error" message="Form not found" showIcon />;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Card
        title={
          <Space wrap>
            <Typography.Text strong>{readOnly ? "Form Preview" : "Form Builder"}</Typography.Text>
            <Tag>{formMeta.formId}</Tag>
            <Tag
              color={
                formMeta.status === "published"
                  ? "green"
                  : formMeta.status === "archived"
                    ? "default"
                    : "gold"
              }
            >
              {String(formMeta.status || "").toUpperCase()}
            </Tag>
          </Space>
        }
        extra={
          <Space wrap>
            <Tooltip title="Primary shortcode">
              <Button
                icon={<CopyOutlined />}
                onClick={() => copyShortcode(formMeta.shortcode)}
              >
                {formMeta.shortcode}
              </Button>
            </Tooltip>
            <Tooltip title="Alternative shortcode">
              <Button
                icon={<CopyOutlined />}
                onClick={() => copyShortcode(formMeta.shortcodeAlt)}
              >
                {formMeta.shortcodeAlt}
              </Button>
            </Tooltip>
            {!readOnly ? (
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                Save
              </Button>
            ) : null}
          </Space>
        }
      >
        <Space wrap style={{ width: "100%" }} size="middle">
          <div style={{ minWidth: 180 }}>
            <Typography.Text type="secondary">Form ID</Typography.Text>
            <Input value={formMeta.formId} readOnly />
          </div>
          <div style={{ minWidth: 280, flex: 1 }}>
            <Typography.Text type="secondary">Form Name</Typography.Text>
            <Input
              value={formMeta.name || ""}
              readOnly={readOnly}
              onChange={(event) => setFormMeta((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div style={{ minWidth: 180 }}>
            <Typography.Text type="secondary">Status</Typography.Text>
            <Select
              disabled={readOnly}
              value={formMeta.status}
              onChange={(status) => setFormMeta((prev) => ({ ...prev, status }))}
              style={{ width: "100%" }}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ]}
            />
          </div>
        </Space>
      </Card>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <style>{`
          .fb-preview-shell {
            margin: 0 auto;
            width: 100%;
            transition: max-width 0.2s ease;
          }
          .fb-preview-shell-desktop {
            max-width: 100%;
          }
          .fb-preview-shell-tablet {
            max-width: 840px;
          }
          .fb-preview-shell-mobile {
            max-width: 430px;
          }
          .fb-preview-grid {
            display: grid;
            grid-template-columns: repeat(12, minmax(0, 1fr));
            gap: 16px;
            align-items: start;
          }
          .fb-preview-field {
            grid-column: span 12;
            min-width: 0;
          }
          .fb-preview-half {
            grid-column: span 6;
          }
          .fb-preview-third {
            grid-column: span 4;
          }
          @media (max-width: 1024px) {
            .fb-preview-third {
              grid-column: span 6;
            }
          }
          @media (max-width: 768px) {
            .fb-preview-half,
            .fb-preview-third {
              grid-column: span 12;
            }
          }
        `}</style>
        <div style={{ display: "grid", gridTemplateColumns: layoutColumns, gap: 12 }}>
          <Card
            title="Field Palette"
            extra={<Tag>{FIELD_PALETTE.length} types</Tag>}
            bodyStyle={{ maxHeight: 920, overflow: "auto" }}
          >
            <Typography.Text type="secondary">
              Drag fields into the canvas, or click a field to add it.
            </Typography.Text>
            <div style={{ height: 8 }} />
            <Space wrap>
              {FIELD_PALETTE.map((item) => (
                <PaletteDraggableItem
                  key={item.type}
                  item={item}
                  readOnly={readOnly}
                  onAdd={addField}
                />
              ))}
            </Space>
          </Card>

          <div style={{ display: "grid", gap: 12 }}>
            <Card
              title="Form Canvas"
              extra={
                <Space>
                  <Tag>{fields.length} fields</Tag>
                  {readOnly ? <Tag icon={<EyeOutlined />}>Read only</Tag> : null}
                </Space>
              }
              bodyStyle={{ maxHeight: 520, overflow: "auto" }}
            >
              <Typography.Text type="secondary">
                Drag fields here to build your form. Drag field handles to reorder.
              </Typography.Text>
              <div style={{ height: 8 }} />
              <div
                ref={canvasDrop.setNodeRef}
                style={{
                  border: canvasDrop.isOver ? "1px dashed #1677ff" : "1px dashed #d9d9d9",
                  borderRadius: 8,
                  padding: 8,
                  minHeight: 170,
                  background: canvasDrop.isOver ? "rgba(22,119,255,0.04)" : "#fafafa",
                }}
              >
                <SortableContext
                  items={fields.map((field) => field.fieldKey)}
                  strategy={verticalListSortingStrategy}
                >
                  {fields.map((field) => (
                    <SortableFieldCard
                      key={field.fieldKey}
                      field={field}
                      selected={field.fieldKey === selectedFieldKey}
                      onSelect={setSelectedFieldKey}
                      onDuplicate={duplicateField}
                      onDelete={removeField}
                      readOnly={readOnly}
                    />
                  ))}
                </SortableContext>
                {fields.length === 0 ? (
                  <Empty description="Drop fields here to start building your form." />
                ) : null}
              </div>
            </Card>

            <Card
              title="Live Form Preview"
              extra={
                <Segmented
                  size="small"
                  value={previewViewport}
                  onChange={setPreviewViewport}
                  options={[
                    { label: "Desktop", value: "desktop" },
                    { label: "Tablet", value: "tablet" },
                    { label: "Mobile", value: "mobile" },
                  ]}
                />
              }
              bodyStyle={{ background: "#f7f8fa" }}
            >
              <div className={`fb-preview-shell fb-preview-shell-${previewViewport}`}>
                {fields.length === 0 ? (
                  <Empty description="No fields to preview yet." />
                ) : (
                  <div className="fb-preview-grid">
                    {fields.map((field) => (
                      <FieldPreview key={field.fieldKey} field={field} />
                    ))}
                    <div className="fb-preview-field">
                      <Button type="primary" disabled>
                        {configuration.submitText || "Submit"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <Card
            title={selectedField ? "Field Settings" : "Form Settings"}
            extra={
              selectedField ? (
                <Button size="small" onClick={() => setSelectedFieldKey("")}>
                  Form Settings
                </Button>
              ) : null
            }
            bodyStyle={{ maxHeight: 920, overflow: "auto" }}
          >
          {selectedField ? (
            <div style={{ display: "grid", gap: 10 }}>
              <Typography.Text type="secondary">Type: {selectedField.type}</Typography.Text>
              <label>Field Label</label>
              <Input
                disabled={readOnly}
                value={selectedField.label}
                onChange={(event) =>
                  updateField(selectedField.fieldKey, { label: event.target.value })
                }
              />
              {!NON_DATA_TYPES.has(selectedField.type) ? (
                <>
                  <label>Field Name (auto-normalized)</label>
                  <Input
                    disabled={readOnly}
                    value={selectedField.name || ""}
                    onChange={(event) =>
                      updateField(selectedField.fieldKey, {
                        name: normalizeFieldName(event.target.value || selectedField.label || "field"),
                      })
                    }
                  />
                </>
              ) : null}
              {!NON_DATA_TYPES.has(selectedField.type) ? (
                <>
                  <label>Placeholder</label>
                  <Input
                    disabled={readOnly}
                    value={selectedField.ui?.placeholder || ""}
                    onChange={(event) =>
                      updateFieldNested(selectedField.fieldKey, "ui", {
                        placeholder: event.target.value,
                      })
                    }
                  />
                  <label>Help Text</label>
                  <Input
                    disabled={readOnly}
                    value={selectedField.ui?.helpText || ""}
                    onChange={(event) =>
                      updateFieldNested(selectedField.fieldKey, "ui", {
                        helpText: event.target.value,
                      })
                    }
                  />
                  <label>Default Value</label>
                  <Input
                    disabled={readOnly}
                    value={selectedField.ui?.defaultValue || ""}
                    onChange={(event) =>
                      updateFieldNested(selectedField.fieldKey, "ui", {
                        defaultValue: event.target.value,
                      })
                    }
                  />
                </>
              ) : null}
              {!NON_DATA_TYPES.has(selectedField.type) ? (
                <>
                  <label>Column Width</label>
                  <Select
                    disabled={readOnly}
                    value={resolveColumnWidth(selectedField.ui || {})}
                    onChange={(value) =>
                      updateFieldNested(selectedField.fieldKey, "ui", {
                        columnWidth: value,
                        width: widthFromPreset(value),
                      })
                    }
                    options={COLUMN_WIDTH_OPTIONS}
                  />
                  <label>CSS Class (optional)</label>
                  <Input
                    disabled={readOnly}
                    placeholder="e.g. hero-field custom-spacing"
                    value={selectedField.ui?.cssClass || ""}
                    onChange={(event) =>
                      updateFieldNested(selectedField.fieldKey, "ui", {
                        cssClass: sanitizeCssClass(event.target.value),
                      })
                    }
                  />
                </>
              ) : null}

              {!NON_DATA_TYPES.has(selectedField.type) ? (
                <>
                  <Space style={{ justifyContent: "space-between", width: "100%" }}>
                    <span>Required</span>
                    <Switch
                      disabled={readOnly}
                      checked={selectedField.flags?.required === true}
                      onChange={(checked) =>
                        updateField(selectedField.fieldKey, {
                          required: checked,
                          flags: { ...(selectedField.flags || {}), required: checked },
                        })
                      }
                    />
                  </Space>
                  <Space style={{ justifyContent: "space-between", width: "100%" }}>
                    <span>Read only</span>
                    <Switch
                      disabled={readOnly}
                      checked={selectedField.flags?.readOnly === true}
                      onChange={(checked) =>
                        updateField(selectedField.fieldKey, {
                          readOnly: checked,
                          flags: { ...(selectedField.flags || {}), readOnly: checked },
                        })
                      }
                    />
                  </Space>
                  <Space style={{ justifyContent: "space-between", width: "100%" }}>
                    <span>Hidden</span>
                    <Switch
                      disabled={readOnly}
                      checked={selectedField.flags?.hidden === true}
                      onChange={(checked) =>
                        updateField(selectedField.fieldKey, {
                          hidden: checked,
                          flags: { ...(selectedField.flags || {}), hidden: checked },
                        })
                      }
                    />
                  </Space>
                </>
              ) : null}

              {OPTION_TYPES.has(selectedField.type) ? (
                <>
                  <label>Options</label>
                  {(selectedField.options || []).map((option, index) => (
                    <Space key={`${selectedField.fieldKey}-option-${index}`} style={{ width: "100%" }}>
                      <Input
                        disabled={readOnly}
                        placeholder="Label"
                        value={option.label}
                        onChange={(event) => {
                          const next = [...(selectedField.options || [])];
                          next[index] = {
                            ...next[index],
                            label: event.target.value,
                            value: normalizeFieldName(event.target.value || `option_${index + 1}`),
                          };
                          updateField(selectedField.fieldKey, { options: next });
                        }}
                      />
                      <Popconfirm
                        title="Remove option?"
                        onConfirm={() => {
                          const next = [...(selectedField.options || [])];
                          next.splice(index, 1);
                          updateField(selectedField.fieldKey, { options: next });
                        }}
                        okButtonProps={{ disabled: readOnly }}
                      >
                        <Button disabled={readOnly} danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  ))}
                  <Button
                    disabled={readOnly}
                    icon={<PlusOutlined />}
                    onClick={() =>
                      updateField(selectedField.fieldKey, {
                        options: [
                          ...(selectedField.options || []),
                          {
                            label: `Option ${(selectedField.options || []).length + 1}`,
                            value: `option_${(selectedField.options || []).length + 1}`,
                          },
                        ],
                      })
                    }
                  >
                    Add Option
                  </Button>
                </>
              ) : null}

              {!NON_DATA_TYPES.has(selectedField.type) ? (
                <>
                  <Typography.Text strong style={{ marginTop: 8 }}>
                    Validation
                  </Typography.Text>
                  {selectedField.type === "email" ? (
                    <Alert type="info" message="Email format validation is enabled automatically." />
                  ) : null}
                  <Space style={{ width: "100%" }}>
                    <InputNumber
                      disabled={readOnly}
                      placeholder="Min length"
                      value={selectedField.validation?.minLength}
                      onChange={(value) =>
                        updateFieldNested(selectedField.fieldKey, "validation", {
                          minLength: value ?? undefined,
                        })
                      }
                      style={{ width: "100%" }}
                    />
                    <InputNumber
                      disabled={readOnly}
                      placeholder="Max length"
                      value={selectedField.validation?.maxLength}
                      onChange={(value) =>
                        updateFieldNested(selectedField.fieldKey, "validation", {
                          maxLength: value ?? undefined,
                        })
                      }
                      style={{ width: "100%" }}
                    />
                  </Space>
                  {selectedField.type === "number" ? (
                    <Space style={{ width: "100%" }}>
                      <InputNumber
                        disabled={readOnly}
                        placeholder="Min value"
                        value={selectedField.validation?.minValue}
                        onChange={(value) =>
                          updateFieldNested(selectedField.fieldKey, "validation", {
                            minValue: value ?? undefined,
                          })
                        }
                        style={{ width: "100%" }}
                      />
                      <InputNumber
                        disabled={readOnly}
                        placeholder="Max value"
                        value={selectedField.validation?.maxValue}
                        onChange={(value) =>
                          updateFieldNested(selectedField.fieldKey, "validation", {
                            maxValue: value ?? undefined,
                          })
                        }
                        style={{ width: "100%" }}
                      />
                    </Space>
                  ) : null}
                  {selectedField.type === "mobile" ? (
                    <Space style={{ width: "100%" }}>
                      <InputNumber
                        disabled={readOnly}
                        placeholder="Min digits"
                        value={selectedField.validation?.mobileMin}
                        onChange={(value) =>
                          updateFieldNested(selectedField.fieldKey, "validation", {
                            mobileMin: value ?? undefined,
                          })
                        }
                        style={{ width: "100%" }}
                      />
                      <InputNumber
                        disabled={readOnly}
                        placeholder="Max digits"
                        value={selectedField.validation?.mobileMax}
                        onChange={(value) =>
                          updateFieldNested(selectedField.fieldKey, "validation", {
                            mobileMax: value ?? undefined,
                          })
                        }
                        style={{ width: "100%" }}
                      />
                    </Space>
                  ) : null}
                  {selectedField.type === "checkbox_group" ? (
                    <Space style={{ width: "100%" }}>
                      <InputNumber
                        disabled={readOnly}
                        placeholder="Min checked"
                        value={selectedField.validation?.minChecked}
                        onChange={(value) =>
                          updateFieldNested(selectedField.fieldKey, "validation", {
                            minChecked: value ?? undefined,
                          })
                        }
                        style={{ width: "100%" }}
                      />
                      <InputNumber
                        disabled={readOnly}
                        placeholder="Max checked"
                        value={selectedField.validation?.maxChecked}
                        onChange={(value) =>
                          updateFieldNested(selectedField.fieldKey, "validation", {
                            maxChecked: value ?? undefined,
                          })
                        }
                        style={{ width: "100%" }}
                      />
                    </Space>
                  ) : null}
                  {selectedField.type === "file" ? (
                    <>
                      <InputNumber
                        disabled={readOnly}
                        placeholder="Max file size (MB)"
                        value={selectedField.validation?.maxFileSizeMb}
                        onChange={(value) =>
                          updateFieldNested(selectedField.fieldKey, "validation", {
                            maxFileSizeMb: value ?? undefined,
                          })
                        }
                        style={{ width: "100%" }}
                      />
                      <Input
                        disabled={readOnly}
                        placeholder="Allowed file types (comma-separated, e.g. .pdf,image/png)"
                        value={(selectedField.validation?.fileTypes || []).join(", ")}
                        onChange={(event) =>
                          updateFieldNested(selectedField.fieldKey, "validation", {
                            fileTypes: event.target.value
                              .split(",")
                              .map((entry) => entry.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    </>
                  ) : null}
                  <Input
                    disabled={readOnly}
                    placeholder="Regex pattern"
                    value={selectedField.validation?.regex || ""}
                    onChange={(event) =>
                      updateFieldNested(selectedField.fieldKey, "validation", {
                        regex: event.target.value,
                      })
                    }
                  />
                  <Input
                    disabled={readOnly}
                    placeholder='Custom required message (e.g. "Please enter your name")'
                    value={selectedField.validation?.messages?.required || ""}
                    onChange={(event) =>
                      updateFieldNested(selectedField.fieldKey, "validation", {
                        messages: {
                          ...(selectedField.validation?.messages || {}),
                          required: event.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    disabled={readOnly}
                    placeholder="Custom format message (email/url/mobile/number)"
                    value={
                      selectedField.validation?.messages?.email ||
                      selectedField.validation?.messages?.url ||
                      selectedField.validation?.messages?.mobile ||
                      selectedField.validation?.messages?.number ||
                      ""
                    }
                    onChange={(event) => {
                      const key =
                        selectedField.type === "email"
                          ? "email"
                          : selectedField.type === "url"
                            ? "url"
                            : selectedField.type === "mobile"
                              ? "mobile"
                              : selectedField.type === "number"
                                ? "number"
                                : "email";
                      updateFieldNested(selectedField.fieldKey, "validation", {
                        messages: {
                          ...(selectedField.validation?.messages || {}),
                          [key]: event.target.value,
                        },
                      });
                    }}
                  />
                  {OPTION_TYPES.has(selectedField.type) ? (
                    <Input
                      disabled={readOnly}
                      placeholder="Custom invalid-option message"
                      value={selectedField.validation?.messages?.invalidOption || ""}
                      onChange={(event) =>
                        updateFieldNested(selectedField.fieldKey, "validation", {
                          messages: {
                            ...(selectedField.validation?.messages || {}),
                            invalidOption: event.target.value,
                          },
                        })
                      }
                    />
                  ) : null}
                  <Input
                    disabled={readOnly}
                    placeholder="Custom min-length/value message"
                    value={
                      selectedField.validation?.messages?.minLength ||
                      selectedField.validation?.messages?.minValue ||
                      ""
                    }
                    onChange={(event) =>
                      updateFieldNested(selectedField.fieldKey, "validation", {
                        messages: {
                          ...(selectedField.validation?.messages || {}),
                          minLength: event.target.value,
                          minValue: event.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    disabled={readOnly}
                    placeholder="Custom max-length/value message"
                    value={
                      selectedField.validation?.messages?.maxLength ||
                      selectedField.validation?.messages?.maxValue ||
                      ""
                    }
                    onChange={(event) =>
                      updateFieldNested(selectedField.fieldKey, "validation", {
                        messages: {
                          ...(selectedField.validation?.messages || {}),
                          maxLength: event.target.value,
                          maxValue: event.target.value,
                        },
                      })
                    }
                  />
                  {selectedField.type === "checkbox_group" ? (
                    <>
                      <Input
                        disabled={readOnly}
                        placeholder="Custom min-checked message"
                        value={selectedField.validation?.messages?.minChecked || ""}
                        onChange={(event) =>
                          updateFieldNested(selectedField.fieldKey, "validation", {
                            messages: {
                              ...(selectedField.validation?.messages || {}),
                              minChecked: event.target.value,
                            },
                          })
                        }
                      />
                      <Input
                        disabled={readOnly}
                        placeholder="Custom max-checked message"
                        value={selectedField.validation?.messages?.maxChecked || ""}
                        onChange={(event) =>
                          updateFieldNested(selectedField.fieldKey, "validation", {
                            messages: {
                              ...(selectedField.validation?.messages || {}),
                              maxChecked: event.target.value,
                            },
                          })
                        }
                      />
                    </>
                  ) : null}
                  <Input
                    disabled={readOnly}
                    placeholder="Custom regex message"
                    value={selectedField.validation?.messages?.regex || ""}
                    onChange={(event) =>
                      updateFieldNested(selectedField.fieldKey, "validation", {
                        messages: {
                          ...(selectedField.validation?.messages || {}),
                          regex: event.target.value,
                        },
                      })
                    }
                  />
                  {selectedField.type === "file" ? (
                    <>
                      <Input
                        disabled={readOnly}
                        placeholder="Custom file-type message"
                        value={selectedField.validation?.messages?.fileTypes || ""}
                        onChange={(event) =>
                          updateFieldNested(selectedField.fieldKey, "validation", {
                            messages: {
                              ...(selectedField.validation?.messages || {}),
                              fileTypes: event.target.value,
                            },
                          })
                        }
                      />
                      <Input
                        disabled={readOnly}
                        placeholder="Custom max-file-size message"
                        value={selectedField.validation?.messages?.maxFileSizeMb || ""}
                        onChange={(event) =>
                          updateFieldNested(selectedField.fieldKey, "validation", {
                            messages: {
                              ...(selectedField.validation?.messages || {}),
                              maxFileSizeMb: event.target.value,
                            },
                          })
                        }
                      />
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <Typography.Text strong>Form Configuration</Typography.Text>
              <label>Submit Button Text</label>
              <Input
                disabled={readOnly}
                value={configuration.submitText}
                onChange={(event) =>
                  setConfiguration((prev) => ({ ...prev, submitText: event.target.value }))
                }
              />
              <label>Success Message</label>
              <Input.TextArea
                disabled={readOnly}
                rows={3}
                value={configuration.successMessage}
                onChange={(event) =>
                  setConfiguration((prev) => ({
                    ...prev,
                    successMessage: event.target.value,
                  }))
                }
              />
              <Space style={{ justifyContent: "space-between", width: "100%" }}>
                <span>Allow archived form to render publicly</span>
                <Switch
                  disabled={readOnly}
                  checked={configuration.allowArchivedRender === true}
                  onChange={(checked) =>
                    setConfiguration((prev) => ({
                      ...prev,
                      allowArchivedRender: checked,
                    }))
                  }
                />
              </Space>
            </div>
          )}
          </Card>
        </div>
      </DndContext>
    </div>
  );
}
