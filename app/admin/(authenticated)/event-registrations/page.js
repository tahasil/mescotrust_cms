"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Descriptions,
  Select,
  Input,
  message,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { formatDateTime } from "@/lib/formatDate";
import { ThemeAdminCard } from "@/styles/Theme";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS = {
  new: "blue",
  confirmed: "green",
  waitlisted: "gold",
  cancelled: "default",
};

export default function AdminEventRegistrationsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [eventFilter, setEventFilter] = useState(null);
  const [searchText, setSearchText] = useState("");

  const fetchList = () => {
    setLoading(true);
    fetch("/api/admin/event-registrations?limit=100")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setList(Array.isArray(data) ? data : data.items || []))
      .catch(() => message.error("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const eventOptions = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const r of list) {
      if (r.eventTitle && !seen.has(r.eventTitle)) {
        seen.add(r.eventTitle);
        out.push({ value: r.eventTitle, label: r.eventTitle });
      }
    }
    return out;
  }, [list]);

  const filtered = useMemo(() => {
    let result = list;
    if (statusFilter) result = result.filter((r) => r.status === statusFilter);
    if (eventFilter) result = result.filter((r) => r.eventTitle === eventFilter);
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.payload?.name?.toLowerCase().includes(q) ||
          r.payload?.email?.toLowerCase().includes(q) ||
          r.eventTitle?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [list, statusFilter, eventFilter, searchText]);

  const markRead = async (id) => {
    const res = await fetch(`/api/admin/event-registrations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    if (!res.ok) return message.error("Failed");
    message.success("Marked as read");
    fetchList();
  };

  const updateStatus = async (id, nextStatus) => {
    const res = await fetch(`/api/admin/event-registrations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return message.error(data.error || "Failed to update status");
    }
    message.success("Status updated");
    fetchList();
    if (viewItem && viewItem._id === id) {
      setViewItem({ ...viewItem, status: nextStatus });
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete this registration?",
      content: "This cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`/api/admin/event-registrations/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          message.success("Deleted");
          fetchList();
        } else {
          message.error("Delete failed");
        }
      },
    });
  };

  return (
    <ThemeAdminCard
      title="Event registrations"
      extra={
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search name, email, event"
            allowClear
            style={{ width: 240 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
          />
          <Select
            placeholder="Event"
            allowClear
            style={{ width: 220 }}
            value={eventFilter}
            onChange={setEventFilter}
            options={eventOptions}
          />
        </Space>
      }
    >
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={filtered}
        pagination={{ pageSize: 20 }}
        columns={[
          {
            title: "Event",
            dataIndex: "eventTitle",
            key: "eventTitle",
            render: (t, r) => (
              <span>
                <strong>{t}</strong>
                {r.eventDate ? (
                  <span style={{ color: "#999" }}> &middot; {r.eventDate}</span>
                ) : null}
              </span>
            ),
          },
          {
            title: "Applicant",
            key: "applicant",
            render: (_, r) => (
              <span>
                {r.payload?.name || "—"}
                <br />
                <span style={{ fontSize: 12, color: "#999" }}>
                  {r.payload?.email || ""}
                </span>
              </span>
            ),
          },
          {
            title: "Phone",
            dataIndex: ["payload", "phone"],
            key: "phone",
            width: 130,
            render: (p) => p || "—",
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 140,
            render: (s, record) => (
              <Select
                value={s}
                size="small"
                style={{ width: 120 }}
                options={STATUS_OPTIONS}
                onChange={(v) => updateStatus(record._id, v)}
              />
            ),
          },
          {
            title: "Read",
            dataIndex: "isRead",
            key: "isRead",
            width: 110,
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
            width: 160,
            render: (d) => formatDateTime(d),
          },
          {
            title: "Actions",
            key: "actions",
            width: 100,
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
        title="Registration details"
        width={640}
      >
        {viewItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Event">
              <strong>{viewItem.eventTitle}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Event date">
              {viewItem.eventDate || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLORS[viewItem.status] || "default"}>
                {viewItem.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              {viewItem.payload?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {viewItem.payload?.email}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {viewItem.payload?.phone || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="School / Institution">
              {viewItem.payload?.school || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Class / Year">
              {viewItem.payload?.classOrYear || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Message">
              {viewItem.payload?.message || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Submitted from page">
              {viewItem.page || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Source">
              {viewItem.source || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Submitted at">
              {formatDateTime(viewItem.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </ThemeAdminCard>
  );
}
