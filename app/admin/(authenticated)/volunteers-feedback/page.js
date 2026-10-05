"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Descriptions, Input, Modal, Select, Space, Table, Tag, message } from "antd";
import { CheckOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { formatDateTime } from "@/lib/formatDate";
import { ThemeAdminCard } from "@/styles/Theme";
import AdminExportDropdown from "@/components/admin/AdminExportDropdown";
import { adminTableLoading, adminTableLocale } from "@/components/admin/loading/AdminLoading";
import { resolveAdminStoredFilter } from "@/lib/adminSearchState";

const VOLUNTEERS_FEEDBACK_SEARCH_STORAGE_KEY = "admin-volunteers-feedback-search-query-v1";
const VOLUNTEERS_FEEDBACK_STATUS_STORAGE_KEY = "admin-volunteers-feedback-status-filter-v1";
const VOLUNTEERS_FEEDBACK_SOURCE_STORAGE_KEY = "admin-volunteers-feedback-source-filter-v1";

const FEEDBACK_EXPORT_COLUMNS = [
  { key: "submitted_at", label: "Submitted At" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "message", label: "Message" },
  { key: "source", label: "Source" },
  { key: "page", label: "Page" },
  { key: "status", label: "Status" },
];

export default function AdminVolunteersFeedbackPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return resolveAdminStoredFilter(VOLUNTEERS_FEEDBACK_SEARCH_STORAGE_KEY, params.get("search"));
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return resolveAdminStoredFilter(VOLUNTEERS_FEEDBACK_STATUS_STORAGE_KEY, params.get("status"));
  });
  const [sourceFilter, setSourceFilter] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return resolveAdminStoredFilter(VOLUNTEERS_FEEDBACK_SOURCE_STORAGE_KEY, params.get("source"));
  });
  const [sourceOptions, setSourceOptions] = useState([]);
  const [viewItem, setViewItem] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (search.trim()) {
      sessionStorage.setItem(VOLUNTEERS_FEEDBACK_SEARCH_STORAGE_KEY, search);
      url.searchParams.set("search", search);
    } else {
      sessionStorage.removeItem(VOLUNTEERS_FEEDBACK_SEARCH_STORAGE_KEY);
      url.searchParams.delete("search");
    }
    if (statusFilter) {
      sessionStorage.setItem(VOLUNTEERS_FEEDBACK_STATUS_STORAGE_KEY, statusFilter);
      url.searchParams.set("status", statusFilter);
    } else {
      sessionStorage.removeItem(VOLUNTEERS_FEEDBACK_STATUS_STORAGE_KEY);
      url.searchParams.delete("status");
    }
    if (sourceFilter) {
      sessionStorage.setItem(VOLUNTEERS_FEEDBACK_SOURCE_STORAGE_KEY, sourceFilter);
      url.searchParams.set("source", sourceFilter);
    } else {
      sessionStorage.removeItem(VOLUNTEERS_FEEDBACK_SOURCE_STORAGE_KEY);
      url.searchParams.delete("source");
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [search, statusFilter, sourceFilter]);

  const fetchList = (p = page, s = search, st = statusFilter, src = sourceFilter) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (st) params.set("status", st);
    if (src) params.set("source", src);
    if (s) params.set("search", s);

    fetch(`/api/admin/volunteers-feedback?${params.toString()}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load volunteers feedback");
        }
        return data;
      })
      .then((data) => {
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total) || 0);
        setSourceOptions(Array.isArray(data?.sources) ? data.sources : []);
      })
      .catch((err) =>
        message.error(err?.message || "Failed to load volunteers feedback"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList(1, search, statusFilter, sourceFilter);
    setPage(1);
  }, [search, statusFilter, sourceFilter]);

  useEffect(() => {
    const refresh = () => fetchList(page, search, statusFilter, sourceFilter);
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [page, search, statusFilter, sourceFilter]);

  const markRead = async (id) => {
    const res = await fetch(`/api/admin/volunteers-feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    if (!res.ok) {
      message.error("Failed to update status");
      return;
    }
    message.success("Marked as read");
    fetchList(page, search, statusFilter, sourceFilter);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete this feedback?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/volunteers-feedback/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          message.error("Delete failed");
          return;
        }
        message.success("Deleted");
        fetchList(page, search, statusFilter, sourceFilter);
      },
    });
  };

  const sourceSelectOptions = useMemo(
    () => sourceOptions.map((source) => ({ value: source, label: source })),
    [sourceOptions],
  );

  return (
    <ThemeAdminCard
      title="Volunteers Feedback"
      extra={
        <Space wrap>
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 140 }}
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value || "")}
            options={[
              { value: "unread", label: "Unread" },
              { value: "read", label: "Read" },
            ]}
          />
          <Select
            placeholder="Source"
            allowClear
            style={{ width: 200 }}
            value={sourceFilter || undefined}
            onChange={(value) => setSourceFilter(value || "")}
            options={sourceSelectOptions}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search name/email/phone/message"
            allowClear
            style={{ width: 260 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <AdminExportDropdown
            exportUrl="/api/admin/volunteers-feedback/export"
            filters={{ search, status: statusFilter, source: sourceFilter }}
            availableColumns={FEEDBACK_EXPORT_COLUMNS}
            defaultFilename="volunteers-feedback-export"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchList(page, search, statusFilter, sourceFilter)}
          >
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
          onChange: (p) => {
            setPage(p);
            fetchList(p, search, statusFilter, sourceFilter);
          },
          showTotal: (t) => `${t} feedback submissions`,
        }}
        columns={[
          {
            title: "Name",
            dataIndex: ["payload", "name"],
            key: "name",
            width: 180,
          },
          {
            title: "Email",
            dataIndex: ["payload", "email"],
            key: "email",
            width: 220,
          },
          {
            title: "Phone",
            dataIndex: ["payload", "phone"],
            key: "phone",
            width: 150,
          },
          {
            title: "Message",
            dataIndex: ["payload", "message"],
            key: "message",
            ellipsis: true,
          },
          {
            title: "Source",
            dataIndex: "source",
            key: "source",
            width: 170,
            render: (value) => value || "-",
          },
          {
            title: "Status",
            dataIndex: "isRead",
            key: "isRead",
            width: 120,
            render: (read, record) =>
              read ? (
                <Tag color="green">Read</Tag>
              ) : (
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => markRead(record._id)}
                >
                  Mark read
                </Button>
              ),
          },
          {
            title: "Submitted",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 170,
            render: (dateValue) => formatDateTime(dateValue),
          },
          {
            title: "Actions",
            key: "actions",
            width: 95,
            render: (_, record) => (
              <Space>
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setViewItem(record);
                    if (!record.isRead) markRead(record._id);
                  }}
                />
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record._id)}
                />
              </Space>
            ),
          },
        ]}
      />

      <Modal
        open={!!viewItem}
        onCancel={() => setViewItem(null)}
        footer={null}
        title="Volunteers Feedback Details"
        width={700}
      >
        {viewItem ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Name">
              {viewItem.payload?.name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {viewItem.payload?.email || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {viewItem.payload?.phone || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Message">
              {viewItem.payload?.message || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Page">
              {viewItem.page || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Source">
              {viewItem.source || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {viewItem.isRead ? "Read" : "Unread"}
            </Descriptions.Item>
            <Descriptions.Item label="Submitted">
              {formatDateTime(viewItem.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </ThemeAdminCard>
  );
}
