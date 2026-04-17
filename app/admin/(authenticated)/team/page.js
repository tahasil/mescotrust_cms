"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Table, Tag, message } from "antd";
import { EditOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ThemeAdminCard } from "@/styles/Theme";

const TEAM_COMPONENT_IDS = ["CommitteeMembers"];

const TEAM_LABELS = {
  CommitteeMembers: "Committee Members",
};

export default function AdminTeamPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/site-components")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => message.error("Failed to load team components"))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const byId = new Map(list.map((item) => [item.componentId, item]));
    return TEAM_COMPONENT_IDS.map((componentId, index) => {
      const item = byId.get(componentId) || {};
      return {
        key: componentId,
        componentId,
        displayName: item.displayName || TEAM_LABELS[componentId] || componentId,
        enabled: item.enabled !== false,
        order: index + 1,
      };
    });
  }, [list]);

  const columns = [
    { title: "#", dataIndex: "order", key: "order", width: 70 },
    { title: "Team Component", dataIndex: "displayName", key: "displayName" },
    {
      title: "Component ID",
      dataIndex: "componentId",
      key: "componentId",
      width: 180,
      render: (value) => <code>{value}</code>,
    },
    {
      title: "Status",
      dataIndex: "enabled",
      key: "enabled",
      width: 120,
      render: (enabled) => (
        <Tag color={enabled ? "green" : "default"}>
          {enabled ? "Enabled" : "Disabled"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
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
    <ThemeAdminCard title="Team">
      <Table
        rowKey="componentId"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={false}
      />
    </ThemeAdminCard>
  );
}
