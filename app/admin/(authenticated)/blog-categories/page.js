"use client";

import { useState, useEffect } from "react";
import { Table, Button, Space, message, Modal, Form, Input, InputNumber, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { adminTableLoading, adminTableLocale } from "@/components/admin/loading/AdminLoading";

export default function AdminBlogCategoriesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const fetchCategories = () => {
    setLoading(true);
    fetch("/api/admin/blog-categories")
      .then((res) => (res.ok ? res.json() : []))
      .then(setList)
      .catch(() => message.error("Failed to load categories"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    form.setFieldsValue({
      name: record.name,
      slug: record.slug,
      description: record.description,
      order: record.order,
    });
    setModalOpen(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Delete category?",
      content: `Delete "${record.name}"? Posts using this category will become uncategorized.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/blog-categories/${record._id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          message.error(data.error || "Delete failed");
          return;
        }
        message.success("Category deleted");
        fetchCategories();
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const url = editingId ? `/api/admin/blog-categories/${editingId}` : "/api/admin/blog-categories";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Save failed");
        return;
      }
      message.success(editingId ? "Category updated" : "Category created");
      setModalOpen(false);
      fetchCategories();
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || "Error");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Slug", dataIndex: "slug", key: "slug" },
    { title: "Description", dataIndex: "description", key: "description", ellipsis: true },
    { title: "Order", dataIndex: "order", key: "order", width: 80 },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <ThemeAdminCard
      title="Blog Categories"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add category
        </Button>
      }
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={list}
        loading={adminTableLoading(loading)}
        locale={adminTableLocale(loading)}
        pagination={false}
      />

      <Modal
        title={editingId ? "Edit category" : "New category"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="order" label="Order" initialValue={0}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </ThemeAdminCard>
  );
}
