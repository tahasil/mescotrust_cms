"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Switch, Table, Tag, message } from "antd";
import { EditOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ThemeAdminCard } from "@/styles/Theme";

const SLIDER_COMPONENT_IDS = ["HomeSlider", "ImageSlider", "StoriesSlider", "EventsSlider"];

const SLIDER_LABELS = {
  HomeSlider: "Home Slider",
  ImageSlider: "Circular Slider",
  StoriesSlider: "Stories Slider",
  EventsSlider: "Events Slider",
};

export default function AdminSlidersPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const updateSliderStatus = async (record, enabled) => {
    setUpdatingId(record.componentId);
    try {
      const response = await fetch(
        `/api/admin/site-components/${encodeURIComponent(record.componentId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Failed to update slider status");
      setList((current) => current.map((item) =>
        item.componentId === record.componentId ? { ...item, enabled } : item,
      ));
      message.success(`${record.displayName} ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      message.error(error?.message || "Failed to update slider status");
    } finally {
      setUpdatingId("");
    }
  };

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/site-components")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => message.error("Failed to load sliders"))
      .finally(() => setLoading(false));
  }, []);

  const sliderRows = useMemo(() => {
    const byId = new Map(list.map((item) => [item.componentId, item]));
    return SLIDER_COMPONENT_IDS.map((componentId, index) => {
      const item = byId.get(componentId) || {};
      return {
        key: componentId,
        componentId,
        displayName: item.displayName || SLIDER_LABELS[componentId] || componentId,
        enabled: item.enabled !== false,
        order: index + 1,
      };
    });
  }, [list]);

  const columns = [
    {
      title: "#",
      dataIndex: "order",
      key: "order",
      width: 70,
    },
    {
      title: "Slider",
      dataIndex: "displayName",
      key: "displayName",
    },
    {
      title: "Component ID",
      dataIndex: "componentId",
      key: "componentId",
      width: 160,
      render: (value) => <code>{value}</code>,
    },
    {
      title: "Status",
      dataIndex: "enabled",
      key: "enabled",
      width: 120,
      render: (enabled, record) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Switch
            size="small"
            checked={enabled}
            loading={updatingId === record.componentId}
            onChange={(checked) => updateSliderStatus(record, checked)}
          />
          <Tag color={enabled ? "green" : "default"}>
            {enabled ? "Enabled" : "Disabled"}
          </Tag>
        </span>
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
    <ThemeAdminCard title="Sliders">
      <Table
        rowKey="componentId"
        columns={columns}
        dataSource={sliderRows}
        loading={loading}
        pagination={false}
      />
    </ThemeAdminCard>
  );
}
