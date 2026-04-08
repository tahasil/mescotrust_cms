"use client";

import { useState, useEffect } from "react";
import { Table, Button, Space, message, Modal, Form, Input, Select, Tag, Drawer } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import Link from "next/link";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { ThemeAdminCard } from "@/styles/Theme";

function slugify(text) {
  return (text || "").toString().toLowerCase().trim()
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminBlogsPage() {
  const [list, setList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const fetchBlogs = async () => {
    const res = await fetch("/api/admin/blogs");
    if (res.ok) {
      const data = await res.json();
      setList(Array.isArray(data) ? data : data.items || []);
    }
  };
  const fetchCategories = async () => {
    const res = await fetch("/api/admin/blog-categories");
    if (res.ok) setCategories(await res.json());
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBlogs(), fetchCategories()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = list;
    if (filterStatus) result = result.filter((p) => p.status === filterStatus);
    if (filterCategory) result = result.filter((p) => (p.category?._id || p.category) === filterCategory);
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter((p) => p.title?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [list, filterStatus, filterCategory, searchText]);

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
      featuredImage: record.featuredImage,
      featuredImageMobile: record.featuredImageMobile,
      status: record.status,
      category: record.category?._id || undefined,
      tags: Array.isArray(record.tags) ? record.tags : [],
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
      setSaving(true);
      const payload = {
        title: values.title,
        slug: values.slug,
        content: values.content,
        excerpt: values.excerpt,
        featuredImage: values.featuredImage || "",
        featuredImageMobile: values.featuredImageMobile || "",
        status: values.status,
        category: values.category || null,
        tags: Array.isArray(values.tags) ? values.tags : [],
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
      if (e.errorFields) { setSaving(false); return; }
      message.error(e.message || "Error");
    } finally {
      setSaving(false);
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
    <ThemeAdminCard
      title="Blog posts"
      extra={
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search title or slug"
            allowClear
            style={{ width: 220 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 120 }}
            value={filterStatus}
            onChange={setFilterStatus}
            options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }]}
          />
          <Select
            placeholder="Category"
            allowClear
            style={{ width: 160 }}
            value={filterCategory}
            onChange={setFilterCategory}
            options={categories.map((c) => ({ value: c._id, label: c.name }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add post
          </Button>
        </Space>
      }
    >
      <Table rowKey="_id" columns={columns} dataSource={filtered} loading={loading} pagination={{ pageSize: 20 }} />

      <Drawer
        title={editingId ? "Edit post" : "New post"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        width={520}
        extra={
          <Button type="primary" onClick={handleSubmit} loading={saving}>
            {editingId ? "Update" : "Save"}
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Post title" onChange={(e) => {
              if (!editingId) {
                form.setFieldValue("slug", slugify(e.target.value));
              }
            }} />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]} extra="Auto-generated from title.">
            <Input placeholder="post-slug" />
          </Form.Item>
          <Form.Item name="excerpt" label="Excerpt">
            <Input.TextArea rows={2} placeholder="Short summary" />
          </Form.Item>
          <Form.Item name="featuredImage" label="Featured Image URL (Desktop)">
            <Input placeholder="/uploads/featured-desktop.webp" />
          </Form.Item>
          <Form.Item name="featuredImageMobile" label="Featured Image URL (Mobile)" extra="Optional. If empty, desktop image is used.">
            <Input placeholder="/uploads/featured-mobile.webp" />
          </Form.Item>
          <Form.Item name="content" label="Content">
            <RichTextEditor />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Select allowClear placeholder="Select category" options={categories.map((c) => ({ value: c._id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="tags" label="Tags" extra="Press Enter after each tag">
            <Select mode="tags" placeholder="Add tags" tokenSeparators={[","]} />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="draft">
            <Select options={[{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }]} />
          </Form.Item>
          <Form.Item name="metaTitle" label="Meta title">
            <Input placeholder="SEO title" />
          </Form.Item>
          <Form.Item name="metaDescription" label="Meta description">
            <Input.TextArea rows={2} placeholder="SEO description" />
          </Form.Item>
        </Form>
      </Drawer>
    </ThemeAdminCard>
  );
}
