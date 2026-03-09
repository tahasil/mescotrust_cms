"use client";

import { useState, useEffect } from "react";
import { Table, Button, message } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ThemeAdminCard } from "@/styles/Theme";

export default function AdminComponentsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchList = () => {
    setLoading(true);
    fetch("/api/admin/site-components")
      .then((res) => (res.ok ? res.json() : []))
      .then(setList)
      .catch(() => message.error("Failed to load components"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const columns = [
    {
      title: "Component",
      key: "component",
      width: 200,
      render: (_, record) => record.displayName || record.componentId,
    },
    {
      title: "ID",
      dataIndex: "componentId",
      key: "componentId",
      width: 140,
      render: (id) => <code>{id}</code>,
    },
    {
      title: "Show on all pages",
      key: "global",
      width: 140,
      render: (_, record) => (
        <span style={{ fontWeight: record.global ? 600 : 400 }}>
          {record.global ? "Yes" : "No"}
        </span>
      ),
    },
    {
      title: "Position (when global)",
      key: "position",
      width: 120,
      render: (_, r) =>
        r.global
          ? r.position === "after"
            ? "Below content"
            : "Above content"
          : "—",
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Link
          href={`/admin/components/${encodeURIComponent(record.componentId)}/edit`}
        >
          <Button type="link" size="small" icon={<EditOutlined />}>
            Edit
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <ThemeAdminCard
      title="Components"
      extra={
        <Link href="/admin/components/new">
          <Button type="primary" icon={<PlusOutlined />}>
            New component
          </Button>
        </Link>
      }
    >
      <Table
        rowKey="componentId"
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={false}
        size="middle"
      />
    </ThemeAdminCard>
  );
}
