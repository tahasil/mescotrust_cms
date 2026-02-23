"use client";

import { useState, useEffect } from "react";
import { Card, Table, Button, Form, Input, Switch, InputNumber, Space, message, Modal } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

const DEFAULT_MENU_NAMES = ["header", "footer"];

export default function AdminMenusPage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchMenus = () => {
    setLoading(true);
    fetch("/api/admin/menus")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMenus)
      .catch(() => message.error("Failed to load menus"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleEdit = (record) => {
    setEditingName(record.name);
    form.setFieldsValue({ name: record.name, items: record.items || [] });
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingName(null);
    form.setFieldsValue({ name: "header", items: [] });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const name = (values.name || "").trim();
      const items = (values.items || []).map((item, i) => ({
        label: item.label || "",
        url: item.url || "#",
        order: i,
        openInNewTab: !!item.openInNewTab,
      }));
      const url = editingName ? `/api/admin/menus/${encodeURIComponent(editingName)}` : "/api/admin/menus";
      const method = editingName ? "PUT" : "POST";
      const body = editingName ? { items } : { name, items };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        message.error(data.error || "Save failed");
        return;
      }
      message.success("Menu saved");
      setModalOpen(false);
      fetchMenus();
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || "Error");
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Delete menu?",
      content: `Delete menu "${record.name}"? This cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/menus/${encodeURIComponent(record.name)}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          message.error(data.error || "Delete failed");
          return;
        }
        message.success("Menu deleted");
        fetchMenus();
      },
    });
  };

  return (
    <>
      <h1 style={{ marginBottom: 16 }}>Menus</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Manage navigation menus (e.g. header, footer). Add items with label and URL. Public API: <code>GET /api/public/menus?name=header</code>
      </p>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }}>
        Add menu
      </Button>
      <Table
        rowKey="name"
        loading={loading}
        dataSource={menus}
        columns={[
          { title: "Name", dataIndex: "name", key: "name" },
          {
            title: "Items",
            dataIndex: "items",
            key: "items",
            render: (items) => (Array.isArray(items) ? items.length : 0) + " items",
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
        ]}
      />

      <Modal title={editingName ? "Edit menu" : "Add menu"} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} width={560}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Menu name" rules={[{ required: true }]}>
            <Input placeholder="e.g. header, footer" disabled={!!editingName} />
          </Form.Item>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                    <Form.Item {...rest} name={[name, "label"]} rules={[{ required: true }]}>
                      <Input placeholder="Label" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "url"]} rules={[{ required: true }]}>
                      <Input placeholder="URL" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "openInNewTab"]} valuePropName="checked">
                      <Switch checkedChildren="New tab" />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(name)}>
                      Remove
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  );
}
