"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  category: { name: string } | null;
};

export default function AdminBlogsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/blogs", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => message.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h2 className="text-lg font-medium">Blog posts</h2>
        <Link href="/admin/blogs/new">
          <Button type="primary" icon={<PlusOutlined />}>New post</Button>
        </Link>
      </div>
      <Table
        loading={loading}
        dataSource={posts}
        rowKey="id"
        columns={[
          {
            title: "Title",
            dataIndex: "title",
            render: (t: string, r: Post) => <Link href={`/admin/blogs/${r.id}`}>{t}</Link>,
          },
          { title: "Slug", dataIndex: "slug" },
          {
            title: "Status",
            dataIndex: "status",
            render: (s: string) => <Tag color={s === "published" ? "green" : "default"}>{s}</Tag>,
          },
          {
            title: "Category",
            dataIndex: ["category", "name"],
            render: (_: unknown, r: Post) => r.category?.name ?? "-",
          },
        ]}
      />
    </div>
  );
}
