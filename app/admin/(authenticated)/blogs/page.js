"use client";

import { useState, useEffect } from "react";
import { Table, Button, Space, message, Modal, Form, Input, Select, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import Link from "next/link";

export default function AdminBlogsPage() {
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const fetchBlogs = async () => {
    const res = await fetch("/api/admin/blogs");
    if (res.ok) setList(await res.json());
  };
  const fetchCategories = async () => {
    const res = await fetch("/api/admin/blog-categories");
    if (res.ok) setCategories(await res.json());
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBlogs(), fetchCategories()]).finally(() => setLoading(false));
  }, []);

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    form.setFieldsValue({
      title: record.title,
      slug: record.slug,
      content: record.content,
      excerpt: record.excerpt,
      status: record.status,
      category: record.category?._id || undefined,
      metaTitle: record.meta?.metaTitle,
      metaDescription: record.meta?.metaDescription,
    });
    setModalOpen(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Delete post?",
      content: `Delete "${record.title}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/blogs/${record._id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          message.error(data.error || "Delete failed");
          return;
        }
        message.success("Post deleted");
        fetchBlogs();
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        title: values.title,
        slug: values.slug,
        content: values.content,
        excerpt: values.excerpt,
        status: values.status,
        category: values.category || null,
        meta: { metaTitle: values.metaTitle, metaDescription: values.metaDescription },
      };
      const url = editingId ? `/api/admin/blogs/${editingId}` : "/api/admin/blogs";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Save failed");
        return;
      }
      message.success(editingId ? "Post updated" : "Post created");
      setModalOpen(false);
      fetchBlogs();
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || "Error");
    }
  };

  const columns = [
    { title: "Title", dataIndex: "title", key: "title", render: (t, r) => <Link href={`/admin/blogs/${r._id}`}>{t}</Link> },
    { title: "Slug", dataIndex: "slug", key: "slug" },
    { title: "Category", dataIndex: ["category", "name"], key: "category" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => <Tag color={s === "published" ? "green" : "default"}>{s}</Tag>,
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
      <h1 style={{ marginBottom: 16 }}>Blog posts</h1>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }}>
        Add post
      </Button>
      <Table rowKey="_id" columns={columns} dataSource={list} loading={loading} pagination={{ pageSize: 20 }} />

      <Modal
        title={editingId ? "Edit post" : "New post"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={640}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="excerpt" label="Excerpt">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="content" label="Content">
            <Input.TextArea rows={6} />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Select
              allowClear
              placeholder="Select category"
              options={categories.map((c) => ({ value: c._id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="draft">
            <Select options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }]} />
          </Form.Item>
          <Form.Item name="metaTitle" label="Meta title">
            <Input />
          </Form.Item>
          <Form.Item name="metaDescription" label="Meta description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
