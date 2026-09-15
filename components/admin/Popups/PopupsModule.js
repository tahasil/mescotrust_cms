"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Select, Space, message } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import PopupCreateModal from "./PopupCreateModal";
import PopupsTable from "./PopupsTable";

const POPUPS_SEARCH_STORAGE_KEY = "admin-popups-search-query-v1";
const POPUPS_STATUS_STORAGE_KEY = "admin-popups-status-filter-v1";
const POPUPS_ENABLED_STORAGE_KEY = "admin-popups-enabled-filter-v1";

export default function PopupsModule() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [enabledFilter, setEnabledFilter] = useState("");
  const [form] = Form.useForm();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get("search") || urlParams.get("q");
    const storedSearch = sessionStorage.getItem(POPUPS_SEARCH_STORAGE_KEY);
    const resolvedSearch = urlSearch ?? storedSearch ?? "";
    if (resolvedSearch) {
      setSearch(resolvedSearch);
    }

    const urlStatus = urlParams.get("status");
    const storedStatus = sessionStorage.getItem(POPUPS_STATUS_STORAGE_KEY);
    const resolvedStatus = urlStatus ?? storedStatus ?? "";
    if (resolvedStatus) {
      setStatusFilter(resolvedStatus);
    }

    const urlEnabled = urlParams.get("enabled");
    const storedEnabled = sessionStorage.getItem(POPUPS_ENABLED_STORAGE_KEY);
    const resolvedEnabled = urlEnabled ?? storedEnabled ?? "";
    if (resolvedEnabled) {
      setEnabledFilter(resolvedEnabled);
    }
  }, []);

  const updateUrlParams = (newSearch, newStatus, newEnabled) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (newSearch) params.set("search", newSearch);
    else { params.delete("search"); params.delete("q"); }
    if (newStatus) params.set("status", newStatus);
    else params.delete("status");
    if (newEnabled) params.set("enabled", newEnabled);
    else params.delete("enabled");
    const qs = params.toString();
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (typeof window !== "undefined") {
      if (val) sessionStorage.setItem(POPUPS_SEARCH_STORAGE_KEY, val);
      else sessionStorage.removeItem(POPUPS_SEARCH_STORAGE_KEY);
      updateUrlParams(val, statusFilter, enabledFilter);
    }
  };

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    if (typeof window !== "undefined") {
      if (val) sessionStorage.setItem(POPUPS_STATUS_STORAGE_KEY, val);
      else sessionStorage.removeItem(POPUPS_STATUS_STORAGE_KEY);
      updateUrlParams(search, val, enabledFilter);
    }
  };

  const handleEnabledChange = (val) => {
    setEnabledFilter(val);
    if (typeof window !== "undefined") {
      if (val) sessionStorage.setItem(POPUPS_ENABLED_STORAGE_KEY, val);
      else sessionStorage.removeItem(POPUPS_ENABLED_STORAGE_KEY);
      updateUrlParams(search, statusFilter, val);
    }
  };

  const fetchPopups = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "200");
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (enabledFilter) params.set("enabled", enabledFilter);

    fetch(`/api/admin/popups?${params.toString()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setList(Array.isArray(data?.items) ? data.items : []))
      .catch(() => message.error("Failed to load popups"))
      .finally(() => setLoading(false));
  }, [enabledFilter, search, statusFilter]);

  useEffect(() => {
    fetchPopups();
  }, [fetchPopups]);

  const rows = useMemo(
    () =>
      list.map((item, idx) => ({
        ...item,
        key: item.componentId,
        order: idx + 1,
      })),
    [list],
  );

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);

      const res = await fetch("/api/admin/popups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: values.displayName?.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to create popup");
        return;
      }

      message.success("Popup created");
      setCreateOpen(false);
      form.resetFields();
      form.setFieldsValue({ displayName: "", _derivedId: "" });
      fetchPopups();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.message || "Failed to create popup");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (record) => {
    try {
      setUpdatingId(`${record.componentId}:enabled`);
      const res = await fetch(
        `/api/admin/popups/${encodeURIComponent(record.componentId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled: !record.enabled,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to update popup");
        return;
      }
      message.success(`Popup ${record.enabled ? "disabled" : "enabled"}`);
      fetchPopups();
    } catch {
      message.error("Failed to update popup");
    } finally {
      setUpdatingId("");
    }
  };

  const handleTogglePublish = async (record) => {
    try {
      setUpdatingId(`${record.componentId}:publish`);
      const nextStatus = record.status === "published" ? "draft" : "published";
      const res = await fetch(
        `/api/admin/popups/${encodeURIComponent(record.componentId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to update popup publish status");
        return;
      }
      message.success(
        nextStatus === "published" ? "Popup published" : "Popup unpublished",
      );
      fetchPopups();
    } catch {
      message.error("Failed to update popup publish status");
    } finally {
      setUpdatingId("");
    }
  };

  const handleDelete = async (record) => {
    if (record?.isSystem) return;
    try {
      setDeletingId(record.componentId);
      const res = await fetch(
        `/api/admin/popups/${encodeURIComponent(record.componentId)}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        message.error(data.error || "Failed to delete popup");
        return;
      }
      message.success("Popup deleted");
      fetchPopups();
    } catch {
      message.error("Failed to delete popup");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <>
      <ThemeAdminCard
        title="Popups"
        extra={
          <Space wrap>
            <Input
              allowClear
              value={search}
              onChange={handleSearchChange}
              onPressEnter={fetchPopups}
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              placeholder="Search popup..."
              style={{ width: 240 }}
            />
            <Select
              value={statusFilter}
              onChange={handleStatusChange}
              placeholder="Publish status"
              style={{ width: 150 }}
              options={[
                { value: "", label: "All status" },
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
              ]}
            />
            <Select
              value={enabledFilter}
              onChange={handleEnabledChange}
              placeholder="Enabled"
              style={{ width: 140 }}
              options={[
                { value: "", label: "All visibility" },
                { value: "true", label: "Enabled" },
                { value: "false", label: "Disabled" },
              ]}
            />
            <Button onClick={fetchPopups}>Apply</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              Add Popup
            </Button>
          </Space>
        }
      >
        <PopupsTable
          rows={rows}
          loading={loading}
          updatingId={updatingId}
          deletingId={deletingId}
          onToggleStatus={handleToggleStatus}
          onTogglePublish={handleTogglePublish}
          onDelete={handleDelete}
        />
      </ThemeAdminCard>

      <PopupCreateModal
        open={createOpen}
        saving={creating}
        form={form}
        onCancel={() => {
          if (creating) return;
          setCreateOpen(false);
          form.resetFields();
          form.setFieldsValue({ displayName: "", _derivedId: "" });
        }}
        onSubmit={handleCreate}
      />
    </>
  );
}
