"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Space,
  Input,
  Select,
  Button,
  Row,
  Col,
  Card,
  Statistic,
  message,
  Typography,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  BellOutlined,
  CheckCircleOutlined,
  SendOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import { resolveAdminStoredFilter } from "@/lib/adminSearchState";
import PushNotificationsTable from "./PushNotificationsTable";
import PushNotificationDrawer from "./PushNotificationDrawer";
import PushNotificationDetailsModal from "./PushNotificationDetailsModal";

const PUSH_SEARCH_STORAGE_KEY = "admin-push-search-query-v1";
const PUSH_STATUS_STORAGE_KEY = "admin-push-status-filter-v1";
const PUSH_TYPE_STORAGE_KEY = "admin-push-type-filter-v1";

export default function PushNotificationsModule() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    activeSubscribers: 0,
    totalSubscribers: 0,
    totalSentNotifications: 0,
    deliveryRate: 100,
  });

  // Action states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [detailsItem, setDetailsItem] = useState(null);

  // Filters
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return resolveAdminStoredFilter(PUSH_SEARCH_STORAGE_KEY, params.get("search"));
  });

  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return resolveAdminStoredFilter(PUSH_STATUS_STORAGE_KEY, params.get("status"));
  });

  const [typeFilter, setTypeFilter] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return resolveAdminStoredFilter(PUSH_TYPE_STORAGE_KEY, params.get("type"));
  });

  // Sync filters with sessionStorage and URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);

    if (search.trim()) {
      sessionStorage.setItem(PUSH_SEARCH_STORAGE_KEY, search);
      url.searchParams.set("search", search);
    } else {
      sessionStorage.removeItem(PUSH_SEARCH_STORAGE_KEY);
      url.searchParams.delete("search");
    }

    if (statusFilter) {
      sessionStorage.setItem(PUSH_STATUS_STORAGE_KEY, statusFilter);
      url.searchParams.set("status", statusFilter);
    } else {
      sessionStorage.removeItem(PUSH_STATUS_STORAGE_KEY);
      url.searchParams.delete("status");
    }

    if (typeFilter) {
      sessionStorage.setItem(PUSH_TYPE_STORAGE_KEY, typeFilter);
      url.searchParams.set("type", typeFilter);
    } else {
      sessionStorage.removeItem(PUSH_TYPE_STORAGE_KEY);
      url.searchParams.delete("type");
    }

    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [search, statusFilter, typeFilter]);

  // Fetch metrics overview
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/push-notifications/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Fetch notifications list
  const fetchNotifications = useCallback(
    async (p = page, s = search, st = statusFilter, tp = typeFilter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(pageSize),
        });
        if (s.trim()) params.set("search", s.trim());
        if (st) params.set("status", st);
        if (tp) params.set("type", tp);

        const res = await fetch(`/api/admin/push-notifications?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load notifications");
        const data = await res.json();

        setItems(data.items || []);
        setTotal(data.total || 0);
      } catch (err) {
        message.error(err.message || "Could not fetch push notifications.");
      } finally {
        setLoading(false);
      }
    },
    [page, search, statusFilter, typeFilter, pageSize]
  );

  useEffect(() => {
    fetchNotifications(1, search, statusFilter, typeFilter);
    fetchStats();
    setPage(1);
  }, [search, statusFilter, typeFilter, fetchNotifications, fetchStats]);

  // Handle open create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setDrawerOpen(true);
  };

  // Handle open edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setDrawerOpen(true);
  };

  // Handle clone as draft
  const handleCloneAsDraft = (item) => {
    setEditingItem({
      title: `${item.title} (Copy)`,
      message: item.message,
      type: item.type,
      clickUrl: item.clickUrl,
      imageUrl: item.imageUrl,
    });
    setDrawerOpen(true);
  };

  // Handle submit from Drawer
  const handleSubmitDrawer = async (values) => {
    setSubmitting(true);
    try {
      const isEditing = Boolean(editingItem?._id);
      const url = isEditing
        ? `/api/admin/push-notifications/${editingItem._id}`
        : "/api/admin/push-notifications";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Operation failed.");

      if (values.sendImmediately) {
        message.success("Notification broadcast complete!");
      } else {
        message.success(isEditing ? "Draft updated." : "Notification saved as draft.");
      }

      setDrawerOpen(false);
      fetchNotifications(page, search, statusFilter, typeFilter);
      fetchStats();
    } catch (err) {
      message.error(err.message || "Failed to save notification.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Send Now directly from table
  const handleSendNow = async (item) => {
    setSendingId(item._id);
    try {
      const res = await fetch(`/api/admin/push-notifications/${item._id}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sending failed.");

      message.success("Push notification broadcasted successfully!");
      fetchNotifications(page, search, statusFilter, typeFilter);
      fetchStats();
    } catch (err) {
      message.error(err.message || "Failed to broadcast notification.");
    } finally {
      setSendingId("");
    }
  };

  // Handle Delete Draft
  const handleDeleteDraft = async (item) => {
    setDeletingId(item._id);
    try {
      const res = await fetch(`/api/admin/push-notifications/${item._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed.");

      message.success("Draft notification deleted.");
      fetchNotifications(page, search, statusFilter, typeFilter);
      fetchStats();
    } catch (err) {
      message.error(err.message || "Could not delete notification.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <ThemeAdminCard
      title="Push Notifications"
      extra={
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            data-testid="create-notification-btn"
          >
            Create Notification
          </Button>
        </Space>
      }
    >
      {/* Metric Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card size="small" bordered>
            <Statistic
              title="Active Subscribers"
              value={stats.activeSubscribers}
              prefix={<BellOutlined style={{ color: "#E03C33" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered>
            <Statistic
              title="Broadcasts Sent"
              value={stats.totalSentNotifications}
              prefix={<SendOutlined style={{ color: "#1890ff" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered>
            <Statistic
              title="Total Delivered"
              value={stats.totalDelivered || 0}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered>
            <Statistic
              title="Delivery Rate"
              value={stats.deliveryRate || 100}
              suffix="%"
              prefix={<PercentageOutlined style={{ color: "#fa8c16" }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter and Action Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search notifications..."
            allowClear
            style={{ width: 220 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            placeholder="All Status"
            allowClear
            style={{ width: 140 }}
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || "")}
            options={[
              { value: "draft", label: "Drafts" },
              { value: "sent", label: "Sent" },
              { value: "failed", label: "Failed" },
            ]}
          />

          <Select
            placeholder="All Types"
            allowClear
            style={{ width: 160 }}
            value={typeFilter || undefined}
            onChange={(v) => setTypeFilter(v || "")}
            options={[
              { value: "announcement", label: "Announcement" },
              { value: "event", label: "Event" },
              { value: "campaign", label: "Campaign" },
            ]}
          />

          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchNotifications(page, search, statusFilter, typeFilter);
              fetchStats();
            }}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Main Notifications Table */}
      <PushNotificationsTable
        items={items}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteDraft}
        onSendNow={handleSendNow}
        onViewDetails={(item) => setDetailsItem(item)}
        onCloneAsDraft={handleCloneAsDraft}
        sendingId={sendingId}
        deletingId={deletingId}
      />

      {/* Create / Edit Drawer */}
      <PushNotificationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialValues={editingItem}
        onSubmit={handleSubmitDrawer}
        loading={submitting}
      />

      {/* Details & Delivery Stats Modal */}
      <PushNotificationDetailsModal
        open={Boolean(detailsItem)}
        onClose={() => setDetailsItem(null)}
        notification={detailsItem}
      />
    </ThemeAdminCard>
  );
}
