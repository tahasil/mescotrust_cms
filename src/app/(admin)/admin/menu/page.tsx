"use client";

import { useEffect, useState } from "react";
import { Table, Button, Space, Tag, message, Popconfirm } from "antd";
import { PlusOutlined } from "@ant-design/icons";

type Menu = {
  id: string;
  name: string;
  location: string;
  type: string;
  items: { id: string; label: string; url: string; openInNewTab: boolean }[];
};

export default function AdminMenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/menus", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setMenus(Array.isArray(data) ? data : []))
      .catch(() => message.error("Failed to load menus"))
      .finally(() => setLoading(false));
  }, []);

  const createMenu = async () => {
    try {
      const res = await fetch("/api/admin/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: "New menu", location: "header", type: "normal" }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.error || "Failed");
      message.success("Menu created");
      setMenus((prev) => [...prev, created]);
    } catch {
      message.error("Failed to create menu");
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h2 className="text-lg font-medium">Menus</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={createMenu}>
          Add menu
        </Button>
      </div>
      <Table
        loading={loading}
        dataSource={menus}
        rowKey="id"
        columns={[
          { title: "Name", dataIndex: "name" },
          { title: "Location", dataIndex: "location" },
          {
            title: "Type",
            dataIndex: "type",
            render: (t: string) => <Tag>{t}</Tag>,
          },
          {
            title: "Items",
            dataIndex: "items",
            render: (items: { length: number }) => items?.length ?? 0,
          },
        ]}
      />
    </div>
  );
}
