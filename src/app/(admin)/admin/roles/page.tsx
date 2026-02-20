"use client";

import { useEffect, useState } from "react";
import { Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";

type Role = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  _count: { users: number };
};

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/roles", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setRoles(Array.isArray(data) ? data : []);
      })
      .catch(() => message.error("Failed to load roles"))
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnsType<Role> = [
    { title: "Name", dataIndex: "name" },
    { title: "Slug", dataIndex: "slug" },
    { title: "Description", dataIndex: "description", render: (d: string | null) => d ?? "-" },
    { title: "Users", dataIndex: ["_count", "users"] },
    { title: "Permissions", dataIndex: "permissions", render: (p: string[]) => p?.length ?? 0 },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">Roles</h2>
      <Table loading={loading} dataSource={roles} rowKey="id" columns={columns} />
    </div>
  );
}
