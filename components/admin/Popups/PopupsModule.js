"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Select, Space, message } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import PopupCreateModal from "./PopupCreateModal";
import PopupsTable from "./PopupsTable";

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
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={fetchPopups}
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              placeholder="Search popup..."
              style={{ width: 240 }}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
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
              onChange={setEnabledFilter}
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
