"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Select,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined, SearchOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ThemeAdminCard } from "@/styles/Theme";

export default function AdminPagesPage() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [folderFilter, setFolderFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pages");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setList(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      message.error(e.message || "Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleCreate = () => {
    router.push("/admin/pages/new");
  };

  const handleEdit = (record) => {
    router.push(`/admin/pages/${record._id}`);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Delete page?",
      content: `Delete "${record.title}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/pages/${record._id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          message.error(data.error || "Delete failed");
          return;
        }
        message.success("Page deleted");
        fetchPages();
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const url = editingId
        ? `/api/admin/pages/${editingId}`
        : "/api/admin/pages";
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
      message.success(editingId ? "Page updated" : "Page created");
      setModalOpen(false);
      fetchPages();
      if (!editingId && data._id) {
        router.push(`/admin/pages/${data._id}`);
      }
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || "Error");
    }
  };

  // Derive unique folders from page slugs
  const folders = [...new Set(
    list
      .filter((p) => p.slug && p.slug.includes("/"))
      .map((p) => p.slug.substring(0, p.slug.lastIndexOf("/")))
  )].sort();

  const filteredList = list.filter((p) => {
    const matchesFolder = folderFilter === "all"
      ? true
      : folderFilter === "root"
        ? !p.slug || !p.slug.includes("/")
        : p.slug && p.slug.startsWith(folderFilter + "/");
    const matchesSearch = !searchQuery
      || (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase()))
      || (p.slug && p.slug.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFolder && matchesSearch;
  });

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (t) => t,
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      render: (slug) => {
        if (!slug || !slug.includes("/")) return slug;
        const lastSlash = slug.lastIndexOf("/");
        return (
          <>
            <Tag color="blue" style={{ marginRight: 4 }}><FolderOutlined /> {slug.substring(0, lastSlash)}</Tag>
            {slug.substring(lastSlash + 1)}
          </>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => (
        <Tag color={s === "published" ? "green" : "default"}>{s}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <ThemeAdminCard
      title="Pages"
      extra={
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search pages..."
            allowClear
            style={{ width: 220 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Link href="/admin/pages/new">
            <Button type="primary" icon={<PlusOutlined />}>
              Add page
            </Button>
          </Link>
        </Space>
      }
    >
      {folders.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Select
            value={folderFilter}
            onChange={setFolderFilter}
            style={{ width: 240 }}
            options={[
              { label: "All pages", value: "all" },
              { label: "Root level (no folder)", value: "root" },
              ...folders.map((f) => ({ label: `📁 ${f}`, value: f })),
            ]}
          />
        </div>
      )}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filteredList}
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={editingId ? "Edit page" : "New page"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input placeholder="url-slug" />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="draft">
            <Select
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="locale"
            label="Locale"
            initialValue="en"
            extra="Language code (e.g. en, ar, he)"
          >
            <Input placeholder="en" />
          </Form.Item>
        </Form>
      </Modal>
    </ThemeAdminCard>
  );
}
