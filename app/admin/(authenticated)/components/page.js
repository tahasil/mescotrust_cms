"use client";

import { useState, useEffect } from "react";
import { Table, Tag, Button, Space, message, Modal, Form, Input, Select, Drawer, Card, Row, Col } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined } from "@ant-design/icons";

const KNOWN_BASE_COMPONENTS = [
  { value: "Paragraph", label: "Paragraph" },
  { value: "Heading", label: "Heading" },
  { value: "Image", label: "Image" },
];

const CORE_PAGE_BUILDER_COMPONENTS_LIST = [
  { baseComponent: "Paragraph", displayName: "Paragraph", description: "Body text block. Editable: text." },
  { baseComponent: "Heading", displayName: "Heading", description: "Heading (H1–H6). Editable: level, text." },
  { baseComponent: "Image", displayName: "Image", description: "Image with URL. Editable: src, alt text." },
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
      const res = await fetch("/api/admin/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          displayName: values.displayName || values.name,
          baseComponent: values.baseComponent,
          category: values.category || "",
          type: "custom",
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
    });
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingId) return;
    try {
      const values = await editForm.validateFields();
      const res = await fetch(`/api/admin/components/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: values.displayName,
          category: values.category,
          active: values.active,
        }),
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

  const handleSeedDefaults = async () => {
    try {
      const res = await fetch("/api/admin/components/seed", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Seed failed");
        return;
      }
      message.success(data.created?.length ? `Created: ${data.created.join(", ")}` : "Default components already exist.");
      fetchList();
    } catch (e) {
      message.error("Seed failed");
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Delete component?",
      content: `Delete "${record.displayName || record.name}"? This only works if no page uses this component.`,
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

      <Card title="Core Page Builder Components" style={{ marginBottom: 24 }}>
        <p style={{ color: "#666", marginBottom: 16 }}>
          These block types are always available in the page builder. Seed them into the database to manage display name and category in the table below.
        </p>
        <Row gutter={[16, 16]}>
          {CORE_PAGE_BUILDER_COMPONENTS_LIST.map((item) => (
            <Col xs={24} sm={12} md={8} key={item.baseComponent}>
              <Card size="small" type="inner">
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.displayName}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{item.description}</div>
                <Tag style={{ marginTop: 8 }}>{item.baseComponent}</Tag>
              </Card>
            </Col>
          ))}
        </Row>
        <Button type="primary" icon={<AppstoreOutlined />} onClick={handleSeedDefaults} style={{ marginTop: 16 }}>
          Seed default components
        </Button>
      </Card>

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
        </Form>
      </Modal>

      <Drawer
        title="Edit component"
        open={editDrawerOpen}
        onClose={() => { setEditDrawerOpen(false); setEditingId(null); }}
        onOk={handleEditSubmit}
        okText="Save"
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
        </Form>
      </Drawer>
    </>
  );
}
