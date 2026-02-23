"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Tag, Button, Space, message, Modal, Form, Input, Select, Drawer, Empty,
  Segmented, Badge, Tooltip, Card as AntCard,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined,
  SearchOutlined, EyeOutlined, UnorderedListOutlined,
  FontSizeOutlined, PictureOutlined, LayoutOutlined,
  InteractionOutlined, TableOutlined, ShareAltOutlined,
  StarOutlined, TeamOutlined, ClockCircleOutlined,
  AlertOutlined, LineOutlined,
} from "@ant-design/icons";
import ComponentRenderer from "@/components/cms/ComponentRenderer";

const KNOWN_BASE_COMPONENTS = [
  { value: "Paragraph", label: "Paragraph" },
  { value: "Heading", label: "Heading" },
  { value: "List", label: "List" },
  { value: "Quote", label: "Quote" },
  { value: "CodeSnippet", label: "Code Snippet" },
  { value: "Image", label: "Image" },
  { value: "Gallery", label: "Gallery" },
  { value: "Video", label: "Video" },
  { value: "FileDownload", label: "File Download" },
  { value: "Cover", label: "Cover" },
  { value: "Buttons", label: "Buttons" },
  { value: "Spacer", label: "Spacer / Divider" },
  { value: "Columns", label: "Columns" },
  { value: "CallToAction", label: "Call to Action" },
  { value: "Embed", label: "Embed" },
  { value: "Breadcrumbs", label: "Breadcrumbs" },
  { value: "Card", label: "Card" },
  { value: "CardGrid", label: "Card Grid" },
  { value: "Accordion", label: "Accordion / FAQ" },
  { value: "Tabs", label: "Tabs" },
  { value: "Hero", label: "Hero Section" },
  { value: "Stats", label: "Statistics" },
  { value: "Testimonial", label: "Testimonials" },
  { value: "Pricing", label: "Pricing Table" },
  { value: "Team", label: "Team Members" },
  { value: "Timeline", label: "Timeline" },
  { value: "Alert", label: "Alert / Notice" },
  { value: "IconBox", label: "Icon Box" },
  { value: "Slider", label: "Slider / Carousel" },
  { value: "Modal", label: "Modal / Popup" },
  { value: "SocialLinks", label: "Social Links" },
  { value: "Divider", label: "Divider" },
  { value: "Table", label: "Table" },
  { value: "FeatureGrid", label: "Feature Grid" },
];

const CATEGORY_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "media", label: "Media" },
  { value: "layout", label: "Layout" },
  { value: "content", label: "Content" },
  { value: "interactive", label: "Interactive" },
  { value: "data", label: "Data Display" },
  { value: "navigation", label: "Navigation" },
];

const CATEGORY_META = {
  text: { label: "Text", icon: <FontSizeOutlined />, color: "#1890ff" },
  media: { label: "Media", icon: <PictureOutlined />, color: "#52c41a" },
  layout: { label: "Layout", icon: <LayoutOutlined />, color: "#722ed1" },
  content: { label: "Content", icon: <AppstoreOutlined />, color: "#fa8c16" },
  interactive: { label: "Interactive", icon: <InteractionOutlined />, color: "#eb2f96" },
  data: { label: "Data Display", icon: <TableOutlined />, color: "#13c2c2" },
  navigation: { label: "Navigation", icon: <ShareAltOutlined />, color: "#597ef7" },
};

const BLOCK_ICON_MAP = {
  Paragraph: <FontSizeOutlined />, Heading: <FontSizeOutlined />, List: <UnorderedListOutlined />,
  Quote: <FontSizeOutlined />, CodeSnippet: <FontSizeOutlined />, Image: <PictureOutlined />,
  Gallery: <PictureOutlined />, Video: <PictureOutlined />, FileDownload: <PictureOutlined />,
  Cover: <LayoutOutlined />, Hero: <StarOutlined />, Buttons: <LayoutOutlined />,
  Spacer: <LineOutlined />, Columns: <LayoutOutlined />, Divider: <LineOutlined />,
  CallToAction: <StarOutlined />, Card: <AppstoreOutlined />, CardGrid: <AppstoreOutlined />,
  FeatureGrid: <AppstoreOutlined />, IconBox: <StarOutlined />, Testimonial: <TeamOutlined />,
  Team: <TeamOutlined />, Embed: <PictureOutlined />, Accordion: <UnorderedListOutlined />,
  Tabs: <AppstoreOutlined />, Modal: <InteractionOutlined />, Stats: <StarOutlined />,
  Pricing: <TableOutlined />, Table: <TableOutlined />, Timeline: <ClockCircleOutlined />,
  Breadcrumbs: <ShareAltOutlined />, Alert: <AlertOutlined />, SocialLinks: <ShareAltOutlined />,
  Slider: <PictureOutlined />,
};

function ComponentPreviewCard({ record, onEdit, onDelete }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const catKey = record.category || "content";
  const catMeta = CATEGORY_META[catKey] || CATEGORY_META.content;
  const icon = BLOCK_ICON_MAP[record.baseComponent] || <AppstoreOutlined />;

  const demoLayout = [{
    instanceId: "preview_" + record._id,
    baseComponent: record.baseComponent,
    props: record.defaultProps || {},
    order: 0,
  }];

  return (
    <AntCard
      hoverable
      style={{ borderRadius: 10, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}
      styles={{ body: { padding: 0, flex: 1, display: "flex", flexDirection: "column" } }}
    >
      {/* Preview area */}
      <div
        style={{
          padding: "16px",
          background: "#fafafa",
          borderBottom: "1px solid #f0f0f0",
          minHeight: 100,
          maxHeight: 200,
          overflow: "hidden",
          position: "relative",
          cursor: "pointer",
        }}
        onClick={() => setPreviewOpen(true)}
      >
        <div style={{ pointerEvents: "none", transform: "scale(0.85)", transformOrigin: "top left", width: "117%" }}>
          <ComponentRenderer layout={demoLayout} />
        </div>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
          background: "linear-gradient(transparent, #fafafa)",
        }} />
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: "rgba(255,255,255,0.9)", borderRadius: 6, padding: "2px 6px",
        }}>
          <Tooltip title="Full preview">
            <EyeOutlined style={{ fontSize: 14, color: "#888" }} />
          </Tooltip>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "12px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: catMeta.color + "15", color: catMeta.color,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>
            {icon}
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#333", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {record.displayName || record.name}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          <Tag color={catMeta.color} style={{ borderRadius: 10, fontSize: 11, margin: 0 }}>{catMeta.label}</Tag>
          <Tag color={record.type === "system" ? "blue" : "default"} style={{ borderRadius: 10, fontSize: 11, margin: 0 }}>{record.type}</Tag>
          {!record.active && <Tag color="red" style={{ borderRadius: 10, fontSize: 11, margin: 0 }}>Inactive</Tag>}
        </div>
        <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
          Base: <code style={{ background: "#f5f5f5", padding: "1px 4px", borderRadius: 3 }}>{record.baseComponent}</code>
        </div>
        <div style={{ marginTop: "auto", display: "flex", gap: 4 }}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>Edit</Button>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(record)}>Delete</Button>
        </div>
      </div>

      {/* Full preview modal */}
      <Modal
        title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}>{icon}<span>{record.displayName || record.name} Preview</span></div>}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={700}
      >
        <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 16, background: "#fff" }}>
          <ComponentRenderer layout={demoLayout} />
        </div>
      </Modal>
    </AntCard>
  );
}

export default function AdminComponentsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchList = () => {
    setLoading(true);
    fetch("/api/admin/components")
      .then((res) => (res.ok ? res.json() : []))
      .then(setList)
      .catch(() => message.error("Failed to load components"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  const filteredList = useMemo(() => {
    let items = list;
    if (filterCategory !== "all") {
      items = items.filter((c) => (c.category || "content") === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((c) =>
        (c.displayName || c.name || "").toLowerCase().includes(q) ||
        (c.baseComponent || "").toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [list, filterCategory, searchQuery]);

  const handleAdd = () => { form.resetFields(); setAddModalOpen(true); };

  const handleAddSubmit = async () => {
    try {
      const values = await form.validateFields();
      let propsSchema = [];
      let defaultProps = {};
      if (values.propsSchemaJson) {
        try { propsSchema = JSON.parse(values.propsSchemaJson); } catch { message.error("Props schema is not valid JSON"); return; }
        if (!Array.isArray(propsSchema)) { message.error("Props schema must be a JSON array"); return; }
      }
      if (values.defaultPropsJson) {
        try { defaultProps = JSON.parse(values.defaultPropsJson); } catch { message.error("Default props is not valid JSON"); return; }
      }
      const res = await fetch("/api/admin/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, displayName: values.displayName || values.name, baseComponent: values.baseComponent, category: values.category || "", type: "custom", propsSchema, defaultProps }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); message.error(data.error || "Failed to create"); return; }
      message.success("Component added");
      setAddModalOpen(false);
      fetchList();
    } catch (e) { if (e.errorFields) return; message.error(e.message || "Error"); }
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    editForm.setFieldsValue({
      displayName: record.displayName || record.name,
      category: record.category || "",
      active: record.active !== false,
      propsSchemaJson: record.propsSchema?.length ? JSON.stringify(record.propsSchema, null, 2) : "[]",
      defaultPropsJson: record.defaultProps && Object.keys(record.defaultProps).length ? JSON.stringify(record.defaultProps, null, 2) : "{}",
    });
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingId) return;
    try {
      const values = await editForm.validateFields();
      let propsSchema, defaultProps;
      if (values.propsSchemaJson !== undefined) {
        try { propsSchema = JSON.parse(values.propsSchemaJson); } catch { message.error("Props schema is not valid JSON"); return; }
        if (!Array.isArray(propsSchema)) { message.error("Props schema must be a JSON array"); return; }
      }
      if (values.defaultPropsJson !== undefined) {
        try { defaultProps = JSON.parse(values.defaultPropsJson); } catch { message.error("Default props is not valid JSON"); return; }
      }
      const payload = { displayName: values.displayName, category: values.category, active: values.active };
      if (propsSchema !== undefined) payload.propsSchema = propsSchema;
      if (defaultProps !== undefined) payload.defaultProps = defaultProps;
      const res = await fetch(`/api/admin/components/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const data = await res.json().catch(() => ({})); message.error(data.error || "Failed to update"); return; }
      message.success("Component updated");
      setEditDrawerOpen(false);
      setEditingId(null);
      fetchList();
    } catch (e) { if (e.errorFields) return; message.error(e.message || "Error"); }
  };

  const handleDelete = async (record) => {
    let usageMsg = "";
    try {
      const res = await fetch(`/api/admin/components/${record._id}/usage`);
      if (res.ok) { const data = await res.json(); if (data.count > 0) usageMsg = ` This component is used by ${data.count} page(s).`; }
    } catch {}
    Modal.confirm({
      title: "Delete component?",
      content: `Delete "${record.displayName || record.name}"?${usageMsg}${usageMsg ? " Remove it from those pages first, or deactivate instead." : ""}`,
      okText: "Delete", okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/components/${record._id}`, { method: "DELETE" });
        if (!res.ok) { const data = await res.json().catch(() => ({})); message.error(data.error || "Delete failed"); return; }
        message.success("Component deleted");
        fetchList();
      },
    });
  };

  const categoryStats = useMemo(() => {
    const stats = { all: list.length };
    list.forEach((c) => { const cat = c.category || "content"; stats[cat] = (stats[cat] || 0) + 1; });
    return stats;
  }, [list]);

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22 }}>Components</h1>
          <p style={{ color: "#888", margin: 0, fontSize: 13 }}>
            Block types used in the visual page builder. Each component renders live on the canvas.
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
          Add Component
        </Button>
      </div>

      {/* Filters toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
        padding: "12px 16px", background: "#fafafa", borderRadius: 8, flexWrap: "wrap",
      }}>
        <Input
          prefix={<SearchOutlined style={{ color: "#bbb" }} />}
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          style={{ maxWidth: 260, borderRadius: 6 }}
        />
        <Segmented
          value={filterCategory}
          onChange={setFilterCategory}
          options={[
            { value: "all", label: `All (${categoryStats.all || 0})` },
            ...CATEGORY_OPTIONS.filter((o) => categoryStats[o.value]).map((o) => ({
              value: o.value,
              label: `${o.label} (${categoryStats[o.value] || 0})`,
            })),
          ]}
        />
        <div style={{ marginLeft: "auto" }}>
          <Segmented
            size="small"
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: "grid", icon: <AppstoreOutlined /> },
              { value: "list", icon: <UnorderedListOutlined /> },
            ]}
          />
        </div>
      </div>

      {/* Component grid / list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#999" }}>Loading...</div>
      ) : filteredList.length === 0 ? (
        <Empty description="No components found" style={{ padding: 60 }} />
      ) : viewMode === "grid" ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}>
          {filteredList.map((record) => (
            <ComponentPreviewCard key={record._id} record={record} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredList.map((record) => {
            const catKey = record.category || "content";
            const catMeta = CATEGORY_META[catKey] || CATEGORY_META.content;
            const icon = BLOCK_ICON_MAP[record.baseComponent] || <AppstoreOutlined />;
            return (
              <div key={record._id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 16px", background: "#fff", border: "1px solid #e8e8e8",
                borderRadius: 8,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: catMeta.color + "15", color: catMeta.color,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                }}>
                  {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{record.displayName || record.name}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>{record.baseComponent} &middot; {catMeta.label}</div>
                </div>
                <Space>
                  <Tag color={record.type === "system" ? "blue" : "default"} style={{ borderRadius: 10, margin: 0 }}>{record.type}</Tag>
                  {record.active ? <Tag color="green" style={{ borderRadius: 10, margin: 0 }}>Active</Tag> : <Tag color="red" style={{ borderRadius: 10, margin: 0 }}>Inactive</Tag>}
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
                </Space>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal title="Add component" open={addModalOpen} onOk={handleAddSubmit} onCancel={() => setAddModalOpen(false)} okText="Add" width={560}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name (internal)" rules={[{ required: true }]}>
            <Input placeholder="e.g. MyParagraph" />
          </Form.Item>
          <Form.Item name="displayName" label="Display name">
            <Input placeholder="Shown in page builder" />
          </Form.Item>
          <Form.Item name="baseComponent" label="Base component" rules={[{ required: true }]}>
            <Select options={KNOWN_BASE_COMPONENTS} placeholder="Must exist in code" showSearch />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Select options={CATEGORY_OPTIONS} placeholder="Component category" allowClear />
          </Form.Item>
          <Form.Item name="propsSchemaJson" label="Props schema (JSON)" help='Array of fields, e.g. [{"key":"text","type":"text","label":"Text"}]. Types: text, richtext, image, url, number, select, boolean, json.'>
            <Input.TextArea rows={4} placeholder='[{"key":"text","type":"text","label":"Text"}]' style={{ fontFamily: "monospace", fontSize: 12 }} />
          </Form.Item>
          <Form.Item name="defaultPropsJson" label="Default props (JSON)" help="Must conform to the props schema above.">
            <Input.TextArea rows={3} placeholder='{"text":""}' style={{ fontFamily: "monospace", fontSize: 12 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Drawer */}
      <Drawer
        title="Edit component"
        open={editDrawerOpen}
        onClose={() => { setEditDrawerOpen(false); setEditingId(null); }}
        width={480}
        extra={<Button type="primary" onClick={handleEditSubmit}>Save</Button>}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="displayName" label="Display name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Select options={CATEGORY_OPTIONS} placeholder="Component category" allowClear />
          </Form.Item>
          <Form.Item name="active" label="Active">
            <Select options={[{ value: true, label: "Active" }, { value: false, label: "Inactive" }]} />
          </Form.Item>
          <Form.Item name="propsSchemaJson" label="Props schema (JSON)">
            <Input.TextArea rows={6} style={{ fontFamily: "monospace", fontSize: 12 }} />
          </Form.Item>
          <Form.Item name="defaultPropsJson" label="Default props (JSON)">
            <Input.TextArea rows={4} style={{ fontFamily: "monospace", fontSize: 12 }} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
