"use client";

import { useEffect, useState } from "react";
import { Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";

type User = {
  id: string;
  name: string;
  email: string;
  status: string;
  role: { name: string; slug: string } | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => message.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnsType<User> = [
    { title: "Name", dataIndex: "name" },
    { title: "Email", dataIndex: "email" },
    {
      title: "Role",
      dataIndex: ["role", "name"],
      render: (_, r) => r.role?.name ?? "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s: string) => <Tag color={s === "active" ? "green" : "default"}>{s}</Tag>,
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">Users</h2>
      <Table loading={loading} dataSource={users} rowKey="id" columns={columns} />
    </div>
  );
}
