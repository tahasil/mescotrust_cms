"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SaveOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";

function safeString(value) {
  return value == null ? "" : String(value).trim();
}

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN");
}

function boolFromAny(value, fallback = false) {
  if (value === true || value === false) return value;
  const raw = safeString(value).toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return fallback;
}

function statusTag(status) {
  const value = safeString(status).toLowerCase();
  if (value === "approved") return <Tag color="green">Approved</Tag>;
  if (value === "rejected") return <Tag color="red">Rejected</Tag>;
  if (value === "failed") return <Tag color="red">Failed</Tag>;
  if (value === "success") return <Tag color="green">Success</Tag>;
  if (value === "partial") return <Tag color="orange">Partial</Tag>;
  return <Tag color="gold">Pending</Tag>;
}

const SETTINGS_LAYOUT_OPTIONS = [
  { label: "Grid", value: "grid" },
];
const SETTINGS_SORT_OPTIONS = [
  { label: "Latest", value: "latest" },
  { label: "Platform Priority", value: "platform-priority" },
  { label: "Engagement", value: "engagement" },
];
const SETTINGS_ORDER_OPTIONS = [
  { label: "Descending", value: "desc" },
  { label: "Ascending", value: "asc" },
];
const CARD_STYLE_OPTIONS = [
  { label: "Clean", value: "clean" },
  { label: "Outlined", value: "outlined" },
  { label: "Elevated", value: "elevated" },
];

export default function SocialWallAdminPage() {
  const [settingsForm] = Form.useForm();
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [platformsLoading, setPlatformsLoading] = useState(true);
  const [platformsSaving, setPlatformsSaving] = useState(false);
  const [platformRows, setPlatformRows] = useState([]);
  const [supportedPlatforms, setSupportedPlatforms] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncPlatforms, setSyncPlatforms] = useState([]);
  const [syncResult, setSyncResult] = useState(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsData, setPostsData] = useState({ page: 1, limit: 20, total: 0, items: [] });
  const [postFilters, setPostFilters] = useState({
    platform: "",
    status: "",
    featured: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationData, setModerationData] = useState({ page: 1, limit: 20, total: 0, items: [] });
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsData, setLogsData] = useState({ page: 1, limit: 20, total: 0, items: [] });
  const [logsKind, setLogsKind] = useState("sync");
  const [clearLogsBusy, setClearLogsBusy] = useState(false);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/social-wall/settings", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load settings");
      settingsForm.setFieldsValue({
        moduleEnabled: data?.moduleEnabled !== false,
        defaultLayout: data?.defaultLayout || "grid",
        defaultPostLimit: Number(data?.defaultPostLimit || 12),
        defaultSortBy: data?.defaultSortBy || "latest",
        defaultSortOrder: data?.defaultSortOrder || "desc",
        filtersEnabled: data?.filtersEnabled !== false,
        moderationMode: data?.moderationMode || "manual",
        cardStylePreset: data?.cardStylePreset || "clean",
      });
    } catch (err) {
      message.error(err?.message || "Failed to load settings");
    } finally {
      setSettingsLoading(false);
    }
  }, [settingsForm]);

  const loadPlatforms = useCallback(async () => {
    setPlatformsLoading(true);
    try {
      const res = await fetch("/api/admin/social-wall/platforms", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load platform config");
      setSupportedPlatforms(Array.isArray(data?.supportedPlatforms) ? data.supportedPlatforms : []);
      setPlatformRows(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      message.error(err?.message || "Failed to load platform config");
    } finally {
      setPlatformsLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const res = await fetch("/api/admin/social-wall/dashboard", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load dashboard");
      setDashboardData(data);
    } catch (err) {
      message.error(err?.message || "Failed to load dashboard");
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const loadPosts = useCallback(
    async (page = 1, limit = postsData.limit || 20, filters = postFilters) => {
      setPostsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (filters?.platform) params.set("platform", filters.platform);
        if (filters?.status) params.set("status", filters.status);
        if (filters?.featured !== "") params.set("featured", String(filters.featured));
        if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters?.dateTo) params.set("dateTo", filters.dateTo);
        if (filters?.search) params.set("search", filters.search);
        const res = await fetch(`/api/admin/social-wall/posts?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load posts");
        setPostsData({
          page: data?.page || page,
          limit: data?.limit || limit,
          total: data?.total || 0,
          items: Array.isArray(data?.items) ? data.items : [],
        });
      } catch (err) {
        message.error(err?.message || "Failed to load posts");
      } finally {
        setPostsLoading(false);
      }
    },
    [postFilters, postsData.limit],
  );

  const loadModeration = useCallback(async (page = 1, limit = moderationData.limit || 20) => {
    setModerationLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: "pending",
      });
      const res = await fetch(`/api/admin/social-wall/posts?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load moderation queue");
      setModerationData({
        page: data?.page || page,
        limit: data?.limit || limit,
        total: data?.total || 0,
        items: Array.isArray(data?.items) ? data.items : [],
      });
    } catch (err) {
      message.error(err?.message || "Failed to load moderation queue");
    } finally {
      setModerationLoading(false);
    }
  }, [moderationData.limit]);

  const loadLogs = useCallback(async (page = 1, limit = logsData.limit || 20, kind = logsKind) => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (safeString(kind)) params.set("kind", safeString(kind));
      const res = await fetch(`/api/admin/social-wall/logs?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load logs");
      setLogsData({
        page: data?.page || page,
        limit: data?.limit || limit,
        total: data?.total || 0,
        items: Array.isArray(data?.items) ? data.items : [],
      });
    } catch (err) {
      message.error(err?.message || "Failed to load logs");
    } finally {
      setLogsLoading(false);
    }
  }, [logsData.limit, logsKind]);

  useEffect(() => {
    loadSettings();
    loadPlatforms();
    loadDashboard();
    loadPosts(1, 20);
    loadModeration(1, 20);
    loadLogs(1, 20, logsKind);
  }, [loadDashboard, loadLogs, loadModeration, loadPlatforms, loadPosts, loadSettings, logsKind]);

  const platformOptions = useMemo(
    () =>
      (supportedPlatforms.length > 0 ? supportedPlatforms : platformRows).map((item) => ({
        label: item?.label || item?.platform || "",
        value: item?.platform || "",
      })),
    [platformRows, supportedPlatforms],
  );

  const updatePlatformField = useCallback((platform, key, value) => {
    setPlatformRows((prev) =>
      prev.map((row) => (row.platform === platform ? { ...row, [key]: value } : row)),
    );
  }, []);

  const saveSettings = async () => {
    try {
      const values = await settingsForm.validateFields();
      setSettingsSaving(true);
      const res = await fetch("/api/admin/social-wall/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save settings");
      message.success("Social Wall settings saved");
      await loadSettings();
      await loadDashboard();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.message || "Failed to save settings");
    } finally {
      setSettingsSaving(false);
    }
  };

  const savePlatforms = async () => {
    setPlatformsSaving(true);
    try {
      const payload = platformRows.map((row) => ({
        platform: row.platform,
        mode: row.mode,
        active: row.active !== false,
        displayOrder: Number(row.displayOrder || 1),
        postLimit: Number(row.postLimit || 12),
        fetchIntervalMinutes: Number(row.fetchIntervalMinutes || 30),
        accessToken: safeString(row.accessToken),
        refreshToken: safeString(row.refreshToken),
        accountId: safeString(row.accountId),
        apiKey: safeString(row.apiKey),
      }));
      const res = await fetch("/api/admin/social-wall/platforms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save platform config");
      message.success("Platform configuration saved");
      setPlatformRows(Array.isArray(data?.items) ? data.items : []);
      await loadDashboard();
    } catch (err) {
      message.error(err?.message || "Failed to save platform config");
    } finally {
      setPlatformsSaving(false);
    }
  };

  const runSync = async (triggerMode = "manual") => {
    setSyncBusy(true);
    try {
      const endpoint =
        triggerMode === "manual"
          ? "/api/admin/social-wall/sync"
          : "/api/admin/social-wall/jobs";
      const body =
        triggerMode === "manual"
          ? { platforms: syncPlatforms }
          : { action: "scheduled-sync", platforms: syncPlatforms };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 429) {
        throw new Error(data?.error || "Sync failed");
      }
      setSyncResult(data || null);
      if (res.status === 429) {
        message.warning(
          `Sync cooldown active. Retry in ${Number(data?.retryAfterSeconds || 0)} seconds.`,
        );
      } else {
        message.success("Sync completed");
      }
      await Promise.all([loadDashboard(), loadPosts(), loadModeration(), loadLogs(), loadPlatforms()]);
    } catch (err) {
      message.error(err?.message || "Sync failed");
    } finally {
      setSyncBusy(false);
    }
  };

  const runLogCleanup = async () => {
    setSyncBusy(true);
    try {
      const res = await fetch("/api/admin/social-wall/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cleanup-logs", olderThanDays: 45 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Cleanup failed");
      message.success(`Old logs cleaned: ${Number(data?.deletedCount || 0)} removed`);
      await loadLogs();
    } catch (err) {
      message.error(err?.message || "Cleanup failed");
    } finally {
      setSyncBusy(false);
    }
  };

  const runClearLogs = async () => {
    setClearLogsBusy(true);
    try {
      const res = await fetch("/api/admin/social-wall/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clear-logs",
          kind: logsKind === "config" ? "config" : "sync",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to clear logs");

      const removed = Number(data?.deletedCount || 0);
      message.success(`${removed} log entries removed`);
      await Promise.all([
        loadLogs(1, logsData.limit, logsKind),
        loadDashboard(),
      ]);
    } catch (err) {
      message.error(err?.message || "Failed to clear logs");
    } finally {
      setClearLogsBusy(false);
    }
  };

  const runTokenRefresh = async () => {
    setSyncBusy(true);
    try {
      const res = await fetch("/api/admin/social-wall/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refresh-tokens",
          platforms: syncPlatforms,
          force: false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Token refresh failed");
      setSyncResult(data || null);
      message.success("Token refresh job completed");
      await Promise.all([loadPlatforms(), loadDashboard(), loadLogs(1, logsData.limit, logsKind)]);
    } catch (err) {
      message.error(err?.message || "Token refresh failed");
    } finally {
      setSyncBusy(false);
    }
  };

  const patchStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/admin/social-wall/posts/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update status");
      message.success("Status updated");
      await Promise.all([loadPosts(), loadModeration(), loadDashboard()]);
    } catch (err) {
      message.error(err?.message || "Failed to update status");
    }
  };

  const patchFeature = async (id, featured) => {
    try {
      const res = await fetch(`/api/admin/social-wall/posts/${encodeURIComponent(id)}/feature`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update feature state");
      await Promise.all([loadPosts(), loadModeration(), loadDashboard()]);
    } catch (err) {
      message.error(err?.message || "Failed to update feature state");
    }
  };

  const postColumns = [
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      width: 120,
      render: (value) => safeString(value || "-"),
    },
    {
      title: "Thumbnail",
      dataIndex: "thumbnailUrl",
      key: "thumbnailUrl",
      width: 110,
      render: (_, row) =>
        row?.thumbnailUrl || row?.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.thumbnailUrl || row.mediaUrl}
            alt={safeString(row?.caption || row?.platform || "Post")}
            style={{
              width: 72,
              height: 52,
              objectFit: "cover",
              borderRadius: 6,
              border: "1px solid rgba(15,23,42,0.12)",
            }}
          />
        ) : (
          "-"
        ),
    },
    {
      title: "Caption",
      dataIndex: "caption",
      key: "caption",
      render: (value) => (
        <span title={safeString(value)}>{safeString(value).slice(0, 110) || "-"}</span>
      ),
    },
    {
      title: "Published",
      dataIndex: "publishedAt",
      key: "publishedAt",
      width: 180,
      render: (value) => fmtDate(value),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (value) => statusTag(value),
    },
    {
      title: "Featured",
      dataIndex: "featured",
      key: "featured",
      width: 100,
      render: (_, record) => (
        <Switch
          checked={record?.featured === true}
          onChange={(checked) => patchFeature(record.id, checked)}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <Space size={6}>
          <Button size="small" onClick={() => patchStatus(record.id, "approved")}>
            Approve
          </Button>
          <Button size="small" danger onClick={() => patchStatus(record.id, "rejected")}>
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const moderationColumns = [
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      width: 120,
    },
    {
      title: "Caption",
      dataIndex: "caption",
      key: "caption",
      render: (value) => (
        <span title={safeString(value)}>{safeString(value).slice(0, 120) || "-"}</span>
      ),
    },
    {
      title: "Published",
      dataIndex: "publishedAt",
      key: "publishedAt",
      width: 180,
      render: (value) => fmtDate(value),
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => patchStatus(record.id, "approved")}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => patchStatus(record.id, "rejected")}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const logsColumns = [
    {
      title: "Platform/Entity",
      dataIndex: "platform",
      key: "platform",
      width: 160,
      render: (_, row) => safeString(row?.platform || row?.entityKey || "-"),
    },
    {
      title: "Trigger/Action",
      dataIndex: "trigger",
      key: "trigger",
      width: 140,
      render: (_, row) => safeString(row?.trigger || row?.action || "-"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (value) => (value ? statusTag(value) : <Tag color="blue">Audit</Tag>),
    },
    {
      title: "Started",
      dataIndex: "startedAt",
      key: "startedAt",
      width: 180,
      render: (_, row) => fmtDate(row?.startedAt || row?.createdAt),
    },
    {
      title: "Duration",
      dataIndex: "durationMs",
      key: "durationMs",
      width: 100,
      render: (value) => `${Number(value || 0)} ms`,
    },
    {
      title: "Fetched/New/Updated",
      key: "stats",
      width: 180,
      render: (_, row) =>
        row?.status
          ? `${Number(row?.fetchedCount || 0)} / ${Number(row?.newCount || 0)} / ${Number(row?.updatedCount || 0)}`
          : "-",
    },
    {
      title: "Error/Details",
      key: "error",
      render: (_, row) =>
        row?.errorMessage
          ? safeString(row.errorMessage)
          : row?.payload
            ? JSON.stringify(row.payload)
            : "-",
    },
  ];

  const tabs = [
    {
      key: "dashboard",
      label: "Dashboard",
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card loading={dashboardLoading} title="Posts">
              <div>Total: {Number(dashboardData?.stats?.totalPosts || 0)}</div>
              <div>Approved: {Number(dashboardData?.stats?.approvedPosts || 0)}</div>
              <div>Pending: {Number(dashboardData?.stats?.pendingPosts || 0)}</div>
              <div>Rejected: {Number(dashboardData?.stats?.rejectedPosts || 0)}</div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card loading={dashboardLoading} title="Platforms">
              <div>Active: {Number(dashboardData?.stats?.activePlatforms || 0)}</div>
              <div>Live: {Number(dashboardData?.stats?.livePlatforms || 0)}</div>
              <div>Featured Posts: {Number(dashboardData?.stats?.featuredPosts || 0)}</div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card loading={dashboardLoading} title="Actions">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button
                  type="primary"
                  icon={<SyncOutlined />}
                  loading={syncBusy}
                  onClick={() => runSync("manual")}
                >
                  Run Manual Sync
                </Button>
                <Button icon={<ReloadOutlined />} onClick={loadDashboard}>
                  Refresh Dashboard
                </Button>
                <Link href="/admin/pages">
                  <Button>Go To Pages</Button>
                </Link>
              </Space>
            </Card>
          </Col>
          {Array.isArray(dashboardData?.cooldownPlatforms) &&
          dashboardData.cooldownPlatforms.length > 0 ? (
            <Col xs={24}>
              <Alert
                type="warning"
                showIcon
                message="Sync cooldown active"
                description={dashboardData.cooldownPlatforms
                  .map(
                    (row) =>
                      `${row.platform}: retry in ${Number(row.retryAfterSeconds || 0)} seconds`,
                  )
                  .join(" | ")}
              />
            </Col>
          ) : null}
        </Row>
      ),
    },
    {
      key: "settings",
      label: "Settings",
      children: (
        <ThemeAdminCard
          loading={settingsLoading}
          title="Social Wall Settings"
          extra={
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={settingsSaving}
              onClick={saveSettings}
            >
              Save Settings
            </Button>
          }
        >
          <Form form={settingsForm} layout="vertical">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Form.Item name="moduleEnabled" label="Module enabled" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="filtersEnabled" label="Filters enabled" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="defaultPostLimit" label="Default post limit">
                  <InputNumber min={1} max={60} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="defaultLayout" label="Default layout">
                  <Select options={SETTINGS_LAYOUT_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="defaultSortBy" label="Default sort by">
                  <Select options={SETTINGS_SORT_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="defaultSortOrder" label="Default sort order">
                  <Select options={SETTINGS_ORDER_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="moderationMode" label="Moderation mode">
                  <Select
                    options={[
                      { label: "Manual Approval", value: "manual" },
                      { label: "Auto Publish", value: "auto" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="cardStylePreset" label="Card style preset">
                  <Select options={CARD_STYLE_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </ThemeAdminCard>
      ),
    },
    {
      key: "platforms",
      label: "Platforms",
      children: (
        <ThemeAdminCard
          loading={platformsLoading}
          title="Platform Configuration"
          extra={
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={platformsSaving}
              onClick={savePlatforms}
            >
              Save Platforms
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            {platformRows.map((row) => {
              const platformKey = safeString(row.platform).toLowerCase();
              const accessTokenLabel =
                platformKey === "facebook"
                  ? "PAGE_ACCESS_TOKEN"
                  : platformKey === "twitter"
                    ? "BEARER_TOKEN"
                    : "ACCESS_TOKEN";
              const accountIdLabel =
                platformKey === "facebook"
                  ? "PAGE_ID (not App ID)"
                  : platformKey === "youtube"
                    ? "CHANNEL_ID"
                    : platformKey === "instagram" || platformKey === "twitter"
                      ? "USER_ID"
                      : "ACCOUNT_ID";
              const apiKeyLabel =
                platformKey === "youtube" ? "YOUTUBE_API_KEY" : "API_KEY (not used)";
              const apiKeyEditable = platformKey === "youtube";
              const showFacebookAccountHint =
                platformKey === "facebook" &&
                safeString(row.lastSyncError).toUpperCase().includes("FACEBOOK_API_400");

              return (
              <Card
                key={row.platform}
                size="small"
                title={row.label || row.platform}
              >
                <Row gutter={[12, 12]}>
                  <Col xs={24} md={3}>
                    <div style={{ marginBottom: 6 }}>Active</div>
                    <Switch
                      checked={row.active !== false}
                      onChange={(value) => updatePlatformField(row.platform, "active", value)}
                    />
                  </Col>
                  <Col xs={24} md={4}>
                    <div style={{ marginBottom: 6 }}>Mode</div>
                    <Select
                      value={row.mode || "manual-only"}
                      style={{ width: "100%" }}
                      disabled={row.liveCapable !== true}
                      options={[
                        { label: "Live", value: "live" },
                        { label: "Manual-only", value: "manual-only" },
                      ]}
                      onChange={(value) => updatePlatformField(row.platform, "mode", value)}
                    />
                  </Col>
                  <Col xs={24} md={4}>
                    <div style={{ marginBottom: 6 }}>Display Order</div>
                    <InputNumber
                      min={1}
                      max={99}
                      style={{ width: "100%" }}
                      value={Number(row.displayOrder || 1)}
                      onChange={(value) =>
                        updatePlatformField(row.platform, "displayOrder", Number(value || 1))
                      }
                    />
                  </Col>
                  <Col xs={24} md={4}>
                    <div style={{ marginBottom: 6 }}>Post Limit</div>
                    <InputNumber
                      min={1}
                      max={60}
                      style={{ width: "100%" }}
                      value={Number(row.postLimit || 12)}
                      onChange={(value) =>
                        updatePlatformField(row.platform, "postLimit", Number(value || 12))
                      }
                    />
                  </Col>
                  <Col xs={24} md={4}>
                    <div style={{ marginBottom: 6 }}>Fetch Interval (min)</div>
                    <InputNumber
                      min={5}
                      max={1440}
                      style={{ width: "100%" }}
                      value={Number(row.fetchIntervalMinutes || 30)}
                      onChange={(value) =>
                        updatePlatformField(
                          row.platform,
                          "fetchIntervalMinutes",
                          Number(value || 30),
                        )
                      }
                    />
                  </Col>
                  <Col xs={24} md={5}>
                    <div style={{ marginBottom: 6 }}>Last Sync</div>
                    <Tag>{fmtDate(row.lastSyncAt)}</Tag>
                  </Col>
                  <Col xs={24} md={8}>
                    <Input.Password
                      placeholder={`${accessTokenLabel} ${
                        row.accessTokenMasked ? `(current: ${row.accessTokenMasked})` : ""
                      }`}
                      value={row.accessToken || ""}
                      onChange={(event) =>
                        updatePlatformField(row.platform, "accessToken", event.target.value)
                      }
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <Input
                      placeholder={`${accountIdLabel} ${
                        row.accountIdMasked ? `(current: ${row.accountIdMasked})` : ""
                      }`}
                      value={row.accountId || ""}
                      onChange={(event) =>
                        updatePlatformField(row.platform, "accountId", event.target.value)
                      }
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <Input.Password
                      placeholder={`${apiKeyLabel} ${row.apiKeyMasked ? `(current: ${row.apiKeyMasked})` : ""}`}
                      value={row.apiKey || ""}
                      disabled={!apiKeyEditable}
                      onChange={(event) =>
                        updatePlatformField(row.platform, "apiKey", event.target.value)
                      }
                    />
                  </Col>
                  {showFacebookAccountHint ? (
                    <Col xs={24}>
                      <Alert
                        type="warning"
                        showIcon
                        message="Facebook requires PAGE_ID and PAGE_ACCESS_TOKEN. App ID/App Secret will not fetch posts."
                      />
                    </Col>
                  ) : null}
                  {row.lastSyncError ? (
                    <Col xs={24}>
                      <Alert type="error" showIcon message={row.lastSyncError} />
                    </Col>
                  ) : null}
                </Row>
              </Card>
            )})}
          </Space>
        </ThemeAdminCard>
      ),
    },
    {
      key: "sync",
      label: "Sync",
      children: (
        <ThemeAdminCard title="Synchronization Controls">
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Select platforms (optional)</div>
              <Checkbox.Group
                options={platformOptions}
                value={syncPlatforms}
                onChange={(value) => setSyncPlatforms(value)}
              />
            </div>
            <Space wrap>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                loading={syncBusy}
                onClick={() => runSync("manual")}
              >
                Run Manual Sync
              </Button>
              <Button
                icon={<SyncOutlined />}
                loading={syncBusy}
                onClick={() => runSync("scheduled")}
              >
                Run Scheduled Sync Job
              </Button>
              <Button icon={<SyncOutlined />} loading={syncBusy} onClick={runTokenRefresh}>
                Refresh Tokens
              </Button>
              <Button icon={<ReloadOutlined />} loading={syncBusy} onClick={runLogCleanup}>
                Cleanup Old Logs
              </Button>
            </Space>
            {syncResult ? (
              <Alert
                type={syncResult?.error ? "warning" : "success"}
                showIcon
                message={
                  syncResult?.error
                    ? `Sync Warning: ${syncResult.error}`
                    : "Sync job completed"
                }
                description={
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(syncResult, null, 2)}
                  </pre>
                }
              />
            ) : null}
          </Space>
        </ThemeAdminCard>
      ),
    },
    {
      key: "posts",
      label: "Posts",
      children: (
        <ThemeAdminCard
          title="Social Wall Posts"
          extra={
            <Button icon={<ReloadOutlined />} onClick={() => loadPosts(postsData.page, postsData.limit)}>
              Refresh
            </Button>
          }
        >
          <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
            <Col xs={24} md={4}>
              <Select
                allowClear
                placeholder="Platform"
                options={platformOptions}
                value={postFilters.platform || undefined}
                onChange={(value) => setPostFilters((prev) => ({ ...prev, platform: value || "" }))}
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} md={4}>
              <Select
                allowClear
                placeholder="Status"
                options={[
                  { label: "Pending", value: "pending" },
                  { label: "Approved", value: "approved" },
                  { label: "Rejected", value: "rejected" },
                ]}
                value={postFilters.status || undefined}
                onChange={(value) => setPostFilters((prev) => ({ ...prev, status: value || "" }))}
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} md={4}>
              <Select
                allowClear
                placeholder="Featured"
                options={[
                  { label: "Featured", value: "true" },
                  { label: "Not Featured", value: "false" },
                ]}
                value={postFilters.featured || undefined}
                onChange={(value) => setPostFilters((prev) => ({ ...prev, featured: value || "" }))}
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} md={6}>
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                onChange={(_, dateStrings) =>
                  setPostFilters((prev) => ({
                    ...prev,
                    dateFrom: safeString(dateStrings?.[0]),
                    dateTo: safeString(dateStrings?.[1]),
                  }))
                }
              />
            </Col>
            <Col xs={24} md={4}>
              <Input
                allowClear
                placeholder="Search caption, hashtag, author"
                value={postFilters.search}
                onChange={(event) =>
                  setPostFilters((prev) => ({ ...prev, search: event.target.value }))
                }
              />
            </Col>
            <Col xs={24} md={2}>
              <Button
                type="primary"
                style={{ width: "100%" }}
                onClick={() => loadPosts(1, postsData.limit, postFilters)}
              >
                Apply
              </Button>
            </Col>
          </Row>
          <Table
            rowKey="id"
            loading={postsLoading}
            columns={postColumns}
            dataSource={Array.isArray(postsData.items) ? postsData.items : []}
            pagination={{
              current: postsData.page,
              pageSize: postsData.limit,
              total: postsData.total,
              showSizeChanger: true,
              onChange: (page, pageSize) => loadPosts(page, pageSize, postFilters),
            }}
          />
        </ThemeAdminCard>
      ),
    },
    {
      key: "moderation",
      label: "Moderation",
      children: (
        <ThemeAdminCard
          title="Moderation Queue"
          extra={
            <Button icon={<ReloadOutlined />} onClick={() => loadModeration(moderationData.page, moderationData.limit)}>
              Refresh
            </Button>
          }
        >
          <Table
            rowKey="id"
            loading={moderationLoading}
            columns={moderationColumns}
            dataSource={Array.isArray(moderationData.items) ? moderationData.items : []}
            pagination={{
              current: moderationData.page,
              pageSize: moderationData.limit,
              total: moderationData.total,
              showSizeChanger: true,
              onChange: (page, pageSize) => loadModeration(page, pageSize),
            }}
          />
        </ThemeAdminCard>
      ),
    },
    {
      key: "logs",
      label: "Logs",
      children: (
        <ThemeAdminCard
          title="Synchronization Logs"
          extra={
            <Space>
              <Popconfirm
                title={
                  logsKind === "config"
                    ? "Clear all config audit logs?"
                    : "Clear all sync logs?"
                }
                description="This action cannot be undone."
                okText="Clear"
                cancelText="Cancel"
                okButtonProps={{ danger: true, loading: clearLogsBusy }}
                onConfirm={runClearLogs}
              >
                <Button danger icon={<DeleteOutlined />} loading={clearLogsBusy}>
                  Clear Logs
                </Button>
              </Popconfirm>
              <Button icon={<ReloadOutlined />} onClick={() => loadLogs(logsData.page, logsData.limit, logsKind)}>
                Refresh
              </Button>
            </Space>
          }
        >
          <div style={{ marginBottom: 12, maxWidth: 240 }}>
            <Select
              value={logsKind}
              style={{ width: "100%" }}
              options={[
                { label: "Sync Logs", value: "sync" },
                { label: "Config Audit Logs", value: "config" },
              ]}
              onChange={(value) => {
                const next = safeString(value) || "sync";
                setLogsKind(next);
                loadLogs(1, logsData.limit, next);
              }}
            />
          </div>
          <Table
            rowKey="id"
            loading={logsLoading}
            columns={logsColumns}
            dataSource={Array.isArray(logsData.items) ? logsData.items : []}
            pagination={{
              current: logsData.page,
              pageSize: logsData.limit,
              total: logsData.total,
              showSizeChanger: true,
              onChange: (page, pageSize) => loadLogs(page, pageSize, logsKind),
            }}
          />
        </ThemeAdminCard>
      ),
    },
  ];

  return <Tabs defaultActiveKey="dashboard" items={tabs} />;
}
