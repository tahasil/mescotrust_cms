"use client";

import { useEffect, useState } from "react";
import { Table, Tag, message } from "antd";

type Submission = {
  id: string;
  payload: string;
  isRead: boolean;
  createdAt: string;
};

export default function AdminContactsPage() {
  const [list, setList] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/contacts", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => message.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const parsePayload = (p: string) => {
    try {
      return JSON.parse(p) as Record<string, string>;
    } catch {
      return {};
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">Contact submissions</h2>
      <Table
        loading={loading}
        dataSource={list}
        rowKey="id"
        columns={[
          {
            title: "Payload",
            dataIndex: "payload",
            render: (p: string) => {
              const o = parsePayload(p);
              return `${o.name ?? ""} ${o.email ?? ""} — ${(o.message ?? "").slice(0, 50)}...`;
            },
          },
          {
            title: "Read",
            dataIndex: "isRead",
            render: (v: boolean) => <Tag color={v ? "green" : "default"}>{v ? "Yes" : "No"}</Tag>,
          },
          { title: "Date", dataIndex: "createdAt", render: (d: string) => new Date(d).toLocaleString() },
        ]}
      />
    </div>
  );
}
