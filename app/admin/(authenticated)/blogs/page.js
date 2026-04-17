"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, Button, Space, message, Modal, Input, Select, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";

export default function AdminBlogsPage() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [searchText, setSearchText] = useState("");

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

  const filtered = useMemo(() => {
    let result = list;
    if (filterStatus) result = result.filter((p) => p.status === filterStatus);
    if (filterCategory) {
      result = result.filter((p) => (p.category?._id || p.category) === filterCategory);
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [list, filterStatus, filterCategory, searchText]);

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

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (t) => t || "-",
    },
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
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/blogs/${record._id}`)}
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
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
            ]}
          />
          <Select
            placeholder="Category"
            allowClear
            style={{ width: 160 }}
            value={filterCategory}
            onChange={setFilterCategory}
            options={categories.map((c) => ({ value: c._id, label: c.name }))}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/admin/blogs/new")}
          >
            Add post
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filtered}
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </ThemeAdminCard>
  );
}
