"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
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
  CheckCircleOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { formatDateTime } from "@/lib/formatDate";
import { ThemeAdminCard } from "@/styles/Theme";
import AdminExportDropdown from "@/components/admin/AdminExportDropdown";
import { adminTableLoading, adminTableLocale } from "@/components/admin/loading/AdminLoading";
import { resolveAdminStoredFilter } from "@/lib/adminSearchState";
import { ATTENDANCE_OPTIONS, getAttendanceLabel } from "@/lib/events/rsvp";

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

const ATTENDANCE_COLORS = {
  yes: "green",
  maybe: "gold",
  no: "default",
};

const EVENT_REG_SEARCH_STORAGE_KEY = "admin-event-reg-search-query-v1";
const EVENT_REG_STATUS_STORAGE_KEY = "admin-event-reg-status-filter-v1";
const EVENT_REG_EVENT_STORAGE_KEY = "admin-event-reg-event-filter-v2";
const EVENT_REG_REPLY_STORAGE_KEY = "admin-event-reg-reply-filter-v1";
const LIST_PAGE_SIZE = 100;

const EVENT_REG_EXPORT_COLUMNS = [
  { key: "submitted_at", label: "Submitted At" },
  { key: "event_title", label: "Event Title" },
  { key: "event_date", label: "Event Date" },
  { key: "name", label: "Applicant Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "school", label: "School / Institution" },
  { key: "class_or_year", label: "Class / Year" },
  { key: "message", label: "Message" },
  { key: "attendance", label: "Reply" },
  { key: "status", label: "Status" },
  { key: "read_status", label: "Read Status" },
  { key: "page", label: "Page" },
  { key: "source", label: "Source" },
];

// Events can share a title (a function held every year), so the filter uses the
// event's id. Rows from before ids were stored fall back to their title.
const getEventKey = (row) => row.eventId || row.eventTitle;

export default function AdminEventRegistrationsPage() {
  const [list, setList] = useState([]);
  const [rsvpSummary, setRsvpSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return resolveAdminStoredFilter(EVENT_REG_STATUS_STORAGE_KEY, params.get("status")) || null;
  });
  const [eventFilter, setEventFilter] = useState(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return resolveAdminStoredFilter(EVENT_REG_EVENT_STORAGE_KEY, params.get("event")) || null;
  });
  const [replyFilter, setReplyFilter] = useState(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return resolveAdminStoredFilter(EVENT_REG_REPLY_STORAGE_KEY, params.get("reply")) || null;
  });
  const [searchText, setSearchText] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return resolveAdminStoredFilter(EVENT_REG_SEARCH_STORAGE_KEY, params.get("search"));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (searchText.trim()) {
      sessionStorage.setItem(EVENT_REG_SEARCH_STORAGE_KEY, searchText);
      url.searchParams.set("search", searchText);
    } else {
      sessionStorage.removeItem(EVENT_REG_SEARCH_STORAGE_KEY);
      url.searchParams.delete("search");
    }
    if (statusFilter) {
      sessionStorage.setItem(EVENT_REG_STATUS_STORAGE_KEY, statusFilter);
      url.searchParams.set("status", statusFilter);
    } else {
      sessionStorage.removeItem(EVENT_REG_STATUS_STORAGE_KEY);
      url.searchParams.delete("status");
    }
    if (eventFilter) {
      sessionStorage.setItem(EVENT_REG_EVENT_STORAGE_KEY, eventFilter);
      url.searchParams.set("event", eventFilter);
    } else {
      sessionStorage.removeItem(EVENT_REG_EVENT_STORAGE_KEY);
      url.searchParams.delete("event");
    }
    if (replyFilter) {
      sessionStorage.setItem(EVENT_REG_REPLY_STORAGE_KEY, replyFilter);
      url.searchParams.set("reply", replyFilter);
    } else {
      sessionStorage.removeItem(EVENT_REG_REPLY_STORAGE_KEY);
      url.searchParams.delete("reply");
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [searchText, statusFilter, eventFilter, replyFilter]);

  // Filtering happens in this page, so it needs every row, not just the first page.
  const fetchList = async () => {
    setLoading(true);
    try {
      const rows = [];
      let totalPages = 1;
      for (let page = 1; page <= totalPages; page += 1) {
        const res = await fetch(
          `/api/admin/event-registrations?limit=${LIST_PAGE_SIZE}&page=${page}`,
        );
        if (!res.ok) throw new Error("load");
        const data = await res.json();
        rows.push(...(data.items || []));
        totalPages = data.totalPages || 1;
      }
      setList(rows);

      const summaryRes = await fetch("/api/admin/event-registrations/summary");
      const summary = summaryRes.ok ? await summaryRes.json() : { items: [] };
      setRsvpSummary(summary.items || []);
    } catch {
      message.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const eventOptions = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const r of list) {
      const key = getEventKey(r);
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push({
          value: key,
          label: r.eventDate ? `${r.eventTitle} · ${r.eventDate}` : r.eventTitle,
        });
      }
    }
    return out;
  }, [list]);

  const filtered = useMemo(() => {
    let result = list;
    if (statusFilter) result = result.filter((r) => r.status === statusFilter);
    if (eventFilter)
      result = result.filter((r) => getEventKey(r) === eventFilter);
    if (replyFilter) result = result.filter((r) => r.attendance === replyFilter);
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
  }, [list, statusFilter, eventFilter, replyFilter, searchText]);

  // All events by default, or the event chosen in the filter. One fixed row of
  // cards, so the page looks the same however many events have replies.
  const rsvpTotals = useMemo(() => {
    const items = eventFilter
      ? rsvpSummary.filter((item) => item.eventId === eventFilter)
      : rsvpSummary;
    if (!items.length) return null;
    const total = (key) => items.reduce((sum, item) => sum + item[key], 0);
    return {
      yes: total("yes"),
      maybe: total("maybe"),
      no: total("no"),
      seatsTaken: total("seatsTaken"),
      capacity: items.length === 1 ? items[0].capacity : null,
    };
  }, [rsvpSummary, eventFilter]);

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
      title="Registered Applicants"
      extra={
        <Space wrap>
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
            placeholder="Reply"
            allowClear
            style={{ width: 120 }}
            value={replyFilter}
            onChange={setReplyFilter}
            options={ATTENDANCE_OPTIONS}
          />
          <Select
            placeholder="Event"
            allowClear
            style={{ width: 260 }}
            value={eventFilter}
            onChange={setEventFilter}
            options={eventOptions}
          />
          <AdminExportDropdown
            exportUrl="/api/admin/event-registrations/export"
            filters={{ search: searchText, status: statusFilter, event: eventFilter, attendance: replyFilter }}
            availableColumns={EVENT_REG_EXPORT_COLUMNS}
            defaultFilename="event-registrations-export"
          />
          <Button icon={<ReloadOutlined />} onClick={fetchList}>
            Refresh
          </Button>
        </Space>
      }
    >
      {rsvpTotals ? (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }} data-testid="rsvp-summary">
          <Col xs={12} sm={6}>
            <Card size="small" bordered>
              <Statistic
                title="Yes"
                value={rsvpTotals.yes}
                prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" bordered>
              <Statistic
                title="Maybe"
                value={rsvpTotals.maybe}
                prefix={<QuestionCircleOutlined style={{ color: "#faad14" }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" bordered>
              <Statistic
                title="No"
                value={rsvpTotals.no}
                prefix={<CloseCircleOutlined style={{ color: "#8c8c8c" }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" bordered>
              <Statistic
                title="Seats taken"
                value={rsvpTotals.seatsTaken}
                suffix={rsvpTotals.capacity ? `/ ${rsvpTotals.capacity}` : undefined}
                prefix={<TeamOutlined style={{ color: "#E03C33" }} />}
              />
            </Card>
          </Col>
        </Row>
      ) : null}

      <Table
        rowKey="_id"
        loading={adminTableLoading(loading)}
        locale={adminTableLocale(loading)}
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
            title: "Reply",
            dataIndex: "attendance",
            key: "attendance",
            width: 90,
            render: (value) =>
              value ? (
                <Tag color={ATTENDANCE_COLORS[value]}>{getAttendanceLabel(value)}</Tag>
              ) : (
                "—"
              ),
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
            <Descriptions.Item label="Reply">
              {getAttendanceLabel(viewItem.attendance) || "—"}
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
