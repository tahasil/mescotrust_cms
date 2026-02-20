"use client";

import { useEffect, useState } from "react";
import { Table, message } from "antd";

type Redirect = {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
};

export default function AdminRedirectsPage() {
  const [list, setList] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/redirects", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => message.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">Redirects</h2>
      <Table
        loading={loading}
        dataSource={list}
        rowKey="id"
        columns={[
          { title: "From", dataIndex: "fromPath" },
          { title: "To", dataIndex: "toPath" },
          { title: "Status", dataIndex: "statusCode" },
        ]}
      />
    </div>
  );
}
