"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Tag, Button, Space, message, Modal, Form, Input, Select, Drawer, Empty,
  Segmented, Switch, Tooltip,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined, SettingOutlined,
  SearchOutlined, UnorderedListOutlined,
  FontSizeOutlined, PictureOutlined, LayoutOutlined,
  InteractionOutlined, TableOutlined, ShareAltOutlined,
  StarOutlined, TeamOutlined, ClockCircleOutlined,
  AlertOutlined, LineOutlined,
} from "@ant-design/icons";

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
  Slider: <PictureOutlined />, Header: <LayoutOutlined />, Section: <LayoutOutlined />,
};

export default function AdminComponentsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
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

  /** Base component options for Add modal = components from the list (same as Component list page), unique by baseComponent */
  const baseComponentOptions = useMemo(() => {
    const seen = new Set();
    return list
      .filter((c) => c.baseComponent && !seen.has(c.baseComponent) && (seen.add(c.baseComponent), true))
      .map((c) => ({ value: c.baseComponent, label: c.displayName || c.name || c.baseComponent }));
  }, [list]);

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

  const handleActiveChange = async (record, active) => {
    try {
      const res = await fetch(`/api/admin/components/${record._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Update failed");
        return;
      }
      setList((prev) => prev.map((c) => (c._id === record._id ? { ...c, active } : c)));
      message.success(active ? "Component activated" : "Component deactivated");
    } catch {
      message.error("Update failed");
    }
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
        <Space>
          <Button
            onClick={async () => {
              try {
                const res = await fetch("/api/admin/components/seed", { method: "POST" });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) { message.error(data.error || "Seed failed"); return; }
                message.success(data.created?.length ? `Seeded ${data.created.length} system components` : "System components already in database");
                fetchList();
              } catch (e) { message.error("Seed failed"); }
            }}
          >
            Seed system components
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
            Add Component
          </Button>
        </Space>
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
      </div>

      {/* Component list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#999" }}>Loading...</div>
      ) : filteredList.length === 0 ? (
        <Empty description="No components found" style={{ padding: 60 }} />
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
                  <span style={{ fontSize: 12, color: "#666" }}>Active</span>
                  <Switch checked={record.active !== false} onChange={(checked) => handleActiveChange(record, checked)} size="small" />
                  <Link href={`/admin/components/${record._id}/edit`}>
                    <Button type="primary" size="small" icon={<EditOutlined />}>Edit</Button>
                  </Link>
                  <Button type="text" size="small" icon={<SettingOutlined />} onClick={() => handleEdit(record)} />
                  {record.type !== "system" && (
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
                  )}
                  {record.type === "system" && (
                    <Tooltip title="Base / system components cannot be deleted. You can deactivate them with the switch.">
                      <span style={{ display: "inline-block" }}>
                        <Button type="text" size="small" disabled icon={<DeleteOutlined />} style={{ color: "#ccc", cursor: "not-allowed" }} />
                      </span>
                    </Tooltip>
                  )}
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
          <Form.Item
            name="baseComponent"
            label="Base component"
            rules={[{ required: true, message: "Select a base component" }]}
            help={list.length === 0 ? "No components in the list yet. Use “Seed system components” below to add base components first." : undefined}
          >
            <Select
              options={baseComponentOptions}
              placeholder={list.length === 0 ? "Seed system components first" : "Choose from components in the list"}
              showSearch
              optionFilterProp="label"
              disabled={baseComponentOptions.length === 0}
            />
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
