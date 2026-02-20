"use client";

import { useEffect, useState } from "react";
import { Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";

type Component = {
  id: string;
  name: string;
  slug: string;
  category: string;
  isActive: boolean;
  isSystemComponent: boolean;
};

export default function AdminComponentsPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/components", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setComponents(Array.isArray(data) ? data : []);
      })
      .catch(() => message.error("Failed to load components"))
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnsType<Component> = [
    { title: "Name", dataIndex: "name" },
    { title: "Slug", dataIndex: "slug" },
    { title: "Category", dataIndex: "category" },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (v: boolean) => (
        <Tag color={v ? "green" : "default"}>{v ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Type",
      dataIndex: "isSystemComponent",
      render: (v: boolean) => (v ? "System" : "Builder"),
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">Components</h2>
      <p className="mb-4 text-gray-600">
        Default set: Hero, Card, Text, Image, Buttons, Spacer. Run <code>npm run db:seed</code> to seed.
      </p>
      <Table
        loading={loading}
        dataSource={components}
        rowKey="id"
        columns={columns}
      />
    </div>
  );
}
