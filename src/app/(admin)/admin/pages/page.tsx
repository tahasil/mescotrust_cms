"use client";

import { useEffect, useState } from "react";
import { Table, Button, Space, Tag, message, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import Link from "next/link";

type Page = {
  id: string;
  title: string;
  slug: string;
  status: string;
  isHomePage: boolean;
  updatedAt: string;
};

export default function AdminPagesListPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pages", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPages(data);
    } catch {
      message.error("Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Delete failed");
      }
      message.success("Page deleted");
      fetchPages();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h2 className="text-lg font-medium">Pages</h2>
        <Link href="/admin/pages/new">
          <Button type="primary" icon={<PlusOutlined />}>
            Add page
          </Button>
        </Link>
      </div>
      <Table
        loading={loading}
        dataSource={pages}
        rowKey="id"
        columns={[
          {
            title: "Title",
            dataIndex: "title",
            render: (t: string, r: Page) => (
              <Link href={`/admin/pages/${r.id}`}>{t}</Link>
            ),
          },
          { title: "Slug", dataIndex: "slug" },
          {
            title: "Status",
            dataIndex: "status",
            render: (s: string) => (
              <Tag color={s === "published" ? "green" : "default"}>{s}</Tag>
            ),
          },
          {
            title: "Home",
            dataIndex: "isHomePage",
            render: (v: boolean) => (v ? "Yes" : "-"),
          },
          {
            title: "Actions",
            key: "actions",
            render: (_: unknown, r: Page) => (
              <Space>
                <Link href={`/admin/pages/${r.id}`}>
                  <Button type="link" size="small" icon={<EditOutlined />}>
                    Edit
                  </Button>
                </Link>
                <Popconfirm
                  title="Delete this page?"
                  onConfirm={() => handleDelete(r.id)}
                >
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
