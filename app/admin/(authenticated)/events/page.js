"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, Button, Space, message, Modal, Input, Select, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";

export default function AdminEventsPage() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(null);
  const [searchText, setSearchText] = useState("");

  const fetchEvents = async () => {
    const res = await fetch("/api/admin/events");
    if (res.ok) {
      const data = await res.json();
      setList(Array.isArray(data) ? data : data.items || []);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchEvents().finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = list;
    if (filterStatus) result = result.filter((e) => e.status === filterStatus);
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.slug?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [list, filterStatus, searchText]);

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Delete event?",
      content: `Delete "${record.title}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/events/${record._id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          message.error(data.error || "Delete failed");
          return;
        }
        message.success("Event deleted");
        fetchEvents();
      },
    });
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (t) => t || "-",
    },
    {
      title: "Start date",
      dataIndex: "startDate",
      key: "startDate",
      render: (d) => (d ? new Date(d).toLocaleDateString() : "-"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => (
        <Tag color={s === "published" ? "green" : "default"}>{s}</Tag>
      ),
    },
    {
      title: "Featured",
      dataIndex: "featured",
      key: "featured",
      render: (featured) => (
        <Tag color={featured === true ? "gold" : "default"}>
          {featured === true ? "Featured" : "No"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/events/${record._id}`)}
          >
            Edit
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <ThemeAdminCard
      title="Events"
      extra={
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search title or slug"
            allowClear
            style={{ width: 220 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 120 }}
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
            ]}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/admin/events/new")}
          >
            Add event
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filtered}
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </ThemeAdminCard>
  );
}
