"use client";

import { useState, useEffect } from "react";
import { Card, Button, Select, Drawer, Form, Input, InputNumber, Switch, Space, message } from "antd";
import { PlusOutlined, DeleteOutlined, CopyOutlined, UpOutlined, DownOutlined, EditOutlined } from "@ant-design/icons";
import RichTextEditor from "@/components/admin/RichTextEditor";

function generateId() {
  return "block_" + Math.random().toString(36).slice(2, 11);
}

const CORE_PAGE_BUILDER_COMPONENTS = [
  // --- Text ---
  { _id: "core-Paragraph", name: "Paragraph", displayName: "Paragraph", baseComponent: "Paragraph", propsSchema: [{ key: "text", type: "richtext", label: "Text" }], defaultProps: { text: "" }, active: true },
  { _id: "core-Heading", name: "Heading", displayName: "Heading", baseComponent: "Heading", propsSchema: [{ key: "level", type: "number", label: "Level (1-6)" }, { key: "text", type: "text", label: "Text" }, { key: "style", type: "select", label: "Style", options: ["default", "underline", "accent", "uppercase", "light"] }], defaultProps: { level: 2, text: "", style: "default" }, active: true },
  { _id: "core-List", name: "List", displayName: "List", baseComponent: "List", propsSchema: [{ key: "items", type: "json", label: "Items (JSON array of strings)" }, { key: "ordered", type: "boolean", label: "Numbered list" }], defaultProps: { items: ["Item 1", "Item 2"], ordered: false }, active: true },
  { _id: "core-Quote", name: "Quote", displayName: "Quote", baseComponent: "Quote", propsSchema: [{ key: "text", type: "text", label: "Quote text" }, { key: "citation", type: "text", label: "Citation" }], defaultProps: { text: "", citation: "" }, active: true },
  { _id: "core-CodeSnippet", name: "CodeSnippet", displayName: "Code Snippet", baseComponent: "CodeSnippet", propsSchema: [{ key: "code", type: "text", label: "Code" }, { key: "language", type: "text", label: "Language" }], defaultProps: { code: "", language: "" }, active: true },
  // --- Media ---
  { _id: "core-Image", name: "Image", displayName: "Image", baseComponent: "Image", propsSchema: [{ key: "src", type: "image", label: "Image URL" }, { key: "alt", type: "text", label: "Alt text" }], defaultProps: { src: "", alt: "" }, active: true },
  { _id: "core-Gallery", name: "Gallery", displayName: "Gallery", baseComponent: "Gallery", propsSchema: [{ key: "images", type: "json", label: "Images (JSON: [{src, alt}])" }, { key: "columns", type: "number", label: "Columns (1-6)" }, { key: "gap", type: "number", label: "Gap (px)" }], defaultProps: { images: [], columns: 3, gap: 8 }, active: true },
  { _id: "core-Video", name: "Video", displayName: "Video", baseComponent: "Video", propsSchema: [{ key: "url", type: "url", label: "Video URL (YouTube/Vimeo/file)" }, { key: "caption", type: "text", label: "Caption" }], defaultProps: { url: "", caption: "" }, active: true },
  { _id: "core-FileDownload", name: "FileDownload", displayName: "File Download", baseComponent: "FileDownload", propsSchema: [{ key: "url", type: "url", label: "File URL" }, { key: "label", type: "text", label: "Label" }, { key: "description", type: "text", label: "Description" }], defaultProps: { url: "", label: "", description: "" }, active: true },
  { _id: "core-Cover", name: "Cover", displayName: "Cover", baseComponent: "Cover", propsSchema: [{ key: "src", type: "image", label: "Background image URL" }, { key: "alt", type: "text", label: "Alt text" }, { key: "heading", type: "text", label: "Heading" }, { key: "text", type: "text", label: "Text" }, { key: "overlayColor", type: "text", label: "Overlay color" }, { key: "minHeight", type: "number", label: "Min height (px)" }], defaultProps: { src: "", alt: "", heading: "", text: "", overlayColor: "rgba(0,0,0,0.45)", minHeight: 300 }, active: true },
  // --- Layout ---
  { _id: "core-Buttons", name: "Buttons", displayName: "Buttons", baseComponent: "Buttons", propsSchema: [{ key: "buttons", type: "json", label: "Buttons JSON" }], defaultProps: { buttons: [{ label: "Click me", url: "#", variant: "solid" }] }, active: true },
  { _id: "core-Spacer", name: "Spacer", displayName: "Spacer / Divider", baseComponent: "Spacer", propsSchema: [{ key: "height", type: "number", label: "Height (px)" }, { key: "showDivider", type: "boolean", label: "Show divider line" }], defaultProps: { height: 40, showDivider: false }, active: true },
  { _id: "core-Columns", name: "Columns", displayName: "Columns", baseComponent: "Columns", propsSchema: [{ key: "columns", type: "number", label: "Number of columns (1-4)" }, { key: "gap", type: "number", label: "Gap (px)" }, { key: "content", type: "json", label: "Column content JSON" }], defaultProps: { columns: 2, gap: 24, content: [] }, active: true },
  // --- Content ---
  { _id: "core-CallToAction", name: "CallToAction", displayName: "Call to Action", baseComponent: "CallToAction", propsSchema: [{ key: "heading", type: "text", label: "Heading" }, { key: "text", type: "text", label: "Text" }, { key: "buttonLabel", type: "text", label: "Button label" }, { key: "buttonUrl", type: "url", label: "Button URL" }, { key: "buttonVariant", type: "select", label: "Button style", options: ["solid", "outline"] }, { key: "align", type: "select", label: "Alignment", options: ["left", "center", "right"] }], defaultProps: { heading: "", text: "", buttonLabel: "Learn more", buttonUrl: "#", buttonVariant: "solid", align: "center" }, active: true },
  { _id: "core-Embed", name: "Embed", displayName: "Embed", baseComponent: "Embed", propsSchema: [{ key: "url", type: "url", label: "Embed URL (YouTube/Vimeo/other)" }, { key: "caption", type: "text", label: "Caption" }], defaultProps: { url: "", caption: "" }, active: true },
  // --- Navigation ---
  { _id: "core-Breadcrumbs", name: "Breadcrumbs", displayName: "Breadcrumbs", baseComponent: "Breadcrumbs", propsSchema: [{ key: "items", type: "json", label: "Items (JSON: [{label, url}])" }, { key: "separator", type: "text", label: "Separator" }], defaultProps: { items: [{ label: "Home", url: "/" }], separator: "/" }, active: true },
];

function renderSchemaField(field) {
  const { key, type, label } = field;
  switch (type) {
    case "number":
      return (
        <Form.Item key={key} name={key} label={label}>
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      );
    case "boolean":
      return (
        <Form.Item key={key} name={key} label={label} valuePropName="checked">
          <Switch />
        </Form.Item>
      );
    case "select":
      return (
        <Form.Item key={key} name={key} label={label}>
          <Select options={(field.options || []).map((o) => ({ value: o, label: o }))} />
        </Form.Item>
      );
    case "url":
    case "image":
      return (
        <Form.Item key={key} name={key} label={label}>
          <Input placeholder="https://..." />
        </Form.Item>
      );
    case "richtext":
      return (
        <Form.Item key={key} name={key} label={label}>
          <RichTextEditor />
        </Form.Item>
      );
    case "json":
      return (
        <Form.Item key={key} name={key} label={label} getValueFromEvent={(e) => {
          if (typeof e === "string") {
            try { return JSON.parse(e); } catch { return e; }
          }
          return e?.target?.value ?? e;
        }} getValueProps={(val) => ({
          value: typeof val === "object" ? JSON.stringify(val, null, 2) : (val ?? ""),
        })}>
          <Input.TextArea rows={4} />
        </Form.Item>
      );
    case "text":
    default:
      return (
        <Form.Item key={key} name={key} label={label}>
          {type === "text" && key === "text" ? <Input.TextArea rows={3} /> : <Input />}
        </Form.Item>
      );
  }
}

export default function PageBuilder({ layout = [], onChange }) {
  const [components, setComponents] = useState(CORE_PAGE_BUILDER_COMPONENTS);
  const [addComponentId, setAddComponentId] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetch("/api/admin/components")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        const active = (list || []).filter((c) => c.active);
        setComponents(active.length > 0 ? active : CORE_PAGE_BUILDER_COMPONENTS);
      })
      .catch(() => setComponents(CORE_PAGE_BUILDER_COMPONENTS));
  }, []);

  const blocks = Array.isArray(layout) ? [...layout] : [];
  const sorted = blocks
    .map((b, i) => ({ ...b, _index: i }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const triggerChange = (newLayout) => {
    const withOrder = newLayout.map(({ _index, ...b }, i) => ({ ...b, order: i }));
    onChange(withOrder);
  };

  const handleAdd = () => {
    const comp = components.find((c) => c._id === addComponentId);
    if (!comp) return;
    const newBlock = {
      instanceId: generateId(),
      componentId: comp._id?.startsWith?.("core-") ? null : comp._id,
      baseComponent: comp.baseComponent,
      props: { ...(comp.defaultProps || {}) },
      order: blocks.length,
    };
    triggerChange([...blocks, newBlock]);
    setAddComponentId(null);
  };

  const handleRemove = (index) => {
    const newLayout = sorted.filter((_, i) => i !== index);
    triggerChange(newLayout.map((b, i) => ({ ...b, order: i })));
  };

  const handleDuplicate = (index) => {
    const block = sorted[index];
    const clone = {
      instanceId: generateId(),
      componentId: block.componentId,
      baseComponent: block.baseComponent,
      props: { ...(block.props || {}) },
      order: blocks.length,
    };
    triggerChange([...blocks, clone]);
  };

  const handleMove = (index, dir) => {
    if (dir === -1 && index === 0) return;
    if (dir === 1 && index === sorted.length - 1) return;
    const newSorted = [...sorted];
    const swap = newSorted[index + dir];
    newSorted[index + dir] = newSorted[index];
    newSorted[index] = swap;
    triggerChange(newSorted.map((b, i) => ({ ...b, order: i })));
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    const block = sorted[index];
    form.setFieldsValue(block.props || {});
    setDrawerOpen(true);
  };

  const handleEditSave = () => {
    form.validateFields().then((values) => {
      const block = sorted[editingIndex];
      const newLayout = blocks.map((b) =>
        b.instanceId === block.instanceId ? { ...b, props: values } : b
      );
      triggerChange(newLayout);
      setDrawerOpen(false);
      setEditingIndex(null);
    });
  };

  const getPropsFields = (baseComponent) => {
    const comp = components.find((c) => c.baseComponent === baseComponent);
    if (comp?.propsSchema?.length > 0) {
      return comp.propsSchema.map(renderSchemaField);
    }
    const core = CORE_PAGE_BUILDER_COMPONENTS.find((c) => c.baseComponent === baseComponent);
    if (core?.propsSchema?.length > 0) {
      return core.propsSchema.map(renderSchemaField);
    }
    return (
      <Form.Item name="text" label="Content">
        <Input.TextArea rows={2} />
      </Form.Item>
    );
  };

  const getBlockPreview = (block) => {
    const p = block.props || {};
    switch (block.baseComponent) {
      case "Paragraph": return (p.text || "(empty)").replace(/<[^>]+>/g, "").slice(0, 60);
      case "Heading": return `H${p.level ?? 2}: ${p.text || "(empty)"}`;
      case "Image": return p.src ? `Image: ${p.src.slice(0, 40)}` : "(no image)";
      case "Buttons": return `${Array.isArray(p.buttons) ? p.buttons.length : 0} button(s)`;
      case "Spacer": return `${p.height || 40}px ${p.showDivider ? "divider" : "spacer"}`;
      case "Columns": return `${p.columns || 2} columns`;
      case "List": return `${Array.isArray(p.items) ? p.items.length : 0} items (${p.ordered ? "numbered" : "bulleted"})`;
      case "Quote": return p.text ? `"${p.text.slice(0, 40)}..."` : "(empty quote)";
      case "CodeSnippet": return p.language ? `Code (${p.language})` : "Code snippet";
      case "Gallery": return `${Array.isArray(p.images) ? p.images.length : 0} image(s)`;
      case "Video": return p.url ? `Video: ${p.url.slice(0, 40)}` : "(no video)";
      case "FileDownload": return p.label || p.url || "(no file)";
      case "Cover": return p.heading || "Cover image";
      case "CallToAction": return p.heading || "Call to Action";
      case "Embed": return p.url ? `Embed: ${p.url.slice(0, 40)}` : "(no URL)";
      case "Breadcrumbs": return `${Array.isArray(p.items) ? p.items.length : 0} crumbs`;
      default: return JSON.stringify(p).slice(0, 50);
    }
  };

  const editingBlock = editingIndex !== null ? sorted[editingIndex] : null;

  return (
    <Card title="Page builder" style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Select
          placeholder="Add block"
          style={{ width: 200 }}
          value={addComponentId}
          onChange={setAddComponentId}
          options={components.map((c) => ({ value: c._id, label: c.displayName || c.baseComponent }))}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!addComponentId}>
          Add block
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p style={{ color: "#999" }}>No blocks yet. Add a block above.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((block, index) => (
            <Card
              key={block.instanceId}
              size="small"
              title={<span>{block.baseComponent}</span>}
              extra={
                <Space>
                  <Button type="text" size="small" icon={<UpOutlined />} disabled={index === 0} onClick={() => handleMove(index, -1)} />
                  <Button type="text" size="small" icon={<DownOutlined />} disabled={index === sorted.length - 1} onClick={() => handleMove(index, 1)} />
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(index)} />
                  <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleDuplicate(index)} />
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemove(index)} />
                </Space>
              }
            >
              <div style={{ color: "#666", fontSize: 12 }}>{getBlockPreview(block)}</div>
            </Card>
          ))}
        </div>
      )}

      <Drawer
        title={`Edit ${editingBlock?.baseComponent || "block"}`}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingIndex(null); }}
        width={400}
        extra={
          <Button type="primary" onClick={handleEditSave}>
            Save
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          {editingBlock && getPropsFields(editingBlock.baseComponent)}
        </Form>
      </Drawer>
    </Card>
  );
}
