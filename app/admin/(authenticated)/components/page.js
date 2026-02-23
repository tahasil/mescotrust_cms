"use client";

import { useState, useEffect } from "react";
import { Table, Tag, Button, Space, message, Modal, Form, Input, Select, Drawer } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

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
];

export default function AdminComponentsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
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

  useEffect(() => {
    fetchList();
  }, []);

  const handleAdd = () => {
    form.resetFields();
    setAddModalOpen(true);
  };

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
        body: JSON.stringify({
          name: values.name,
          displayName: values.displayName || values.name,
          baseComponent: values.baseComponent,
          category: values.category || "",
          type: "custom",
          propsSchema,
          defaultProps,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Failed to create");
        return;
      }
      message.success("Component added");
      setAddModalOpen(false);
      fetchList();
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || "Error");
    }
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
      let propsSchema;
      let defaultProps;
      if (values.propsSchemaJson !== undefined) {
        try { propsSchema = JSON.parse(values.propsSchemaJson); } catch { message.error("Props schema is not valid JSON"); return; }
        if (!Array.isArray(propsSchema)) { message.error("Props schema must be a JSON array"); return; }
      }
      if (values.defaultPropsJson !== undefined) {
        try { defaultProps = JSON.parse(values.defaultPropsJson); } catch { message.error("Default props is not valid JSON"); return; }
      }
      const payload = {
        displayName: values.displayName,
        category: values.category,
        active: values.active,
      };
      if (propsSchema !== undefined) payload.propsSchema = propsSchema;
      if (defaultProps !== undefined) payload.defaultProps = defaultProps;
      const res = await fetch(`/api/admin/components/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Failed to update");
        return;
      }
      message.success("Component updated");
      setEditDrawerOpen(false);
      setEditingId(null);
      fetchList();
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || "Error");
    }
  };

  const handleDelete = async (record) => {
    let usageMsg = "";
    try {
      const res = await fetch(`/api/admin/components/${record._id}/usage`);
      if (res.ok) {
        const data = await res.json();
        if (data.count > 0) {
          usageMsg = ` This component is used by ${data.count} page(s).`;
        }
      }
    } catch {}
    Modal.confirm({
      title: "Delete component?",
      content: `Delete "${record.displayName || record.name}"?${usageMsg}${usageMsg ? " Remove it from those pages first, or deactivate instead." : ""}`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/components/${record._id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          message.error(data.error || "Delete failed");
          return;
        }
        message.success("Component deleted");
        fetchList();
      },
    });
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Display name", dataIndex: "displayName", key: "displayName" },
    { title: "Base component", dataIndex: "baseComponent", key: "baseComponent" },
    { title: "Category", dataIndex: "category", key: "category" },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (t) => <Tag color={t === "system" ? "blue" : "default"}>{t}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (a) => (a ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <h1 style={{ marginBottom: 16 }}>Components</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Block types used in the page builder. Add or edit definitions here. <strong>baseComponent</strong> must match a type registered in code. New types require a code change (see README).
      </p>

      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        Add component
      </Button>
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={false}
      />

      <Modal
        title="Add component"
        open={addModalOpen}
        onOk={handleAddSubmit}
        onCancel={() => setAddModalOpen(false)}
        okText="Add"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name (internal)" rules={[{ required: true }]}>
            <Input placeholder="e.g. MyParagraph" />
          </Form.Item>
          <Form.Item name="displayName" label="Display name">
            <Input placeholder="Shown in page builder" />
          </Form.Item>
          <Form.Item name="baseComponent" label="Base component" rules={[{ required: true }]}>
            <Select options={KNOWN_BASE_COMPONENTS} placeholder="Must exist in code" />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Input placeholder="e.g. Content" />
          </Form.Item>
          <Form.Item name="propsSchemaJson" label="Props schema (JSON)" help='Array of fields, e.g. [{"key":"text","type":"text","label":"Text","required":false}]. Types: text, richtext, image, url, number, select, boolean, json.'>
            <Input.TextArea rows={4} placeholder='[{"key":"text","type":"text","label":"Text"}]' />
          </Form.Item>
          <Form.Item name="defaultPropsJson" label="Default props (JSON)" help="Must conform to the props schema above.">
            <Input.TextArea rows={3} placeholder='{"text":""}' />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="Edit component"
        open={editDrawerOpen}
        onClose={() => { setEditDrawerOpen(false); setEditingId(null); }}
        extra={
          <Button type="primary" onClick={handleEditSubmit}>
            Save
          </Button>
        }
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="displayName" label="Display name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Input />
          </Form.Item>
          <Form.Item name="active" label="Active">
            <Select options={[{ value: true, label: "Active" }, { value: false, label: "Inactive" }]} />
          </Form.Item>
          <Form.Item name="propsSchemaJson" label="Props schema (JSON)" help='Array of fields, e.g. [{"key":"text","type":"text","label":"Text","required":false}]. Types: text, richtext, image, url, number, select, boolean, json.'>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="defaultPropsJson" label="Default props (JSON)" help="Must conform to the props schema above.">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
