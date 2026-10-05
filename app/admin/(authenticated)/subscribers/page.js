"use client";

import { useState, useEffect } from "react";
import { Table, Button, Space, Tag, Input, Select, Modal, message } from "antd";
import { DeleteOutlined, SearchOutlined, MailOutlined, ReloadOutlined } from "@ant-design/icons";
import { formatDate } from "@/lib/formatDate";
import { ThemeAdminCard } from "@/styles/Theme";
import AdminExportDropdown from "@/components/admin/AdminExportDropdown";
import { adminTableLoading, adminTableLocale } from "@/components/admin/loading/AdminLoading";
import { resolveAdminStoredFilter } from "@/lib/adminSearchState";

const SUBSCRIBERS_SEARCH_STORAGE_KEY = "admin-subscribers-search-query-v1";
const SUBSCRIBERS_STATUS_STORAGE_KEY = "admin-subscribers-status-filter-v1";

const SUBSCRIBER_EXPORT_COLUMNS = [
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
  { key: "source", label: "Source" },
  { key: "subscribed_at", label: "Subscribed At" },
  { key: "updated_at", label: "Updated At" },
];

export default function AdminSubscribersPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return resolveAdminStoredFilter(SUBSCRIBERS_STATUS_STORAGE_KEY, params.get("status"));
  });
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return resolveAdminStoredFilter(SUBSCRIBERS_SEARCH_STORAGE_KEY, params.get("search"));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (search.trim()) {
      sessionStorage.setItem(SUBSCRIBERS_SEARCH_STORAGE_KEY, search);
      url.searchParams.set("search", search);
    } else {
      sessionStorage.removeItem(SUBSCRIBERS_SEARCH_STORAGE_KEY);
      url.searchParams.delete("search");
    }
    if (statusFilter) {
      sessionStorage.setItem(SUBSCRIBERS_STATUS_STORAGE_KEY, statusFilter);
      url.searchParams.set("status", statusFilter);
    } else {
      sessionStorage.removeItem(SUBSCRIBERS_STATUS_STORAGE_KEY);
      url.searchParams.delete("status");
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [search, statusFilter]);

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
        <Space wrap>
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
          <AdminExportDropdown
            exportUrl="/api/admin/subscribers/export"
            filters={{ search, status: statusFilter }}
            availableColumns={SUBSCRIBER_EXPORT_COLUMNS}
            defaultFilename="subscribers-export"
          />
          <Button icon={<ReloadOutlined />} onClick={() => fetchSubscribers(page, search, statusFilter)}>
            Refresh
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="_id"
        loading={adminTableLoading(loading)}
        locale={adminTableLocale(loading)}
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
