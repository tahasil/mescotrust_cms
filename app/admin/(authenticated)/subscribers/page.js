"use client";

import { useState, useEffect } from "react";
import { Table, Button, Space, Tag, Input, Select, Modal, message } from "antd";
import { DeleteOutlined, SearchOutlined, MailOutlined } from "@ant-design/icons";
import { formatDate } from "@/lib/formatDate";
import { ThemeAdminCard } from "@/styles/Theme";

export default function AdminSubscribersPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchSubscribers = (p = page, s = search, st = statusFilter) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: 20 });
    if (st) params.set("status", st);
    if (s) params.set("search", s);
    fetch(`/api/admin/subscribers?${params}`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => message.error("Failed to load subscribers"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubscribers(1, search, statusFilter);
    setPage(1);
  }, [statusFilter, search]);

  const handleDelete = (id, email) => {
    Modal.confirm({
      title: "Delete subscriber?",
      content: `Remove "${email}" from subscribers?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/subscribers?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          message.success("Subscriber deleted");
          fetchSubscribers(page, search, statusFilter);
        } else {
          message.error("Delete failed");
        }
      },
    });
  };

  return (
    <ThemeAdminCard
      title="Subscribers"
      extra={
        <Space>
          <Select
            placeholder="All status"
            allowClear
            style={{ width: 140 }}
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || "")}
            options={[
              { value: "active", label: "Active" },
              { value: "unsubscribed", label: "Unsubscribed" },
            ]}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search email..."
            allowClear
            style={{ width: 220 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Space>
      }
    >
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={items}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: (p) => { setPage(p); fetchSubscribers(p, search, statusFilter); },
          showTotal: (t) => `${t} subscribers`,
        }}
        columns={[
          {
            title: "Email",
            dataIndex: "email",
            key: "email",
            render: (email) => (
              <Space>
                <MailOutlined style={{ color: "#1677ff" }} />
                <a href={`mailto:${email}`}>{email}</a>
              </Space>
            ),
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (s) => (
              <Tag color={s === "active" ? "green" : "default"}>
                {s === "active" ? "Active" : "Unsubscribed"}
              </Tag>
            ),
          },
          {
            title: "Source",
            dataIndex: "source",
            key: "source",
            width: 140,
          },
          {
            title: "Subscribed",
            dataIndex: "createdAt",
            key: "date",
            width: 140,
            render: (d) => formatDate(d),
          },
          {
            title: "",
            key: "actions",
            width: 60,
            render: (_, record) => (
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record._id, record.email)}
              />
            ),
          },
        ]}
      />
    </ThemeAdminCard>
  );
}
